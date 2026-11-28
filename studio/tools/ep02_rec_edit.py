"""第 02 期：用户自己的录音 → 剪掉重念、逐句对齐、按规则重排停顿 → 人声 + 时间轴（格式与 ep02_tts.py 相同）。
用法（在 studio/ 下，系统 Python）：
  python3 tools/ep02_rec_edit.py ../episodes/02_求神不问真假/SCRIPT.md media_src/ep02/rec/voice_proc.wav public/ep02/voice_rec.wav src/ep02/timeline.json
voice_proc.wav：录音经 voice_denoise → voice_chain → voice_clarity → de_breath 处理后的人声（时长不变）。
1 剪掉重念：CUTS 里的区间（按原录音时间，落在停顿里）直接删掉，接缝 10ms 交叉淡化。
2 用 faster-whisper 识别剪好的人声，逐字和稿子对齐；句与句之间在能量最低的静音处下刀。
3 停顿重排（2026-11-28 用户：「没说话的主题过渡要停久一点，大家还没看清楚就跳过了」）：
  句间保留原来的自然停顿，但限制在 0.35–0.9 秒；换段落（---＋标题）停 2.7 秒，段落标题卡在这段安静里出现；
  鼓词原声 3.2 秒、余音 2.6 秒、黑底 1.2 秒照稿子留；关键大字（HOLD）后再多留 0.6–1 秒。
4 字幕以稿子为准，念法和稿子不同的地方用 SPOKEN 改成实际念的。
最后写出 对齐报告（识别结果和稿子不一样的字），检查有没有漏剪的重念。
"""
import sys, re, json, wave, difflib
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
from opencc import OpenCC
from pypinyin import lazy_pinyin

src, wav_in, wav_out, json_out = sys.argv[1:5]
SR = 48000
# 重念：删掉 [起, 止)（原录音秒数，两端都在停顿里）
CUTS = [(46.16, 47.42),    # 「从早」→ 重念「从早唱到晚」
        (119.45, 121.80),  # 「结果相信这是仪式的」念了一半
        (133.25, 137.35),  # 「信则灵三个字，在实验室里找到了」没念完，重念
        (181.05, 183.95),  # 「一个人研究了一辈子的」→ 重念
        (226.60, 229.00),  # 「再回到我妈」→ 重念
        (245.55, 248.02),  # 「只是会唱词」→ 重念
        (257.04, 257.36)]  # 「那那些」多出的一个「那」
SPOKEN = [("一个在当时很出格", "一个当时很出格"), ("会唱鼓词的老先生", "会唱词的老先生")]
READ = [("1959 年", "1959年"), ("84 岁", "84岁")]   # 识别结果写成阿拉伯数字
HOLD = {"那就是神。": 0.8, "神和社会，可能就是一回事。": 0.6, "「信则灵」三个字，在实验室里找到了证据。": 0.8,
        "我知道。": 1.0, "也许答案是：互相。": 0.8, "那些被唱了几百年的菩萨，还在吗？": 0.6}
SECTION_PAUSE, LINE_PAUSE = 2.0, (0.35, 0.9)      # 段落：---（0.7）＋标题（2.0）＝2.7 秒
PUN = set("，。？！；：、「」『』“”‘’（）…—,.?!;:\"' \n*《》【】")
cc = OpenCC("t2s")

# ---------- 1 剪掉重念 ----------
with wave.open(wav_in) as w:
    assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
keep, t0 = [], 0.0
for a, b in sorted(CUTS): keep.append((t0, a)); t0 = b
keep.append((t0, len(x) / SR))
XF = int(0.01 * SR)
parts = [x[int(a * SR): int(b * SR)] for a, b in keep]
y = parts[0]
for p in parts[1:]:
    r = np.linspace(1, 0, XF, dtype=np.float32)
    y = np.concatenate([y[:-XF], y[-XF:] * r + p[:XF] * (1 - r), p[XF:]])

# ---------- 2 识别、逐字对齐 ----------
model = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = model.transcribe(resample_poly(y, 1, 3).astype(np.float32), language="zh", word_timestamps=True, beam_size=5,
                           condition_on_previous_text=False, initial_prompt="以下是普通话的句子。")
ac, at = [], []
for s in segs:
    for wd in s.words or []:
        chars = [c for c in cc.convert(wd.word) if c not in PUN]
        for k, c in enumerate(chars):
            d = (wd.end - wd.start) / len(chars); ac.append(c); at.append((wd.start + k * d, wd.start + (k + 1) * d))

text = open(src, encoding="utf-8").read().split("\n---\n", 1)[1]
for a, b in SPOKEN: text = text.replace(a, b)
cues, section = [], "开场"
for raw in text.splitlines():
    line = raw.strip()
    if not line: continue
    if line == "---": cues.append({"gap": 0.7}); continue
    if line.startswith("## "): section = line[3:].strip(); cues.append({"section": section}); continue
    if line.startswith("【"):
        hint = line.strip("【】")
        if "原声" in hint: cues.append({"gap": 3.2, "hint": hint})
        elif "余音" in hint: cues.append({"gap": 2.6, "hint": hint})
        elif "黑底" in hint: cues.append({"gap": 1.2, "hint": hint})
        else: cues.append({"hint": hint})
        continue
    for s in re.findall(r"[^。？！]+[。？！]?", line):
        if s.strip(): cues.append({"say": s.strip(), "section": section})
sents = [c for c in cues if "say" in c]
sc, owner = [], []
for j, s in enumerate(sents):
    say = s["say"]
    for a, b in READ: say = say.replace(a, b)
    for c in say:
        if c not in PUN: sc.append(c); owner.append(j)
sm = difflib.SequenceMatcher(None, sc, ac, autojunk=False)
st, en = [None] * len(sc), [None] * len(sc)
for a, b, n in sm.get_matching_blocks():
    for k in range(n): st[a + k], en[a + k] = at[b + k]
known = [i for i in range(len(sc)) if st[i] is not None]
for i in range(len(sc)):
    if st[i] is None:
        pv = max([k for k in known if k < i], default=None); nx = min([k for k in known if k > i], default=None)
        if pv is None: st[i] = en[i] = st[nx]
        elif nx is None: st[i] = en[i] = en[pv]
        else: f = (i - pv) / (nx - pv); st[i] = en[i] = en[pv] + (st[nx] - en[pv]) * f
report = []
for op, a, b, c, d in sm.get_opcodes():
    if op == "equal": continue
    s1, s2 = "".join(sc[a:b]), "".join(ac[c:d])
    same = lazy_pinyin(s1) == lazy_pinyin(s2) or (s2.isdigit() and b > a)
    if not same: report.append(f"{at[c][0] if c < len(at) else 0:7.2f}s  稿「{s1}」→听「{s2}」")

# ---------- 3 句子起止：在静音处下刀 ----------
HOP = SR // 100
n = len(y) // HOP
db = 20 * np.log10(np.sqrt(np.mean(y[: n * HOP].reshape(n, HOP) ** 2, axis=1)) + 1e-7)
thr = max(np.percentile(db, 10) + 12, db.max() - 45)
quiet = db < thr
first = lambda j: owner.index(j)
last = lambda j: len(owner) - 1 - owner[::-1].index(j)
on, off, gaps = [0] * len(sents), [0] * len(sents), [0.0] * len(sents)
vi = np.where(~quiet)[0]
on[0] = max(0, int(st[first(0)] * 100) - 30)
while on[0] < n and quiet[on[0]]: on[0] += 1
for j in range(len(sents) - 1):
    lo = int(max(0, en[last(j)] - 0.25) * 100); hi = int(min(n - 1, st[first(j + 1)] * 100 + 25))
    if hi <= lo: hi = lo + 1
    best, run, bs = (0, lo, lo), 0, lo           # 窗口里最长的一段静音
    for k in range(lo, hi):
        if quiet[k]:
            if run == 0: bs = k
            run += 1
            if run > best[0]: best = (run, bs, k + 1)
        else: run = 0
    if best[0] == 0:
        m = lo + int(np.argmin(db[lo:hi])); best = (0, m, m)
    off[j], on[j + 1], gaps[j] = best[1], best[2], best[0] / 100
off[-1] = vi[-1] + 1 if len(vi) else n

# ---------- 4 重排停顿，拼人声，写时间轴 ----------
pieces, items, t = [], [], 0.0
def silence(sec):
    global t
    pieces.append(np.zeros(int(round(sec * SR)), np.float32)); t += sec
def clip(fa, fb, pre=0.05, post=0.12):
    a = max(0, int((fa / 100 - pre) * SR)); b = min(len(y), int((fb / 100 + post) * SR))
    seg = y[a:b].copy(); k = int(0.008 * SR); seg[:k] *= np.linspace(0, 1, k); seg[-k:] *= np.linspace(1, 0, k)
    return seg

silence(0.3)
j, sec_no, pending, last_end = 0, 0, 0.0, 0.3
for c in cues:
    if "gap" in c:
        silence(c["gap"]); items.append({"type": "gap", "at": round(t - c["gap"], 3), "len": c["gap"], "hint": c.get("hint", "")}); continue
    if "section" in c and "say" not in c:     # 句子也带 section 字段，要分开
        sec_no += 1; items.append({"type": "section", "at": round(last_end + 0.35, 3), "title": c["section"], "no": sec_no})
        silence(SECTION_PAUSE); continue
    if "hint" in c:
        items.append({"type": "hint", "at": round(t, 3), "hint": c["hint"]}); continue
    pre = min(0.05, gaps[j - 1] / 2) if j else 0.05; post = min(0.12, gaps[j] / 2) if j < len(sents) - 1 else 0.12
    seg = clip(on[j], off[j], pre, post)      # 两句挨得很近时，余量各取一半，不重复
    start = t + pre; pieces.append(seg); t += len(seg) / SR
    last_end = t - post + 0.02
    items.append({"type": "line", "start": round(start, 3), "end": round(last_end, 3), "text": c["say"], "section": c["section"]})
    if j < len(sents) - 1:
        lo, hi = LINE_PAUSE if c["say"].endswith(("。", "？", "！")) else (0.25, 0.6)
        nxt_pre = min(0.05, gaps[j] / 2)
        silence(max(0.05, min(hi, max(lo, gaps[j])) - post - nxt_pre) + HOLD.get(c["say"], 0.0))   # 片段两端已带余量
    j += 1
silence(1.0)

voice = np.concatenate(pieces)
voice *= min(1.0, 0.95 / np.abs(voice).max())
with wave.open(wav_out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(voice, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump({"duration": round(t, 3), "voice": "用户录音（2026-11-28）", "items": items}, open(json_out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("和稿子不一样的地方（同音字不算）：")
print("\n".join(report) or "无")
print(f"ok {t:.1f}s, {len(sents)} 句（原录音 {len(x) / SR:.1f}s，剪掉 {sum(b - a for a, b in CUTS):.1f}s）")
