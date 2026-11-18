"""镜头表：自动切分一部素材片的镜头，每个镜头截一张图，拼成带时间码的总览图，方便挑镜头。
用法：python3 studio/tools/shot_sheet.py 素材.mp4 输出目录 [每张图最多镜头数=60]
输出：输出目录/<文件名>_镜头表_N.jpg，以及 <文件名>_镜头.csv（镜头号、开始、结束、时长）
"""
import csv, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
from scenedetect import detect, AdaptiveDetector

src, out = sys.argv[1], sys.argv[2]
per_sheet = int(sys.argv[3]) if len(sys.argv) > 3 else 60
os.makedirs(out, exist_ok=True)
name = os.path.splitext(os.path.basename(src))[0]
scenes = detect(src, AdaptiveDetector())
if not scenes:
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).decode())
    scenes = [(0.0, dur)]
else:
    scenes = [(a.get_seconds(), b.get_seconds()) for a, b in scenes]
with open(os.path.join(out, f"{name}_镜头.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["镜头", "开始秒", "结束秒", "时长秒"])
    for i, (a, b) in enumerate(scenes, 1): w.writerow([i, round(a, 2), round(b, 2), round(b - a, 2)])
font_path = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
font = ImageFont.truetype(font_path, 18) if os.path.exists(font_path) else ImageFont.load_default()
tw, th, cols = 320, 180, 6
fmt = lambda s: f"{int(s // 60):02d}:{s % 60:05.2f}"
for k in range(0, len(scenes), per_sheet):
    chunk = scenes[k:k + per_sheet]
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 26)), (12, 12, 14))
    d = ImageDraw.Draw(sheet)
    for j, (a, b) in enumerate(chunk):
        mid = a + (b - a) / 2
        tmp = os.path.join(out, "_tmp.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{mid:.2f}", "-i", src, "-frames:v", "1", "-vf", f"scale={tw}:{th}:force_original_aspect_ratio=decrease,pad={tw}:{th}:(ow-iw)/2:(oh-ih)/2", tmp], check=True)
        x, y = (j % cols) * tw, (j // cols) * (th + 26)
        sheet.paste(Image.open(tmp), (x, y))
        d.text((x + 6, y + th + 3), f"#{k + j + 1}  {fmt(a)}–{fmt(b)}", fill=(230, 210, 170), font=font)
    p = os.path.join(out, f"{name}_镜头表_{k // per_sheet + 1}.jpg")
    sheet.save(p, quality=85); print(p, len(chunk), "个镜头")
os.remove(os.path.join(out, "_tmp.jpg")) if os.path.exists(os.path.join(out, "_tmp.jpg")) else None
print("共", len(scenes), "个镜头")
