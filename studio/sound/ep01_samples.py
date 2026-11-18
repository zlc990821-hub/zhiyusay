"""第 01 期三段样片的音效轨（时间与画面卡点一致，见 src/ep01/*.tsx）
用法：python3 sound/ep01_samples.py public/ep01/   → sfx_open.wav、sfx_glass.wav、sfx_souls.wav
"""
import sys
from sfxlib import (Track, bell, bowl, clue_chime, crackle, glass, pad, pen, projector, riser,
                    shimmer, soft_tone, strike, thump, tinkles, whoosh, noise, lp)

out = sys.argv[1].rstrip("/")


# ---------------- 开场 0–73.4 ----------------
def opening():
    tr = Track(73.4)
    bed = pad([55, 82.4, 110, 164.8], 73.4)
    tr.bed(bed, [(0, 0), (2, 0.07), (9.7, 0.06), (12, 0.045), (33, 0.05), (34.3, 0.075), (46, 0.08), (47.5, 0.05),
                 (63.5, 0.06), (64.2, 0.09), (67.5, 0.06), (73.0, 0.05), (73.4, 0)])
    warm = pad([220, 277.2, 329.6], 73.4, cutoff=1800)          # 拥抱段的一点暖意
    tr.bed(warm, [(0, 0), (34.0, 0), (36, 0.03), (46.5, 0.03), (48.5, 0)], wet=0.5)
    # 日记：翻开纸页，钢笔，划掉
    tr.add(whoosh(0.8, 500, 3000), 9.6, gain=0.08, wet=0.2)
    tr.add(pen(4.3, seed=1), 15.94, gain=0.11, pan=-0.1, wet=0.1)
    tr.add(strike(0.45), 22.82, gain=0.16, pan=-0.05, wet=0.15)
    tr.add(pen(3.7, seed=2), 25.24, gain=0.11, pan=-0.1, wet=0.1)
    tr.add(strike(0.4), 30.3, gain=0.12, wet=0.15)
    for k in range(10):                                         # 拉远时，飞快写满、划掉
        tr.add(pen(0.22, density=20, seed=10 + k), 30.4 + k * 0.27, gain=0.07 * (1 - k / 14), pan=(k % 3 - 1) * 0.3, wet=0.25)
        tr.add(strike(0.2), 30.66 + k * 0.27, gain=0.06 * (1 - k / 14), pan=(k % 3 - 1) * 0.3, wet=0.25)
    tr.add(whoosh(3.6, 2500, 300, q=0.9), 29.7, gain=0.05, wet=0.5)
    # 一个光点 → 三点微光
    tr.add(soft_tone(440, 4.0, attack=0.9, release=2.5), 47.3, gain=0.06, wet=0.7)
    for i, (f, p) in enumerate([(330, -0.25), (440, 0), (554.4, 0.25)]):
        tr.add(bell(f, 3.5, decay=1.6), 52.3 + i * 0.2, gain=0.05, pan=p, wet=0.7)
    tr.add(shimmer(2.0, 1320), 52.4, gain=0.025, wet=0.8)
    tr.add(shimmer(3.0, 1100, seed=4), 59.7, gain=0.03, wet=0.8)
    # 大字
    tr.add(thump(1.6, 52, 33, 0.7), 63.7, gain=0.22, wet=0.3)
    # 第一颗线索亮起，开始旋转 → 接片头
    tr.add(clue_chime(), 68.86, gain=0.12, wet=0.6)
    tr.add(riser(4.0, 160, 520), 69.4, gain=0.07, wet=0.4)
    tr.write(f"{out}/sfx_open.wav", fade_out=0.25)


# ---------------- 碎玻璃 196.0–238.4 ----------------
def glass_seg():
    T0 = 196.0
    tr = Track(238.4 - T0)
    at = lambda s: s - T0
    bed = pad([55, 58.3, 110], tr.dur, cutoff=900)
    tr.bed(bed, [(0, 0), (1.5, 0.05), (at(215), 0.05), (at(221), 0.07), (at(231), 0.05), (at(235), 0.06), (tr.dur, 0.05)])
    # 老片段落里的放映机声
    for a, b in [(200.55, 215.17), (221.5, 224.03), (228.25, 231.3)]:
        p = projector(b - a)
        p[: 2400] *= __import__("numpy").linspace(0, 1, 2400)
        tr.add(p, at(a), gain=0.035, wet=0.1)
    tr.add(whoosh(0.7, 400, 2000), at(200.3), gain=0.05)
    # 两个词：像盖章
    for s, p in [(204.39, -0.4), (212.29, 0.4)]:
        tr.add(thump(0.8, 90, 45, 0.25), at(s), gain=0.25, pan=p, wet=0.2)
        tr.add(noise(0.06) * 0.5, at(s), gain=0.05, pan=p)
    tr.add(whoosh(0.8, 300, 1600), at(209.3), gain=0.05, pan=0.4)
    # 柱状图升起
    for s in (215.17, 224.03):
        tr.add(whoosh(0.5, 2000, 600), at(s) - 0.1, gain=0.05)
        tr.add(soft_tone(392, 1.6, attack=0.4, release=0.8), at(s) + 0.3, gain=0.05, pan=-0.3, wet=0.5)
        tr.add(soft_tone(330, 1.6, attack=0.4, release=0.8), at(s) + 0.65, gain=0.045, pan=0.3, wet=0.5)
    tr.add(bell(660, 1.8, decay=0.6), at(227.39), gain=0.09, wet=0.4)
    # 慢动作碎裂（想象里的碎玻璃）
    tr.add(glass(3.2, slow=2.2, seed=3), at(221.5), gain=0.32, wet=0.45)
    # 碎玻璃一片片消失：倒放的碎片声
    tk = tinkles(1.4, n=30, seed=8)[::-1]
    tr.add(tk, at(228.25), gain=0.1, wet=0.6)
    tr.add(shimmer(1.4, 2200, seed=6), at(228.3), gain=0.03, wet=0.8)
    # 「撞毁」碎掉、落地、化成光点
    tr.add(soft_tone(110, 2.0, attack=0.3, release=1.2), at(231.3), gain=0.08, wet=0.4)
    tr.add(tinkles(0.8, n=10, seed=21, fmin=1500, fmax=4000), at(232.6), gain=0.05, wet=0.3)
    tr.add(glass(2.2, slow=1.0, seed=4), at(233.41), gain=0.36, wet=0.35)
    tr.add(tinkles(1.2, n=40, seed=22), at(233.9), gain=0.12, wet=0.3)
    tr.add(shimmer(1.6, 1760, seed=7), at(234.9), gain=0.04, wet=0.8)
    tr.add(whoosh(1.2, 800, 4000), at(235.0), gain=0.05, wet=0.6)
    tr.add(clue_chime(), at(235.9), gain=0.12, wet=0.6)
    tr.write(f"{out}/sfx_glass.wav", fade_out=0.8)


# ---------------- 三魂 759.6–820.2 ----------------
def souls():
    T0 = 759.6
    tr = Track(820.2 - T0)
    at = lambda s: s - T0
    bed = pad([73.4, 110, 146.8, 220], tr.dur, cutoff=1300)
    tr.bed(bed, [(0, 0), (1.2, 0.06), (at(777), 0.06), (at(778.5), 0.045), (at(782), 0.045), (at(784.5), 0.075),
                 (at(800), 0.08), (at(808), 0.07), (at(809), 0.03), (at(814.5), 0.03), (at(817), 0.05), (tr.dur, 0.03)])
    tr.add(shimmer(1.8, 990), at(761.27), gain=0.035, wet=0.8)
    tr.add(whoosh(1.5, 300, 1500, q=0.9), at(762.9), gain=0.05, wet=0.5)
    # 地：记录
    tr.add(bell(196, 3.5, decay=1.6), at(763.6), gain=0.09, wet=0.6)
    tr.add(pen(0.6, density=12, seed=31), at(765.55), gain=0.05, wet=0.4)
    tr.add(soft_tone(196 * 1.06, 1.4, attack=0.3, release=0.9), at(766.95), gain=0.03, wet=0.6)
    tr.add(whoosh(1.2, 600, 2200), at(768.31), gain=0.05, pan=0.5, wet=0.4)
    # 人：书写（一直在写的、很轻的笔声）
    tr.add(bell(294, 3.5, decay=1.5), at(770.0), gain=0.08, wet=0.6)
    tr.add(pen(9.9, density=6, seed=32), at(770.0), gain=0.03, pan=0.2, wet=0.5)
    # 天：看着的
    tr.add(bell(440, 4.0, decay=2.0), at(776.3), gain=0.08, wet=0.7)
    tr.add(soft_tone(440, 8.0, attack=1.5, release=3.0, harm=(1, 0.2)), at(776.5), gain=0.03, wet=0.8)
    # 记录没了、书写停了
    tr.add(soft_tone(146.8, 2.0, attack=0.2, release=1.6), at(777.9), gain=0.04, wet=0.6)
    tr.add(soft_tone(130.8, 2.0, attack=0.2, release=1.6), at(779.9), gain=0.04, wet=0.6)
    # 三魂：三声
    for s, f in [(786.04, 196), (787.34, 294), (788.26, 440)]:
        tr.add(bell(f, 3.5, decay=1.6), at(s), gain=0.08, wet=0.6)
    # 像不像：更亮的一声
    for s, f, p in [(791.64, 196, -0.1), (795.26, 294, 0), (799.06, 440, 0.1)]:
        tr.add(bell(f, 5.0, decay=2.4, bright=1.6), at(s), gain=0.11, pan=p, wet=0.7)
    tr.add(shimmer(3.0, 880, seed=12), at(800.6), gain=0.025, wet=0.8)
    # 庄子：一声磬
    tr.add(bowl(220, 7.0), at(808.58), gain=0.16, wet=0.5)
    # 柴火 → 烛火
    fire = crackle(3.0)
    tr.add(fire, at(814.6), gain=0.12, wet=0.2)
    tr.add(soft_tone(330, 3.6, attack=0.8, release=2.0), at(816.8), gain=0.04, wet=0.8)
    tr.write(f"{out}/sfx_souls.wav", fade_out=1.0)


opening()
glass_seg()
souls()
print("ok")
