#!/bin/bash
# 重新生成 src/ep01/clipdur.ts（素材时长表，含 clips/blur/ 下预虚化的素材）
cd "$(dirname "$0")/.." && { echo '// 素材时长（秒），由 tools/gen_clipdur.sh 生成；Clip 用它自动放慢，Bed 用它判断有没有预虚化的素材'; echo 'export const CLIPDUR: Record<string, number> = {';
for f in public/ep01/clips/*.mp4 public/ep01/clips/blur/*.mp4 public/ep02/clips/*.mp4; do [ -f "$f" ] && printf '  "%s": %.2f,\n' "${f#public/}" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)"; done; echo '};'; } > src/ep01/clipdur.ts
