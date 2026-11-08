---
name: vibe-knowledge-video
description: 制作抖音「Vibe知识大赏」风格的无旁白知识短片（1920×1080 30fps、深色底、双语字幕、合成 BGM 与音效、纯代码逐帧渲染成 MP4）。当用户给一个知识主题/文案、要求做"知识大赏"、"vibe知识视频"、"科普短片"、"无旁白动画视频"时使用。
---

# Vibe知识大赏 短片制作

把一个知识点做成 **100–150 秒、无人声、画面把字幕"演出来"** 的电影感科普短片。
全部由代码生成：`film.js`（Canvas，画面 = f(t)）→ Playwright 逐帧截图 → ffmpeg 编码 → numpy 合成配乐/音效 → loudnorm → 自检。

样片：`projects/benford/`（《第一位数字》本福特定律，130s）。动手前先读它的 `script.md` 和 `film.js`，那是本 skill 的"标准答案"。

## 何时读哪个参考

| 文件 | 什么时候读 |
|---|---|
| `references/style-guide.md` | 写 film.js 之前（配色/字号/五区布局/动效/禁用清单） |
| `references/narrative.md` | 立题与写文案时（六段式、钩子句式、金句、选题库） |
| `references/engine-api.md` | 写 film.js 时（V.* 与 g.* 全部 API、常用画面配方） |
| `references/publish.md` | 交付前（验收清单、抖音标题/正文/标签/置顶评论） |

## 工作流（8 步，不可跳步）

1. **立题 + 事实核查**：一句话论点；列事实表，每条带可查出处（论文/书/机构）。数据宁缺毋滥，不确定的不写。示意数据必须在画面上标"示意"。
2. **找形象**：每个概念配一个外行认得、能动起来的主角物（柱子、计数器、纸卡、尺子、地图、文献…）。字幕里的动词，画面上必须真的发生。
3. **写 `script.md`**：用 `assets/script.template.md`。六段式结构 + 分镜表（时间 / 顶标签 / 主视觉动作 / 中英字幕 / 注释 / 音效）。字幕每句 ≤ 20 字，2.5–3.6 s/句。
4. **建工程**：`bash scripts/new_film.sh <slug> "<片名>"`，首次运行先 `bash scripts/setup_fonts.sh`。
5. **先做最难的一镜**，截静帧检查：`node engine/render.mjs projects/<slug> --stills 5,20,40`，用 Read 看 `out/contact.jpg` 和单帧 PNG。
6. **铺全片**，每段写完都截静帧自查（版面越界、字压字、空场、可读性）。用户在场时，先出 30 秒样片确认：`bash engine/build.sh projects/<slug> 0 30`。
7. **出片**：`bash engine/build.sh projects/<slug>` → `out/final.mp4`，自动跑 `engine/qa.py`。
8. **交付**：QA 全过 + 抽 16 帧拼图人工复查 + 按 `references/publish.md` 写发布文案。如实说明哪些地方没检查到。

## 铁律

- **画面 = f(t)**：禁止 `Math.random()`（用 `rng(seed)`）、禁止 rAF/CSS 动画/定时器参与画面状态。
- **无旁白**：所有信息靠字幕 + 画面；关掉声音也能看懂。
- **先图后字**：主角物先动，标签随后，注释再后，结论最后锁定。
- **任何时刻不静止超过 4 秒**：静态卡片用 `V.push()` 慢推镜、`g.float()` 微漂浮。
- **五区不打架**：主视觉在 y=160–720；注释带 y≈768；字幕带 y≈935/988（中/英）。主视觉永远不进字幕带。
- **全片一套配色**：只用 `Vibe.C` 里的色值；金色只给"答案/重点"，一屏最多一个金色焦点。
- **严谨**：结尾必须有声明卡 + 参考文献（作者, 年份, 期刊/书）。历史文献复原盖"示意"章。
- **不抄**：可以学结构和风格，不复刻任何具体原片的画面、文案或配乐。

## 命令速查

```bash
bash scripts/setup_fonts.sh                          # 一次性：下载开源字体（OFL）到 engine/fonts/
bash scripts/new_film.sh entropy "《熵》"             # 新工程
node engine/render.mjs projects/entropy --stills 3,15,40,80   # 静帧 + 拼图
bash engine/build.sh projects/entropy 0 30            # 30 秒样片
bash engine/build.sh projects/entropy                 # 全片 → out/final.mp4 + QA
python3 engine/qa.py projects/entropy/out/final.mp4   # 单独跑自检
```

130 秒全片在 4 核机器上约 2–3 分钟渲染完。浏览器预览：在仓库根目录 `python3 -m http.server`，打开 `/projects/<slug>/index.html`（`?t=42` 定格某一秒）。
