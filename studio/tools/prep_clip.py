"""把素材片段剪出来并统一调色，输出 30fps、无声的 mp4。
用法：python3 studio/tools/prep_clip.py 输入 输出 起始秒 时长 [模式 fill|pillar|vertical|tall] [慢放倍数]
tall 输出 1080x1620（2:3 竖版），其余输出 1920x1080。
统一调色：暖色、略降饱和、轻微颗粒与暗角；4:3 老片两侧留深色边（pillar）。
"""
import subprocess, sys
src, dst, ss, t = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
mode = sys.argv[5] if len(sys.argv) > 5 else "fill"
slow = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
geo = {
    "fill": "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
    "pillar": "scale=-2:1080,pad=1920:1080:(ow-iw)/2:0:color=0x0b0a09",
    "vertical": "crop=iw:iw*9/16,scale=1920:1080",
    "tall": "scale=1080:1620:force_original_aspect_ratio=increase,crop=1080:1620",   # 2:3 竖版（第 02 期起），居中裁切
}[mode]
grade = ("eq=saturation=0.78:contrast=1.04:brightness=-0.02,"
         "colorbalance=rs=0.06:gs=0.02:bs=-0.06:rm=0.04:bm=-0.04,"
         "vignette=PI/4.5,noise=alls=5:allf=t+u")
vf = f"{geo},setpts={slow}*PTS,{grade},fps=30,format=yuv420p"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", str(t), "-i", src, "-an", "-vf", vf,
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", dst], check=True)
print(dst)
