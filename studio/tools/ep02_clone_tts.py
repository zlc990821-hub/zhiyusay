"""第 02 期配音（用户同意用自己第 01 期的声音克隆，2026-11-28）：第一步，按段生成。
用法（在 studio/ 下，用装了 f5-tts 的 Python 3.12 环境）：
  /root/ttsenv/bin/python -I tools/ep02_clone_tts.py ../episodes/02_求神不问真假/SCRIPT.md 参考.wav "参考文字" 输出目录
模型：F5-TTS（F5TTS_v1_Base，开源）。参考录音：第 01 期人声里 8 秒的一句话（见 STATUS.md）。
同一段里连续的几句合成一组生成（每组不超过约 60 字），这样参考录音只需要重复计算十几次，CPU 上约 1 个半小时。
输出：输出目录/chunk_XX.wav（24kHz）和 plan.json（每组的句子、组与组之间的停顿和空档）。
第二步（系统 Python）：tools/ep02_clone_align.py 用语音识别找出每句的起止时间，拼成一条人声和时间轴。
"""
import sys, re, json, os
import numpy as np, soundfile as sf
from f5_tts.api import F5TTS

src, ref_wav, ref_text, out_dir = sys.argv[1:5]
os.makedirs(out_dir, exist_ok=True)
READ = [("1959 年", "一九五九年"), ("84 岁", "八十四岁"), ("BBC", "B B C")]
TAIL = "就这样。"   # 模型总把最后一个字截掉半截：每组末尾多念一句垫着，对齐时切掉（见 ep02_clone_align.py）

text = open(src, encoding="utf-8").read().split("\n---\n", 1)[1]
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

# 连续的句子合成一组（遇到空档、段落、画面提示就断开）
plan, cur = [], []
def flush():
    global cur
    if cur: plan.append({"chunk": cur}); cur = []
for c in cues:
    if "say" in c:
        if cur and sum(len(x["say"]) for x in cur) + len(c["say"]) > 60: flush()
        cur.append(c)
    else:
        flush(); plan.append(c)
flush()

tts = F5TTS(model="F5TTS_v1_Base", device="cpu")
k = 0
for p in plan:
    if "chunk" not in p: continue
    k += 1; p["file"] = f"chunk_{k:02d}.wav"
    path = os.path.join(out_dir, p["file"])
    p["tail"] = TAIL
    if os.path.exists(path): continue            # 断了可以接着跑
    gen = "".join(x["say"] for x in p["chunk"])
    for a, b in READ: gen = gen.replace(a, b)
    for q in "「」『』“”": gen = gen.replace(q, "")    # 模型会把引号念成怪音（「信则灵」→「一信则灵黑」）
    gen += TAIL
    wav, sr, _ = tts.infer(ref_file=ref_wav, ref_text=ref_text, gen_text=gen, nfe_step=32, speed=1.0, remove_silence=False, show_info=lambda *a: None)
    sf.write(path, np.asarray(wav, dtype=np.float32), sr)
    print(f"{p['file']} {len(wav)/sr:.1f}s  {gen}", flush=True)
json.dump(plan, open(os.path.join(out_dir, "plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ALL DONE", flush=True)
