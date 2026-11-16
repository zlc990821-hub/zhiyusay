"""「离心」片头片尾音效：全部用代码合成，与画面时间点严格对齐（见 src/brand/Intro.tsx、Outro.tsx）。
用法：python3 sound/brand_sfx.py out/   →  生成 brand_intro.wav、brand_outro.wav（48kHz 立体声）
"""
import sys, wave
import numpy as np
from scipy import signal

SR = 48000
DUR = 8.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def env(points):
    """分段线性包络：[(秒, 值), ...]"""
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


def bandnoise_tv(fc, q=4.0, block=256):
    """中心频率随时间变化的带通噪声"""
    x = rng.standard_normal(N)
    y = np.zeros(N)
    zi = np.zeros(2)
    for s in range(0, N, block):
        e = min(N, s + block)
        f = float(np.clip(fc[s], 30, SR / 2 - 1000))
        w0 = 2 * np.pi * f / SR
        alpha = np.sin(w0) / (2 * q)
        b = np.array([alpha, 0, -alpha]); a = np.array([1 + alpha, -2 * np.cos(w0), 1 - alpha])
        b /= a[0]; a /= a[0]
        y[s:e], zi = signal.lfilter(b, a, x[s:e], zi=zi)
    return y / (np.max(np.abs(y)) + 1e-9)


def pan(mono, p):
    """p: -1 左 … +1 右，等功率"""
    p = np.broadcast_to(p, mono.shape)
    ang = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(ang), mono * np.sin(ang)], axis=1)


def reverb(st, seconds=2.6, mix=0.35):
    n = int(SR * seconds)
    tt = np.arange(n) / SR
    out = np.zeros_like(st)
    sos = signal.butter(2, 5000, "low", fs=SR, output="sos")
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-tt * 3.2 / seconds * 2.3)
        ir = signal.sosfilt(sos, ir)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = signal.fftconvolve(st[:, ch], ir)[: len(st)]
    return st * (1 - mix) + out * mix


def bell(t0, f0, amp, decay=2.5, partials=(1, 2.0, 2.76, 5.4, 8.93)):
    y = np.zeros(N)
    m = t >= t0
    tt = t[m] - t0
    for i, k in enumerate(partials):
        y[m] += np.sin(2 * np.pi * f0 * k * tt) * np.exp(-tt * (1.5 + i * 1.2) / decay * 2) / (1 + i)
    att = smooth(tt / 0.004)
    y[m] *= att
    return y * amp


def thump(t0, amp, f_start=58, f_end=32, decay=1.1):
    y = np.zeros(N)
    m = t >= t0
    tt = t[m] - t0
    f = f_end + (f_start - f_end) * np.exp(-tt * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y[m] = np.sin(ph) * np.exp(-tt / decay * 2.2) * smooth(tt / 0.01)
    return y * amp


def pad(freqs, amp_env, detune=0.15):
    y = np.zeros(N)
    for i, f in enumerate(freqs):
        for d in (-detune, detune):
            y += np.sin(2 * np.pi * (f + d) * t + i) / len(freqs)
    sos = signal.butter(2, 1800, "low", fs=SR, output="sos")
    return signal.sosfilt(sos, y) * amp_env


def drone(amp_env, base=55):
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.3 * t)
    y = np.sin(2 * np.pi * base * t) + 0.45 * np.sin(2 * np.pi * base * 2 * t + 0.5) + 0.15 * np.sin(2 * np.pi * base * 3 * t + 1.1)
    return y * lfo * amp_env


def finish(st, fade_in=0.5, fade_out_start=7.4):
    master = smooth(t / fade_in) * (1 - smooth((t - fade_out_start) / (DUR - fade_out_start)))
    st = st * master[:, None]
    st = np.tanh(st * 1.2) / 1.2  # 轻微软限幅
    peak = np.max(np.abs(st))
    return st / peak * 0.89


def write(path, st):
    data = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


# ---------------- 片头 ----------------
def intro():
    TE = 4.2
    # 旋转角速度，与画面一致：先 0.35+0.27t²，挣脱后衰减
    omega = np.where(t <= TE, 0.35 + 0.27 * t ** 2, 0.25 + 5.1 * np.exp(-1.6 * (t - TE)))
    dry = np.zeros((N, 2)); wet = np.zeros((N, 2))

    # 1 低频嗡鸣：从无到有，挣脱后回落
    dry += pan(drone(env([(0, 0), (1, 0.05), (TE, 0.22), (TE + 0.3, 0.16), (6.5, 0.12), (8, 0.1)])), 0)

    # 2 旋转的呼呼声：带通噪声，中心频率和脉动随转速上升
    fc = 140 + 70 * omega
    whirr = bandnoise_tv(fc, q=3.0)
    am_rate = 1.2 + 2.0 * omega
    am = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(am_rate) / SR)
    whirr_env = env([(0, 0), (0.6, 0.04), (3.0, 0.16), (TE - 0.05, 0.32), (TE + 0.05, 0.08), (TE + 1.5, 0.03), (8, 0.02)])
    dry += pan(whirr * am * whirr_env, 0.15 * np.sin(2 * np.pi * np.cumsum(am_rate / 3) / SR))

    # 3 上升音：挣脱前的张力
    glide_f = np.interp(t, [2.4, TE], [220, 700])
    glide = np.sin(2 * np.pi * np.cumsum(glide_f) / SR) * env([(2.4, 0), (3.6, 0.03), (TE - 0.02, 0.07), (TE, 0)])
    wet += pan(glide, 0)

    # 4 挣脱：低沉一震 + 一声亮点
    dry += pan(thump(TE, 0.85), 0)
    wet += pan(bell(TE, 1320, 0.05, decay=0.8), 0)

    # 5 悬停的一瞬：吸气般的反向噪声
    inhale = bandnoise_tv(np.interp(t, [TE, TE + 0.27], [600, 2400]), q=1.5)
    dry += pan(inhale * env([(TE, 0), (TE + 0.24, 0.12), (TE + 0.28, 0)]), -0.2)

    # 6 甩出去的破风声：从中间扫向左边，频率由高到低
    wf = np.interp(t, [TE + 0.25, TE + 0.45, TE + 0.9], [3000, 1400, 300])
    whoosh = bandnoise_tv(wf, q=1.2)
    w_env = env([(TE + 0.25, 0), (TE + 0.42, 0.55), (TE + 0.6, 0.25), (TE + 1.2, 0)])
    w_pan = np.interp(t, [TE + 0.25, TE + 0.7], [0, -0.95])
    dry += pan(whoosh * w_env, w_pan)
    wet += pan(whoosh * w_env * 0.5, w_pan)

    # 7 光带扫过字：清亮的微光，从左移到右
    shimmer = np.zeros(N)
    for i, f in enumerate((1318.5, 1760, 2637, 3520, 4186)):
        trem = 0.6 + 0.4 * np.sin(2 * np.pi * (6 + i * 1.7) * t + i)
        shimmer += np.sin(2 * np.pi * f * t + i * 0.7) * trem / (1 + i * 0.6)
    s_env = env([(5.0, 0), (5.35, 0.05), (5.85, 0.06), (6.1, 0)])
    wet += pan(shimmer * s_env, np.interp(t, [5.0, 6.0], [-0.8, 0.8]))
    # 字完全显现时的余音
    wet += pan(bell(6.0, 659.25, 0.16, decay=3.0), 0)

    # 8 口号出现：温暖的和弦铺底
    dry += pan(pad([110, 164.8, 220, 246.9, 329.6], env([(6.2, 0), (7.0, 0.11), (8, 0.11)])), 0)

    st = dry + reverb(wet, 3.0, 0.55)
    return finish(st, 0.5, 7.4)


# ---------------- 片尾 ----------------
def outro():
    TM, TC = 1.6, 4.6
    omega = 0.25 + np.where(t > TM, 1.2 * (t - TM), 0)
    dry = np.zeros((N, 2)); wet = np.zeros((N, 2))

    # 1 开场的和弦余温
    dry += pan(pad([110, 164.8, 220, 246.9], env([(0, 0.0), (0.6, 0.09), (TM, 0.07), (2.6, 0)])), 0)

    # 2 光点归来：由远及近，从右扫到中间，频率由低到高
    rf = np.interp(t, [0.5, 1.5], [400, 2600])
    ret = bandnoise_tv(rf, q=1.3)
    r_env = env([(0.5, 0), (1.3, 0.3), (1.58, 0.45), (1.66, 0)])
    dry += pan(ret * r_env, np.interp(t, [0.5, 1.6], [0.95, 0]))
    wet += pan(ret * r_env * 0.4, 0)

    # 3 归位：轻轻一震 + 低一些的余音
    dry += pan(thump(TM, 0.45, 70, 45, 0.7), 0)
    wet += pan(bell(TM, 440, 0.12, decay=2.2), 0)

    # 4 收拢：旋转声越来越快
    fc = 160 + 90 * omega
    whirr = bandnoise_tv(fc, q=3.0)
    am_rate = 1.2 + 2.0 * omega
    am = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(am_rate) / SR)
    dry += pan(whirr * am * env([(TM, 0), (2.6, 0.1), (TC, 0.3), (TC + 0.6, 0.38), (TC + 0.68, 0)]), 0)
    dry += pan(drone(env([(TM, 0.02), (TC, 0.16), (TC + 0.6, 0.22), (TC + 0.68, 0)])), 0)

    # 5 被吸进一个点：反向膨胀，随后骤停
    glide_f = np.interp(t, [3.2, TC + 0.65], [330, 1320])
    suck = np.sin(2 * np.pi * np.cumsum(glide_f) / SR) * env([(3.2, 0), (TC, 0.05), (TC + 0.62, 0.11), (TC + 0.66, 0)])
    dry += pan(suck, 0)

    # 6 熄灭：一声极轻的「嗒」，加一圈淡淡的余光
    tick = bell(TC + 0.68, 2093, 0.08, decay=0.35)
    wet += pan(tick, 0)
    wet += pan(bell(TC + 0.7, 523.25, 0.06, decay=2.0), 0)

    # 7 黑暗里的口号：和弦再次铺底
    dry += pan(pad([110, 164.8, 220, 246.9, 329.6], env([(5.5, 0), (6.4, 0.1), (8, 0.1)])), 0)

    st = dry + reverb(wet, 3.0, 0.55)
    return finish(st, 0.4, 7.3)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "out"
    write(f"{out}/brand_intro.wav", intro())
    write(f"{out}/brand_outro.wav", outro())
    print("ok")
