#!/usr/bin/env bash
# 新建一个片子工程：bash scripts/new_film.sh <slug> "<片名>"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="$1"; TITLE="${2:-$1}"; P="$ROOT/projects/$SLUG"
[ -e "$P" ] && { echo "已存在: $P"; exit 1; }
mkdir -p "$P"
sed "s#<title>Vibe Film</title>#<title>$TITLE</title>#" "$ROOT/engine/template.html" > "$P/index.html"
sed "s#{{TITLE}}#$TITLE#g" "$ROOT/.claude/skills/vibe-knowledge-video/assets/film.template.js" > "$P/film.js"
cp "$ROOT/.claude/skills/vibe-knowledge-video/assets/script.template.md" "$P/script.md"
echo "window.BGM = null; /* 运行 python3 engine/bgm.py use <id> --project projects/$SLUG ... 后会被覆盖 */" > "$P/bgm.js"
echo "✓ $P"
echo "  下一步：python3 engine/bgm.py pick --duration 130 --hit 12.4  →  python3 engine/bgm.py use <id> --project projects/$SLUG --duration 130 --hit 12.4"
echo "  预览：node engine/render.mjs projects/$SLUG --stills 1,5,10"
