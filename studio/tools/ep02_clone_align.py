"""第 02 期配音第二步：把克隆生成的分组音频切成逐句，拼成一条人声，并写出时间轴（格式与 ep02_tts.py 相同）。
用法（在 studio/ 下，系统 Python）：
  python3 tools/ep02_clone_align.py media_src/ep02/clone public/ep02/voice_clone.wav src/ep02/timeline.json [语速=1.0]
做法：每组用 faster-whisper 识别出每个字的时间（繁体转简体），和稿子逐字对齐，找出句与句之间的停顿，在停顿处下刀；
句子之间统一停 0.55 秒（和 AI 配音版一致），空档、段落和画面提示照稿子留。
同时写出 对齐报告.txt：每组识别出来和稿子不一样的字。漏字、多字、念错多的组，删掉 chunk_XX.wav 重新生成即可。
"""
import sys, os, json, wave, difflib, subprocess, tempfile
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
from opencc import OpenCC
from pypinyin import lazy_pinyin

clone_dir, out_wav, out_json = sys.argv[1:4]
TEMPO = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
plan = json.load(open(os.path.join(clone_dir, "plan.json"), encoding="utf-8"))
READ = [("1959 年", "一九五九年"), ("84 岁", "八十四岁"), ("BBC", "B B C")]
PUN = set("，。？！；：、「」『』“”‘’（）…—,.?!;:\"' \n*《》【】")
SR = 24000
cc = OpenCC("t2s")
model = WhisperModel("small", device="cpu", compute_type="int8")
tmp = tempfile.mkdtemp()


def readwav(path):
    if TEMPO != 1.0:
        p2 = os.path.join(tmp, "t.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-af", f"atempo={TEMPO}", "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", p2], check=True)
        path = p2
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2, path
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768


def rms_frames(x, hop=240):                      # 10 毫秒一帧
    n = len(x) // hop
    return np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)


def fade(seg, ms=8):
    k = min(len(seg) // 2, int(SR * ms / 1000))
    if k: seg = seg.copy(); seg[:k] *= np.linspace(0, 1, k); seg[-k:] *= np.linspace(1, 0, k)
    return seg


report, pieces, items, t, sec_no = [], [], [], 0.0, 0
def silence(sec):
    global t
    pieces.append(np.zeros(int(round(sec * SR)), np.float32)); t += sec

silence(0.3)
for p in plan:
    if "gap" in p:
        silence(p["gap"]); items.append({"type": "gap", "at": round(t - p["gap"], 3), "len": p["gap"], "hint": p.get("hint", "")}); continue
    if "section" in p:
        sec_no += 1; items.append({"type": "section", "at": round(t, 3), "title": p["section"], "no": sec_no}); continue
    if "hint" in p:
        items.append({"type": "hint", "at": round(t, 3), "hint": p["hint"]}); continue

    sents = p["chunk"]
    x = readwav(os.path.join(clone_dir, p["file"]))
    # 1. 识别：每个字的时间
    segs, _ = model.transcribe(resample_poly(x, 2, 3).astype(np.float32), language="zh", word_timestamps=True, beam_size=5,
                               condition_on_previous_text=False, initial_prompt="以下是普通话的句子。")
    ac, at = [], []
    for s in segs:
        for w in s.words or []:
            chars = [c for c in cc.convert(w.word) if c not in PUN]
            for k, c in enumerate(chars):
                d = (w.end - w.start) / len(chars)
                ac.append(c); at.append((w.start + k * d, w.start + (k + 1) * d))
    # 2. 稿子的字（按实际念法）
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
            if pv is None and nx is None: st[i] = en[i] = len(x) / SR * i / len(sc)
            elif pv is None: st[i] = en[i] = st[nx]
            elif nx is None: st[i] = en[i] = en[pv]
            else: f = (i - pv) / (nx - pv); st[i] = en[i] = en[pv] + (st[nx] - en[pv]) * f
    diffs, bad = [], 0                            # 同音字（拼音一样）多半是识别的问题，不算念错
    for op, a, b, c, d in sm.get_opcodes():
        if op == "equal": continue
        same = lazy_pinyin("".join(sc[a:b])) == lazy_pinyin("".join(ac[c:d]))
        bad += 0 if same else max(b - a, d - c)
        diffs.append(f"稿「{''.join(sc[a:b])}」→听「{''.join(ac[c:d])}」" + ("(同音)" if same else ""))
    report.append(f"{p['file']}  {'⚠ ' if bad >= 2 or (bad and len(sc) < 20) else ''}对上 {len(known)}/{len(sc)}  " + ("；".join(diffs) if diffs else "全对"))

    # 3. 找每句的起止：能量低于门限算停顿
    r = rms_frames(x); thr = max(np.percentile(r, 10) * 4, r.max() * 0.025)
    voiced = r > thr
    first = lambda j: owner.index(j)
    last = lambda j: len(owner) - 1 - owner[::-1].index(j)
    bounds = []                                   # 每句 (起, 止)，单位：帧
    vi = np.where(voiced)[0]
    a0 = max(0, vi[0] - 5) if len(vi) else 0
    for j in range(len(sents) - 1):
        lo = int(max(0, en[last(j)] - 0.2) * 100); hi = int(min(len(r) - 1, st[first(j + 1)] * 100 + 20))
        if hi <= lo: hi = lo + 1
        win = ~voiced[lo:hi]
        best, run, bs = (0, lo, lo), 0, lo        # 窗口里最长的一段静音
        for k, q in enumerate(win):
            if q:
                if run == 0: bs = lo + k
                run += 1
                if run > best[0]: best = (run, bs, lo + k + 1)
            else: run = 0
        if best[0] == 0:                          # 没有静音：在最安静的那一帧下刀
            m = lo + int(np.argmin(r[lo:hi])); best = (0, m, m)
        bounds.append((a0, best[1] + 6)); a0 = max(best[1] + 6, best[2] - 4)
    ve = vi[-1] + 12 if len(vi) else len(r)
    if len(vi) and ve / 100 - en[-1] > 0.8: report[-1] += f"  ⚠ 末尾多出 {ve / 100 - en[-1]:.1f}s 声音"
    bounds.append((a0, min(len(r), ve)))

    for j, (fa, fb) in enumerate(bounds):
        seg = fade(x[fa * 240: fb * 240])
        start = t; pieces.append(seg); t += len(seg) / SR
        items.append({"type": "line", "start": round(start, 3), "end": round(t, 3), "text": sents[j]["say"], "section": sents[j]["section"]})
        silence(0.55 if sents[j]["say"].endswith(("。", "？", "！")) else 0.3)
silence(1.0)

voice = np.concatenate(pieces)
voice48 = resample_poly(voice, 2, 1)
with wave.open(out_wav, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
    w.writeframes((np.clip(voice48, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump({"duration": round(t, 3), "voice": "F5-TTS 克隆（第 01 期人声）", "items": items}, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
open(os.path.join(clone_dir, "对齐报告.txt"), "w", encoding="utf-8").write("\n".join(report) + "\n")
print("\n".join(report))
print(f"ok {t:.1f}s, {sum(1 for i in items if i['type'] == 'line')} 句")
