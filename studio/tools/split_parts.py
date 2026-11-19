"""把成片切成手机能打开的小段：每段 30–50 秒、切点放在两句话之间的停顿里、每个文件不超过 8MB。
用法（在 studio/ 下）：
  python3 tools/split_parts.py 成片.mp4 输出目录 文件名前缀 [--from 秒] [--to 秒] [--target 36] [--max-mb 7.8] [--height 1080]
切点依据 src/ep01_subs.json（录音时间；73.4 秒以后整体加 8 秒片头）。用户在剪映里按编号顺序拼回即可。
"""
import argparse, json, os, subprocess, tempfile

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out"); ap.add_argument("prefix")
ap.add_argument("--from", dest="a", type=float, default=0.0)
ap.add_argument("--to", dest="b", type=float, default=None)
ap.add_argument("--target", type=float, default=36.0)
ap.add_argument("--max-mb", type=float, default=7.8)
ap.add_argument("--height", type=int, default=1080)
args = ap.parse_args()

dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", args.src]).decode())
A, B = args.a, min(args.b or dur, dur)
subs = json.load(open("src/ep01_subs.json", encoding="utf-8"))
subs = subs if isinstance(subs, list) else subs["subs"]
F = lambda v: v if v < 73.4 else v + 8.0
# 可以下刀的地方：两句字幕之间至少 0.25 秒的空隙，取空隙中点
cuts = []
for x, y in zip(subs, subs[1:]):
    e, s = F(x["end"] - 0.3), F(y["start"])     # 字幕结束时间带了 0.35 秒余量，往回收一点
    if s - e >= 0.25: cuts.append(round((e + s) / 2, 2))
cuts.append(73.4 + 0.02)                          # 主题片头前后也是好切点
cuts.append(81.4 + 0.02)
cuts = sorted(c for c in set(cuts) if A + 1 < c < B - 1)

parts, t = [], A
while B - t > args.target * 1.4:
    ok = [c for c in cuts if t + args.target * 0.7 <= c <= t + args.target * 1.4]
    c = min(ok, key=lambda c: abs(c - t - args.target)) if ok else t + args.target
    parts.append((t, c)); t = c
parts.append((t, B))

os.makedirs(args.out, exist_ok=True)
n = len(parts)
tmp = tempfile.mkdtemp()
for i, (a, b) in enumerate(parts, 1):
    out = os.path.join(args.out, f"{args.prefix}_{i:02d}of{n:02d}.mp4")
    d = b - a
    budget = args.max_mb * 8 * 1024 * 1024 * 0.96 / d          # 每秒可用的比特
    vk = int(min(6000, (budget - 128 * 1024) / 1000))
    for attempt in range(3):
        base = ["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-i", args.src, "-t", f"{d:.3f}",
                "-vf", f"scale=-2:{args.height}", "-c:v", "libx264", "-preset", "medium", "-b:v", f"{vk}k",
                "-pix_fmt", "yuv420p", "-passlogfile", os.path.join(tmp, "p")]
        subprocess.run(base + ["-pass", "1", "-an", "-f", "mp4", os.devnull], check=True)
        subprocess.run(base + ["-pass", "2", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out], check=True)
        mb = os.path.getsize(out) / 1024 / 1024
        if mb <= args.max_mb: break
        vk = int(vk * 0.88)
    print(f"{os.path.basename(out)}  {a:7.2f}–{b:7.2f}  {d:5.1f}s  {mb:4.1f}MB  {vk}k")
