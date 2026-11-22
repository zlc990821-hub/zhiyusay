"""人声去换气：把句子之间的换气声压低（不剪掉，时长不变，画面仍能对上）。
用法（在 studio/ 下）：python3 tools/de_breath.py 输入.wav 输出.wav [压低多少dB=15] [区段清单.txt]

做法：
  1 逐帧（10ms）算响度和「有没有音高」（自相关）。有音高的是说话的元音部分。
  2 说话前后留保护区：前 80ms、后 80ms；
    紧贴说话、比 -22dB 还响的清辅音也一并保护。
  3 保护区以外、比底噪明显响（底噪 +10dB 以上）、持续 80ms 以上的声音，判定为换气或口水声，
    压低指定的分贝数，前后各 15ms 平滑过渡，听不出开关。
  4 字尾保护：说话结束后音量一路下降的部分（最多 250ms）是念成气声的字尾，不压；吸气是音量往上涨的。
     字头同理：开口前音量一路上涨进字里的部分（最多 120ms，h、f 等弱字头）不压；吸气和开口之间通常有一下停顿。
     句尾的挤喉音（低频为主、没有规则音高）也算说话。
  5 只压真正的停顿：前后两段说话之间至少空出 0.25 秒（较响的要 0.35 秒），连贯说话里字与字之间的清音不碰。
只能凭声音特征判断，个别很响、紧贴着说话的吸气可能被当作字头保护下来；宁可少压，不能吃字。
"""
import sys, wave
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
cut_db = float(sys.argv[3]) if len(sys.argv) > 3 else 15.0
listfile = sys.argv[4] if len(sys.argv) > 4 else None

w = wave.open(src); sr = w.getframerate(); ch = w.getnchannels(); n = w.getnframes()
assert ch == 1 and w.getsampwidth() == 2, "需要 16 位单声道"
x = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
w.close()

hop, win = sr // 100, int(sr * 0.04)
nf = (len(x) - win) // hop
idx = np.arange(win)[None, :] + hop * np.arange(nf)[:, None]
rms = np.empty(nf); rv = np.empty(nf); hfr = np.empty(nf)
fq = np.fft.rfftfreq(4096, 1 / sr)
han = np.hanning(win).astype(np.float32)
lo, hi = sr // 400, sr // 70
for s in range(0, nf, 4000):
    fr = x[idx[s:s + 4000]]
    rms[s:s + 4000] = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    fw = (fr - fr.mean(1, keepdims=True)) * han
    P = np.abs(np.fft.rfft(fw, 4096)) ** 2
    ac = np.fft.irfft(P, 4096)[:, :hi + 1]
    rv[s:s + 4000] = ac[:, lo:hi + 1].max(1) / (ac[:, 0] + 1e-12)
    hfr[s:s + 4000] = P[:, fq > 2000].sum(1) / (P.sum(1) + 1e-12)

floor = np.percentile(rms, 5)
voiced = (rv > 0.45) & (rms > -35)
voiced |= (hfr < 0.1) & (rms > -30)          # 挤喉音（句尾沙哑的「嘎」声）：没有规则音高，但能量在低频，是字的一部分


def dilate(m, before, after):
    out = m.copy()
    for k in range(1, before + 1): out[:-k] |= m[k:]
    for k in range(1, after + 1): out[k:] |= m[:-k]
    return out


speech = dilate(voiced, 8, 8)
# 紧贴说话的响清辅音（比 -22dB 响）也算说话
loud = rms > -22
changed = True
while changed:
    grow = loud & ~speech & (np.r_[speech[1:], False] | np.r_[False, speech[:-1]])
    changed = grow.any(); speech |= grow

# 字尾：说话结束后音量一路下降的部分（最多 250ms）算作字的一部分，保护起来；
# 吸气是音量先往上涨的，用这一点把「念成气声的字尾」和「换气」分开
ends = np.where(speech[:-1] & ~speech[1:])[0]
for e in ends:
    k = e + 1
    while k < nf and k - e <= 25 and not speech[k] and rms[k] > floor + 10 and rms[k] <= rms[k - 1] + 1.0:
        speech[k] = True; k += 1

starts = np.where(~speech[:-1] & speech[1:])[0] + 1
for st in starts:
    k = st - 1
    while k >= 0 and st - k <= 12 and not speech[k] and rms[k] > floor + 10 and rms[k] <= rms[k + 1] + 1.0:
        speech[k] = True; k -= 1

# 每一帧所在的「无音高空档」有多长（上一个浊音帧到下一个浊音帧）
INF = 10 ** 6
prevv = np.empty(nf, int); nextv = np.empty(nf, int)
last = -INF
for k in range(nf):
    if voiced[k]: last = k
    prevv[k] = last
last = INF
for k in range(nf - 1, -1, -1):
    if voiced[k]: last = k
    nextv[k] = last
cand = (~speech) & (rms > floor + 10)
segs = []; skipped = []; i = 0
while i < nf:
    if cand[i]:
        j = i
        while j < nf and cand[j]: j += 1
        if j - i >= 8:
            gap = (nextv[j - 1] - prevv[i]) / 100          # 秒
            need = 0.35 if rms[i:j].max() > -24 else 0.25   # 越响的越要确认是在真正的停顿里
            (segs if gap >= need else skipped).append((i, j))
        i = j
    else: i += 1

# 逐样本增益：区段内压低，前后 15ms 余弦过渡
g = np.ones(len(x), np.float32)
low = 10 ** (-cut_db / 20)
fade = int(sr * 0.015)
ramp = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fade))).astype(np.float32)
for a, b in segs:
    s0 = a * hop + win // 2 - hop // 2; s1 = b * hop + win // 2 - hop // 2
    s0 = max(s0, 0); s1 = min(s1, len(x))
    g[s0:s1] = np.minimum(g[s0:s1], low)
    if s0 - fade >= 0: g[s0 - fade:s0] = np.minimum(g[s0 - fade:s0], 1 - (1 - low) * ramp)
    if s1 + fade <= len(x): g[s1:s1 + fade] = np.minimum(g[s1:s1 + fade], low + (1 - low) * ramp)
y = x * g

out = wave.open(dst, "wb"); out.setnchannels(1); out.setsampwidth(2); out.setframerate(sr)
out.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); out.close()

tot = sum(b - a for a, b in segs) / 100
print(f"跳过 {len(skipped)} 处（在连贯的说话中间，不算停顿）")
print(f"底噪 {floor:.1f} dB；压低 {len(segs)} 处，共 {tot:.1f} 秒（占全长 {tot / (len(x) / sr) * 100:.1f}%），每处压低 {cut_db:g} dB")
if listfile:
    with open(listfile, "w") as f:
        for a, b in segs: f.write(f"{a / 100:.2f}\t{b / 100:.2f}\t{rms[a:b].max():.1f}\n")
