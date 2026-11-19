#!/usr/bin/env bash
# 逐个渲染分段合成（无声），输出到 out/seg/<合成ID>.mp4
# 先渲染到临时文件，成功才替换旧文件；失败自动重试一次（并发降到 2，省内存），仍失败就报 FAIL。
cd "$(dirname "$0")/.."
clean() { rm -rf /tmp/remotion-webpack-bundle-* /tmp/remotion-v4.*-assets* 2>/dev/null; }
fail=0
for c in "$@"; do
  ok=0
  for conc in 4 2; do
    rm -f "out/seg/$c.new.mp4"
    if npx remotion render src/index.ts "$c" "out/seg/$c.new.mp4" --concurrency=$conc --crf=18 --muted --log=error > "out/seg/$c.log" 2>&1 \
       && [ -s "out/seg/$c.new.mp4" ]; then
      mv -f "out/seg/$c.new.mp4" "out/seg/$c.mp4"; ok=1
    fi
    # Remotion 每次渲染都在 /tmp 留一份 public 的拷贝（几百 MB），渲完就删，否则磁盘会满
    clean
    [ $ok = 1 ] && break
    echo "retry $c (concurrency 2)"; tail -3 "out/seg/$c.log"
  done
  if [ $ok = 1 ]; then echo "done $c $(date +%H:%M)"; else echo "FAIL $c $(date +%H:%M)"; fail=1; fi
done
exit $fail
