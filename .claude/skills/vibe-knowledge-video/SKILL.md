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
| `references/music-sync.md` | **选 BGM 与卡点**（写 film.js 之前必读） |
| `references/sound-design.md` | 给动画配音效（动作 → 音效对照表、电平） |
| `references/publish.md` | 交付前（验收清单、抖音标题/正文/标签/置顶评论） |

## 工作流（8 步，不可跳步）

1. **立题 + 事实核查**：一句话论点；列事实表，每条带可查出处（论文/书/机构）。数据宁缺毋滥，不确定的不写。示意数据必须在画面上标"示意"。
2. **找形象**：每个概念配一个外行认得、能动起来的主角物（柱子、计数器、纸卡、尺子、地图、文献…）。字幕里的动词，画面上必须真的发生。
3. **写 `script.md`**：用 `assets/script.template.md`。六段式结构 + 分镜表（时间 / 顶标签 / 主视觉动作 / 中英字幕 / 注释 / 音效）。字幕每句 ≤ 20 字，2.5–3.6 s/句。
4. **建工程 + 选 BGM（先选歌再做画面）**：`bash scripts/new_film.sh <slug> "<片名>"`（首次先 `bash scripts/setup_fonts.sh`）。
   然后在 BGM 库里挑歌：`python3 engine/bgm.py list` → `pick --duration <秒> --hit <标题卡秒数>` → 结合题材人工决定 →
   `python3 engine/bgm.py use <id> --project projects/<slug> --duration <秒> --hit <秒>` 生成 `bgm.js`。
   向用户说明选了哪首、为什么、从第几秒开始。库里没有合适的就用合成配乐（不生成 bgm.js 即可），并告诉用户缺什么风格。
   **库里有音频文件缺失**（新会话、公开仓库不存音频）时，请用户重新上传对应曲目再 `ingest`。
5. **先做最难的一镜**，截静帧检查：`node engine/render.mjs projects/<slug> --stills 5,20,40`，用 Read 看 `out/contact.jpg` 和单帧 PNG。
6. **铺全片**：大段落放在小节头，标题卡放在第一个 drop，段内元素按拍入场（`V.B(n)`）；
   每个动作都按 `sound-design.md` 配音效（`V.cue`）；`film.js` 末尾 `V.sync()` 再 `V.mount()`。每段写完都截静帧自查（版面越界、字压字、空场、可读性）。用户在场时，先出 30 秒样片确认：`bash engine/build.sh projects/<slug> 0 30`。
7. **出片**：`bash engine/build.sh projects/<slug>` → `out/final.mp4`，自动跑 `engine/qa.py`。
8. **交付**：QA 全过 + 抽 16 帧拼图人工复查 + 按 `references/publish.md` 写发布文案。如实说明哪些地方没检查到。

## 有配音的片子（用户给音频 + 文案）

样片：`projects/voice/`（《隧道里的声音》，竖屏 209s，纸感治愈风）。
1. 先确认：音频里是否已混配乐（是 → 不再叠 BGM）、竖屏/横屏、风格、字幕语言。
2. 音频放 `projects/<slug>/raw/`（不入库），`bgm.js` 写成配音轨：`{ file, offset: 0, duck: false, beats: [] ... }`。
3. `pip install faster-whisper` → `python3 engine/asr.py raw/voice.m4a asr.json`（逐词时间戳）。
4. 文案存 `script.txt`，用 `{关键词}` 标强调（高亮不要跨标点）→ `python3 engine/align.py script.txt asr.json subs.js`（字幕用原文，ASR 只给时间；匹配率应 > 95%）。
5. `Vibe.create({ width: 1080, height: 1920, theme: 'paper' })`，`for (const s of window.SUBS) V.sub(s.a, s.b, s.text)`；场景切点跟随段落（subs 里的 `para_end`），不卡拍。
6. 情感/治愈题材的定稿风格是**月夜湖面**（`projects/voice/film.js`）：紫色夜空 + 满月 + 三层远山 + 带波纹的真实倒影；两个人 = 两团光（暖金 / 银蓝），不画小人；文案 `{关键词}` 自动变成湖面上方用光线"描"出来的图标（`ICON` 表，有倒影）——**用户要求尽量用图案、不要用文字**，画面里除字幕/片名外不放字，也不要顶部章节标签；字幕白色宋体在水面上。用户明确否定过简笔小人/纸感插画（"太幼稚"）和看不清的纯黑底。
   自定义世界用 `Vibe.create({ bg: (g,t)=>..., subStyle: {...}, layout: {...} })`；倒影在 overlay 里先把水面以上拷到离屏画布再逐条翻转（不要对主画布自拷贝，极慢）。

## 铁律

- **画面 = f(t)**：禁止 `Math.random()`（用 `rng(seed)`）、禁止 rAF/CSS 动画/定时器参与画面状态。
- **无旁白**：所有信息靠字幕 + 画面；关掉声音也能看懂。
- **先图后字**：主角物先动，标签随后，注释再后，结论最后锁定。
- **任何时刻不静止超过 4 秒**：静态卡片用 `V.push()` 慢推镜、`g.float()` 微漂浮。
- **五区不打架**：主视觉在 y=160–720；注释带 y≈768；字幕带 y≈935/988（中/英）。主视觉永远不进字幕带。
- **全片一套配色**：只用 `Vibe.C` 里的色值；金色只给"答案/重点"，一屏最多一个金色焦点。
- **严谨**：结尾必须有声明卡 + 参考文献（作者, 年份, 期刊/书）。历史文献复原盖"示意"章。
- **先选歌再剪**：有 BGM 就必须卡点——场景切点在拍上、标题卡在 drop、重音效在拍上（qa.py 会查）。
- **动作必有声**：每个入场/翻转/划线/盖章/落地/揭晓都配对应音效；字幕不卡拍，按阅读速度。
- **不抄**：可以学结构和风格，不复刻任何具体原片的画面、文案或配乐。

## 命令速查

```bash
bash scripts/setup_fonts.sh                          # 一次性：下载开源字体（OFL）到 engine/fonts/
bash scripts/new_film.sh entropy "《熵》"             # 新工程
python3 engine/bgm.py ingest [文件...]                # 新歌入库（无参数=扫描 bgm/inbox/）
python3 engine/bgm.py list | show <id> | click <id>   # 浏览 / 段落 / 节拍器试听
python3 engine/bgm.py pick --duration 130 --hit 12.4 --mood calm
python3 engine/bgm.py use <id> --project projects/entropy --duration 130 --hit 12.4
node engine/render.mjs projects/entropy --stills 3,15,40,80   # 静帧 + 拼图
bash engine/build.sh projects/entropy 0 30            # 30 秒样片
bash engine/build.sh projects/entropy                 # 全片 → out/final.mp4 + QA
python3 engine/qa.py projects/entropy/out/final.mp4   # 单独跑自检
```

130 秒全片在 4 核机器上约 2–3 分钟渲染完。浏览器预览：在仓库根目录 `python3 -m http.server`，打开 `/projects/<slug>/index.html`（`?t=42` 定格某一秒）。
