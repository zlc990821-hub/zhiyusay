# 第 01 期 状态

## 已完成
- 方向、命题、口播稿 v4（SCRIPT.md，悬案式）、BEATS_v4.md、研究笔记。
- 片头片尾 v5（docs/品牌样片/），含合成音效。
- 用户录音（14:41，一条过）；语音识别 → `audio/transcript_v4录音.*`。
- 分镜表 v2（SHOTLIST.md，96 镜），用户回复「可以的剩下的都你来定」。
- 字幕与卡点：`studio/tools/align_subs.py` → `studio/src/ep01_subs.json`（对齐率 96.3%，277 行；人名不断行，规则见 `audio/字幕不断词.txt`；卡点短语见 `audio/卡点短语.txt`）。
- 素材调色切片：`studio/tools/prep_clip.py` → `studio/public/ep01/clips/`（不入库，可按下表重新生成）。
- 三段样片的代码：`studio/src/ep01/`（Opening 开场+片头、Glass 碎玻璃、Souls 三魂），音效 `studio/sound/ep01_samples.py`（合成，无版权问题）。

## 片段来源（重新生成用）
| 片段 | 来源 | 起点 | 时长 | 处理 |
|---|---|---|---|---|
| s1_hand | Mixkit 49557 | 见 素材清单 | 10 | fill |
| s5_hug | Mixkit 46525 | | 9 | fill |
| s6_photo | Mixkit 21447 | | 6.5 | fill |
| car_pov | 交通安全片 | 131.2 | 5.6 | fill |
| car_road | 交通安全片 | 144.8 | 5.0 | fill |
| glass_burst | 交通安全片 | 173.0 | 0.42 | fill，慢放 4 倍（只有玻璃，前后是人被甩动的镜头，不能多取） |
| glass_out | 交通安全片 | 183.2 | 3.8 | pillar |
| fire | Mixkit 1243 | 1 | 6 | fill |
| candle | Mixkit 3458 | 0 | 8 | vertical |

## 未完成
- 三段样片渲染、截帧检查、交给用户确认（进行中）。
- 样片通过后：其余镜头逐段制作 → 全片合成 → 混音（人声 -16 LUFS，音效衬底约低 15 LU）→ 字幕 → 渲染 → 截帧检查 → 交付。可选：导出剪映草稿。
- 还缺的素材：维基共享资源实验室大鼠视频（CC BY 2.0）、庄子画像（被 429 限速，样片里先只用原文书法字）。

## 已知问题
- 录音与稿子有两处出入（约 07:30 少「还能弹」，约 13:23 少「只」字），字幕已按录音处理（`audio/字幕替换.json`）。
- voice.wav 规整后被 ffmpeg-normalize 升到 192kHz，已重采样回 48kHz。

## 下一步唯一任务
- 渲染三段样片，截帧检查，交给用户确认风格。
