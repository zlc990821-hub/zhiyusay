"""第 01 期三段样片的音效轨（时间与画面卡点一致，见 src/ep01/*.tsx）
真实录制的音效来自 Mixkit（sound/mixkit_manifest.txt），氛围底和音高类的声音用代码合成。
原则：有趣、有节奏感，但不抢话；音效整体比人声低约 15 LU。
用法：python3 sound/ep01_samples.py public/ep01/   → sfx_open.wav、sfx_glass.wav、sfx_souls.wav
"""
import sys
import numpy as np
from sfxlib import (Track, bell, bowl, clue_chime, glass, lib, pad, riser, shimmer, soft_tone, thump, tinkles)

out = sys.argv[1].rstrip("/")


def chain(tr, name, a, b, gain, step=None, pan=0.0, wet=0.15):
    """把一段短音效接连铺满 [a, b)，用于连续写字等"""
    x = lib(name)
    step = step or len(x) / 48000 * 0.95
    k, t = 0, a
    while t < b - 0.1:
        tr.add(x, t, gain=gain * (0.85 + 0.15 * ((k * 7) % 3) / 2), pan=pan + (0.08 if k % 2 else -0.08), wet=wet)
        t += step; k += 1


# ---------------- 开场 0–81.4（含本期主题片头的 8 秒） ----------------
def opening():
    tr = Track(81.4)
    tr.bed(pad([55, 82.4, 110, 164.8], tr.dur), [(0, 0), (2, 0.07), (9.7, 0.06), (12, 0.045), (33, 0.05), (34.3, 0.075), (46, 0.08),
                                                 (47.5, 0.05), (63.5, 0.06), (64.2, 0.09), (67.5, 0.06), (73.0, 0.05), (73.6, 0)])
    tr.bed(pad([220, 277.2, 329.6], tr.dur, cutoff=1800), [(0, 0), (34.0, 0), (36, 0.03), (46.5, 0.03), (48.5, 0)], wet=0.5)
    for k in range(5):                                   # 「1985 · 英国」打字机轻响
        tr.add(lib("type_soft"), 1.25 + k * 0.11, gain=0.07, wet=0.1)
    # 日记：翻开、写字、划掉
    tr.add(lib("page_big"), 9.7, gain=0.14, wet=0.15)
    chain(tr, "pen_write", 15.94, 20.2, 0.15)
    tr.add(lib("marker_line"), 22.82, gain=0.22, wet=0.1)
    chain(tr, "pen_write", 25.24, 28.9, 0.15)
    tr.add(lib("whoosh_tunnel"), 29.6, gain=0.07, wet=0.3)
    tr.add(lib("marker_line"), 30.3, gain=0.15, wet=0.1)
    for k in range(10):                                  # 拉远时飞快写满、划掉
        g = 0.09 * (1 - k / 13)
        tr.add(lib("scribble"), 30.4 + k * 0.27, gain=g, pan=(k % 3 - 1) * 0.4, wet=0.3)
        tr.add(lib("marker_line"), 30.66 + k * 0.27, gain=g * 0.9, pan=(k % 3 - 1) * 0.4, wet=0.3)
    # 一个光点 → 三点微光
    tr.add(lib("sparkle_touch"), 47.3, gain=0.06, wet=0.6)
    tr.add(soft_tone(440, 4.0, attack=0.9, release=2.5), 47.3, gain=0.04, wet=0.7)
    for i, (f, p) in enumerate([(330, -0.25), (440, 0), (554.4, 0.25)]):
        tr.add(bell(f, 3.5, decay=1.6), 52.3 + i * 0.2, gain=0.05, pan=p, wet=0.7)
    tr.add(lib("sparkle_fairy"), 52.4, gain=0.05, wet=0.6)
    tr.add(shimmer(3.0, 1100, seed=4), 59.7, gain=0.03, wet=0.8)
    # 大字
    tr.add(thump(1.6, 52, 33, 0.7), 63.7, gain=0.22, wet=0.3)
    # 第一颗线索亮起、开始旋转 → 接本期主题片头
    tr.add(lib("sparkle_fairy"), 68.86, gain=0.12, wet=0.5)
    tr.add(clue_chime(), 68.86, gain=0.07, wet=0.6)
    tr.add(riser(4.0, 160, 520), 69.4, gain=0.06, wet=0.4)
    tr.add(lib("whoosh_tunnel"), 72.7, gain=0.07, wet=0.3)
    tr.add(lib("sparkle_sweep"), 73.4 + 5.0, gain=0.10, wet=0.4)   # 光带扫出标题
    tr.write(f"{out}/sfx_open.wav", fade_out=0.6)


# ---------------- 碎玻璃 196.0–238.4 ----------------
def glass_seg():
    T0 = 196.0
    tr = Track(238.4 - T0)
    at = lambda s: s - T0
    tr.bed(pad([55, 58.3, 110], tr.dur, cutoff=900), [(0, 0), (1.5, 0.05), (at(219), 0.05), (at(221), 0.07), (at(231), 0.05), (at(235), 0.06), (tr.dur, 0.05)])
    # 肖像、人名条
    tr.add(lib("shutter_vintage"), at(196.6), gain=0.16, wet=0.15)
    for k in range(8):
        tr.add(lib("type_soft"), at(198.3) + k * 0.1, gain=0.06, pan=-0.4, wet=0.1)
    # 实验板出现；录像屏幕里放着老片 → 放映机声
    tr.add(lib("whoosh_air"), at(200.4), gain=0.10, wet=0.2)
    proj = lib("projector", seconds=231.0 - 200.55)
    proj[: 9600] *= np.linspace(0, 1, 9600)[:, None]
    tr.add(proj, at(200.55), gain=0.035, wet=0.1)
    # 两张问题卡：出现时轻轻一「啵」，被换掉的词亮起时一声脆响 + 划线
    for card, word, p in [(202.4, 204.39, -0.35), (209.51, 212.29, 0.35)]:
        tr.add(lib("pop_whoosh"), at(card), gain=0.16, pan=p, wet=0.15)
        tr.add(lib("pop_dry"), at(word), gain=0.15, pan=p, wet=0.15)
        tr.add(lib("marker_line"), at(word) + 0.08, gain=0.08, pan=p, wet=0.1)
    tr.add(lib("whoosh_air"), at(203.0), gain=0.05, wet=0.3)
    # 车速数字跳动
    for s, p in [(215.4, -0.35), (215.8, 0.35)]:
        tr.add(lib("tick_counter", seconds=1.3), at(s), gain=0.07, pan=p, wet=0.1)
    # 一周以后：镜头移到屏幕，屏幕上浮出想象中的裂纹
    tr.add(lib("whoosh_air"), at(219.0), gain=0.08, wet=0.3)
    tr.add(lib("glass_break"), at(221.7), gain=0.12, wet=0.5)
    tr.add(tinkles(1.2, n=18, seed=8), at(221.8), gain=0.04, wet=0.6)
    # 50 人点阵一个个亮起
    for k in range(16):
        tr.add(lib("clock_tick"), at(224.53) + k * 0.07, gain=0.045, pan=-0.35, wet=0.1)
    for k in range(7):
        tr.add(lib("clock_tick"), at(225.1) + k * 0.07, gain=0.045, pan=0.35, wet=0.1)
    tr.add(lib("reveal_ding"), at(227.39), gain=0.14, wet=0.3)
    # 裂纹消失、镜头推进屏幕：车完好地开过去
    tr.add(lib("sparkle_transition"), at(228.3), gain=0.08, wet=0.4)
    tr.add(lib("whoosh_fast"), at(228.4), gain=0.10, wet=0.2)
    # 「撞毁」碎掉、落地、化成光点飞进线索图
    tr.add(soft_tone(110, 2.0, attack=0.3, release=1.2), at(231.3), gain=0.07, wet=0.4)
    tr.add(tinkles(0.8, n=10, seed=21, fmin=1500, fmax=4000), at(232.6), gain=0.05, wet=0.3)
    tr.add(lib("glass_break"), at(233.41), gain=0.32, wet=0.3)
    tr.add(glass(2.2, slow=1.0, seed=4), at(233.41), gain=0.12, wet=0.35)
    tr.add(lib("glass_sweep"), at(233.95), gain=0.10, wet=0.2)
    tr.add(lib("sparkle_sweep"), at(235.0), gain=0.08, wet=0.5)
    tr.add(lib("sparkle_fairy"), at(235.9), gain=0.12, wet=0.5)
    tr.add(clue_chime(), at(235.9), gain=0.06, wet=0.6)
    tr.write(f"{out}/sfx_glass.wav", fade_out=0.8)


# ---------------- 三魂 759.6–820.2 ----------------
def souls():
    T0 = 759.6
    tr = Track(820.2 - T0)
    at = lambda s: s - T0
    tr.bed(pad([73.4, 110, 146.8, 220], tr.dur, cutoff=1300), [(0, 0), (1.2, 0.06), (at(777), 0.06), (at(778.5), 0.045), (at(782), 0.045), (at(784.5), 0.075),
                                                                (at(800), 0.08), (at(808), 0.07), (at(809), 0.03), (at(814.5), 0.03), (at(817), 0.05), (tr.dur, 0.03)])
    tr.add(lib("sparkle_touch"), at(761.27), gain=0.06, wet=0.6)
    tr.add(lib("whoosh_air"), at(762.9), gain=0.07, wet=0.4)
    # 地：记录
    tr.add(bell(196, 3.5, decay=1.6), at(763.6), gain=0.08, wet=0.6)
    tr.add(lib("light_aura"), at(763.6), gain=0.035, wet=0.6)
    tr.add(lib("pencil_write", seconds=0.9), at(765.55), gain=0.07, wet=0.3)
    tr.add(soft_tone(196 * 1.06, 1.4, attack=0.3, release=0.9), at(766.95), gain=0.03, wet=0.6)
    tr.add(lib("paper_slide"), at(768.31), gain=0.10, pan=0.4, wet=0.3)
    # 人：书写（很轻的笔声，一直在写，书写停了它也停）
    tr.add(bell(294, 3.5, decay=1.5), at(770.0), gain=0.08, wet=0.6)
    chain(tr, "pen_write", at(770.0), at(779.9), 0.03, wet=0.5)
    # 天：看着的
    tr.add(bell(440, 4.0, decay=2.0), at(776.3), gain=0.08, wet=0.7)
    tr.add(lib("light_aura"), at(776.3), gain=0.045, wet=0.6)
    tr.add(soft_tone(146.8, 2.0, attack=0.2, release=1.6), at(777.9), gain=0.04, wet=0.6)
    tr.add(soft_tone(130.8, 2.0, attack=0.2, release=1.6), at(779.9), gain=0.04, wet=0.6)
    # 三魂的名字浮现
    for s, f in [(786.04, 196), (787.34, 294), (788.26, 440)]:
        tr.add(bell(f, 3.5, decay=1.6), at(s), gain=0.08, wet=0.6)
    # 像不像：更亮的一声
    for s, f, p in [(791.64, 196, -0.1), (795.26, 294, 0), (799.06, 440, 0.1)]:
        tr.add(bell(f, 5.0, decay=2.4, bright=1.6), at(s), gain=0.10, pan=p, wet=0.7)
        tr.add(lib("sparkle_touch"), at(s), gain=0.05, pan=p, wet=0.6)
    tr.add(shimmer(3.0, 880, seed=12), at(800.6), gain=0.025, wet=0.8)
    # 庄子：一声磬；柴火在字下面烧，「柴会烧完」时变响；「火，传下去了」划一根火柴
    tr.add(bowl(220, 7.0), at(808.58), gain=0.14, wet=0.5)
    fire = lib("campfire", seconds=817.6 - 808.3)
    env = np.interp(np.arange(len(fire)) / 48000, [0, 0.9, 6.3, 7.2, 8.4, 9.3], [0, 0.35, 0.35, 1, 1, 0])
    tr.add(fire * env[:, None], at(808.3), gain=0.10, wet=0.15)
    tr.add(lib("match_light", seconds=2.5), at(816.5), gain=0.12, wet=0.3)
    tr.add(soft_tone(330, 3.6, attack=0.8, release=2.0), at(816.8), gain=0.035, wet=0.8)
    tr.write(f"{out}/sfx_souls.wav", fade_out=1.0)


opening()
glass_seg()
souls()
print("ok")
