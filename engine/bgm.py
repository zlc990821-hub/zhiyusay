#!/usr/bin/env python3
"""
bgm.py — BGM 库：入库分析 / 列表 / 挑选 / 绑定到片子（卡点数据）

  python3 engine/bgm.py ingest <mp3...>          # 入库：复制到 bgm/tracks/，分析节拍、段落、高潮、调式，写入 bgm/library.json
  python3 engine/bgm.py ingest                   # 无参数 = 扫描 bgm/inbox/ 中的新文件
  python3 engine/bgm.py reanalyze [id...]        # 重新分析（保留手工填写的 tags/notes）
  python3 engine/bgm.py list                     # 列表
  python3 engine/bgm.py show <id>                # 单曲详情：段落、drop、能量曲线
  python3 engine/bgm.py click <id> [--offset 0 --duration 40]   # 导出叠加节拍器的试听，用耳朵核对拍点
  python3 engine/bgm.py pick --duration 130 [--mood calm,tech] [--hit 12.4] [--bpm 70-100]
                                                 # 按时长/情绪/高潮对齐 给出候选曲与最佳起点
  python3 engine/bgm.py use <id> --project projects/x [--offset 12.3 | --hit 12.4] [--duration 130]
                                                 # 绑定：写 projects/x/bgm.js（视频时间轴上的拍点/小节/高潮）

纯 numpy + ffmpeg 实现：谱通量起音包络 → 自相关测速 → 动态规划拍点追踪 → 低频重音定小节头
→ 按小节 RMS 分段 → 能量跃升处标 drop → Krumhansl 调式估计。
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LIB_DIR = os.path.join(ROOT, 'bgm')
TRACKS = os.path.join(LIB_DIR, 'tracks')
INBOX = os.path.join(LIB_DIR, 'inbox')
LIB = os.path.join(LIB_DIR, 'library.json')
SR = 22050
HOP = 512
NFFT = 2048
FPS = SR / HOP  # 起音包络帧率 ≈ 43.07

# ---------------------------------------------------------------- IO
def load_lib():
    if os.path.exists(LIB):
        return json.load(open(LIB, encoding='utf-8'))
    return {'version': 1, 'tracks': {}}

def save_lib(lib):
    os.makedirs(LIB_DIR, exist_ok=True)
    with open(LIB, 'w', encoding='utf-8') as f:
        json.dump(lib, f, ensure_ascii=False, indent=1)

def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:format_tags=title,artist',
                          '-of', 'json', path], capture_output=True, text=True).stdout
    j = json.loads(out or '{}').get('format', {})
    tags = {k.lower(): v for k, v in (j.get('tags') or {}).items()}
    return float(j.get('duration', 0)), tags.get('title'), tags.get('artist')

def decode(path, sr=SR):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def slugify(title, path):
    base = title or os.path.splitext(os.path.basename(path))[0]
    s = re.sub(r'[^\w一-鿿]+', '-', base.lower()).strip('-')
    s = re.sub(r'^[0-9a-f]{8}-', '', s)  # 去掉上传前缀
    return s[:40] or hashlib.md5(path.encode()).hexdigest()[:8]

# ---------------------------------------------------------------- 分析
def stft_mag(x):
    win = np.hanning(NFFT)
    n = 1 + (len(x) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(n)[:, None]
    frames = x[idx] * win
    return np.abs(np.fft.rfft(frames, axis=1))  # (n, NFFT/2+1)

def onset_env(mag, lo=None, hi=None):
    f = np.fft.rfftfreq(NFFT, 1 / SR)
    sel = np.ones_like(f, bool)
    if lo: sel &= f >= lo
    if hi: sel &= f < hi
    L = np.log1p(1000 * mag[:, sel])
    flux = np.maximum(0, np.diff(L, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    k = np.hanning(5); flux = np.convolve(flux, k / k.sum(), 'same')
    flux -= np.convolve(flux, np.ones(int(FPS)) / int(FPS), 'same')  # 去趋势
    flux = np.maximum(flux, 0)
    return flux / (flux.std() + 1e-9)

def estimate_tempo(env, prior_bpm=110):
    n = len(env)
    N = 1 << int(np.ceil(np.log2(2 * n)))
    ac = np.fft.irfft(np.abs(np.fft.rfft(env, N)) ** 2)[:n]
    lags = np.arange(n)
    bpm = 60 * FPS / np.maximum(lags, 1)
    valid = (bpm >= 55) & (bpm <= 200)
    w = np.exp(-0.5 * (np.log2(np.maximum(bpm, 1) / prior_bpm) / 0.9) ** 2)
    score = np.where(valid, ac * w, 0)
    # 叠加 2 倍/0.5 倍谐波，抑制半拍/双拍误判
    best = int(np.argmax(score))
    # 抛物线插值精化
    if 1 <= best < n - 1:
        a, b, c = score[best - 1], score[best], score[best + 1]
        off = 0.5 * (a - c) / (a - 2 * b + c + 1e-12)
    else:
        off = 0
    period = best + off
    return 60 * FPS / period, period

def track_beats(env, period, tightness=120):
    n = len(env)
    score = env.copy(); back = -np.ones(n, int)
    P = period
    lo, hi = int(round(P / 2)), int(round(2 * P))
    offs = np.arange(lo, hi + 1)
    pen = -tightness * np.log(offs / P) ** 2
    for t in range(hi, n):
        cand = score[t - offs] + pen
        j = int(np.argmax(cand))
        score[t] = env[t] + cand[j]; back[t] = t - offs[j]
    # 从末尾附近最高分回溯
    tail = int(n - P)
    t = tail + int(np.argmax(score[tail:]))
    beats = []
    while t >= 0:
        beats.append(t)
        if back[t] < 0: break
        t = back[t]
    beats = np.array(beats[::-1], float)
    # 向前补齐开头
    while beats[0] - P > 0: beats = np.insert(beats, 0, beats[0] - P)
    return beats / FPS

def downbeat_phase(beats, env_low, env_all, meter=4):
    idx = np.clip((beats * FPS).astype(int), 0, len(env_all) - 1)
    strength = env_low[idx] * 1.5 + env_all[idx] * 0.5
    sc = [strength[p::meter].mean() for p in range(meter)]
    return int(np.argmax(sc))

KS_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KS_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
PC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

def estimate_key(mag):
    f = np.fft.rfftfreq(NFFT, 1 / SR)
    sel = (f > 130) & (f < 3000)
    midi = 69 + 12 * np.log2(f[sel] / 440)
    pc = np.round(midi).astype(int) % 12
    e = (mag[:, sel] ** 2).mean(axis=0)
    chroma = np.array([e[pc == i].sum() for i in range(12)])
    chroma /= chroma.sum() + 1e-12
    best = (-2, '', '')
    for r in range(12):
        for prof, mode in ((KS_MAJ, 'major'), (KS_MIN, 'minor')):
            c = np.corrcoef(chroma, np.roll(prof, r))[0, 1]
            if c > best[0]: best = (c, PC[r], mode)
    return best[1] + ('m' if best[2] == 'minor' else ''), best[2], float(best[0])

def analyze(path, bpm_hint=None):
    x = decode(path)
    dur = len(x) / SR
    mag = stft_mag(x)
    env = onset_env(mag)
    env_low = onset_env(mag, 30, 160)
    env_hi = onset_env(mag, 4000, None)
    bpm, period = estimate_tempo(env, bpm_hint or 110)
    if bpm_hint:  # 人工提示：把结果折到最接近提示的倍/半速
        while bpm > bpm_hint * 1.4: bpm /= 2; period *= 2
        while bpm < bpm_hint / 1.4: bpm *= 2; period /= 2
    beats = track_beats(env, period)
    phase = downbeat_phase(beats, env_low, env)
    downbeats = beats[phase::4]
    # 每小节能量 → 段落
    rms_fr = np.sqrt(np.convolve(x ** 2, np.ones(HOP) / HOP, 'same')[::HOP] + 1e-12)
    def seg_mean(a, b, arr=rms_fr):
        i, j = int(a * FPS), max(int(a * FPS) + 1, int(b * FPS)); return float(arr[i:j].mean())
    db = 20 * np.log10(rms_fr + 1e-9)
    bars = ([0.0] if downbeats[0] > 0.3 else []) + list(downbeats) + [dur]
    bar_e = np.array([seg_mean(bars[i], bars[i + 1]) for i in range(len(bars) - 1)])
    bar_low = np.array([float(env_low[int(bars[i] * FPS):int(bars[i + 1] * FPS)].mean()) for i in range(len(bars) - 1)])
    eN = bar_e / (np.percentile(bar_e, 95) + 1e-9)
    # 段落边界：平滑后能量差在 4 小节网格附近的大跳变
    sm = np.convolve(eN, np.ones(2) / 2, 'same')
    sections, start = [], 0
    for i in range(2, len(eN) - 1):
        prev = eN[max(start, i - 4):i].mean(); nxt = eN[i:i + 4].mean()
        if i - start >= 4 and abs(nxt - prev) > 0.18 and (i % 4 == 0 or abs(nxt - prev) > 0.35):
            sections.append((start, i)); start = i
    sections.append((start, len(eN)))
    def lvl(v): return 'high' if v > 0.78 else 'mid' if v > 0.5 else 'low'
    secs = []
    for a, b in sections:
        v = float(eN[a:b].mean())
        secs.append({'t': round(bars[a], 3), 'end': round(bars[b], 3), 'bars': b - a, 'energy': round(v, 3), 'level': lvl(v)})
    drops = []
    for i in range(1, len(secs)):
        rise = secs[i]['energy'] - secs[i - 1]['energy']
        if rise > 0.18 and secs[i]['energy'] > 0.6:
            drops.append({'t': secs[i]['t'], 'rise': round(rise, 3)})
    # 强拍（kick）时刻：低频起音峰
    peaks = []
    thr = np.percentile(env_low, 92)
    for i in range(1, len(env_low) - 1):
        if env_low[i] > thr and env_low[i] >= env_low[i - 1] and env_low[i] >= env_low[i + 1]:
            if not peaks or i - peaks[-1] > FPS * 0.15: peaks.append(i)
    key, mode, kconf = estimate_key(mag)
    # 能量曲线（每秒）
    per_sec = [round(float(20 * np.log10(seg_mean(s, s + 1) + 1e-9)), 1) for s in range(int(dur))]
    cent_f = np.fft.rfftfreq(NFFT, 1 / SR)
    centroid = float(((mag * cent_f).sum(1) / (mag.sum(1) + 1e-9)).mean())
    # 拍点规整度：拍间隔的变异系数（越小越像固定速度的电子/编曲）
    ibi = np.diff(beats); steady = float(1 - min(1, ibi.std() / ibi.mean() * 10))
    # 开头静/响：前 2 秒平均能量（可否硬切入）
    intro_db = float(np.mean(db[: int(2 * FPS)]))
    mean_e = float(bar_e.mean() / (bar_e.max() + 1e-9))
    tags = []
    tags.append('slow' if bpm < 85 else 'mid-tempo' if bpm < 115 else 'fast')
    tags.append('dark' if mode == 'minor' else 'bright')
    if centroid > 2600: tags.append('crisp')
    if bar_low.mean() > 1.0 and bpm >= 95: tags.append('punchy')
    if mean_e > 0.7: tags.append('dense')
    elif mean_e < 0.45: tags.append('dynamic')
    return {
        'duration': round(dur, 3), 'bpm': round(float(bpm), 2), 'beat_period': round(float(period / FPS), 4),
        'key': key, 'mode': mode, 'key_conf': round(kconf, 2), 'steadiness': round(steady, 2),
        'beats': [round(float(b), 3) for b in beats],
        'downbeats': [round(float(b), 3) for b in downbeats],
        'kicks': [round(i / FPS, 3) for i in peaks],
        'sections': secs, 'drops': drops,
        'energy_db_per_sec': per_sec, 'intro_db': round(intro_db, 1), 'centroid_hz': round(centroid),
        'auto_tags': tags,
    }

# ---------------------------------------------------------------- 命令
def cmd_ingest(paths):
    os.makedirs(TRACKS, exist_ok=True); os.makedirs(INBOX, exist_ok=True)
    if not paths:
        paths = [os.path.join(INBOX, f) for f in sorted(os.listdir(INBOX)) if f.lower().endswith(('.mp3', '.wav', '.m4a', '.flac', '.ogg'))]
    lib = load_lib()
    for p in paths:
        dur, title, artist = probe(p)
        tid = slugify(title, p)
        ext = os.path.splitext(p)[1].lower()
        dst = os.path.join(TRACKS, tid + ext)
        if os.path.abspath(p) != os.path.abspath(dst): shutil.copyfile(p, dst)
        sha = hashlib.sha1(open(dst, 'rb').read()).hexdigest()[:12]
        old = lib['tracks'].get(tid, {})
        print(f'… {tid}  ({title or "?"}, {dur:.0f}s)', flush=True)
        a = analyze(dst, old.get('bpm_hint'))
        lib['tracks'][tid] = {
            'id': tid, 'title': title or tid, 'artist': artist or old.get('artist', ''),
            'file': os.path.relpath(dst, ROOT), 'sha1': sha,
            # 手工字段：入库后可直接编辑 library.json 补充，重新分析不会覆盖
            'tags': old.get('tags', []), 'notes': old.get('notes', ''), 'vocals': old.get('vocals', None),
            'favorite_start': old.get('favorite_start', None), 'used_in': old.get('used_in', []),
            'bpm_hint': old.get('bpm_hint', None),
            **a,
        }
        save_lib(lib)
        print(f'✓ {tid}: {a["bpm"]} BPM · {a["key"]} · {len(a["sections"])} 段 · drops {[float(d["t"]) for d in a["drops"]]}')
        if p.startswith(INBOX): os.remove(p)

def cmd_reanalyze(ids):
    lib = load_lib()
    for tid in ids or list(lib['tracks']):
        t = lib['tracks'][tid]; print(f'… {tid}', flush=True)
        t.setdefault('bpm_hint', None)
        t.update(analyze(os.path.join(ROOT, t['file']), t.get('bpm_hint')))
        save_lib(lib)

def cmd_list():
    lib = load_lib()
    print(f'{"id":<34}{"BPM":>7} {"key":>5} {"dur":>6}  {"drops":<22} tags')
    for t in sorted(lib['tracks'].values(), key=lambda t: t['bpm']):
        drops = ','.join(f'{d["t"]:.0f}' for d in t['drops'][:4])
        print(f'{t["id"][:33]:<34}{t["bpm"]:>7.1f} {t["key"]:>5} {t["duration"]:>6.0f}  {drops:<22} {" ".join(t["tags"] + t["auto_tags"])}')

def cmd_show(tid):
    t = load_lib()['tracks'][tid]
    print(f'{t["title"]} — {t["artist"]}\n  {t["bpm"]} BPM（拍长 {t["beat_period"]}s，小节 {t["beat_period"]*4:.3f}s） · {t["key"]} · 规整度 {t["steadiness"]} · 开头 {t["intro_db"]} dB')
    print(f'  tags: {t["tags"]}  auto: {t["auto_tags"]}  vocals: {t["vocals"]}  notes: {t["notes"]}')
    print('  段落：')
    for s in t['sections']:
        bar = '█' * int(s['energy'] * 30)
        print(f'   {s["t"]:7.2f}–{s["end"]:7.2f}s  {s["bars"]:3d} 小节  {s["level"]:<5} {bar}')
    print('  drops:', [d['t'] for d in t['drops']])

def window_score(t, offset, duration, hit=None):
    """评估以 offset 为起点、长 duration 的一段"""
    end = offset + duration
    if end > t['duration'] + 0.5: return -1e9, {}
    secs = t['sections']
    def energy_at(x):
        for s in secs:
            if s['t'] <= x < s['end']: return s['energy']
        return 0
    e = [energy_at(offset + k) for k in np.arange(0, duration, 1.0)]
    sc = 0; why = {}
    # 1) 有高潮落在片中（不在开头 10% 也不在最后 15%）
    inside = [d for d in t['drops'] if offset + duration * 0.08 < d['t'] < end - duration * 0.15]
    sc += min(len(inside), 2) * 1.0; why['drops_inside'] = [round(d['t'] - offset, 2) for d in inside]
    # 2) 指定的命中点（如标题卡/揭晓）对准 drop 或段落起点
    if hit is not None:
        cands = [d['t'] for d in t['drops']] + [s['t'] for s in secs]
        err = min(abs((offset + hit) - c) for c in cands)
        sc += 2.0 * np.exp(-err / 0.3); why['hit_err'] = round(err, 2)
    # 3) 起点在小节头
    db_err = min(abs(offset - d) for d in t['downbeats'])
    sc += 0.5 * np.exp(-db_err / 0.05)
    # 4) 结尾不在高能段中间被截断（尾段能量低更好，会做淡出）
    sc += 0.6 * (1 - energy_at(end - 1))
    # 5) 开头不要太炸
    sc += 0.4 * (1 - energy_at(offset + 0.5))
    why['mean_energy'] = round(float(np.mean(e)), 2)
    return sc, why

def best_offset(t, duration, hit=None):
    starts = [d for d in t['downbeats'] if d + duration <= t['duration'] + 0.5] or [0.0]
    if t.get('favorite_start') is not None: starts = [t['favorite_start']] + starts
    best = max(((window_score(t, s, duration, hit), s) for s in starts), key=lambda z: z[0][0])
    return best[1], best[0][0], best[0][1]

def cmd_pick(a):
    lib = load_lib()
    want = set(filter(None, (a.mood or '').split(',')))
    lo, hi = (map(float, a.bpm.split('-')) if a.bpm else (0, 999))
    rows = []
    for t in lib['tracks'].values():
        tags = set(t['tags'] + t['auto_tags'])
        long_enough = t['duration'] >= a.duration
        off, sc, why = best_offset(t, min(a.duration, t['duration']), a.hit)
        sc += 1.2 * len(want & tags)
        if not (lo <= t['bpm'] <= hi): sc -= 2
        if not long_enough: sc -= 3
        if t.get('vocals'): sc -= 1.0  # 知识区默认偏好纯音乐
        rows.append((sc, t, off, why, long_enough))
    rows.sort(key=lambda r: -r[0])
    print(f'目标 {a.duration}s' + (f'，命中点 {a.hit}s' if a.hit is not None else '') + (f'，情绪 {sorted(want)}' if want else ''))
    for sc, t, off, why, ok in rows[: a.top]:
        print(f'  {sc:5.2f}  {t["id"]:<32} {t["bpm"]:6.1f}BPM {t["key"]:>4}  起点 {off:7.2f}s  {"" if ok else "【时长不足】"} {why}  tags={t["tags"] + t["auto_tags"]}')

def cmd_use(a):
    lib = load_lib(); t = lib['tracks'][a.id]
    dur = a.duration
    if a.offset is not None: off = a.offset
    else: off, _, _ = best_offset(t, min(dur, t['duration']), a.hit)
    end = off + dur
    sel = lambda arr: [round(x - off, 3) for x in arr if off - 0.01 <= x < end]
    data = {
        'id': t['id'], 'title': t['title'], 'artist': t['artist'], 'file': t['file'],
        'offset': round(off, 3), 'duration': dur, 'bpm': t['bpm'], 'beat': t['beat_period'], 'bar': round(t['beat_period'] * 4, 4),
        'key': t['key'],
        'beats': sel(t['beats']), 'downbeats': sel(t['downbeats']), 'kicks': sel(t['kicks']),
        'sections': [{**s, 't': round(s['t'] - off, 3), 'end': round(s['end'] - off, 3)} for s in t['sections'] if s['end'] > off and s['t'] < end],
        'drops': [{**d, 't': round(d['t'] - off, 3)} for d in t['drops'] if off <= d['t'] < end],
        'fade_in': a.fade_in, 'fade_out': a.fade_out, 'gain_db': a.gain_db,
    }
    proj = os.path.abspath(a.project)
    with open(os.path.join(proj, 'bgm.js'), 'w', encoding='utf-8') as f:
        f.write('/* 由 engine/bgm.py use 生成：BGM 在视频时间轴上的拍点/小节头/高潮。勿手改，重新运行 use 即可。 */\n')
        f.write('window.BGM = ' + json.dumps(data, ensure_ascii=False) + ';\n')
    rel = os.path.relpath(proj, ROOT)
    if rel not in t['used_in']: t['used_in'].append(rel); save_lib(lib)
    print(f'✓ {rel}/bgm.js ← {t["id"]}  起点 {off:.2f}s · {t["bpm"]} BPM · 小节 {data["bar"]}s')
    print(f'  视频内 drops: {[d["t"] for d in data["drops"]]}')
    print('  段落: ' + ' | '.join(f'{s["t"]:.1f}s {s["level"]}' for s in data['sections']))

def cmd_click(a):
    """导出一段叠加了节拍器的试听：小节头高音、其他拍低音、drop 处加铃声。用耳朵确认拍点准不准。"""
    t = load_lib()['tracks'][a.id]
    sr = 44100; off = a.offset; dur = a.duration
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(off), '-t', str(dur), '-i', os.path.join(ROOT, t['file']),
                          '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64) * 0.6
    def click(f, n=0.04):
        tt = np.arange(int(n * sr)) / sr; return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 80) * 0.5
    down = set(round(d, 3) for d in t['downbeats'])
    for b in t['beats']:
        if off <= b < off + dur:
            c = click(1760 if round(b, 3) in down else 880); i = int((b - off) * sr); x[i:i + len(c)] += c[: len(x) - i]
    for d in t['drops']:
        if off <= d['t'] < off + dur:
            c = click(2637, 0.5); i = int((d['t'] - off) * sr); x[i:i + len(c)] += c[: len(x) - i]
    out = a.out or os.path.join(LIB_DIR, f'click_{t["id"]}.mp3')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(sr), '-ac', '1', '-i', '-', '-b:a', '160k', out], stdin=subprocess.PIPE)
    p.communicate((np.clip(x, -1, 1)).astype('<f8').tobytes())
    print('✓ ' + out)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    p = sp.add_parser('ingest'); p.add_argument('paths', nargs='*')
    p = sp.add_parser('reanalyze'); p.add_argument('ids', nargs='*')
    sp.add_parser('list')
    p = sp.add_parser('show'); p.add_argument('id')
    p = sp.add_parser('pick'); p.add_argument('--duration', type=float, required=True); p.add_argument('--mood'); p.add_argument('--bpm')
    p.add_argument('--hit', type=float); p.add_argument('--top', type=int, default=6)
    p = sp.add_parser('use'); p.add_argument('id'); p.add_argument('--project', required=True); p.add_argument('--duration', type=float, required=True)
    p.add_argument('--offset', type=float); p.add_argument('--hit', type=float)
    p.add_argument('--fade-in', type=float, default=0.0); p.add_argument('--fade-out', type=float, default=4.0); p.add_argument('--gain-db', type=float, default=0.0)
    p = sp.add_parser('click'); p.add_argument('id'); p.add_argument('--offset', type=float, default=0); p.add_argument('--duration', type=float, default=40); p.add_argument('--out')
    a = ap.parse_args()
    {'ingest': lambda: cmd_ingest(a.paths), 'reanalyze': lambda: cmd_reanalyze(a.ids), 'list': cmd_list,
     'show': lambda: cmd_show(a.id), 'click': lambda: cmd_click(a), 'pick': lambda: cmd_pick(a), 'use': lambda: cmd_use(a)}[a.cmd]()

if __name__ == '__main__':
    main()
