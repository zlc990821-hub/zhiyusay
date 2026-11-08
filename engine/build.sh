#!/usr/bin/env bash
# 一键出片：渲染画面 → 合成音频 → 响度归一并封装 → 自检
#   bash engine/build.sh projects/benford            # 全片
#   bash engine/build.sh projects/benford 0 30       # 30 秒样片
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
P="$(cd "$1" && pwd)"; FROM="${2:-}"; TO="${3:-}"
OUT="$P/out"; mkdir -p "$OUT"
[ -d "$ROOT/engine/fonts/noto-sans-sc" ] || bash "$ROOT/scripts/setup_fonts.sh"

if [ -n "$FROM" ]; then
  node "$ROOT/engine/render.mjs" "$P" --from "$FROM" --to "$TO" --out video_part.mp4
  VID="$OUT/video_part.mp4"; FINAL="$OUT/sample_${FROM}-${TO}.mp4"; SS=(-ss "$FROM" -t "$(python3 -c "print($TO-$FROM)")")
else
  node "$ROOT/engine/render.mjs" "$P"
  VID="$OUT/video.mp4"; FINAL="$OUT/final.mp4"; SS=()
fi
python3 "$ROOT/engine/audio.py" "$OUT/cues.json" "$OUT/audio.wav"
# 测响度 → 线性增益到 -14 LUFS → 限幅（audio.py 已做主限幅，这里只是微调与保险）
I=$(ffmpeg -hide_banner -nostats -i "$OUT/audio.wav" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14 - ($I), 2))")
ffmpeg -y -loglevel error -i "$VID" "${SS[@]}" -i "$OUT/audio.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 44100 \
  -af "volume=${G}dB,alimiter=limit=0.79:attack=1:release=60:level=false" -shortest -movflags +faststart "$FINAL"
echo "✓ $FINAL"
python3 "$ROOT/engine/qa.py" "$FINAL" || true
