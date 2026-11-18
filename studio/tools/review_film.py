"""成片自动审查：黑场、画面冻结、分段响度，外加每 N 秒一帧的总览图（标注成片时间）。
用法：python3 tools/review_film.py 成片.mp4 输出目录 [截帧间隔秒=3]
输出：report.txt（黑场 / 冻结 / 响度）、sheet_XX.jpg（每张 30 帧，6×5）
自动检查只能找出「可疑处」，最后要逐张看总览图，从观众的角度判断。
"""
import os, re, subprocess, sys

src, out = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 3.0
os.makedirs(out, exist_ok=True)
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"


def ff(args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args], capture_output=True, text=True).stderr


dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
lines = [f"成片：{src}  时长 {dur:.1f} 秒（{int(dur // 60)} 分 {dur % 60:.0f} 秒）", ""]

# 黑场：持续 1 秒以上
r = ff(["-i", src, "-vf", "blackdetect=d=1.0:pic_th=0.97:pix_th=0.06", "-an", "-f", "null", "-"])
bl = re.findall(r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)", r)
lines.append(f"一、黑场（≥1 秒）：{len(bl)} 处")
lines += [f"  {float(a):7.1f} – {float(b):7.1f}  （{float(d):.1f} 秒）" for a, b, d in bl]

# 冻结：画面 4 秒以上几乎不动（可能是残影，也可能是节奏太拖）
r = ff(["-i", src, "-vf", "freezedetect=n=-55dB:d=4", "-an", "-f", "null", "-"])
fs = re.findall(r"freeze_start: ([\d.]+)", r); fe = re.findall(r"freeze_end: ([\d.]+)", r)
lines.append(f"\n二、画面冻结（≥4 秒）：{len(fs)} 处")
lines += [f"  {float(a):7.1f} – {float(b):7.1f}  （{float(b) - float(a):.1f} 秒）" for a, b in zip(fs, fe)]

# 响度：整体 + 每 30 秒
r = ff(["-i", src, "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]; tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1]
lines.append(f"\n三、响度：整体 {I} LUFS，真峰值 {tp} dBTP")
ms = [(float(t), float(m)) for t, m in re.findall(r"t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+)", r)]
for k in range(int(dur // 30) + 1):
    seg = [m for t, m in ms if k * 30 <= t < (k + 1) * 30 and m > -70]
    if seg:
        seg.sort(); med = seg[len(seg) // 2]
        lines.append(f"  {k * 30:4d}–{(k + 1) * 30:4d} 秒  中位短时响度 {med:6.1f}  {'← 偏低' if med < -22 else ('← 偏高' if med > -11 else '')}")
open(os.path.join(out, "report.txt"), "w", encoding="utf-8").write("\n".join(lines))
print("\n".join(lines))

# 总览图：每 step 秒一帧，左上角标成片时间
n = 0
per = 30
for k in range(0, int(dur // (step * per)) + 1):
    t0 = k * step * per
    vf = (f"fps=1/{step},scale=384:-1,drawtext=fontfile={FONT}:text='%{{pts\\:hms}}':x=4:y=4:fontcolor=yellow:fontsize=18:"
          f"box=1:boxcolor=black@0.6,tile=6x5:padding=3")
    ff(["-y", "-ss", f"{t0}", "-t", f"{step * per}", "-i", src, "-vf", vf.replace("%{pts\\:hms}", f"%{{pts\\:hms\\:{t0}}}"), "-frames:v", "1", os.path.join(out, f"sheet_{k:02d}.jpg")])
    n += 1
print(f"总览图 {n} 张 → {out}")
