"""把稿子和录音识别结果逐字对齐，生成字幕和卡点时间。
用法：python3 studio/tools/align_subs.py SCRIPT.md transcript.json 输出.json [替换规则.json] ["短语1|短语2"] [不断词.txt]
- 字幕文字以稿子为准（可用替换规则对齐实际录音），时间以录音为准。
- 字幕一屏一整句（长句两行），不在句子中间截断。
- 输出：subs（字幕行）、cues（稿子里每个短语首次/全部出现的时间，供画面卡点）。
"""
import difflib, json, re, sys
from opencc import OpenCC
script_md, tr_json, out = sys.argv[1], sys.argv[2], sys.argv[3]
repl = json.load(open(sys.argv[4], encoding="utf-8")) if len(sys.argv) > 4 else {}
cc = OpenCC("t2s")
PUN = "，。？！；：、「」『』“”‘’（）…—,.?!;:\"' \n*《》【】"

# 1. 取出稿子正文（00–09 段），去掉标题、（停）、加粗、片头片尾标记
lines, seg = [], None
for raw in open(script_md, encoding="utf-8").read().splitlines():
    m = re.match(r"## (\d\d) ", raw)
    if m: seg = m.group(1); continue
    if raw.startswith("## ") or raw.startswith("#"): seg = None if raw.startswith("# ") else seg; continue
    if seg is None or not raw.strip() or raw.strip() in ("---",) or raw.startswith("【") or raw.startswith("- ") or raw.startswith("全片") or raw.startswith("状态") or raw.startswith("标记"):
        continue
    t = raw.replace("（停）", "").replace("**", "").strip()
    if t: lines.append((seg, t))
text = "\n".join(f"{s}\t{t}" for s, t in lines)
for a, b in repl.items(): text = text.replace(a, b)
lines = [tuple(l.split("\t", 1)) for l in text.splitlines()]

# 2. 稿子字符序列（去标点）
sc, sc_pos = [], []   # 字符，以及它在 (行号, 行内位置)
for li, (s, t) in enumerate(lines):
    for ci, ch in enumerate(t):
        if ch not in PUN: sc.append(ch); sc_pos.append((li, ci))

# 3. 识别结果字符序列与时间
tr = json.load(open(tr_json, encoding="utf-8"))
ac, at = [], []
for s in tr:
    for w in s.get("words", []):
        word = cc.convert(w["w"]).strip()
        chars = [c for c in word if c not in PUN]
        if not chars: continue
        dur = (w["e"] - w["s"]) / len(chars)
        for k, c in enumerate(chars):
            ac.append(c); at.append((w["s"] + k * dur, w["s"] + (k + 1) * dur))

# 4. 对齐
sm = difflib.SequenceMatcher(None, sc, ac, autojunk=False)
st, en = [None] * len(sc), [None] * len(sc)
for a, b, n in sm.get_matching_blocks():
    for k in range(n): st[a + k], en[a + k] = at[b + k]
known = [i for i in range(len(sc)) if st[i] is not None]
for i in range(len(sc)):   # 没对上的字：在前后已知的字之间插值
    if st[i] is None:
        prev = max([k for k in known if k < i], default=None); nxt = min([k for k in known if k > i], default=None)
        if prev is None: st[i] = en[i] = st[nxt]
        elif nxt is None: st[i] = en[i] = en[prev]
        else:
            f = (i - prev) / (nxt - prev); st[i] = en[prev] + (st[nxt] - en[prev]) * f; en[i] = st[i]
matched = len(known) / len(sc)

# 5. 切字幕：一屏一整句（2026-11-19 用户要求，按稿子完整显示，不在句子中间截断）
#    句子以 。？！ 结束（引号里的句号跟着引号走）；一句太长（超过 MAXU 字）时，才在最靠近中间的逗号处分成两屏，
#    每屏仍是完整的分句。每屏最多两行，每行不超过 LINE 字，换行点放在标点后。
LINE, MAXU = 20, 40
PROTECT = [w.strip() for w in open(sys.argv[6], encoding="utf-8").read().split() if w.strip()] if len(sys.argv) > 6 else []
core_len = lambda x: len(re.sub(f"[{re.escape(PUN)}]", "", x))

def sentences(t):
    out, buf, q = [], "", 0
    for i, ch in enumerate(t):
        buf += ch
        if ch in "「『": q += 1
        elif ch in "」』": q = max(0, q - 1)
        nxt = t[i + 1] if i + 1 < len(t) else ""
        if ch in "。？！" and q == 0 and nxt not in "」』":
            out.append(buf); buf = ""
        elif ch in "」』" and q == 0 and buf and buf[-2:-1] in "。？！":
            out.append(buf); buf = ""
    if buf.strip(): out.append(buf)
    return [x for x in out if x.strip()]

def split_long(c):
    if core_len(c) <= MAXU: return [c]
    cuts = [m.end() for m in re.finditer(r"[，；：]", c) if 4 < m.end() < len(c) - 3]
    if not cuts: return [c]
    mid = len(c) / 2
    k = min(cuts, key=lambda x: abs(x - mid))
    return split_long(c[:k]) + split_long(c[k:])

def wrap(d):
    """两行：在最靠近中间的标点后换行；没有标点时在虚词处换行，不切开人名"""
    if core_len(d) <= LINE: return d
    mid = len(d) / 2
    # 换行点后面不能紧跟标点（否则下一行以「，」开头）
    cand = [m.end() for m in re.finditer(r"[，、；：」]", d) if 2 < m.end() < len(d) - 1 and d[m.end()] not in "，、；：。」！？"]
    if cand:
        k = min(cand, key=lambda x: abs(x - mid))
        if abs(k - mid) <= len(d) * 0.3: return d[:k] + "\n" + d[k:]
    banned = set()
    for w in PROTECT + re.findall(r"[0-9A-Za-z.]+", d):
        j = d.find(w)
        while j >= 0: banned.update(range(j + 1, j + len(w))); j = d.find(w, j + 1)
    k = min(range(3, len(d) - 2), key=lambda i: abs(i - mid) - (3 if d[i - 1] in "的了着过" or d[i] in "给把在和与对是就都也还" else 0) + (100 if i in banned else 0))
    return d[:k] + "\n" + d[k:]

pos2idx = {p: i for i, p in enumerate(sc_pos)}
subs = []
for li, (s, t) in enumerate(lines):
    cur = 0
    for sent in sentences(t):
        for c in split_long(sent):
            start_ci = t.find(c, cur); cur = start_ci + len(c)
            idxs = [pos2idx[(li, ci)] for ci in range(start_ci, start_ci + len(c)) if (li, ci) in pos2idx]
            if not idxs: continue
            disp = c.strip()
            disp = re.sub(r"[。，；：、]+$", "", disp)
            disp = re.sub(r"。」$", "」", disp)
            subs.append({"seg": s, "start": round(st[idxs[0]], 2), "end": round(en[idxs[-1]] + 0.35, 2), "text": wrap(disp)})
for i in range(len(subs) - 1):   # 防止重叠，保证最短显示 1.0 秒
    subs[i]["end"] = min(max(subs[i]["end"], subs[i]["start"] + 1.0), subs[i + 1]["start"] - 0.05)

# 6. 卡点：每个短语在稿子里出现的时间
plain = "".join(sc)
def find_all(ph):
    ph2 = "".join(c for c in ph if c not in PUN); res, k = [], plain.find(ph2)
    while k >= 0: res.append(round(st[k], 2)); k = plain.find(ph2, k + 1)
    return res
cue_list = sys.argv[5].split("|") if len(sys.argv) > 5 else []
cues = {ph: find_all(ph) for ph in cue_list}
json.dump({"matched": round(matched, 3), "subs": subs, "cues": cues}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"对齐率 {matched:.1%}，字幕 {len(subs)} 行")
