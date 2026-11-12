"""Synthesise the sound-effect bed for an episode from timeline.json (self-made, no licensing issues).

Usage: python3 -I tools/synth_sfx.py <episode_dir>   -> <episode_dir>/audio/sfx.wav (48k stereo)
Supported cues: pad [t0,t1], shimmer [t...], whoosh [[t0,t1]...], impact [t...], ticks [t0,t1],
                riser [[t0,t1]...], boom [t...]
"""
import json, os, sys, wave
import numpy as np

d = sys.argv[1]
tl = json.load(open(os.path.join(d, "timeline.json")))
SR = 48000
N = int(tl["duration"] * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def add(t0, sig, pan=0.0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2); R[i:j] += s * np.sqrt((1 + pan) / 2)

def env(n, a, r):  # attack/release in samples
    e = np.ones(n); a = max(1, min(a, n)); r = max(1, min(r, n))
    e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r)
    return e

def lowpass(x, fc):  # one-pole
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc; y[k] = acc
    return y

def lp_fast(x, fc):  # FFT brickwall-ish smooth lowpass
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))

def bp_fast(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X, len(x))

cues = tl["sfx"]

# ambient pad (placeholder until BGM is chosen): A minor-ish open fifths, slow swell
if "pad" in cues:
    t0, t1 = cues["pad"]; n = int((t1 - t0) * SR); t = np.arange(n) / SR
    sig = np.zeros(n)
    for f, g in ((55, 1.0), (82.41, 0.6), (110, 0.5), (164.81, 0.25), (220, 0.12)):
        lfo = 1 + 0.004 * np.sin(2 * np.pi * 0.07 * t + f)
        sig += g * np.sin(2 * np.pi * f * t * lfo)
    sig += 0.25 * lp_fast(rng.standard_normal(n), 400)
    sig *= (0.55 + 0.45 * np.sin(2 * np.pi * t / 23 - 1.5)) * env(n, 4 * SR, 3 * SR)
    add(t0, sig / np.abs(sig).max(), 0, 0.10)

for t in cues.get("shimmer", []):
    n = int(3.5 * SR); tt = np.arange(n) / SR; s = np.zeros(n)
    for k, f in enumerate((1318.5, 1760, 2217.5, 2637)):
        s += np.sin(2 * np.pi * f * tt + k) * np.exp(-tt * (1.2 + 0.3 * k)) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + k) * tt))
    add(t, s * env(n, int(0.25 * SR), SR) / 4, 0, 0.10)

for t0, t1 in cues.get("whoosh", []):
    n = int((t1 - t0 + 0.8) * SR); x = rng.standard_normal(n)
    out = np.zeros(n); seg = 4096
    for k in range(0, n, seg):
        p = k / n; out[k:k + seg] = bp_fast(x[k:k + seg] if k + seg <= n else np.pad(x[k:], (0, k + seg - n)), 200 + 3000 * p ** 2, 800 + 6000 * p ** 2)[: min(seg, n - k)]
    e = np.sin(np.pi * np.clip(np.arange(n) / n, 0, 1)) ** 2
    add(t0, out * e / np.abs(out).max(), 0, 0.16)

for t in cues.get("impact", []):
    n = int(5 * SR); tt = np.arange(n) / SR
    f = 35 + 60 * np.exp(-tt * 3); body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 0.9)
    noise = lp_fast(rng.standard_normal(n), 1800) * np.exp(-tt * 2.5)
    s = body + 0.6 * noise
    add(t - 0.02, s * env(n, 200, SR) / np.abs(s).max(), 0, 0.42)

if "ticks" in cues:
    t0, t1 = cues["ticks"]; k = 0; t = t0
    while t < t1:
        n = int(0.03 * SR); tt = np.arange(n) / SR
        add(t, np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 260), (k % 2) * 0.4 - 0.2, 0.06)
        k += 1; p = (t - t0) / (t1 - t0); t += 0.11 - 0.07 * p

for t0, t1 in cues.get("riser", []):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; p = tt / tt[-1]
    s = np.sin(2 * np.pi * np.cumsum(220 + 440 * p ** 2) / SR) * 0.3 + bp_fast(rng.standard_normal(n), 2000, 9000) * 0.5
    add(t0, s * p ** 2.5 * env(n, 10, int(0.03 * SR)), 0, 0.10)

for t in cues.get("boom", []):
    n = int(6 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 48 * tt) * np.exp(-tt * 0.8) + 0.5 * np.sin(2 * np.pi * 96 * tt) * np.exp(-tt * 1.5)
    s += 0.2 * lp_fast(rng.standard_normal(n), 900) * np.exp(-tt * 1.2)
    add(t, s * env(n, 300, SR) / np.abs(s).max(), 0, 0.32)

y = np.stack([L, R], 1)
peak = np.abs(y).max()
if peak > 0.89: y *= 0.89 / peak
with wave.open(os.path.join(d, "audio", "sfx.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((y * 32767).astype(np.int16).tobytes())
print("sfx.wav written, peak", round(float(np.abs(y).max()), 3))
