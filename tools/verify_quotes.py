#!/usr/bin/env python3
"""校验文档中引用的原文是否真的出自语料（防止伪托语录混入）。

规则：Markdown 中以 "> " 开头的引用行，去掉末尾的（出处）后，按省略号切段，
每段（去标点后不少于 4 字）都必须能在 corpus/hans 中逐字找到。
行内含【不校验】标记的引用行跳过（用于明确标注的后人语、现代解读）。

用法:
    python3 tools/verify_quotes.py [要检查的文件或目录 ...]
默认检查 skills/wang-yangming/references、skills/wang-yangming/SKILL.md 和 examples/。
"""
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
CORPUS = os.path.join(ROOT, "skills", "wang-yangming", "corpus", "hans")
PUNCT = re.compile(r"[\s，。、；：？！「」『』“”‘’（）()《》〈〉【】\[\]·…—\-,.;:?!'\"*_~`|]+")


# 四库本等版本中的常见异体字 -> 通行字（两边都归一后再比对）
VARIANTS = str.maketrans({
    "徳": "德", "逺": "远", "㫖": "旨", "冦": "寇", "懐": "怀", "恱": "悦", "乆": "久",
    "㣲": "微", "㨯": "椁", "黙": "默", "曽": "曾", "髙": "高", "㸃": "点", "叅": "参",
    "隂": "阴", "歛": "敛", "鬬": "斗", "揜": "掩", "巻": "卷", "収": "收", "㑹": "会",
    "觧": "解", "敎": "教", "爲": "为", "於": "于", "衆": "众", "盖": "盖", "葢": "盖",
    "聨": "联", "軰": "辈", "□": "",
})


def norm(s):
    return PUNCT.sub("", s).translate(VARIANTS)


def load_corpus():
    parts = []
    for fn in sorted(os.listdir(CORPUS)):
        if fn.endswith(".md"):
            with open(os.path.join(CORPUS, fn), encoding="utf-8") as f:
                parts.append(norm(f.read()))
    return "\n".join(parts)


def iter_files(paths):
    for p in paths:
        if os.path.isdir(p):
            for dp, _, fns in os.walk(p):
                for fn in sorted(fns):
                    if fn.endswith(".md"):
                        yield os.path.join(dp, fn)
        elif p.endswith(".md") and os.path.exists(p):
            yield p


def main():
    paths = sys.argv[1:] or [
        os.path.join(ROOT, "skills", "wang-yangming", "references"),
        os.path.join(ROOT, "skills", "wang-yangming", "SKILL.md"),
        os.path.join(ROOT, "examples"),
    ]
    corpus = load_corpus()
    bad = checked = 0
    for fp in iter_files(paths):
        with open(fp, encoding="utf-8") as f:
            in_code = False
            for no, line in enumerate(f, 1):
                if line.startswith("```"):
                    in_code = not in_code
                if in_code or not line.startswith(">") or "不校验" in line:
                    continue
                text = line.lstrip("> ").strip()
                if not text or text.startswith(("本文件", "注", "——", "—— ")):
                    continue
                text = re.sub(r"（[^（）]*《[^）]*）\s*$", "", text)  # 去掉末尾出处
                text = re.sub(r"（(同上|[^（）]*第\d+条[^（）]*)）\s*$", "", text)
                for seg in re.split(r"……|\.\.\.|…", text):
                    n = norm(seg)
                    if len(n) < 4:
                        continue
                    checked += 1
                    if n not in corpus:
                        bad += 1
                        print(f"✗ {os.path.relpath(fp, ROOT)}:{no}  {seg.strip()[:60]}")
    print(f"校验 {checked} 段引文，{bad} 段未在语料中找到。")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
