# 卡点：画面跟着音乐走

抖音卡点的核心只有一句：**观众"感觉到"的每一次变化，都落在音乐的拍子上；最大的变化，落在音乐最大的变化上。**

## 1. 先选歌，再定时间轴

音乐决定节奏，而不是做完画面再找一首歌配上去。顺序固定：

1. 写完 `script.md`（知道总时长、标题卡/揭晓点大概在几秒）
2. `python3 engine/bgm.py list` 看库，`python3 engine/bgm.py pick --duration 130 --hit 12.4 --mood ...` 打分
3. **人工判断**：分数只看结构（drop 位置、时长、起点），不懂情绪。按下表结合题材挑
4. `python3 engine/bgm.py show <id>` 看段落；拿不准拍点就 `python3 engine/bgm.py click <id>` 听节拍器叠加版
5. `python3 engine/bgm.py use <id> --project projects/<slug> --duration 130 --hit 12.4` 生成 `bgm.js`
6. 写 `film.js`，最后调用 `V.sync()`

### 题材 → 音乐

| 题材气质 | 选什么 | 库里的候选（⚠ 仅凭曲名 + 自动分析推测，未人工试听；以 `library.json` 里用户填写的 tags/notes 为准） |
|---|---|---|
| 理性、数学、科学原理 | 中速 95–115 BPM，干净电子/钢琴，能量平稳 | vibe知识大赏（话题同名曲）、Saltwater Room 纯音乐 |
| 历史、人物、宿命感 | 慢 70–90 BPM，小调，有铺垫有爆发 | the-invincible-king、fearless |
| 反常识、悬疑、黑暗心理 | 小调、暗黑 funk/phonk、强低频 | una-mas-funk-2、ghost、天空之境 |
| 燃、逆袭、成功学反转 | 快 120–140 BPM，slap house / phonk，drop 明显 | 红色猛兽-immortal、invincible-king-slap-house、money-in-my-pocket |
| 治愈、情感、哲学收尾 | 慢、大调、留白多 | mr-broken-heart-instrumental |

带人声的歌：字幕会和歌词抢注意力，知识片优先纯音乐；必须用时，把字幕密集段放在间奏。

## 2. 节拍网格

`bgm.js` 给出视频时间轴上的：`beats`（每拍）、`downbeats`（小节头）、`kicks`（底鼓）、`sections`（段落 + 能量 low/mid/high）、`drops`（能量跃升点）。

| API | 用法 |
|---|---|
| `V.B(n)` / `V.D(n)` | 第 n 拍 / 第 n 小节头的时间 |
| `V.snap(t, 'beat' \| 'bar' \| 'half')` | 吸附 |
| `V.nextBeat(t, unit)` | 下一个拍点 |
| `V.pulse(t, 'beat' \| 'bar', decay)` / `g.pulse(...)` | 拍点脉冲 0..1，做随拍发光、微缩放 |
| `V.drops()` / `V.sections()` | 高潮点 / 段落 |
| `V.sync()` | 把所有场景起点吸附到 drop > 小节头 > 拍，内部字幕/音效整体平移 |

## 3. 什么该卡在哪

| 画面事件 | 卡在 | 说明 |
|---|---|---|
| 标题卡出现 | **第一个 drop** | 钩子段在 drop 前收住；drop 上硬切 + 闪光 + `impact`/`boom`，`reverse` 用 `align:'end'` 推到 drop |
| 大段落切换（历史→机制→反转） | 小节头，最好是 4/8 小节乐句头 | `V.sync()` 自动做 |
| 段内元素依次入场（柱子、卡片、标签） | 每拍或每半拍一个 | 用 `V.B(n)` 排，或 `V.snap()` |
| 揭晓数字 / 盖章 / 金句 | 重拍（小节头）或 drop | 揭晓前一拍留空，制造"等一下" |
| 数字滚动、曲线生长 | 起止都在拍上，时长 = 整数拍 | |
| 字幕 | **不卡拍**，按阅读速度 | 字幕跟拍会读不完；只让每段第一句和切点同步 |
| 背景呼吸光 | 自动随小节头脉动 | `V.beatGlow = false` 关闭 |

**音乐能量 ↔ 画面密度**：`sections` 是 low 时画面留白、元素少；high 时信息密、切换快。最高能量段放"机制模拟"，最后一个能量回落段放金句与结尾。

## 4. 检查

`engine/qa.py` 会报告：
- **切点卡拍**：场景切点在拍上（±45ms）的比例，≥ 80% 才算过
- **重音卡拍**：whoosh/thud/chime/stamp/impact 等重音效在拍上（±60ms）的比例，≥ 60% 才算过
- **高潮对位**：每个 drop 上都要有切点或重音

最后**一定要带声音看一遍成片**，尤其是 drop 前后 3 秒。
