#!/usr/bin/env python3
"""从维基文库下载页面 wikitext（action=raw，限速、可断点续传）。

用法:
    python3 tools/fetch_wikisource.py <输出目录> <标题列表文件>

标题列表每行一个维基文库页面标题，如「傳習錄/卷上」（见 tools/titles.txt）。
下载完列表后，会自动再下载这些页面里嵌入引用的子页面（{{:页面}}、{{#lst:页面|段}}）。
"""
import os
import re
import sys
import time
import urllib.parse
import urllib.request

UA = "yangming-corpus-builder/0.1 (open-source text corpus; rate-limited)"
BASE = "https://zh.wikisource.org/w/index.php"
DELAY = float(os.environ.get("WS_DELAY", "6"))


def fetch(title):
    url = BASE + "?" + urllib.parse.urlencode({"title": title, "action": "raw"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=90).read().decode("utf-8")


def fetch_all(out_dir, titles):
    for t in titles:
        fn = os.path.join(out_dir, t.replace("/", "__") + ".wiki")
        if os.path.exists(fn) and os.path.getsize(fn) > 0:
            continue
        for attempt in range(6):
            try:
                text = fetch(t)
                if text.startswith("You are making too many requests"):
                    raise RuntimeError("rate limited")
                with open(fn, "w", encoding="utf-8") as f:
                    f.write(text)
                print("OK", t, len(text), flush=True)
                break
            except Exception as e:  # noqa: BLE001
                wait = 30 * (attempt + 1)
                print("retry", t, e, f"wait {wait}s", flush=True)
                time.sleep(wait)
        time.sleep(DELAY)


def transcluded_titles(out_dir):
    found = set()
    for fn in os.listdir(out_dir):
        if fn.endswith(".wiki"):
            text = open(os.path.join(out_dir, fn), encoding="utf-8").read()
            found.update(m.strip() for m in re.findall(r"\{\{(?::|#lst:)([^}|]+)", text))
    return sorted(found)


def main():
    out_dir, list_file = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    titles = [t.strip() for t in open(list_file, encoding="utf-8") if t.strip() and not t.startswith("#")]
    fetch_all(out_dir, titles)
    fetch_all(out_dir, transcluded_titles(out_dir))


if __name__ == "__main__":
    main()
