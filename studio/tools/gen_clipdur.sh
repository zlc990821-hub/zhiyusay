#!/bin/bash
# 重新生成 src/ep01/clipdur.ts（素材时长表）
cd "$(dirname "$0")/.." && { echo '// 素材时长（秒），由 tools/gen_clipdur.sh 生成；Bed 用它自动放慢，避免素材播完定格'; echo 'export const CLIPDUR: Record<string, number> = {';
for f in public/ep01/clips/*.mp4; do printf '  "ep01/clips/%s": %.2f,\n' "$(basename $f)" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)"; done; echo '};'; } > src/ep01/clipdur.ts
