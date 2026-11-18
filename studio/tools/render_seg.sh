#!/usr/bin/env bash
# 逐个渲染分段合成（无声），输出到 out/seg/<合成ID>.mp4
cd "$(dirname "$0")/.."
for c in "$@"; do
  npx remotion render src/index.ts "$c" "out/seg/$c.mp4" --concurrency=4 --crf=18 --muted --log=error 2>&1 | tail -2
  echo "done $c $(date +%H:%M)"
  # Remotion 每次渲染都在 /tmp 留一份 public 的拷贝（几百 MB），渲完就删，否则磁盘会满
  rm -rf /tmp/remotion-webpack-bundle-* /tmp/remotion-v4.*-assets* 2>/dev/null
done
