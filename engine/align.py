#!/usr/bin/env python3
"""align.py — 把文案逐字对齐到配音（ASR 逐词时间戳），切成字幕行

  python3 engine/align.py <script.txt> <asr.json> <out subs.js|subs.json> [--max 16] [--min 5]

文案里用 {关键词} 标出强调词（每个高亮不要跨标点）。

- 字幕文本用文案原文（ASR 只提供时间），ASR 识别错字不影响字幕
- 先按标点切成小句，过短的并到相邻句，过长的在中间断开
- {关键词} 标记会保留（引擎里渲染成强调色）
"""
import argparse, difflib, json, re

PUNCT = '，。！？；：、,.!?;:“”"\'「」（）() \n\t…—'

def clauses(text, mx, mn):
    paras = [p.strip() for p in text.split('\n') if p.strip()]
    units = []
    for p in paras:
        parts = re.findall(r'[^，。！？；：,!?;:]+[，。！？；：,!?;:]?', p)
        buf = ''
        for x in parts:
            x = x.strip()
            core = lambda s: len(re.sub(r'[%s{}]' % re.escape(PUNCT), '', s))
            if buf and core(buf) + core(x) <= mx and (core(buf) < mn or core(x) < mn):
                buf += x
            else:
                if buf: units.append(buf)
                buf = x
        if buf: units.append(buf)
        units.append(None)  # 段落分隔
    # 过长的再切
    out = []
    for u in units:
        if u is None: out.append(None); continue
        n = len(re.sub(r'[%s{}]' % re.escape(PUNCT), '', u))
        if n > mx * 1.35:
            k = len(u) // 2; out += [u[:k], u[k:]]
        else: out.append(u)
    return out

def strip_tail(u):
    return u.rstrip('，。；：、,;:')

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('script'); ap.add_argument('asr'); ap.add_argument('out')
    ap.add_argument('--max', type=int, default=16); ap.add_argument('--min', type=int, default=5); a = ap.parse_args()
    text = open(a.script, encoding='utf-8').read()
    asr = json.load(open(a.asr, encoding='utf-8'))
    # ASR 字符级时间
    achars, atimes = [], []
    for s in asr:
        for w in s['words']:
            cs = [c for c in w['w'] if c not in PUNCT]
            if not cs: continue
            d = (w['e'] - w['s']) / len(cs)
            for i, c in enumerate(cs): achars.append(c); atimes.append((w['s'] + i * d, w['s'] + (i + 1) * d))
    units = clauses(text, a.max, a.min)
    sc, owner = [], []
    for ui, u in enumerate(units):
        if u is None: continue
        for c in u:
            if c in PUNCT or c in '{}': continue
            sc.append(c); owner.append(ui)
    sm = difflib.SequenceMatcher(None, sc, achars, autojunk=False)
    m = [None] * len(sc)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): m[blk.a + k] = blk.b + k
    matched = sum(x is not None for x in m)
    # 未匹配的字按相邻已匹配字插值
    known = [(i, atimes[j]) for i, j in enumerate(m) if j is not None]
    def time_of(i):
        if m[i] is not None: return atimes[m[i]]
        prev = max((k for k in known if k[0] < i), default=None, key=lambda k: k[0])
        nxt = min((k for k in known if k[0] > i), default=None, key=lambda k: k[0])
        if prev and nxt:
            f = (i - prev[0]) / (nxt[0] - prev[0]); t = prev[1][1] + f * (nxt[1][0] - prev[1][1]); return (t, t + 0.15)
        return prev[1] if prev else nxt[1]
    subs = []
    for ui, u in enumerate(units):
        if u is None:
            if subs: subs[-1]['para_end'] = True
            continue
        idx = [i for i, o in enumerate(owner) if o == ui]
        if not idx: continue
        subs.append({'a': round(time_of(idx[0])[0], 3), 'b': round(time_of(idx[-1])[1], 3), 'text': strip_tail(u)})
    # 显示时间：提前 0.08s 出现；与下一句间隔 < 0.8s 时延续到下一句前
    for i, s in enumerate(subs):
        s['speech_a'], s['speech_b'] = s['a'], s['b']
        s['a'] = max(0, s['a'] - 0.08)
        nxt = subs[i + 1]['a'] - 0.08 if i + 1 < len(subs) else s['b'] + 1.2
        s['b'] = round(nxt - 0.04 if nxt - s['b'] < 0.8 else s['b'] + 0.35, 3)
    if a.out.endswith('.js'):
        open(a.out, 'w', encoding='utf-8').write('/* 由 engine/align.py 生成：文案逐字对齐配音后的字幕。a/b=显示区间，speech_a/b=实际发音区间，para_end=段落末句 */\nwindow.SUBS = ' + json.dumps(subs, ensure_ascii=False, indent=0) + ';\n')
    else:
        json.dump(subs, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'✓ {len(subs)} 行字幕，逐字匹配率 {matched / len(sc) * 100:.1f}% → {a.out}')

if __name__ == '__main__':
    main()
