"""Mixkit 免费音效（Mixkit Sound Effects Free License：可商用，无需署名；不能单独转售音效本身）。
用法：
  列表：python3 studio/tools/mixkit_sfx.py list 分类1 分类2 ...      （分类即网址里的词，如 whoosh、pop、paper、glass）
  下载：python3 studio/tools/mixkit_sfx.py get 输出目录 编号:名字 编号:名字 ...
下载地址：https://assets.mixkit.co/active_storage/sfx/<编号>/<编号>.wav
"""
import html, os, re, sys, urllib.request
UA = {"User-Agent": "Mozilla/5.0"}


def fetch(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read()


if sys.argv[1] == "list":
    for cat in sys.argv[2:]:
        rows = []
        for page in (1, 2):
            u = f"https://mixkit.co/free-sound-effects/{cat}/" + (f"?page={page}" if page > 1 else "")
            try:
                s = fetch(u).decode("utf-8", "ignore")
            except Exception:
                break
            parts = s.split('data-audio-player-item-id-value="')[1:]
            for p in parts:
                sid = p.split('"')[0]
                t = re.search(r'item-grid-card__title[^>]*>\s*([^<]+)<', p)
                d = re.search(r'item-grid-sfx-preview__meta-time[^>]*>\s*([^<]+)<', p)
                if t:
                    rows.append((sid, html.unescape(t.group(1).strip()), d.group(1).strip() if d else "?"))
        seen = set()
        print(f"== {cat}（{len(rows)}）")
        for sid, title, dur in rows:
            if sid in seen: continue
            seen.add(sid); print(f"{sid}\t{dur}\t{title}")
elif sys.argv[1] == "get":
    out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    for item in sys.argv[3:]:
        sid, name = item.split(":", 1)
        p = os.path.join(out, f"{name}_mixkit{sid}.wav")
        if not os.path.exists(p):
            open(p, "wb").write(fetch(f"https://assets.mixkit.co/active_storage/sfx/{sid}/{sid}.wav"))
        print("ok", p, os.path.getsize(p))
