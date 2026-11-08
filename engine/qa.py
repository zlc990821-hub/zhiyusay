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
    rep('规格', v['width'] == 1920 and v['height'] == 1080 and abs(fps - 30) < .01 and v['codec_name'] == 'h264',
        f"{v['width']}x{v['height']} {fps:.0f}fps {v['codec_name']} {v.get('pix_fmt')}")
    rep('音轨', a is not None and a['codec_name'] == 'aac', f"{a['codec_name'] if a else '无'} {a.get('sample_rate') if a else ''}")
    rep('时长', 60 <= dur <= 300, f"{dur:.1f}s（建议 100–170s）")
    # 抽帧：4fps 灰度 192x108
    w, h = 192, 108
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps=4,scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
    dark = (fr.mean(axis=(1, 2)) < 60).mean()
    rep('深色底', dark > 0.9, f"{dark*100:.0f}% 帧平均亮度 < 60")
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
    print('  结论：' + ('通过' if ok else '有未通过项，请检查'))
    return 0 if ok else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
