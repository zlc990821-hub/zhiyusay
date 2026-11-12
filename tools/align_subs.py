"""Align subtitle lines to ASR word timestamps, then map to the edited timeline.

Usage: python3 -I tools/align_subs.py <episode_dir>
Reads  subtitles.txt, audio/asr_raw.json, audio/timemap.json
Writes subtitles.json  [{start,end,text}] in edited-timeline seconds, plus subtitles.srt.
ASR text may contain homophone errors; alignment is character-level (difflib),
with numbers in the ASR (e.g. "138") expanded to Chinese so they still match.
"""
import json, os, re, sys, difflib

d = sys.argv[1]
lines = [l.strip() for l in open(os.path.join(d, "subtitles.txt"), encoding="utf-8")
         if l.strip() and not l.startswith("#")]
tm = json.load(open(os.path.join(d, "audio/timemap.json")))
# Prefer ASR run on the edited voiceover (retakes already removed): identity time mapping.
edit_asr = os.path.join(d, "audio/asr_edit.json")
if os.path.exists(edit_asr):
    asr = json.load(open(edit_asr))
    tm = {"duration": tm["duration"], "segments": [[0.0, tm["duration"], 0.0]]}
else:
    asr = json.load(open(os.path.join(d, "audio/asr_raw.json")))

DIG = "零一二三四五六七八九"
def num_zh(s):  # good enough for numbers < 10000 as spoken digit groups
    n = int(s); out = ""
    for v, u in ((1000, "千"), (100, "百"), (10, "十")):
        if n >= v: out += DIG[n // v] + u; n %= v
    if n: out += DIG[n]
    return out or "零"

def keep(c): return re.match(r"[一-鿿0-9A-Za-z]", c)

# ASR -> per-character (char, start, end)
chars = []
for s in asr:
    for st, en, w in s["words"]:
        w = re.sub(r"\d+", lambda m: num_zh(m.group()) if len(m.group()) < 4 else m.group(), w)
        cs = [c for c in w if keep(c)]
        for i, c in enumerate(cs):
            chars.append((c, st + (en - st) * i / len(cs), st + (en - st) * (i + 1) / len(cs)))

# drop ASR characters that fall inside removed regions (retakes), so lines align to the kept take
def kept(t): return any(r0 - 0.02 <= t <= r1 + 0.02 for r0, r1, _ in tm["segments"])
chars = [c for c in chars if kept((c[1] + c[2]) / 2)]

# subtitle text -> per-character with line index
sub = [(c, li) for li, l in enumerate(lines) for c in l if keep(c)]
A = "".join(c for c, *_ in chars); B = "".join(c for c, _ in sub)
sm = difflib.SequenceMatcher(None, B, A, autojunk=False)
t_of = [None] * len(B)
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        t_of[blk.a + k] = (chars[blk.b + k][1], chars[blk.b + k][2])

def to_edit(t):
    for r0, r1, e0 in tm["segments"]:
        if r0 <= t < r1:
            return e0 + t - r0
    # ASR word edges are fuzzy: snap to the nearest kept segment if within 0.3 s
    best = min(tm["segments"], key=lambda g: max(g[0] - t, t - g[1], 0))
    r0, r1, e0 = best
    if max(r0 - t, t - r1, 0) <= 0.3:
        return e0 + min(max(t, r0), r1) - r0
    raise ValueError(t)

out, unmatched = [], 0
for li, text in enumerate(lines):
    idx = [i for i, (_, l) in enumerate(sub) if l == li]
    ts = [t_of[i] for i in idx if t_of[i]]
    unmatched += sum(1 for i in idx if not t_of[i])
    if not ts: raise SystemExit(f"line not aligned: {text}")
    out.append({"text": text, "start": round(to_edit(ts[0][0]), 3), "end": round(to_edit(ts[-1][1]), 3)})

# display timing: show a touch early, hold until next line (max +0.8s), min 1.2s on screen
for i, o in enumerate(out):
    o["start"] = max(0, o["start"] - 0.12)
    nxt = out[i + 1]["start"] - 0.12 if i + 1 < len(out) else tm["duration"]
    o["end"] = round(min(max(o["end"] + 0.8, o["start"] + 1.2), nxt - 0.04), 3)
    o["start"] = round(o["start"], 3)
    o["cps"] = round(len([c for c in o["text"] if keep(c)]) / (o["end"] - o["start"]), 1)

json.dump(out, open(os.path.join(d, "subtitles.json"), "w"), ensure_ascii=False, indent=1)
def ts(t): return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round(t%1*1000))%1000:03d}"
with open(os.path.join(d, "subtitles.srt"), "w", encoding="utf-8") as f:
    for i, o in enumerate(out, 1):
        f.write(f"{i}\n{ts(o['start'])} --> {ts(o['end'])}\n{o['text']}\n\n")
print(f"{len(out)} lines, {unmatched}/{len(B)} chars unmatched (homophones), max cps {max(o['cps'] for o in out)}")
for o in out: print(f"{o['start']:7.2f}-{o['end']:7.2f} {o['cps']:4} {o['text']}")
