# 调研：抖音「Vibe知识大赏」（2026-11）

## 是什么

抖音 2026 年 9 月底发起的知识短视频话题 `#Vibe知识大赏`。名字借用 vibe coding：创作者用 Claude Code 等 AI 编程工具写 HTML/Canvas/Remotion 动画代码，逐帧渲染成 MP4。
- 形态：1–3 分钟横屏科普动画，**无人声旁白**，只有字幕 + 配乐 + 音效。
- 热度（第三方报道，未独立核实）：截至 2026-10-20，抖音话题约 11.7–12.2 亿次播放、5.1 万人参与；小红书同名话题 6.6 亿浏览。
- 活动：标题建议以「Vibe知识大赏」为前缀，带话题；第三方整理称本期截止 10 月 31 日，优质视频可获流量扶持。以 App 内话题页为准。
- 被点名的创作者：@i陆三金（据界面新闻）。被多个拆解项目分析过的原片水印包括 @Iwanau、@Juno、叁号暗房。

## 爆款原片拆解（来自开源项目对 8 条原片的逐秒分析）

| 片名 | 主题 | 反直觉点 |
|---|---|---|
| 《月老的算法》 | Gale-Shapley 稳定匹配 | 主动开口的一方拿到最优稳定结局 |
| 《多修一条路，为什么反而更堵》 | 布雷斯悖论 | 加路反而全体变慢 |
| 《运气的形状》 | 概率论诞生史 | 个体不可测，群体极稳定 |
| 《倒霉的事总扎堆》 | 聚类错觉 | 真随机看起来"扎堆" |
| 《第几个人》 | 秘书问题 / 37% 法则 | 先看 37% 再出手 |
| 《你的耳朵在下注》 | 预测编码 / 多巴胺 | 等待本身就是快乐 |
| 《虚无主义？然后呢》 | 尼采精神三变 | 自己选的活法就是答案 |
| 《悲观主义与叔本华》 | 钟摆理论 | 散场后的空是自由 |

## 共同规律

1. **六段式**：冷开场钩子 → 历史锚点（年份/文献/人物）→ 机制动画 → 反直觉转折 → 现实落点 + 金句 → 声明 + 引用 + 互动问题。
2. **画面**：深蓝黑底、金色强调、米白纸卡、红色印章；五区布局（水印 / 顶标签 / 主视觉 / 注释带 / 双语字幕）。字幕里说到的东西，画面上必须真的出现并动起来。
3. **声音**：无旁白；76–78 BPM 小调钢琴 + pad；事件音效与画面同一张节拍表；切镜踩重拍。
4. **严谨**：每个事实有出处；历史图示标"示意"；结尾学术引用。评论区会较真。
5. **节奏**：画面几乎从不静止（静止 < 25%，单次 ≤ 4s）。

## 已有开源 Skill（学习参考，未复制代码）

| 项目 | 路线 | 亮点 |
|---|---|---|
| HeyChengC/vibe-knowledge-film | Canvas + Playwright + ffmpeg | "先找形象再写文案"；夜曲 / 寓言两种画风；30 秒样片确认 |
| MiyanoX (= xiazhuo123456789) /vibe-knowledge-video | Canvas `render(t)` + numpy BGM | 8 条原片 1091 帧逐秒分析；五区布局；六段式；QA 脚本 |
| LuZhong-Li/vibe-knowledge-video-skill | HTML + 体检钩子 | 八阶段 + A1–A43 验收；字号四级；可读性三道防线 |
| wchhywizd/vibe-knowledge-interactive | Canvas 逐帧 | 互动式反常识开场；100 条爆款样本 + 25 个选题 |
| xqq9978-hub / GuanLi22 | Remotion | 横竖屏；自动 BPM 卡点 |
| Jogzh/concept-reel | 基于 vibe-knowledge-film | 15 种动态设计风格、并行渲染 |

## 本仓库的取舍

- 走 **Canvas `f(t)` + Playwright + ffmpeg** 路线（确定性最好、依赖最少、本机已有 Chromium）。
- 字体全部用开源 OFL 字体，`scripts/setup_fonts.sh` 从 npm 拉取，不进仓库。
- 配乐、音效全部 numpy 现场合成，无版权风险。
- 引擎、模板、样片全部原创，不含任何原片素材。

## 来源

- https://xtxian.com/ai-video/opus-video/vibe-zhishi-dashang （活动规则、热度、选题规律汇总）
- https://github.com/MiyanoX/vibe-knowledge-video （style-guide.md、narrative-templates.md）
- https://github.com/HeyChengC/vibe-knowledge-film
- https://github.com/LuZhong-Li/vibe-knowledge-video-skill
- https://github.com/wchhywizd/vibe-knowledge-interactive
- https://github.com/CodeTeng/Vibe-Knowledge-Awards
- https://github.com/xqq9978-hub/vibe-knowledge-video
- https://x.com/guanmo_ai/status/2112525216924807210
