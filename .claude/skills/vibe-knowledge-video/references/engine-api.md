# 引擎 API（engine/vibe.js）

工程结构：`projects/<slug>/{index.html, film.js, script.md, out/}`。`index.html` 加载字体 CSS + `engine/vibe.js` + `film.js`。

## V：时间轴

```js
const V = Vibe.create({ duration: 130, watermark: '@zhiyusay', bpm: 77, seed: 11 });
const { C, E, prog, env, clamp, lerp, rng } = Vibe;   // 颜色、缓动、工具
```

| API | 说明 |
|---|---|
| `V.scene(a, b, (g, lt, s) => {...}, {fin, fout, z})` | 在 [a,b) 秒绘制；`lt` 场景内时间；`s.t` 全局时间；自动交叉淡入淡出（默认 0.6s） |
| `V.sub(a, b, zh, en)` | 一条双语字幕 |
| `V.subs_seq(start, [[dur, zh, en], ...], gap=0.25)` | 连续字幕，返回结束时间 |
| `V.label(a, b, text)` | 顶部标签 |
| `V.note(a, b, text, {x, y, color, size})` | 注释带（默认 y=768，手写橙色） |
| `V.cue(t, name, gain=1, pan=0)` | 音效点 |
| `V.music({prog, sections, gain, sfx_gain})` | 配乐：和弦进行 + 分段乐器层 |
| `V.titleCard(a, b, {title, subtitle, en, kicker})` | 标准标题卡 |
| `V.endCards(a, {disclaimer[], cites[], question, credit, disclaimerDur, citeDur})` | 声明卡 + 参考文献 + 互动问题，返回结束时间 |
| `V.push(g, lt, rate)` | 慢推镜（放在场景函数第一行） |
| `V.overlay(a, b, fn)` | 画在场景之上、字幕之下 |
| `V.beat` / `V.bar` | 一拍 / 一小节秒数 |
| `V.mount()` | 最后调用 |

## 缓动与进度

```js
prog(t, a, b, E.out)    // t 在 [a,b] 的 0..1 进度
env(t, a, b, fin, fout) // 进场-停留-退场包络 0..1
E.linear E.inOut E.out E.in E.outQuint E.outBack E.spring
rng(seed)()             // 固定种子随机数，在场景外预生成数据
```

## g：绘图助手

| API | 说明 |
|---|---|
| `g.text(str, x, y, {size, weight, fam, color, align, base, alpha, ls, italic, stroke, glow, glowColor, gradient:[c1,c2,..]})` | 文字；fam: `sans` `serif` `en` `hand` |
| `g.measure(str, opts)` | 宽度 |
| `g.textReveal(str, x, y, k, opts)` | 逐字浮现（k: 0..1） |
| `g.fillRR(x, y, w, h, r, fill, {stroke, lw, shadow, alpha})` | 圆角矩形 |
| `g.line(x1, y1, x2, y2, {color, lw, dash, alpha, k})` | 线（k 为绘制进度） |
| `g.path(pts, k, {color, lw, dash, glow, alpha})` | 折线自绘，返回笔尖坐标 |
| `g.circle(x, y, r, fill, {stroke, lw, glow, alpha})` | 圆 |
| `g.card(cx, cy, w, h, {rot, scale, fill, hole, draw(g,w,h)})` | 米白卡片 |
| `g.paper(cx, cy, w, h, {rot, seed, bodyTop, draw(g,w,h)})` | 做旧文献 |
| `g.stamp(x, y, txt, {k, size, rot, color})` | 印章（k 为盖章进度） |
| `g.pill(x, y, txt, {size, color, fill, stroke, alpha})` | 胶囊标签，返回宽度 |
| `g.spot(x, y, r, alpha, 'r,g,b')` | 局部聚光 |
| `g.float(t, seed, amp)` | 微漂浮 `[dx, dy]` |
| `g.count(v, dec)` | 千分位格式化 |
| `g.ctx` | 原生 CanvasRenderingContext2D（save/restore 自行配对） |

## 音效名

`whoosh`（转场）`swell`（开场铺垫）`rise`（揭晓前上扬）`chime`（揭晓/金句）`sparkle`（高亮）
`tick`（计数/逐个出现）`click`（粒子落下）`pop`（卡片/标签弹出）`paper`（纸张）`stamp`（盖章）`thud`（标题重音）

每段 1–3 个重音（chime/thud/stamp），其余为轻音效（gain 0.25–0.5）。

## 配乐层

`pad` `bass` `piano` `arp` `bell` `kick` `shaker`，用 `+` 组合。典型编排：

```js
V.music({ prog: ['Am','F','C','G'], sections: [
  [0, 12, 'pad'], [12, 18, 'pad+bell'], [18, 50, 'pad+piano'],
  [50, 90, 'pad+piano+bass+kick+shaker'], [90, 104, 'pad+arp+bass+kick'],
  [104, 116, 'pad+piano+bell'], [116, 999, 'pad'] ] });
```

其他可用和弦进行：`['Dm','Bb','F','C']`（更暗），`['Am','Fmaj7','C','Gsus2']`（更柔），`['Em','C','G','D']`（更亮）。

## 常用配方

**数字飞成柱子**：在场景外预生成 `{x,y,d}`，`fly = prog(lt, a, b)`，位置 `lerp(start, target, fly)`，柱高同步从 0 长出。

**规则卡缩成角标**：`shrink = prog(t, ...)`，`translate(lerp(cx, 330, shrink), lerp(cy, 250, shrink))` + `scale(lerp(1, .62, shrink))`。

**随机落点堆积**：预生成 `DROPS=[{u, t}]`，每帧遍历：未落地的画下落中，已落地的按格子计数堆叠位置。纯函数、无状态。

**数字雨计数**：同上，落地的计入 `counts[]`，再用 `lerp(counts/N, 理论值, settle)` 让柱子最后收敛到理论分布。
