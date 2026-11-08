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
def sfx(name, dur=None):
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
    # ---- 扩展音效（动画 → 声音，见 references/sound-design.md）----
    if name == 'flip':      # 卡片翻面：两下纸响 + 轻气流
        a = noise(0.09, 1500, 8000) * np.exp(-np.arange(int(.09 * SR)) / SR * 45) * 0.5
        out = np.zeros(int(0.25 * SR)); out[:len(a)] += a; j = int(0.08 * SR); out[j:j + len(a)] += a * 0.7
        return out + np.pad(sfx('whoosh')[: len(out)] * 0.3, (0, max(0, len(out) - len(sfx('whoosh')))))[: len(out)]
    if name == 'pen':       # 画线/描边：沙沙的笔尖摩擦，长度 = 动画时长
        d = dur or 0.8; s_ = noise(d, 2500, 9000); t = np.arange(len(s_)) / SR
        grain = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 13 * t + 2 * np.sin(2 * np.pi * 3 * t)))
        return s_ * grain * np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.08) * 0.22
    if name == 'counter':   # 数字滚动：密集轻 tick，长度 = 滚动时长
        d = dur or 1.5; out = np.zeros(int(d * SR) + int(.06 * SR)); tk = sfx('tick') * 0.6
        tt = 0.0; step = 0.045
        while tt < d: i = int(tt * SR); out[i:i + len(tk)] += tk[: len(out) - i] * (0.6 + 0.4 * np.random.default_rng(int(tt * 1e3)).random()); tt += step
        return out
    if name == 'drop':      # 小球落地：带音高的短促 thump
        d = 0.18; t = np.arange(int(d * SR)) / SR
        return np.sin(2 * np.pi * (180 + 300 * np.exp(-t * 60)) * t) * np.exp(-t * 30) * 0.55
    if name == 'coin':
        return (bell(1567.98, 0.6) + bell(2093, 0.6) * 0.6) * 0.5
    if name == 'impact':    # 揭晓/重击：低频 + 噪声 + 混响尾
        d = 1.2; t = np.arange(int(d * SR)) / SR
        sub = np.sin(2 * np.pi * (48 + 60 * np.exp(-t * 15)) * t) * np.exp(-t * 3.5)
        return (sub + noise(d, 100, 5000) * np.exp(-t * 18) * 0.7) * 0.8
    if name == 'boom':      # 808 下坠，用在 drop 上
        d = 1.6; t = np.arange(int(d * SR)) / SR; f = 70 * np.exp(-t * 0.9) + 30
        return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 2.2) * 0.7
    if name == 'reverse':   # 反向镲：渐强到 t 截止（配合 align:'end' 正好卡在 drop/切点）
        d = dur or 1.5; t = np.arange(int(d * SR)) / SR
        return noise(d, 3000, 12000) * (t / d) ** 3 * 0.6
    if name == 'shutter':
        a = noise(0.03, 1000, 8000) * 0.7; b = noise(0.05, 500, 4000) * 0.5
        out = np.zeros(int(0.12 * SR)); out[:len(a)] += a; j = int(0.06 * SR); out[j:j + len(b)] += b; return out
    if name == 'heartbeat':
        out = np.zeros(int(0.7 * SR)); k = sfx('thud') * 0.6
        out[:len(k)] += k[: len(out)]; j = int(0.22 * SR); out[j:] += k[: len(out) - j] * 0.7; return out
    if name == 'bubble':
        d = 0.14; t = np.arange(int(d * SR)) / SR; f = 400 + 1800 * t / d
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25) * 0.4
    if name == 'ding':
        return bell(1760, 1.0) * 0.6
    if name == 'correct':   # ✓ 两音上行
        out = np.zeros(int(0.6 * SR)); a = pluck(midi_hz(76), 0.4); b = pluck(midi_hz(83), 0.5)
        out[:len(a)] += a; j = int(0.1 * SR); out[j:j + len(b)] += b[: len(out) - j]; return out * 1.2
    if name == 'wrong':     # ✗ 低沉两下
        out = np.zeros(int(0.5 * SR)); a = pluck(midi_hz(50), 0.25) * 1.3
        out[:len(a)] += a; j = int(0.14 * SR); out[j:j + len(a)] += a[: len(out) - j]; return out
    if name == 'slide':     # 元素横移
        d = 0.35; s_ = noise(d, 800, 5000); t = np.arange(len(s_)) / SR
        return s_ * np.sin(np.pi * t / d) ** 2 * 0.3
    if name == 'zoom':      # 推近：上行气流
        d = 0.6; t = np.arange(int(d * SR)) / SR
        return (noise(d, 400, 6000) * (t / d) ** 1.5 * np.exp(-np.maximum(0, t - d * .85) * 30) * 0.5
                + np.sin(2 * np.pi * np.cumsum(200 + 900 * t / d) / SR) * (t / d) * 0.1)
    if name == 'snap':
        d = 0.06; s_ = noise(d, 1500, 6000); t = np.arange(len(s_)) / SR
        return s_ * np.exp(-t * 120) * 0.9
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

def limiter(x, thr=0.6, block=128, release=0.12):
    """前瞻峰值限幅：按块求峰值、提前一块起作用、按 release 平滑恢复"""
    n = x.shape[1]; nb = -(-n // block)
    a = np.pad(np.abs(x).max(axis=0), (0, nb * block - n)).reshape(nb, block).max(axis=1)
    a = np.maximum(a, np.concatenate([a[1:], a[-1:]]))  # 前瞻一块
    g = np.minimum(1.0, thr / (a + 1e-9))
    k = 1 - np.exp(-block / (SR * release)); gs = np.empty_like(g); cur = 1.0
    for i in range(nb):
        cur = g[i] if g[i] < cur else cur + (g[i] - cur) * k
        gs[i] = cur
    gain = np.interp(np.arange(n), np.arange(nb) * block + block / 2, gs)
    return x * gain

def master(mix, target_rms_db=-15.0):
    """响度先拉到目标附近，再限幅，最终 loudnorm 只需要微调"""
    rms = np.sqrt((mix ** 2).mean()) + 1e-9
    mix = mix * (10 ** (target_rms_db / 20) / rms)
    mix = limiter(mix, 0.7)
    return np.clip(mix, -0.89, 0.89)

def load_bgm(b, dur, root):
    """解码库里的曲子：从 offset 截 dur 秒，淡入淡出，RMS 归一到 -18 dBFS"""
    import subprocess, os
    path = os.path.join(root, b['file'])
    if not os.path.exists(path):
        raise SystemExit(f'✗ BGM 文件不存在: {path}\n  公开仓库不保存音频；请把这首歌重新放进 bgm/inbox/ 后运行 python3 engine/bgm.py ingest')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(b['offset']), '-t', str(dur + 0.5), '-i', path,
                          '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64).reshape(-1, 2).T
    n = int(dur * SR)
    if x.shape[1] < n: x = np.pad(x, ((0, 0), (0, n - x.shape[1])))
    x = x[:, :n]
    t = np.arange(n) / SR
    fi, fo = b.get('fade_in') or 0.0, b.get('fade_out') or 4.0
    if fi > 0: x *= np.clip(t / fi, 0, 1)
    x *= np.clip((dur - t) / fo, 0, 1) ** 1.5
    rms = np.sqrt((x ** 2).mean()) + 1e-9
    return x * (10 ** (-18 / 20) / rms) * 10 ** ((b.get('gain_db') or 0) / 20)

# 音效分级电平（相对音乐 RMS 的 dB）：重击 > 点缀 > 动作 > 质感。由 V.cue 的 gain 再微调。
LEVEL_DB = {  # 由校准脚本生成：单个音效 gain=1 时，起音 0.25s 的 RMS 相对音乐的目标 dB 见 references/sound-design.md
    'impact': 2.8, 'boom': 0.2, 'stamp': 5.5, 'thud': 3.2, 'chime': -0.9, 'ding': -2.1, 'sparkle': -0.7,
    'correct': 0.2, 'wrong': -0.4, 'coin': -1.2, 'bubble': 0.1, 'heartbeat': -0.4, 'whoosh': 5.9, 'slide': -0.9,
    'zoom': 10.0, 'flip': 5.2, 'paper': -1.7, 'shutter': 1.6, 'reverse': 5.0, 'rise': 1.0, 'swell': 2.0,
    'pop': 0.1, 'snap': 2.9, 'drop': -0.0, 'pen': -3.9, 'tick': 0.8, 'click': 1.7, 'counter': -0.9,
}
MUSIC_RMS_DB = -18.0

def norm_sfx(sig, name):
    """按信号"响的部分"的 RMS 归一到分级电平"""
    a = np.abs(sig); loud = a > a.max() * 0.1
    rms = np.sqrt((sig[loud] ** 2).mean()) + 1e-9
    return sig * (10 ** ((MUSIC_RMS_DB + LEVEL_DB.get(name, -6)) / 20) / rms)

def place_cues(cfg, n):
    fx = np.zeros((2, n))
    for c in cfg.get('cues', []):
        sig = norm_sfx(sfx(c['name'], c.get('dur')), c['name'])
        t0 = c['t'] - (len(sig) / SR if c.get('align') == 'end' else 0)
        add(fx, sig, t0, c.get('gain', 1), pan=c.get('pan', 0))
    return reverb(fx, 1.6, 0.2)

def main(cues_path, out_path):
    import os
    cfg = json.load(open(cues_path))
    dur = cfg['duration']; bpm = cfg.get('bpm', 77)
    music = cfg.get('music') or {}
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    n = int(dur * SR)
    fx = place_cues(cfg, n + 4 * SR)[:, :n]
    if cfg.get('bgm'):
        m = load_bgm(cfg['bgm'], dur, root)
        # 侧链压缩：音效响起时音乐让位 ~3–5 dB，保证音效听得清
        env_ = np.abs(fx).max(axis=0)
        k = int(0.08 * SR); env_ = np.convolve(env_, np.ones(k) / k, 'same')
        duck = 1 - 0.45 * np.clip(env_ / (np.percentile(env_, 99.5) + 1e-9), 0, 1)
        mix = m * duck + fx * music.get('sfx_gain', 1.0)
        src = f'BGM「{cfg["bgm"].get("id")}」@{cfg["bgm"]["offset"]:.2f}s'
    else:
        m = bgm(dur, bpm, music)[:, :n]
        m = m * (10 ** (MUSIC_RMS_DB / 20) / (np.sqrt((m ** 2).mean()) + 1e-9))
        mix = m * music.get('gain', 1.0) + fx * music.get('sfx_gain', 0.8)
        src = '合成配乐'
    mix = master(mix)
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f'✓ audio {dur:.1f}s · {src} · {len(cfg.get("cues", []))} 个音效 → {out_path}')

if __name__ == '__main__':
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    main(sys.argv[1], sys.argv[2])
