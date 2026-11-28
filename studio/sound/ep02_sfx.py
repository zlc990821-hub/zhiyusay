"""第 02 期音效与原声轨（不含人声）。时间全部从 src/ep02/timeline.json 读，和画面同一个时间轴。
用法（在 studio/ 下）：python3 sound/ep02_sfx.py public/ep02/sfx.wav
用到：media_src/ep02/guci_drum.wav、guci_temple.wav（用户提供的鼓词原声）；Mixkit 音效库（sfx/lib）；其余代码合成。
"""
import sys, json, wave
import numpy as np
sys.path.insert(0, "sound")
from sfxlib import Track, SR, bell, bowl, soft_tone, pad, thump, whoosh, tinkles, shimmer, riser, lp, noise, lib

out = sys.argv[1]
TL = json.load(open("src/ep02/timeline.json", encoding="utf-8"))
lines = [i for i in TL["items"] if i["type"] == "line"]
def L(i, head):
    assert lines[i]["text"].startswith(head), (i, head, lines[i]["text"]); return lines[i]
def word(l, w):
    k = max(0, l["text"].find(w)); return l["start"] + (l["end"] - l["start"]) * k / len(l["text"])
gap = lambda key: next(i["at"] for i in TL["items"] if i["type"] == "gap" and key in i.get("hint", ""))

S = {k: L(i, h) for k, (i, h) in {
    "ask": (0, "我问我妈"), "reply": (1, "我妈说：管它"), "better": (2, "她说，上次"), "next": (3, "所以下个月"), "superstition": (4, "听起来"),
    "three": (5, "可这件事"), "xuan": (6, "而且"), "look": (7, "先看这个场面"), "steps": (11, "先请"), "durk": (14, "一百多年前"), "quote1": (15, "神和社会"),
    "family": (16, "一个家族"), "isgod": (17, "那就是神"), "renqing": (18, "神既然是"), "canbiz": (20, "可是，请客"), "harvard": (21, "哈佛商学院"),
    "ritual": (22, "让人上台"), "groupA": (23, "她告诉一组人"), "groupB": (24, "告诉另一组人"), "same": (25, "动作，一模一样"), "result": (26, "结果"),
    "believe": (27, "同样的动作"), "lab": (28, "「信则灵」"), "malin": (29, "其实一百年前"), "fish": (30, "岛上的渔民"), "control": (31, "越是控制不了"),
    "biz": (32, "做生意"), "psych": (33, "可是，「心理作用」"), "jung": (34, "1959"), "q": (35, "记者问他"), "a1": (36, "他停了一下"), "a2": (37, "我知道"),
    "why": (38, "一个研究了一辈子"), "cu": (39, "在荣格看来"), "dwell": (40, "神，就住在那里"), "centuries": (42, "几百年来"), "more": (44, "发的人越多"),
    "song": (45, "那唱词"), "door": (46, "而信"), "back": (47, "再回到我妈"), "who": (48, "那生意，到底"), "mutual": (49, "也许答案是"),
    "feedB": (50, "人用香火"), "feedP": (51, "菩萨用一颗"), "fewer": (52, "只是，会唱词"), "stop": (53, "如果有一天"), "still": (54, "那些被唱了"),
    "leave": (55, "这个问题"), "yours": (56, "也说说看"),
}.items()}
SEC = [i["at"] for i in TL["items"] if i["type"] == "section"]   # 段落标题卡出现的时刻（换段落那段安静的开头）
DRUM, ECHO = gap("原声"), gap("余音")
END = TL["duration"] + 3.2
tr = Track(END)


def load(path):
    w = wave.open(path); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    return x.reshape(-1, w.getnchannels()) if w.getnchannels() == 2 else np.stack([x, x], 1)


drum, temple = load("media_src/ep02/guci_drum.wav"), load("media_src/ep02/guci_temple.wav")
def seg(x, a, d, fi=0.05, fo=0.4):
    y = x[int(a * SR): int((a + d) * SR)].copy(); n1, n2 = int(fi * SR), int(fo * SR)
    if n1: y[:n1] *= np.linspace(0, 1, n1)[:, None]
    if n2: y[-n2:] *= np.linspace(1, 0, n2)[:, None]
    return y

# ---------- 原声 ----------
# 开场后鼓声一响：前 3.2 秒放满，之后压到很低，垫在讲述下面直到第一层
d = seg(drum, 0, SEC[0] + 0.5 - DRUM, fi=0.02, fo=1.0)
env = np.ones(len(d)); k = int(3.2 * SR); env[k:k + int(0.8 * SR)] = np.linspace(1, 0.13, int(0.8 * SR))[: len(env[k:k + int(0.8 * SR)])]; env[k + int(0.8 * SR):] = 0.13
tr.add(d * env[:, None], DRUM, gain=0.9, wet=0.12)
# 庙里的现场声，很轻地垫着
tr.add(seg(temple, 0, 10.2, fi=0.6, fo=0.8), S["next"]["start"] - 0.3, gain=0.16, wet=0.1)
tr.add(seg(temple, 0, 10.2, fi=0.6, fo=0.8), SEC[0], gain=0.14, wet=0.1)
tr.add(seg(temple, 1, 9.2, fi=0.6, fo=0.8), SEC[3], gain=0.13, wet=0.1)
# 「唱词，就是跟它说话的方式」：鼓词原声冒出来一下
tr.add(seg(drum, 12, S["door"]["start"] - S["song"]["start"] + 0.3, fi=0.3, fo=0.6), S["song"]["start"] - 0.3, gain=0.32, wet=0.25)
# 结尾：最后一面鼓，余音拖长、慢慢散掉
e = seg(drum, 8, 9.0, fi=0.05, fo=5.0)
tr.add(e, ECHO, gain=0.75, wet=0.55)

# ---------- 氛围底 ----------
bed = pad([55, 82.4, 110, 146.8], END, cutoff=1100)
pts = [(0, 0), (1.5, 0.05), (DRUM - 0.2, 0.05), (DRUM, 0.0), (S["superstition"]["start"], 0.0), (S["superstition"]["start"] + 1.5, 0.045),
       (ECHO - 0.5, 0.045), (ECHO, 0.0), (S["still"]["start"], 0.0), (S["still"]["start"] + 1.0, 0.06), (END - 1, 0.04), (END, 0)]
tr.bed(bed, pts, wet=0.3)

# ---------- 开场 ----------
tr.add(lib("pop_whoosh"), S["ask"]["start"], gain=0.16, wet=0.1)
tr.add(lib("pop_dry"), word(S["reply"], "管它"), gain=0.2, wet=0.1)
tr.add(thump(0.9, 95, 45, 0.35), S["superstition"]["start"] + 1.2, gain=0.5, wet=0.2)
for w in ("社会学", "哈佛", "最神秘"):
    tr.add(lib("shutter_vintage"), word(S["three"], w), gain=0.16, pan=-0.2 if w == "社会学" else 0.2, wet=0.15)
tr.add(shimmer(2.4, 990, seed=3), S["xuan"]["start"] + 1.0, gain=0.05, wet=0.6)

# ---------- 段落：一声钵 ----------
for at, f in zip(SEC, (196, 220, 174.6, 196)):
    tr.add(lib("whoosh_air"), at - 0.1, gain=0.1, wet=0.3); tr.add(bowl(f, 6.0), at, gain=0.22, wet=0.5)

# ---------- 第一层 ----------
for i, w in enumerate(("先请", "先供", "先唱", "求事")):
    tr.add(lib("pop_dry"), word(S["steps"], w), gain=0.16, pan=-0.45 + i * 0.3, wet=0.15)
tr.add(lib("shutter_vintage"), S["durk"]["start"] + 0.3, gain=0.16, wet=0.15)
tr.add(bell(392, 3.0, decay=1.3), S["quote1"]["start"], gain=0.12, wet=0.6)
tr.add(tinkles(7.5, n=70, seed=21, fmin=2500, fmax=6500), word(S["family"], "规矩"), gain=0.05, wet=0.7)
tr.add(lib("light_aura"), S["isgod"]["start"] - 0.2, gain=0.3, wet=0.4)
tr.add(lib("bell_chime"), word(S["renqing"], "中国人"), gain=0.12, wet=0.5)

# ---------- 第二层 ----------
tr.add(lib("shutter_vintage"), S["harvard"]["start"] + 0.2, gain=0.16, wet=0.15)
for i, w in enumerate(("画下", "撒点盐", "数到五", "揉成", "扔掉")):
    tr.add(lib("pop_dry"), word(S["ritual"], w), gain=0.14, pan=-0.3 + 0.15 * i, wet=0.15)
tr.add(lib("sweep_small"), S["groupA"]["start"], gain=0.16, pan=-0.4, wet=0.2)
tr.add(lib("sweep_small"), S["groupB"]["start"], gain=0.16, pan=0.4, wet=0.2)
tr.add(lib("reveal_ding"), S["same"]["start"], gain=0.14, wet=0.3)
# 心跳：先快，再慢慢降下来
beat = thump(0.22, 70, 42, 0.12)
t, a, b = S["result"]["start"], S["result"]["start"], S["believe"]["start"] + 0.3
while t < b:
    u = (t - a) / (b - a); interval = 0.55 + 0.45 * u
    tr.add(beat, t, gain=0.45 * (1 - 0.4 * u), wet=0.1); tr.add(beat, t + 0.16, gain=0.3 * (1 - 0.4 * u), wet=0.1); t += interval
tr.add(thump(1.0, 85, 40, 0.4), S["lab"]["start"], gain=0.5, wet=0.25)
tr.add(lib("sparkle_sweep"), S["lab"]["start"] + 0.1, gain=0.14, wet=0.4)
tr.add(lib("shutter_vintage"), S["malin"]["start"] + 0.2, gain=0.14, wet=0.15)
calm = lp(noise(6.0), 500) * np.sin(np.linspace(0, np.pi, int(6.0 * SR))) ** 2
tr.add(calm, word(S["fish"], "内湖") - 0.5, gain=0.18, wet=0.3)
rough = whoosh(7.0, 120, 900, q=0.7) + lp(noise(7.0), 900) * 0.8
tr.add(rough, word(S["fish"], "外海") - 0.3, gain=0.22, wet=0.3)
tr.add(whoosh(3.5, 150, 700, q=0.8), S["control"]["start"] - 0.2, gain=0.22, wet=0.3)

# ---------- 第三层 ----------
tr.add(lib("projector", seconds=S["why"]["start"] - S["psych"]["start"]), S["psych"]["start"], gain=0.05, wet=0.1)
tr.add(lib("type_soft"), S["jung"]["start"] + 0.1, gain=0.12, wet=0.1)
tr.add(lib("pop_dry"), S["q"]["start"] + 0.6, gain=0.16, pan=-0.3, wet=0.1)
tr.add(lib("pop_dry"), S["a1"]["start"] + 1.0, gain=0.16, pan=0.3, wet=0.1)
tr.add(thump(1.2, 60, 35, 0.6), S["a2"]["start"], gain=0.35, wet=0.35)
tr.add(shimmer(3.0, 880, seed=7), word(S["cu"], "所有人共享"), gain=0.05, wet=0.7)
tr.add(lib("light_aura"), S["dwell"]["start"] - 0.2, gain=0.3, wet=0.45)
tr.add(tinkles(15.0, n=220, seed=41, fmin=2500, fmax=7500), S["centuries"]["start"], gain=0.05, wet=0.7)
tr.add(riser(4.0, 160, 520), S["more"]["start"], gain=0.06, wet=0.4)
tr.add(lib("whoosh_tunnel"), word(S["door"], "打开") - 0.3, gain=0.16, wet=0.4)
tr.add(bowl(146.8, 7.0), word(S["door"], "打开"), gain=0.18, wet=0.6)

# ---------- 最后 ----------
tr.add(bell(523.3, 3.0, decay=1.2), S["mutual"]["start"] + 0.2, gain=0.12, wet=0.6)
tr.add(lib("sparkle_touch"), S["feedB"]["start"], gain=0.1, pan=-0.3, wet=0.5)
tr.add(lib("sparkle_touch"), S["feedP"]["start"], gain=0.1, pan=0.3, wet=0.5)
tr.add(soft_tone(110, 5.0, attack=1.0, release=3.0), S["still"]["start"], gain=0.06, wet=0.6)
tr.add(soft_tone(220, 4.0, attack=0.6, release=2.5), S["yours"]["start"], gain=0.05, wet=0.6)
tr.add(shimmer(2.5, 1320, seed=9), S["yours"]["end"] + 0.4, gain=0.04, wet=0.7)

tr.write(out, fade_out=1.2)
print("ok", out, f"{END:.1f}s")
