#!/usr/bin/env python3
"""把维基文库 wikitext 清洗为 Markdown 语料（繁体原文 + OpenCC 简体）。

用法:
    python3 tools/build_corpus.py <wikitext目录> <输出corpus目录>

wikitext 文件名为维基文库页面标题（"/" 替换为 "__"）加 .wiki 后缀，
由 tools/fetch_wikisource.py 下载得到。
"""
import os
import re
import sys

try:
    import opencc  # pip install opencc
except ImportError:  # pragma: no cover
    sys.exit("需要 OpenCC: pip install opencc")

T2S = opencc.OpenCC("t2s")

# 维基文库标题 -> (输出文件名, 简体显示名, 分类)
CATALOG = [
    ("傳習錄/卷上", "chuanxilu-1-shang", "传习录·卷上（徐爱、陆澄、薛侃录）", "语录"),
    ("傳習錄/卷中", "chuanxilu-2-zhong", "传习录·卷中（论学书信）", "语录"),
    ("傳習錄/卷下", "chuanxilu-3-xia", "传习录·卷下（陈九川、黄直、黄修易、黄省曾、钱德洪等录）", "语录"),
    ("大學問", "daxuewen", "大学问", "单篇"),
    ("教條示龍場諸生", "jiaotiao-longchang", "教条示龙场诸生", "单篇"),
    ("瘞旅文", "yilvwen", "瘗旅文", "单篇"),
    ("象祠記", "xiangci-ji", "象祠记", "单篇"),
    ("尊經閣記", "zunjingge-ji", "尊经阁记", "单篇"),
    ("觀德亭記", "guandeting-ji", "观德亭记", "单篇"),
    ("諭俗文 (王守仁)", "yusuwen", "谕俗文", "单篇"),
    ("鄊約告諭_(王守仁)", "xiangyue-gaoyu", "乡约告谕", "单篇"),
    ("告諭_(王守仁)", "gaoyu", "告谕", "单篇"),
    ("平茶寮碑", "pingchaliao-bei", "平茶寮碑", "单篇"),
    ("平浰頭碑", "pingliutou-bei", "平浰头碑", "单篇"),
]
_JUAN = {
    1: "语录一", 2: "语录二", 3: "语录三", 4: "文录一", 5: "文录二", 6: "文录三",
    7: "文录四", 8: "文录五", 9: "别录一", 10: "别录二", 11: "别录三", 12: "别录四",
    13: "别录五", 14: "别录六", 15: "别录七", 16: "别录八", 17: "别录九", 18: "别录十",
    19: "外集一", 20: "外集二", 21: "外集三", 22: "外集四", 23: "外集五", 24: "外集六",
    25: "外集七", 26: "续编一", 27: "续编二", 28: "续编三", 29: "续编四", 30: "续编五",
    31: "续编六",
}
for i in range(1, 32):
    CATALOG.append((f"王陽明集/卷{i:02d}", f"quanji-{i:02d}", f"王阳明全集（王文成公全书）卷{i}·{_JUAN[i]}", "全集"))
# 年谱、世德纪：取四库全书本《王文成全书》卷32—38（无标点）
_FULU = {32: "年谱一", 33: "年谱二", 34: "年谱三", 35: "年谱四（附录）", 36: "年谱五（附录）",
         37: "世德纪一", 38: "世德纪二"}
for i, name in _FULU.items():
    cat = "年谱" if i <= 36 else "世德纪"
    CATALOG.append((f"王文成全書 (四庫全書本)/卷{i}", f"quanji-{i}-siku",
                    f"王文成公全书（四库全书本）卷{i}·附录·{name}（原书无标点）", cat))

WIKI_DIR = None  # main() 中设置，用于展开嵌入页面 {{:页面名}}


def expand_transclusions(s: str, depth: int = 0) -> str:
    """把 {{:页面}} / {{#lst:页面|段}} 替换为该页面正文（页面需已下载）。"""
    seen = set()

    def repl(m):
        title = m.group(1).strip()
        if title in seen:  # 同一页面的多个分段只嵌入一次
            return ""
        seen.add(title)
        fn = os.path.join(WIKI_DIR, title.replace("/", "__") + ".wiki")
        if depth > 2 or not os.path.exists(fn):
            return f"（未收录嵌入页面：{title}）"
        body = open(fn, encoding="utf-8").read()
        body = re.sub(r"\{\{[Hh]eader2?\s*\|.*?\n\}\}", "", body, flags=re.S)
        body = re.sub(r"<section\s+(begin|end)=[^>]*/>", "", body)
        return expand_transclusions(body, depth + 1)

    return re.sub(r"\{\{(?::|#lst:)([^}|]+)(?:\|[^}]*)?\}\}", repl, s)


def strip_templates(s: str) -> str:
    """去掉 {{...}}（可嵌套）。少数承载正文的模板先展开。"""
    s = re.sub(r"\{\{SK anchor\|([^{}|]*)\}\}", r"\n## \1\n", s)  # 四库本分节锚点
    s = re.sub(r"\{\{(?:SK notes|\*)\|([^{}]*)\}\}", r"（\1）", s)  # 小注
    s = re.sub(r"\{\{YL\|([^{}|]*)\}\}", r"\1", s)  # 年号
    s = re.sub(r"\{\{(?:SKchar\|[^{}]*|？)\}\}", "□", s)  # 缺字/图片字
    s = re.sub(r"\{\{!\|([^|{}]*)(?:\|[^{}]*)?\}\}", r"\1", s)  # 生僻字模板
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    return s


def clean(wikitext: str) -> str:
    s = wikitext
    s = re.sub(r"<ref[^>/]*/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = expand_transclusions(s)
    s = re.sub(r"<ref[^>/]*/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"-\{(?:[^{}|]*\|)?([^{}]*)\}-", r"\1", s)  # 繁简转换标记 -{X}-
    s = strip_templates(s)
    s = re.sub(r"\{\|.*?\|\}", "", s, flags=re.S)  # 表格
    s = re.sub(r"\[\[(?:Category|分類|分类|File|Image|文件):[^\]]*\]\]", "", s)
    s = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[\[([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[https?://\S+ ([^\]]*)\]", r"\1", s)
    s = re.sub(r"'''?", "", s)
    s = re.sub(r"</?br\s*/?>", "\n", s)
    s = re.sub(r"</?[a-zA-Z][^>]*>", "", s)
    out = []
    for line in s.splitlines():
        line = line.rstrip()
        m = re.match(r"^(=+)\s*(.*?)\s*\1$", line)
        if m:
            level, title = len(m.group(1)), m.group(2).strip()
            if title in ("註釋", "注释", "注釋", "參考文獻"):
                continue
            if re.fullmatch(r"\d+", title):
                out.append(f"\n**〔{title}〕**")  # 传习录条目编号（维基文库本）
            else:
                out.append("\n" + "#" * min(level + 0, 6) + " " + title)
            continue
        line = re.sub(r"^[:*#;]+\s*", "", line).lstrip("\u3000 ")
        out.append(line)
    text = "\n".join(out)
    if "SKQS header" in wikitext:  # 四库本 <poem> 每行一段，补空行便于分段检索
        text = text.replace("\n", "\n\n")
    text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"
    return text


def main():
    global WIKI_DIR
    src, dst = sys.argv[1], sys.argv[2]
    WIKI_DIR = src
    rows = []
    for title, slug, name_hans, cat in CATALOG:
        fn = os.path.join(src, title.replace("/", "__") + ".wiki")
        if not os.path.exists(fn):
            print("缺失:", title)
            continue
        body = clean(open(fn, encoding="utf-8").read())
        url = "https://zh.wikisource.org/wiki/" + title.replace(" ", "_")
        for variant, text in (("hant", body), ("hans", T2S.convert(body))):
            os.makedirs(os.path.join(dst, variant), exist_ok=True)
            head_name = name_hans if variant == "hans" else title.replace("/", "·")
            header = f"# {head_name}\n\n> 来源：维基文库《{title}》 {url} （原文公有领域；维基文库录入文本依 CC BY-SA 4.0 授权）\n\n"
            open(os.path.join(dst, variant, slug + ".md"), "w", encoding="utf-8").write(header + text)
        rows.append((cat, slug, name_hans, len(body), url))
    with open(os.path.join(dst, "INDEX.md"), "w", encoding="utf-8") as f:
        f.write("# 语料目录\n\n`hans/` 为简体（OpenCC 自动转换，引用重要文句时请对照 `hant/` 繁体原文），`hant/` 为维基文库繁体原文。\n\n")
        f.write("| 分类 | 文件 | 篇目 | 字数(约) | 来源 |\n|---|---|---|---|---|\n")
        for cat, slug, name, n, url in rows:
            f.write(f"| {cat} | `{slug}.md` | {name} | {n} | [维基文库]({url}) |\n")
    print("完成", len(rows), "篇")


if __name__ == "__main__":
    main()
