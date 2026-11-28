#!/usr/bin/env python3
"""在王阳明原文语料中检索，返回带出处的原文段落。

用法示例:
    python3 search.py 事上磨                 # 简体检索（默认搜 corpus/hans）
    python3 search.py 举业 夺志               # 多个词 = 同时包含（AND）
    python3 search.py 好名 务实 --any         # 任一词命中（OR）
    python3 search.py "知.{0,6}行.{0,6}合一" --regex
    python3 search.py 學書 --hant             # 繁体原文检索
    python3 search.py 良知 --file chuanxilu   # 只搜文件名含 chuanxilu 的篇目
    python3 search.py --entry 3               # 直接取《传习录》第 3 条全文

只依赖 Python 3 标准库。
"""
import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CORPUS = os.path.normpath(os.path.join(HERE, "..", "corpus"))
# 四库本等版本的常见异体字，检索时两边都归一（显示仍用原文）
VARIANTS = str.maketrans({
    "徳": "德", "逺": "远", "㫖": "旨", "冦": "寇", "懐": "怀", "恱": "悦", "乆": "久",
    "㣲": "微", "㨯": "椁", "黙": "默", "曽": "曾", "髙": "高", "㸃": "点", "叅": "参",
    "隂": "阴", "歛": "敛", "鬬": "斗", "揜": "掩", "巻": "卷", "収": "收", "㑹": "会",
    "觧": "解", "敎": "教", "葢": "盖", "聨": "联", "軰": "辈",
})
ENTRY_RE = re.compile(r"^\*\*〔(\d+)〕\*\*\s*$")
HEAD_RE = re.compile(r"^(#{1,6})\s+(.*)$")


def iter_units(path):
    """把一篇切成检索单元：传习录按条目（〔N〕），其余按段落；附带所在小标题。"""
    title, section, entry = None, None, None
    buf = []

    def flush():
        text = "\n".join(buf).strip()
        if text:
            yield title, section, entry, text

    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()
    for line in lines:
        if line.startswith("> 来源"):
            continue
        h = HEAD_RE.match(line)
        e = ENTRY_RE.match(line)
        if h or e:
            yield from flush()
            buf = []
            if h:
                if len(h.group(1)) == 1 and title is None:
                    title = h.group(2)
                else:
                    section = h.group(2)
                entry = None
            else:
                entry = int(e.group(1))
            continue
        if entry is None and not line.strip():
            yield from flush()
            buf = []
            continue
        buf.append(line)
    yield from flush()


def main():
    ap = argparse.ArgumentParser(description="检索王阳明原文语料")
    ap.add_argument("terms", nargs="*", help="检索词（默认全部命中）")
    ap.add_argument("--any", action="store_true", help="任一词命中即可")
    ap.add_argument("--regex", action="store_true", help="把检索词当正则")
    ap.add_argument("--hant", action="store_true", help="检索繁体原文")
    ap.add_argument("--file", default="", help="只检索文件名包含该字符串的篇目")
    ap.add_argument("--entry", type=int, help="取出《传习录》第 N 条（维基文库本编号，共 342 条）")
    ap.add_argument("--limit", type=int, default=12, help="最多返回几条（默认 12）")
    ap.add_argument("--width", type=int, default=600, help="每条最多显示多少字（默认 600，0 为不截断）")
    a = ap.parse_args()
    if not a.terms and a.entry is None:
        ap.error("请给出检索词或 --entry")

    variant = "hant" if a.hant else "hans"
    root = os.path.join(CORPUS, variant)
    if not os.path.isdir(root):
        sys.exit(f"找不到语料目录 {root}")
    files = sorted(f for f in os.listdir(root) if f.endswith(".md") and a.file in f)
    if a.entry is not None:
        files = [f for f in files if f.startswith("chuanxilu")]

    terms = [t.translate(VARIANTS) for t in a.terms]
    gap = r"[\s，。、；：？！「」『』“”‘’（）《》·…—,.;:?!]*"  # 非正则检索时忽略标点差异

    def loose(t):
        chars = [c for c in t if not re.match(gap + "$", c) or c.isalnum()]
        return gap.join(re.escape(c) for c in chars)

    pats = [re.compile(t) if a.regex else re.compile(loose(t)) for t in terms]
    hits = 0
    for fn in files:
        for title, section, entry, text in iter_units(os.path.join(root, fn)):
            if a.entry is not None:
                if entry != a.entry:
                    continue
            else:
                key = text.translate(VARIANTS)
                found = [bool(p.search(key)) for p in pats]
                if not (any(found) if a.any else all(found)):
                    continue
            hits += 1
            where = title or fn
            if section:
                where += f" · {section}"
            if entry is not None:
                where += f" · 第{entry}条"
            shown = text
            if a.width and len(text) > a.width and pats:
                m = pats[0].search(text.translate(VARIANTS))
                start = max(0, (m.start() if m else 0) - a.width // 3)
                shown = ("…" if start else "") + text[start:start + a.width] + ("…" if start + a.width < len(text) else "")
            print(f"【{where}】（{variant}/{fn}）\n{shown}\n")
            if hits >= a.limit:
                print(f"……已达 --limit {a.limit}，可加大 limit 或缩小检索词")
                return
    if hits == 0:
        print("未检索到。可换同义词、改用 --any，或用 --hant 检索繁体原文。"
              "若始终检索不到，说明这句话很可能不出自王阳明本人，不要当作原文引用。")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:  # 允许 | head
        sys.stderr.close()
