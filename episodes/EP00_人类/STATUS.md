# EP00 STATUS

更新：2026-11-12

## 已完成
- 单集脚本 v1（SCRIPT.md）。用户已录制配音，视为文字确认。
- 配音处理：`audio/vo_raw.m4a` → `audio/vo_edit.wav`（去掉开头 3.5 秒杂音、高通、轻降噪、轻压缩、响度 -16 LUFS；
  在 8 个段落交界处插入停顿，共 +11.1 秒，给画面留呼吸）。剪辑参数见 `audio/edit.json`，时间映射见 `audio/timemap.json`。
- 字幕：按实际录音文字整理成 55 屏（`subtitles.txt`），自动对齐到剪辑后音频（`subtitles.json` / `.srt`），最快 6.2 字/秒。
- 音效底：`audio/sfx.wav` 由程序合成（自制，无版权问题），含临时氛围铺底（BGM 未定前的占位）。
- Remotion 工程：`studio/`，合成 `EP00`（178 秒）。已完成 0–31.5 秒开场：粒子手 → 星云(H) → 恒星(C O Ca Fe) → 超新星 → 138亿年 → 行星 → 手翻转 → 问题 → 标题。
- 开场样片已渲染并通过技术检查（1080p30，-16.5 LUFS，无黑帧）。

## 录音与原稿的差异（字幕已按录音）
- “我们会 / 我们原创” 读成 “我会 / 我原创”；“这一路上” 读成 “这一路”；“这些，都可以被测量” 读成 “这些可以被测量”。
- 标题行未朗读（画面显示，不需要读）。

## 未完成
- 用户审看开场样片（审美方向确认）
- BGM 选定（目前为合成占位氛围）
- 31.5 秒之后的镜头 5–10：细胞更替、神经网络与旋律、红光与“意识的难题”、五种回答光环、六层路径、收束
- 整片渲染与双层验收

## 已知问题 / 风险
- 正式配音由用户提供；如替换录音需重跑 `tools/edit_vo.py` 与 `tools/align_subs.py`。
- 热门 BGM 的平台版权风险需用户确认。

## 下一步唯一可执行任务
- 用户看开场样片并反馈；确认后制作镜头 5–10。

## 复现命令
```
python3 -I tools/edit_vo.py episodes/EP00_人类/audio
python3 -I tools/align_subs.py episodes/EP00_人类
python3 -I tools/synth_sfx.py episodes/EP00_人类
cd studio && npx remotion render src/index.ts EP00 out/EP00.mp4 --frames=0-944
```
