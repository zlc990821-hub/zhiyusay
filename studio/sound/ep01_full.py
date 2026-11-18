"""第 01 期整片音效轨（成片时间轴）。
成片时间：录音 0–73.4 秒照原样；73.4 起插入 8 秒主题片头，之后的录音整体往后挪 8 秒。
三段样片的音效（sfx_open / sfx_glass / sfx_souls）原样放回各自位置，其余各段在这里按画面卡点配。
用法：python3 sound/ep01_full.py public/ep01/   → sfx_full.wav（成片长度，48kHz 立体声）
"""
import sys, wave
import numpy as np
from sfxlib import (Track, bell, bowl, clue_chime, lib, pad, riser, shimmer, soft_tone, thump, tinkles, whoosh, SR)

out = sys.argv[1].rstrip("/")
TITLE_AT, TITLE_LEN = 73.4, 8.0
V_END = 875.6                     # 录音 875.6 起是品牌片尾（8 秒）
FILM = V_END + TITLE_LEN + 8.0    # 成片总长
V = lambda v: v if v < TITLE_AT else v + TITLE_LEN
tr = Track(FILM)


def ev(name_or_sig, v, gain, pan=0.0, wet=0.2, **kw):
    sig = lib(name_or_sig, **kw) if isinstance(name_or_sig, str) else name_or_sig
    tr.add(sig, V(v), gain=gain, pan=pan, wet=wet)


def chain(name, a, b, gain, wet=0.15):
    x = lib(name); step = len(x) / SR * 0.95; t, k = a, 0
    while t < b - 0.1:
        tr.add(x, V(t), gain=gain * (0.85 + 0.15 * (k % 3) / 2), pan=0.08 if k % 2 else -0.08, wet=wet); t += step; k += 1


def types(v, n, gain=0.06, pan=-0.4):
    for k in range(n): ev("type_soft", v + k * 0.1, gain, pan=pan, wet=0.1)


def new_clue(v):
    ev("sparkle_fairy", v, 0.12, wet=0.5); ev(clue_chime(), v, 0.06, wet=0.6)


def keyline(v):
    ev(thump(1.4, 50, 34, 0.6), v, 0.16, wet=0.3)


def load(path):
    w = wave.open(path); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    return x.reshape(-1, w.getnchannels()) if w.getnchannels() == 2 else np.stack([x, x], 1)


def put_sample(path, film_at, cut_len, fade=0.5):
    x = load(path)[: int(cut_len * SR)]
    n = int(fade * SR); x[-n:] *= np.linspace(1, 0, n)[:, None]
    tr.add(x, film_at, gain=1.0, wet=0.0)


# ---------- 三段样片的音效，放回原位 ----------
put_sample(f"{out}/sfx_open.wav", 0.0, 81.4, fade=0.3)                 # 开场 + 主题片头的光带
put_sample(f"{out}/sfx_glass.wav", V(196.0), 237.5 - 196.0, fade=0.6)  # 碎玻璃
put_sample(f"{out}/sfx_souls.wav", V(759.6), 819.3 - 759.6, fade=0.8)  # 三魂

# ---------- 氛围底：其余各段一层很低的长音，和样片的底衔接 ----------
bed = pad([55, 82.4, 110, 164.8], FILM, cutoff=1300)
gaps = [(73.4, 196.0), (237.5, 759.6), (819.3, 875.6)]
pts = [(0, 0)]
for a, b in gaps:
    pts += [(V(a) - 0.01, 0), (V(a) + 1.5, 0.05), (V(b) - 1.5, 0.05), (V(b), 0)]
pts += [(FILM, 0)]
tr.bed(bed, pts, wet=0.25)

# ---------- 01 先立一个常识 ----------
ev("whoosh_air", 77.2, 0.06, wet=0.3); ev("whoosh_air", 80.9, 0.05, pan=0.4, wet=0.3)
ev("sparkle_touch", 78.8, 0.06, pan=-0.3, wet=0.5); ev("sparkle_touch", 82.0, 0.06, pan=0.3, wet=0.5)
ev("sparkle_transition", 83.4, 0.09, wet=0.4); ev("whoosh_air", 83.5, 0.06, wet=0.3)
ev("bell_chime", 84.9, 0.06, wet=0.5)
for v in (91.6, 93.8, 95.6): ev("pop_dry", v, 0.12, pan=-0.2, wet=0.15)
ev("pop_long", 97.1, 0.10, wet=0.2); ev(soft_tone(196, 2.5, attack=0.2, release=1.5), 97.1, 0.05, wet=0.5)
ev("sparkle_touch", 102.8, 0.07, wet=0.5)
ev("shutter_vintage", 105.4, 0.15, pan=-0.5, wet=0.15)
ev("sparkle_touch", 111.1, 0.06, pan=0.2, wet=0.5); ev("whoosh_air", 114.4, 0.07, pan=0.4, wet=0.3)
ev("bell_chime", 117.4, 0.08, pan=0.5, wet=0.5)
ev(soft_tone(220, 3.0, attack=1.0, release=1.5), 120.3, 0.04, wet=0.7)                     # 「默认了一件事」那团光
ev("pop_dry", 123.4, 0.07, wet=0.3); ev("pop_dry", 125.0, 0.07, wet=0.3)                  # 两行字浮现
keyline(128.4); new_clue(130.1)
ev("glass_break", 135.3, 0.06, pan=-0.4, wet=0.4); ev(tinkles(0.8, n=8, seed=31), 135.4, 0.03, wet=0.5)

# ---------- 02 皮亚杰 ----------
ev("shutter_vintage", 138.3, 0.15, pan=0.4, wet=0.15); types(138.8, 7)
proj = lib("projector", seconds=184.3 - 150.3); proj[:9600] *= np.linspace(0, 1, 9600)[:, None]
tr.add(proj, V(150.3), gain=0.03, wet=0.1)
ev("shutter_vintage", 169.6, 0.12, wet=0.2)                 # 定格
ev("paper_slide", 175.6, 0.14, pan=0.5, wet=0.2)             # 信滑进来
chain("pen_write", 176.2, 182.4, 0.06)
ev("paper_slice", 184.3, 0.25, wet=0.2); ev("whoosh_air", 184.4, 0.06, wet=0.3)   # 撕开
ev("whoosh_air", 186.6, 0.05, wet=0.3); new_clue(189.4)

# ---------- 02 商场 ----------
proj2 = lib("projector", start=4.0, seconds=259.3 - 240.2); proj2[:9600] *= np.linspace(0, 1, 9600)[:, None]
tr.add(proj2, V(240.2), gain=0.03, wet=0.1)
ev("pop_whoosh", 246.4, 0.14, pan=-0.5, wet=0.15); ev("reveal_ding", 249.9, 0.10, pan=-0.4, wet=0.3)
ev("pencil_write", 253.2, 0.07, wet=0.3, seconds=1.0); ev("pencil_write", 255.4, 0.07, wet=0.3, seconds=1.2)
ev(shimmer(1.6, 1320, seed=5), 253.3, 0.02, wet=0.8)
ev("whoosh_air", 259.0, 0.06, wet=0.3); new_clue(259.3); keyline(259.4)
ev("whoosh_tunnel", 264.6, 0.05, wet=0.3)

# ---------- 03 挑战者号、巴特莱特、老鼠、日志 ----------
rumble = thump(5.5, 45, 30, 4.0) * 0.6 + whoosh(5.5, 80, 300, q=0.8) * 0.4
ev(rumble, 270.9, 0.18, wet=0.2)
ev("paper_slide", 277.4, 0.12, pan=-0.4, wet=0.2); chain("pen_write", 281.0, 286.8, 0.07)
ev("paper_slide", 287.5, 0.12, pan=0.4, wet=0.2); chain("pen_write", 288.4, 293.6, 0.07)
ev("marker_line", 298.4, 0.14, pan=-0.3); ev("marker_line", 298.6, 0.14, pan=0.3)
ev(thump(0.6, 95, 50, 0.2), 301.1, 0.22, pan=0.3, wet=0.15); ev("paper_slice", 301.1, 0.08, pan=0.3)   # 盖章
types(309.3, 9)                                                                          # 巴特莱特人名条
for v, p in ((311.8, -0.5), (315.8, 0.0), (318.9, 0.5)): ev("page_turn", v, 0.14, pan=p, wet=0.15)
ev("marker_line", 324.4, 0.12); ev("sparkle_touch", 328.1, 0.06, wet=0.5)
ev("pop_long", 331.0, 0.10, wet=0.2); ev(soft_tone(220, 2.4, attack=0.2, release=1.4), 331.0, 0.05, wet=0.5)
ev("whoosh_air", 334.9, 0.06, wet=0.3)
ev("sparkle_touch", 343.0, 0.06, pan=-0.2, wet=0.5); ev("pop_dry", 346.4, 0.11, pan=0.3)
ev(soft_tone(220, 2.4, attack=0.3, release=1.8) * np.linspace(1, 0.4, int(2.4 * SR)), 351.3, 0.05, wet=0.5)
ev("sparkle_fairy", 353.7, 0.08, wet=0.5); ev("pop_dry", 353.9, 0.09, pan=0.3)
ev(shimmer(2.0, 1500, seed=9), 357.4, 0.03, wet=0.7); ev("whoosh_air", 357.4, 0.06, wet=0.3); ev("sparkle_touch", 359.4, 0.07, wet=0.5)
ev("page_big", 364.4, 0.13, wet=0.15)
for v in (368.0, 370.0): ev("page_turn", v, 0.13, wet=0.15); ev("scribble", v + 0.4, 0.08, wet=0.2)
ev("whoosh_air", 372.5, 0.05, wet=0.3); keyline(379.6)
ev("whoosh_air", 384.2, 0.06, wet=0.3); new_clue(384.4); ev("sparkle_touch", 385.2, 0.07, pan=0.4, wet=0.5)
for k in range(6): ev(soft_tone(330 * 0.9 ** k, 0.9, attack=0.02, release=0.8), 394.0 + k * 0.38, 0.04, pan=-0.5 + k * 0.2, wet=0.5)

# ---------- 04 H.M.、克莱夫、外婆、发现一 ----------
ev(soft_tone(165, 2.5, attack=0.8, release=1.5), 398.0, 0.04, wet=0.6); types(399.8, 9)
ev("sparkle_touch", 407.4, 0.07, wet=0.5); ev("whoosh_fast", 409.8, 0.08, pan=0.4, wet=0.2); ev(thump(0.9, 70, 40, 0.4), 410.0, 0.10)
for v in (416.6, 419.4): ev("pop_dry", v, 0.12, pan=0.4); ev("whoosh_air", v + 1.6, 0.04, pan=0.5, wet=0.4)
ev("whoosh_air", 422.9, 0.06, wet=0.3)
chain("pencil_write", 426.4, 429.8, 0.06); chain("pencil_write", 430.8, 432.6, 0.06); chain("pencil_write", 432.6, 434.2, 0.06)
for k in range(3): ev("pop_dry", 434.5 + k * 0.25, 0.10, pan=-0.5 + k * 0.5)
keyline(438.7); types(442.4, 8)
ev("whoosh_air", 475.4, 0.05, wet=0.3)
for k, v in enumerate((475.8, 476.6, 477.4)): ev("sparkle_touch", v, 0.06, pan=-0.4 + k * 0.4, wet=0.5)
ev("sparkle_sweep", 480.6, 0.08, wet=0.4); new_clue(481.0); keyline(486.4)
ev("whoosh_air", 492.6, 0.06, pan=0.4, wet=0.3); ev(shimmer(1.6, 1320, seed=13), 492.8, 0.025, wet=0.8)

# ---------- 05 AI、传送机、清单 ----------
for k in range(12): ev("type_soft", 499.6 + k * 0.45, 0.05, pan=0.1, wet=0.1)
for i in range(8): ev("pop_dry" if i % 2 else "pop_whoosh", 506.1 + i * 0.32, 0.11, pan=-0.5 + (i % 4) * 0.33, wet=0.15)
ev("whoosh_air", 508.8, 0.07, wet=0.3); ev("sparkle_sweep", 509.6, 0.07, wet=0.4)
ev(soft_tone(147, 2.5, attack=0.2, release=1.8), 512.3, 0.05, wet=0.5); keyline(512.3)
ev("shutter_vintage", 516.9, 0.15, pan=0.4, wet=0.15); types(517.2, 7)
ev("whoosh_air", 521.0, 0.06, wet=0.3); ev(soft_tone(110, 22.0, attack=1.0, release=3.0, harm=(1, 0.5, 0.25)), 521.0, 0.02, wet=0.3)
ev(whoosh(1.8, 600, 2600, q=2.0), 526.8, 0.08, pan=-0.5, wet=0.2)                      # 扫描
ev("sparkle_transition", 529.2, 0.08, pan=-0.5, wet=0.4); ev("whoosh_tunnel", 529.6, 0.07, wet=0.3)
ev("sparkle_sweep", 532.3, 0.08, pan=0.5, wet=0.4); ev("sparkle_touch", 536.2, 0.06, pan=0.5, wet=0.5); ev("pop_dry", 539.6, 0.11, pan=0.5)
beep = np.concatenate([soft_tone(880, 0.18, attack=0.01, release=0.05), np.zeros(int(0.12 * SR)), soft_tone(660, 0.18, attack=0.01, release=0.05), np.zeros(int(0.12 * SR))])
for k in range(4): ev(beep, 543.7 + k * 0.62, 0.05, pan=-0.5, wet=0.2)                 # 故障
ev("sparkle_touch", 547.8, 0.06, pan=-0.5, wet=0.5); keyline(549.5)
ev("whoosh_air", 554.5, 0.06, wet=0.3); ev("pop_long", 559.0, 0.09, wet=0.2)
for v in (563.2, 564.8, 566.0): ev("pop_dry", v, 0.11); ev("clock_tick", v + 0.35, 0.09)
keyline(567.6); ev("whoosh_air", 570.0, 0.05, wet=0.3); ev("sparkle_touch", 573.6, 0.06, pan=0.3, wet=0.5)

# ---------- 06 里德、那先、讲故事的人 ----------
ev(tinkles(0.8, n=8, seed=41), 575.9, 0.03, wet=0.5)
ev("shutter_vintage", 580.5, 0.15, pan=0.4, wet=0.15); types(580.8, 8)
for v, p in ((584.0, -0.5), (588.0, 0.0), (598.6, 0.5)): ev("pop_whoosh", v, 0.13, pan=p)
for v, p in ((585.0, -0.5), (590.0, 0.0), (599.0, 0.5)): ev("pop_dry", v, 0.10, pan=p)
ev("whoosh_air", 594.0, 0.05, pan=-0.3, wet=0.3); ev("whoosh_air", 599.6, 0.05, pan=0.3, wet=0.3); ev("marker_line", 602.4, 0.10)
ev("bell_chime", 605.2, 0.06, pan=0.3, wet=0.4); ev("bell_chime", 609.4, 0.06, pan=-0.3, wet=0.4)
buzz = soft_tone(120, 0.5, attack=0.01, release=0.2, harm=(1, 0.6, 0.4, 0.3)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 14 * np.arange(int(0.5 * SR)) / SR)))
ev(buzz, 611.7, 0.05, wet=0.2); keyline(617.4)
ev(soft_tone(147, 2.0, attack=0.6, release=1.2), 621.0, 0.04, wet=0.5)
for v in (623.6, 626.6, 628.6): ev("pop_dry", v, 0.11)
ev("whoosh_fast", 636.0, 0.10, wet=0.2); ev(thump(0.8, 80, 45, 0.3), 636.2, 0.08); ev(soft_tone(196, 2.0, attack=0.2, release=1.4), 637.4, 0.04, wet=0.5)
ev("whoosh_air", 640.6, 0.05, wet=0.3)
for v in (641.0, 642.6, 644.0): ev("pop_dry", v, 0.10); ev("whoosh_air", v + 1.6, 0.03, wet=0.4)
ev(soft_tone(165, 2.0, attack=0.2, release=1.5), 648.8, 0.04, wet=0.5)
ev(soft_tone(294, 1.6, attack=0.02, release=1.4) * np.linspace(1, 0.2, int(1.6 * SR)), 651.6, 0.05, wet=0.5)
chain("pen_write", 654.2, 660.4, 0.08)
keyline(660.8); ev("sparkle_touch", 667.4, 0.06, wet=0.5)
ev("pencil_write", 669.3, 0.07, pan=-0.4, wet=0.3, seconds=1.2); ev("pencil_write", 672.1, 0.07, pan=0.3, wet=0.3, seconds=1.5)
ev("sparkle_touch", 675.0, 0.06, wet=0.5); ev("shutter_vintage", 678.2, 0.12, pan=-0.6, wet=0.2)
ev("whoosh_air", 680.6, 0.05, wet=0.3); ev("sparkle_touch", 683.8, 0.06, pan=0.4, wet=0.5); ev("whoosh_air", 688.0, 0.05, pan=0.5, wet=0.3)
ev("whoosh_air", 690.4, 0.05, wet=0.3); new_clue(690.6); keyline(694.0)
ev(soft_tone(330, 2.4, attack=0.02, release=2.2) * np.linspace(1, 0.1, int(2.4 * SR)), 699.4, 0.05, wet=0.5)

# ---------- 07 日记重现、此刻 ----------
ev("page_big", 703.2, 0.13, wet=0.15)
chain("pen_write", 708.6, 710.4, 0.12); ev("marker_line", 713.4, 0.18)
chain("pen_write", 714.6, 716.4, 0.12); ev("marker_line", 716.4, 0.15)
for k in range(18):
    g = 0.08 * (1 - k / 22)
    ev("scribble", 716.9 + k * 0.24, g, pan=(k % 3 - 1) * 0.4, wet=0.3); ev("marker_line", 717.15 + k * 0.24, g * 0.9, pan=(k % 3 - 1) * 0.4, wet=0.3)
ev(soft_tone(220, 2.8, attack=0.4, release=2.0) * np.linspace(1, 0.2, int(2.8 * SR)), 723.0, 0.05, wet=0.6)
ev(pad([220, 277.2, 329.6], 10.0, cutoff=1800) * np.sin(np.linspace(0, np.pi, int(10 * SR))), 727.4, 0.04, wet=0.5)
ev(tinkles(9.5, n=120, seed=51, fmin=2500, fmax=7000), 737.0, 0.025, wet=0.7)
ev("pop_dry", 740.4, 0.09); ev("whoosh_tunnel", 746.6, 0.06, wet=0.3); ev("sparkle_touch", 749.0, 0.07, wet=0.5)
new_clue(751.1); ev("whoosh_air", 756.8, 0.05, wet=0.3); keyline(757.4)

# ---------- 09 最后一条线索 ----------
ev(bowl(196, 7.0), 824.2, 0.08, wet=0.6); ev("bell_chime", 824.0, 0.05, wet=0.5)
ev("paper_slide", 831.2, 0.10, wet=0.2); ev(shimmer(4.0, 990, seed=61)[::-1], 832.6, 0.02, wet=0.8)
for k, f in enumerate((196, 294, 440)): ev(bell(f, 3.0, decay=1.5), 838.0 + k * 0.7, 0.05, wet=0.7)
ev("whoosh_tunnel", 841.6, 0.05, wet=0.4)
for k in range(5): ev(soft_tone(294 * 0.9 ** k, 1.0, attack=0.02, release=0.9), 849.0 + k * 0.5, 0.035, pan=-0.4 + k * 0.2, wet=0.6)
ev("sparkle_touch", 851.9, 0.06, wet=0.5); keyline(867.6)
ev(riser(3.0, 160, 420), 872.8, 0.04, wet=0.4)

tr.write(f"{out}/sfx_full.wav", fade_out=0.5)
print("ok", FILM)
