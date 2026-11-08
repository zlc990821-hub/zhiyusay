# BGM 库

## 加新歌

1. 把 mp3/wav/m4a 放进 `bgm/inbox/`，或者在对话里直接上传给 Claude
2. 运行 `python3 engine/bgm.py ingest`：复制到 `bgm/tracks/`，自动分析 BPM、拍点、小节头、段落、drop、调式，写入 `library.json`
3. （推荐）打开 `library.json`，给这首歌补充手工字段：
   - `tags`：情绪/风格，如 `["calm", "tech", "piano"]`、`["phonk", "dark", "hype"]`、`["epic", "history"]`
   - `notes`：一句话描述，比如"前 16 秒钢琴铺垫，drop 后鼓很重，适合反转"
   - `vocals`：`true` / `false`（有人声的歌在挑选时会被降权）
   - `bpm_hint`：自动测速是半速或倍速时填正确的 BPM，再 `python3 engine/bgm.py reanalyze <id>`
   - `favorite_start`：最喜欢从第几秒开始用

## 常用命令

```bash
python3 engine/bgm.py list                       # 全部曲目
python3 engine/bgm.py show <id>                  # 段落 / 能量 / drop
python3 engine/bgm.py click <id> --offset 10     # 叠加节拍器试听，核对拍点（输出 bgm/click_<id>.mp3）
python3 engine/bgm.py pick --duration 130 --hit 12.4 --mood calm,tech
python3 engine/bgm.py use <id> --project projects/<slug> --duration 130 --hit 12.4
```

## 版权说明

本仓库是**公开**的，所以音频文件本身（`bgm/tracks/`、`bgm/inbox/`）在 `.gitignore` 里，不会被提交；只提交分析结果 `library.json`。
新开的会话里需要重新上传音频（文件名/标题一致即可，`ingest` 会按标题对上已有条目并保留手工字段）。
如果把仓库改成私有，可以去掉 `.gitignore` 里的 `bgm/tracks/` 一行，让音频随仓库保存。

发布到抖音时，请使用抖音曲库中有授权的版本或确认你有使用权。
