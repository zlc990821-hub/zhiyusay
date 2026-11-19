"""把打底素材的虚化提前用 FFmpeg 做好（CSS blur 在无显卡软件渲染下极慢：同样 60 帧，带虚化 85 秒，不带 14 秒）。
扫描 src/ep01/*.tsx 里 Bed 用到的 {src, blur}，生成 public/ep01/clips/blur/<名>_b<半径>.mp4（高斯模糊，sigma = CSS 的像素半径）。
Bed 发现预虚化的文件存在（clipdur.ts 里有）就直接用它，不再加 CSS blur。
用法（在 studio/ 下）：python3 tools/bake_blur.py && bash tools/gen_clipdur.sh
"""
import glob, os, re, subprocess

kit = open("src/ep01/kit.tsx", encoding="utf-8").read()
DESK = re.search(r'export const DESK = "([^"]+)"', kit).group(1)
need = set()
for f in glob.glob("src/ep01/*.tsx"):
    s = open(f, encoding="utf-8").read()
    for obj in re.findall(r"\{[^{}]*\bsrc:\s*(?:DESK|\"[^\"]+\")[^{}]*\}", s):
        m = re.search(r"\bblur:\s*([0-9.]+)", obj)
        if not m: continue
        src = DESK if re.search(r"\bsrc:\s*DESK\b", obj) else re.search(r'\bsrc:\s*"([^"]+)"', obj).group(1)
        need.add((src, float(m.group(1))))

os.makedirs("public/ep01/clips/blur", exist_ok=True)
for src, b in sorted(need):
    name = os.path.basename(src)[:-4]
    out = f"public/ep01/clips/blur/{name}_b{b:g}.mp4"
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(f"public/{src}"):
        print("已有", out); continue
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"public/{src}", "-vf", f"gblur=sigma={b:g}", "-an",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", out], check=True)
    print("生成", out)
