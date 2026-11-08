#!/usr/bin/env python3
"""
audio.py — 纯 numpy 合成 BGM + 事件音效，输出立体声 WAV（响度归一交给 ffmpeg loudnorm）。

  python3 engine/audio.py projects/benford/out/cues.json projects/benford/out/audio.wav

cues.json（由 render.mjs 从 film.js 导出）:
  { "duration": 120, "bpm": 77,
    "music": { "key": "Am", "prog": ["Am","F","C","G"],
               "sections": [[0,8,"pad"], [8,30,"pad+piano"], ...] },
    "cues": [ {"t": 3.2, "name": "whoosh", "gain": 1}, ... ] }

层（layers，用 + 连接）: pad bass piano arp kick shaker bell
音效（cue name）: whoosh tick pop chime thud paper stamp rise swell click sparkle
"""
import json, sys, wave
import numpy as np

SR = 44100
RNG = np.random.default_rng(20261108)

# ---------------------------------------------------------------- 基础
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
        'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}

def midi_hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def chord_notes(name, octave=4):
    """'Am' / 'F' / 'C' / 'G' / 'Dm7' / 'Fmaj7' → midi list"""
    root = name[:2] if len(name) > 1 and name[1] in '#b' else name[:1]
    rest = name[len(root):]
    r = 12 * (octave + 1) + NOTE[root]
    minor = rest.startswith('m') and not rest.startswith('maj')
    iv = [0, 3, 7] if minor else [0, 4, 7]
    if 'maj7' in rest: iv.append(11)
    elif '7' in rest: iv.append(10)
    if 'sus2' in rest: iv[1] = 2
    if 'add9' in rest: iv.append(14)
    return [r + i for i in iv]

def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    a = max(a, 1); r = max(r, 1)
    sus = max(n - a - d - r, 0)
    e = np.concatenate([np.linspace(0, 1, a, endpoint=False),
                        np.linspace(1, s, max(d, 1), endpoint=False),
                        np.full(sus, s), np.linspace(s, 0, r)])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))

def fft_filter(x, lo=None, hi=None, sr=SR):
    """频域带通（平滑过渡），对整段信号操作"""
    n = len(x); N = 1 << int(np.ceil(np.log2(n + 1)))
    X = np.fft.rfft(x, N); f = np.fft.rfftfreq(N, 1 / sr)
    m = np.ones_like(f)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * m, N)[:n]

def add(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0: return
    j = min(buf.shape[1], i + len(sig))
    s = sig[: j - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:j] += s * l * 1.414; buf[1, i:j] += s * r * 1.414

# ---------------------------------------------------------------- 乐器
def tone(freq, dur, harm=(1, .5, .25, .12), detune=0.0, phase_seed=0):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k, a in enumerate(harm, 1):
        ph = (phase_seed * 1.37 * k) % (2 * np.pi)
        out += a * np.sin(2 * np.pi * freq * k * (1 + detune) * t + ph)
    return out

def pad_voice(freq, dur):
    s = sum(tone(freq, dur, (1, .45, .22, .1, .05), d, i) for i, d in enumerate((-0.004, 0, 0.0045)))
    s += 0.3 * tone(freq * 2, dur, (1, .3), 0.002, 9)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 0.21 * np.arange(len(s)) / SR)
    return s * trem * env_adsr(len(s), 1.2, 0.5, 0.85, 1.6) / 4

def piano(freq, dur=2.6, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    inh = 0.0004
    s = np.zeros(n)
    for k, a in enumerate((1, .55, .3, .18, .1, .06), 1):
        fk = freq * k * np.sqrt(1 + inh * k * k)
        s += a * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.6 + 0.9 * k))
    hammer = RNG.standard_normal(n) * np.exp(-t * 90) * 0.04
    att = np.minimum(1, t / 0.004)
    return (s + hammer) * att * vel * 0.5

def bell(freq, dur=3.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * dcy)
            for r, a, dcy in ((1, 1, 1.2), (2.76, .45, 2.2), (5.4, .25, 3.5), (8.93, .12, 5)))
    return s * np.minimum(1, t / 0.002) * 0.4

def pluck(freq, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) + 0.12 * np.sign(np.sin(2 * np.pi * freq * t))
    return s * np.exp(-t * 7) * np.minimum(1, t / 0.003) * 0.35

def kick(dur=0.45):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 45 + 75 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 0.9

def noise(dur, lo=None, hi=None):
    return fft_filter(RNG.standard_normal(int(dur * SR)), lo, hi)

def shaker(dur=0.07):
    s = noise(dur, 5000, 12000); t = np.arange(len(s)) / SR
    return s * np.exp(-t * 60) * np.minimum(1, t / 0.004) * 0.25

def reverb(x, seconds=2.6, mix=0.28, predelay=0.02):
    n = int(seconds * SR); t = np.arange(n) / SR
    ir = RNG.standard_normal((2, n)) * np.exp(-t * 6.9 / seconds)
    ir[:, : int(predelay * SR)] = 0
    for c in range(2): ir[c] = fft_filter(ir[c], 120, 7000)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    out = np.zeros_like(x)
    L = x.shape[1] + n; N = 1 << int(np.ceil(np.log2(L)))
    for c in range(2):
        y = np.fft.irfft(np.fft.rfft(x[c], N) * np.fft.rfft(ir[c], N), N)[: x.shape[1]]
        out[c] = (1 - mix) * x[c] + mix * y
    return out

# ---------------------------------------------------------------- 音效
def sfx(name):
    if name == 'whoosh':
        d = 0.7; s = noise(d, 300, 3500); t = np.arange(len(s)) / SR
        e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
        return s * e * 0.5
    if name == 'swell':
        d = 2.0; s = noise(d, 200, 2500); t = np.arange(len(s)) / SR
        return s * (t / d) ** 2.5 * np.exp(-np.maximum(0, t - d * .92) * 40) * 0.35
    if name == 'rise':
        d = 1.4; t = np.arange(int(d * SR)) / SR
        f = 220 * 2 ** (t / d * 1.5); ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) * 0.25 + noise(d, 1000, 6000) * 0.25) * (t / d) ** 2
    if name == 'tick':
        d = 0.05; t = np.arange(int(d * SR)) / SR
        return (np.sin(2 * np.pi * 1800 * t) + 0.5 * np.sin(2 * np.pi * 3400 * t)) * np.exp(-t * 140) * 0.45
    if name == 'click':
        d = 0.03; s = noise(d, 2000, 9000); t = np.arange(len(s)) / SR
        return s * np.exp(-t * 220) * 0.6
    if name == 'pop':
        d = 0.16; t = np.arange(int(d * SR)) / SR
        f = 520 + 380 * (1 - np.exp(-t * 40)); ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * np.exp(-t * 28) * np.minimum(1, t / 0.002) * 0.55
    if name == 'chime':
        return bell(1318.5, 2.4) * 0.5 + bell(1975.5, 2.4) * 0.25
    if name == 'sparkle':
        out = np.zeros(int(1.2 * SR))
        for i, m in enumerate((88, 91, 95, 100)):
            b = bell(midi_hz(m), 1.0) * 0.25; j = int(i * 0.07 * SR); out[j:j + len(b)] += b[: len(out) - j]
        return out
    if name == 'thud':
        d = 0.5; t = np.arange(int(d * SR)) / SR
        return (np.sin(2 * np.pi * (60 + 30 * np.exp(-t * 20)) * t) * np.exp(-t * 9) + noise(d, 80, 600) * np.exp(-t * 30) * 0.4) * 0.8
    if name == 'paper':
        d = 0.35; s = noise(d, 1800, 7000); t = np.arange(len(s)) / SR
        grain = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 31 * t))
        return s * grain * np.sin(np.pi * np.clip(t / d, 0, 1)) * 0.45
    if name == 'stamp':
        a = sfx('thud'); b = noise(0.08, 1500, 8000) * np.exp(-np.arange(int(.08 * SR)) / SR * 50) * 0.6
        a[: len(b)] += b; return a
    raise ValueError('unknown sfx: ' + name)

# ---------------------------------------------------------------- 配乐
def bgm(duration, bpm, music):
    beat = 60 / bpm; bar = beat * 4
    prog = music.get('prog', ['Am', 'F', 'C', 'G'])
    sections = music.get('sections', [[0, duration, 'pad+piano']])
    def layers_at(t):
        for a, b, ls in sections:
            if a <= t < b: return set(ls.split('+'))
        return set()
    n = int((duration + 4) * SR)
    mus = np.zeros((2, n)); drum = np.zeros((2, n))
    nbars = int(np.ceil(duration / bar)) + 1
    for bi in range(nbars):
        t0 = bi * bar; ch = prog[bi % len(prog)]
        L = layers_at(t0 + 0.01)
        if not L: continue
        tones4 = chord_notes(ch, 4); tones3 = chord_notes(ch, 3)
        if 'pad' in L:
            for i, m in enumerate(tones3 + [tones4[0] + 12]):
                add(mus, pad_voice(midi_hz(m), bar + 1.6), t0, 0.16, pan=(-0.5 + i / 3))
        if 'bass' in L:
            add(mus, tone(midi_hz(tones3[0] - 12), bar, (1, .3, .1)) * env_adsr(int(bar * SR), .05, .3, .7, .4), t0, 0.32)
        if 'piano' in L:
            pattern = [(0, tones4[0], 1.0), (1.5, tones4[1], .7), (2, tones4[2], .8), (3, tones4[1] + 12 if len(tones4) < 4 else tones4[3], .6)]
            for b, m, v in pattern:
                add(mus, piano(midi_hz(m), 2.8, v), t0 + b * beat, 0.42, pan=0.15 * np.sin(m))
            add(mus, piano(midi_hz(tones3[0] - 12), 3.0, 0.8), t0, 0.35, pan=-0.1)
        if 'arp' in L:
            seq = tones4 + [tones4[0] + 12, tones4[2]]
            for k in range(8):
                m = seq[k % len(seq)] + 12
                add(mus, pluck(midi_hz(m), 0.45), t0 + k * beat / 2, 0.16, pan=0.4 * (1 if k % 2 else -1))
        if 'bell' in L:
            add(mus, bell(midi_hz(tones4[2] + 12), 3.0), t0, 0.12, pan=0.3)
        if 'kick' in L:
            for b in (0, 2):
                add(drum, kick(), t0 + b * beat, 0.5)
        if 'shaker' in L:
            for k in range(8):
                add(drum, shaker(), t0 + k * beat / 2, 0.5 if k % 2 else 0.28, pan=0.3)
    mus = reverb(mus, 3.2, 0.38)
    out = mus + reverb(drum, 1.2, 0.15)
    # 全局淡入淡出
    t = np.arange(n) / SR
    out *= np.clip(t / 1.5, 0, 1) * np.clip((duration + 0.5 - t) / 3.0, 0, 1)
    return out

def main(cues_path, out_path):
    cfg = json.load(open(cues_path))
    dur = cfg['duration']; bpm = cfg.get('bpm', 77)
    music = cfg.get('music') or {}
    n = int((dur + 4) * SR)
    m = bgm(dur, bpm, music)[:, :n]
    fx = np.zeros((2, n))
    for c in cfg.get('cues', []):
        add(fx, sfx(c['name']), c['t'], 0.5 * c.get('gain', 1), pan=c.get('pan', 0))
    fx = reverb(fx, 1.6, 0.22)
    mix = m * music.get('gain', 1.0) + fx * music.get('sfx_gain', 0.8)
    mix = mix[:, : int(dur * SR)]
    peak = np.max(np.abs(mix)) or 1
    mix = mix / peak * 0.7  # 留足余量，最终响度由 loudnorm 处理
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f'✓ audio {dur:.1f}s, {len(cfg.get("cues", []))} cues → {out_path}')

if __name__ == '__main__':
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    main(sys.argv[1], sys.argv[2])
