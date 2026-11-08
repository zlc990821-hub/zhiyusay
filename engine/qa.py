#!/usr/bin/env python3
"""qa.py — 成片自检：规格 / 深色底 / 运动密度（最长静止段）/ 响度 / 峰值
   python3 engine/qa.py projects/x/out/final.mp4
"""
import json, re, subprocess, sys
import numpy as np

def sh(*a): return subprocess.run(a, capture_output=True, text=True)

def main(path):
    ok = True
    def rep(name, cond, msg):
        nonlocal ok
        ok &= bool(cond); print(f"  {'✓' if cond else '✗'} {name:<10} {msg}")
    info = json.loads(sh('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path).stdout)
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    a = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
    dur = float(info['format']['duration']); fps = eval(v['r_frame_rate'])
    print(f"QA {path}")
    rep('规格', (v['width'], v['height']) in ((1920, 1080), (1080, 1920)) and abs(fps - 30) < .01 and v['codec_name'] == 'h264',
        f"{v['width']}x{v['height']} {fps:.0f}fps {v['codec_name']} {v.get('pix_fmt')}")
    rep('音轨', a is not None and a['codec_name'] == 'aac', f"{a['codec_name'] if a else '无'} {a.get('sample_rate') if a else ''}")
    rep('时长', 30 <= dur <= 300, f"{dur:.1f}s")
    # 抽帧：4fps 灰度 192x108
    w, h = (192, 108) if v['width'] > v['height'] else (108, 192)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps=4,scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
    lum = fr.mean(axis=(1, 2)); dark = (lum < 60).mean(); light = (lum > 170).mean()
    if light > dark: rep('明亮底', light > 0.85, f"{light*100:.0f}% 帧平均亮度 > 170（纸感主题）")
    else: rep('深色底', dark > 0.9, f"{dark*100:.0f}% 帧平均亮度 < 60")
    diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    still = diff < 0.35
    longest = run = 0
    for s in still:
        run = run + 1 if s else 0; longest = max(longest, run)
    rep('运动', longest / 4 <= 4.0, f"最长静止 {longest/4:.1f}s（≤4s），静止占比 {still.mean()*100:.0f}%，帧差均值 {diff.mean():.2f}")
    if a:
        e = sh('ffmpeg', '-nostats', '-i', path, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-').stderr
        I = re.findall(r'I:\s+(-?[\d.]+) LUFS', e); P = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)
        I = float(I[-1]) if I else -99; P = float(P[-1]) if P else 0
        rep('响度', -16 <= I <= -12, f"{I:.1f} LUFS（目标 -14）")
        rep('峰值', P <= -0.5, f"{P:.1f} dBTP（≤ -1）")
    # 卡点：场景切点 / 重音效 是否落在拍上（需要同目录 cues.json 且用了 BGM）
    import os
    cj = os.path.join(os.path.dirname(os.path.abspath(path)), 'cues.json')
    if os.path.exists(cj):
        cfg = json.load(open(cj)); sy = cfg.get('sync') or {}
        beats = np.array(sy.get('beats') or []); downs = np.array(sy.get('downbeats') or [])
        if len(beats):
            near = lambda t, arr: float(np.min(np.abs(arr - t))) if len(arr) else 9
            cuts = [x for x in sy.get('scenes', []) if x > 0.5 and x < dur - 0.5]
            on = [near(x, beats) <= 0.045 for x in cuts]
            onbar = [near(x, downs) <= 0.045 for x in cuts]
            rep('切点卡拍', np.mean(on) >= 0.8 if on else True, f"{sum(on)}/{len(on)} 个场景切点在拍上，其中 {sum(onbar)} 个在小节头")
            hits = [c['t'] for c in cfg.get('cues', []) if c.get('hit')]
            hon = [near(x, beats) <= 0.06 for x in hits]
            rep('重音卡拍', np.mean(hon) >= 0.6 if hon else True, f"{sum(hon)}/{len(hon)} 个重音效（whoosh/thud/chime/stamp…）在拍上")
            drops = sy.get('drops') or []
            if drops:
                dh = [any(abs(x - d) <= 0.06 for x in cuts + hits) for d in drops]
                rep('高潮对位', all(dh), f"{sum(dh)}/{len(dh)} 个音乐 drop 上有切点或重音（{[round(d,2) for d in drops]}）")
        # 音效覆盖：每个场景切点 ±0.5s 内应有音效
        ct = np.array([c['t'] for c in cfg.get('cues', [])])
        cuts = [x for x in (sy.get('scenes') or []) if x > 0.5]
        if len(ct) and cuts:
            cov = [np.min(np.abs(ct - x)) <= 0.5 for x in cuts]
            rep('音效覆盖', np.mean(cov) >= 0.8, f"{sum(cov)}/{len(cov)} 个场景切点配了音效")
    print('  结论：' + ('通过' if ok else '有未通过项，请检查'))
    return 0 if ok else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
