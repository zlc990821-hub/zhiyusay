"""第 02 期配音（用户暂不录音时的 AI 配音）：按 SCRIPT.md 逐句合成，拼成一条人声，并记下每句的起止时间。
用法（在 studio/ 下，用装了 kokoro 的 Python 3.12 环境）：
  /root/ttsenv/bin/python -I tools/ep02_tts.py ../episodes/02_求神不问真假/SCRIPT.md public/ep02/voice_tts.wav src/ep02/timeline.json
声音：Kokoro-82M-v1.1-zh（开源，Apache-2.0）的 zm_031 男声，语速 0.95。
稿子里的【…原声…】【…余音…】【黑底】会留出空档；段落之间停得长一点，句子之间停得短一点。
用户之后自己录音时，用录音替换 voice_tts.wav、按新录音重新对时间即可，画面不用动。
"""
import sys, re, json
import numpy as np, soundfile as sf
from kokoro import KModel, KPipeline

src, out_wav, out_json = sys.argv[1], sys.argv[2], sys.argv[3]
REPO, VOICE, SPEED, SR = "hexgrad/Kokoro-82M-v1.1-zh", "zm_031", 0.95, 24000

text = open(src, encoding="utf-8").read().split("\n---\n", 1)[1]
READ = [("1959 年", "一九五九年"), ("84 岁", "八十四岁"), ("1959年", "一九五九年")]

# 逐行解析：标题 → 段落号；【…】 → 画面提示（含「原声」「余音」「黑底」时留空档）；正文 → 拆成句子
cues, section, sec_no = [], "开场", 0
for raw in text.splitlines():
    line = raw.strip()
    if not line or line == "---":
        if line == "---": cues.append({"gap": 0.7})
        continue
    if line.startswith("## "):
        section = line[3:].strip(); sec_no += 1
        cues.append({"section": section, "no": sec_no}); continue
    if line.startswith("【"):
        hint = line.strip("【】")
        if "原声" in hint: cues.append({"gap": 3.2, "hint": hint})
        elif "余音" in hint: cues.append({"gap": 2.6, "hint": hint})
        elif "黑底" in hint: cues.append({"gap": 1.2, "hint": hint})
        else: cues.append({"hint": hint})
        continue
    for s in re.findall(r"[^。？！]+[。？！]?", line):
        s = s.strip()
        if s: cues.append({"say": s, "section": section})

model = KModel(repo_id=REPO).eval()
en = KPipeline(lang_code="a", repo_id=REPO, model=False)
zh = KPipeline(lang_code="z", repo_id=REPO, model=model, en_callable=lambda t: next(en(t)).phonemes)

pieces, t, items = [], 0.0, []
def add_silence(sec):
    global t
    pieces.append(np.zeros(int(sec * SR), np.float32)); t += sec

add_silence(0.3)
for c in cues:
    if "gap" in c:
        add_silence(c["gap"]); items.append({"type": "gap", "at": round(t - c["gap"], 3), "len": c["gap"], "hint": c.get("hint", "")}); continue
    if "no" in c:
        items.append({"type": "section", "at": round(t, 3), "title": c["section"], "no": c["no"]}); continue
    if "hint" in c:
        items.append({"type": "hint", "at": round(t, 3), "hint": c["hint"]}); continue
    say = c["say"]
    for a, b in READ: say = say.replace(a, b)
    audio = np.concatenate([r.audio.numpy() for r in zh(say, voice=VOICE, speed=SPEED)])
    # 去掉首尾过长的静音
    nz = np.where(np.abs(audio) > 0.01)[0]
    if len(nz): audio = audio[max(0, nz[0] - 240): nz[-1] + 1200]
    start = t; pieces.append(audio.astype(np.float32)); t += len(audio) / SR
    items.append({"type": "line", "start": round(start, 3), "end": round(t, 3), "text": c["say"], "section": c["section"]})
    add_silence(0.55 if c["say"].endswith(("。", "？", "！")) else 0.3)
add_silence(1.0)

voice = np.concatenate(pieces)
sf.write(out_wav, voice, SR)
json.dump({"duration": round(t, 3), "voice": VOICE, "items": items}, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"ok {t:.1f}s, {sum(1 for i in items if i['type']=='line')} 句")
