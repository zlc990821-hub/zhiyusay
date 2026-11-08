# zhiyusay · Vibe知识大赏 视频工坊

给一个知识主题，用代码做出抖音「Vibe知识大赏」风格的无旁白知识短片（1920×1080 · 双语字幕 · 合成配乐 · 一键出 MP4）。

- **样片**：`projects/benford/` — 《第一位数字》本福特定律，130s（`bash engine/build.sh projects/benford` 生成成片；含版权 BGM 的成片不入公开仓库）
- **Skill**：`.claude/skills/vibe-knowledge-video/` — 在 Claude Code 里说"做一条知识大赏视频：<主题>"即可触发
- **BGM 库**：`bgm/` — 上传/放入 `bgm/inbox/` → `python3 engine/bgm.py ingest` 自动分析拍点、段落、高潮；做片时先选歌再卡点（见 `bgm/README.md`）
- **调研**：`docs/research.md`

## 快速开始

```bash
bash scripts/setup_fonts.sh                      # 一次性：下载开源字体
bash engine/build.sh projects/benford            # 渲染样片 → projects/benford/out/final.mp4
bash scripts/new_film.sh entropy "《熵》"         # 新建一个片子
node engine/render.mjs projects/entropy --stills 3,15,40   # 截静帧检查
bash engine/build.sh projects/entropy            # 出片 + 自检
```

依赖：Node 18+、Playwright（Chromium）、Python 3 + numpy、ffmpeg（libx264）。

## 结构

```
engine/        bgm.py BGM库与节拍分析 · vibe.js 渲染引擎 · render.mjs 并行逐帧渲染 · audio.py 配乐与音效合成 · build.sh 一键出片 · qa.py 自检
scripts/       setup_fonts.sh · new_film.sh
projects/      每个片子一个目录：script.md（文案+分镜）· film.js（动画）· index.html
.claude/skills/vibe-knowledge-video/   SKILL.md + 风格/叙事/API/发布 参考 + 模板
```
