"""Mixkit 免费素材搜索：按关键词抓取视频编号、描述和缩略图，拼成一张挑选表。
用法：python3 studio/tools/mixkit_search.py 输出目录 关键词1 关键词2 ...
下载：https://assets.mixkit.co/videos/<编号>/<编号>-720.mp4（或 -360、-1080）
"""
import html, os, re, subprocess, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0"}
font = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 15)
for term in sys.argv[2:]:
    slug = term.strip().replace(" ", "-")
    url = None
    for u in (f"https://mixkit.co/free-stock-video/{slug}/", f"https://mixkit.co/free-stock-video/discover/{slug}/"):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30)
            page = r.read().decode("utf-8", "ignore"); url = r.geturl(); break
        except Exception:
            continue
    if not url: print(term, "：没有结果"); continue
    items = re.findall(r'data-item-grid--video-player-item-id-value="(\d+)".*?<img src="([^"]+thumb[^"]+)"[^>]*alt="([^"]*)"', page, re.S)
    seen, rows = set(), []
    for vid, thumb, alt in items:
        if vid in seen: continue
        seen.add(vid); rows.append((vid, thumb, html.unescape(alt)))
    rows = rows[:24]
    print(f"{term}：{len(rows)} 段（{url}）")
    if not rows: continue
    tw, th, cols = 320, 180, 6
    sheet = Image.new("RGB", (cols * tw, ((len(rows) + cols - 1) // cols) * (th + 40)), (12, 12, 14))
    d = ImageDraw.Draw(sheet)
    for j, (vid, thumb, alt) in enumerate(rows):
        try:
            data = urllib.request.urlopen(urllib.request.Request(thumb, headers=UA), timeout=30).read()
            p = os.path.join(out, "_t.jpg"); open(p, "wb").write(data)
            im = Image.open(p).convert("RGB"); im.thumbnail((tw, th))
            x, y = (j % cols) * tw, (j // cols) * (th + 40)
            sheet.paste(im, (x, y)); d.text((x + 4, y + th + 2), f"#{vid}", fill=(240, 210, 160), font=font)
            d.text((x + 4, y + th + 20), alt[:40], fill=(200, 200, 200), font=font)
        except Exception as e:
            print("  缩略图失败", vid, e)
    sheet.save(os.path.join(out, f"mixkit_{slug}.jpg"), quality=85)
    with open(os.path.join(out, f"mixkit_{slug}.txt"), "w", encoding="utf-8") as f:
        for vid, _, alt in rows: f.write(f"{vid}\t{alt}\n")
