"""音效合成库：全部用代码合成（无版权问题），按秒放到时间线上。
用法：
    tr = Track(60.0)                       # 一条 60 秒的立体声轨
    tr.add(bell(880, 2.0), at=3.2, pan=-0.2, wet=0.4)
    tr.bed(pad([55, 82.4, 110], 60.0), [(0, 0), (2, 0.05), (58, 0.05), (60, 0)])
    tr.write("out.wav", gain_db=-6)
"""
import wave
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)


def ts(dur):
    return np.arange(int(SR * dur)) / SR


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "high", fs=SR, output="sos"), x)


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


# ---------- 声音素材 ----------
def bell(f0, dur=2.5, decay=1.0, partials=(1, 2.0, 2.76, 5.4, 8.93), bright=1.0):
    t = ts(dur)
    y = np.zeros_like(t)
    for i, k in enumerate(partials):
        y += np.sin(2 * np.pi * f0 * k * t + i) * np.exp(-t * (1.2 + i * 1.4 / bright) / decay) / (1 + i * 1.3 / bright)
    return norm(y * smooth(t / 0.004))


def bowl(f0=220, dur=7.0):
    """颂钵 / 磬：长余音，轻微拍频"""
    t = ts(dur)
    y = np.zeros_like(t)
    for i, (k, a) in enumerate([(1, 1), (1.003, 0.6), (2.71, 0.45), (5.15, 0.2), (8.4, 0.08)]):
        y += a * np.sin(2 * np.pi * f0 * k * t + i) * np.exp(-t * (0.45 + i * 0.5))
    return norm(y * smooth(t / 0.01))


def soft_tone(f0, dur=3.0, attack=0.6, release=1.5, harm=(1, 0.3, 0.1)):
    t = ts(dur)
    y = sum(a * np.sin(2 * np.pi * f0 * (i + 1) * t) for i, a in enumerate(harm))
    e = smooth(t / attack) * np.clip((dur - t) / release, 0, 1)
    return norm(y * e)


def pad(freqs, dur, detune=0.18, cutoff=1400):
    t = ts(dur)
    y = np.zeros_like(t)
    for i, f in enumerate(freqs):
        for d in (-detune, detune):
            y += np.sin(2 * np.pi * (f + d) * t + i * 1.3) * (1 + 0.15 * np.sin(2 * np.pi * (0.07 + 0.03 * i) * t + i))
    return norm(lp(y, cutoff))


def noise(dur):
    return rng.standard_normal(int(SR * dur))


def pen(dur, density=7.0, seed=0):
    """钢笔在纸上写字：一笔一笔的高频沙沙声"""
    r = np.random.default_rng(seed)
    n = int(SR * dur)
    env = np.zeros(n)
    tpos = 0.0
    while tpos < dur:
        L = r.uniform(0.05, 0.2)
        a, b = int(tpos * SR), int(min(dur, tpos + L) * SR)
        tt = np.linspace(0, 1, b - a)
        env[a:b] += np.sin(np.pi * tt) ** 0.7 * r.uniform(0.5, 1.0)
        tpos += L + r.exponential(1 / density)
    x = bp(r.standard_normal(n), 1800, 7000) * 0.7 + bp(r.standard_normal(n), 400, 1200) * 0.3
    return norm(x * lp(env, 60))


def strike(dur=0.45):
    """一笔划掉：快速的刮擦"""
    t = ts(dur)
    x = noise(dur)
    fc = np.interp(t, [0, dur], [1500, 4200])
    y = np.zeros_like(x)
    for s in range(0, len(x), 512):
        e = min(len(x), s + 512)
        f = fc[s]
        y[s:e] = bp(x[s:e], f * 0.6, min(f * 1.6, 20000))
    env = smooth(t / 0.03) * np.clip((dur - t) / 0.15, 0, 1)
    return norm(y * env)


def whoosh(dur=1.0, f0=300, f1=2500, q=1.5):
    t = ts(dur)
    x = noise(dur)
    fc = np.exp(np.interp(t, [0, dur], [np.log(f0), np.log(f1)]))
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), 256):
        e = min(len(x), s + 256)
        f = float(fc[s])
        w0 = 2 * np.pi * f / SR
        al = np.sin(w0) / (2 * q)
        b = np.array([al, 0, -al]) / (1 + al)
        a = np.array([1 + al, -2 * np.cos(w0), 1 - al]) / (1 + al)
        if zi is None:
            zi = np.zeros(2)
        y[s:e], zi = signal.lfilter(b, a, x[s:e], zi=zi)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return norm(y * env)


def thump(dur=1.2, f0=60, f1=34, decay=0.5):
    t = ts(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay) * smooth(t / 0.008))


def glass(dur=2.5, slow=1.0, seed=3):
    """玻璃碎裂：一声脆响 + 许多高频碎片；slow>1 时整体变低、变长（慢动作）"""
    r = np.random.default_rng(seed)
    t = ts(dur)
    y = np.zeros_like(t)
    crack = hp(r.standard_normal(len(t)), 2500 / slow) * np.exp(-t / (0.05 * slow))
    y += crack * 1.2
    for _ in range(90):
        t0 = r.exponential(0.12 * slow)
        f = r.uniform(2500, 9000) / slow
        m = t >= t0
        tt = t[m] - t0
        y[m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / r.uniform(0.04, 0.25) / slow) * r.uniform(0.1, 0.5)
    body = lp(r.standard_normal(len(t)), 900 / slow) * np.exp(-t / (0.25 * slow))
    y += body * 0.5
    return norm(y)


def tinkles(dur=1.5, n=25, seed=5, fmin=3000, fmax=8000):
    r = np.random.default_rng(seed)
    t = ts(dur)
    y = np.zeros_like(t)
    for _ in range(n):
        t0 = r.uniform(0, dur * 0.8)
        f = r.uniform(fmin, fmax)
        m = t >= t0
        tt = t[m] - t0
        y[m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / r.uniform(0.03, 0.12)) * r.uniform(0.2, 1)
    return norm(y)


def shimmer(dur=2.0, base=880, n=14, seed=9):
    r = np.random.default_rng(seed)
    t = ts(dur)
    y = np.zeros_like(t)
    for i in range(n):
        f = base * r.choice([1, 1.5, 2, 2.5, 3, 4])
        ph = r.uniform(0, 6.28)
        y += np.sin(2 * np.pi * f * t + ph) * (0.5 + 0.5 * np.sin(2 * np.pi * r.uniform(2, 7) * t + ph))
    env = np.sin(np.pi * t / dur) ** 2
    return norm(y * env)


def projector(dur, fps=24.0):
    """老放映机：均匀的咔哒声 + 低嗡"""
    t = ts(dur)
    clicks = np.zeros_like(t)
    for k in range(int(dur * fps)):
        i = int(k / fps * SR)
        L = min(240, len(t) - i)
        if L > 0:
            clicks[i:i + L] += np.exp(-np.arange(L) / 40) * (0.6 + 0.4 * rng.random())
    clicks = bp(clicks * rng.standard_normal(len(t)) * 0.5 + clicks, 800, 5000)
    hum = np.sin(2 * np.pi * 50 * t) * 0.2 + lp(noise(dur), 300) * 0.3
    return norm(clicks * 0.6 + hum * 0.4)


def crackle(dur, seed=13):
    """柴火：噼啪声 + 低沉的火焰呼呼声"""
    r = np.random.default_rng(seed)
    t = ts(dur)
    y = lp(r.standard_normal(len(t)), 400) * 0.5
    for _ in range(int(dur * 18)):
        i = int(r.uniform(0, dur) * SR)
        L = min(int(r.uniform(0.003, 0.02) * SR), len(t) - i)
        if L > 0:
            y[i:i + L] += hp(r.standard_normal(L), 1500) * r.uniform(0.3, 1.5) * np.exp(-np.arange(L) / (L / 3))
    return norm(y)


def riser(dur=4.0, f0=180, f1=700):
    t = ts(dur)
    f = np.exp(np.interp(t, [0, dur], [np.log(f0), np.log(f1)]))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + whoosh(dur, f0 * 2, f1 * 4, q=2.5) * 0.6
    return norm(y * smooth(t / dur) ** 1.5)


def clue_chime():
    """线索音：每找到一条线索都用它，全片统一"""
    a = bell(880, 2.6, decay=0.9)
    b = bell(1320, 2.5, decay=0.8)
    y = np.zeros(len(a) + int(0.09 * SR))
    y[: len(a)] += a
    y[int(0.09 * SR): int(0.09 * SR) + len(b)] += b * 0.7
    return norm(y)


# ---------- 时间线 ----------
class Track:
    def __init__(self, dur):
        self.dur = dur
        self.N = int(SR * dur)
        self.t = np.arange(self.N) / SR
        self.dry = np.zeros((self.N, 2))
        self.wet = np.zeros((self.N, 2))

    def add(self, sig, at, gain=1.0, pan=0.0, wet=0.3):
        i = int(at * SR)
        if i >= self.N:
            return
        s = sig[: self.N - max(i, 0)] if i >= 0 else sig[-i:][: self.N]
        i = max(i, 0)
        ang = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        st = np.stack([s * np.cos(ang), s * np.sin(ang)], axis=1) * gain
        self.dry[i: i + len(s)] += st * (1 - wet)
        self.wet[i: i + len(s)] += st * wet

    def bed(self, sig, env_pts, gain=1.0, wet=0.2):
        xs, ys = zip(*env_pts)
        e = np.interp(self.t, xs, ys)
        s = np.resize(sig, self.N) * e
        self.add(s, 0, gain, 0, wet)

    def render(self, rev_seconds=2.8, rev_mix=1.0):
        n = int(SR * rev_seconds)
        tt = np.arange(n) / SR
        out = self.dry.copy()
        for ch in range(2):
            ir = lp(rng.standard_normal(n), 5500) * np.exp(-tt * 6.9 / rev_seconds)
            ir /= np.sqrt(np.sum(ir ** 2))
            out[:, ch] += signal.fftconvolve(self.wet[:, ch], ir)[: self.N] * rev_mix
        return out

    def write(self, path, gain_db=0.0, fade_out=0.3):
        st = self.render()
        st *= 10 ** (gain_db / 20)
        if fade_out:
            st *= np.clip((self.dur - self.t) / fade_out, 0, 1)[:, None]
        st = np.tanh(st)
        data = (np.clip(st, -1, 1) * 32767).astype(np.int16)
        with wave.open(path, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(data.tobytes())
