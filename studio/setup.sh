#!/usr/bin/env bash
# 新会话恢复制作环境：Remotion 依赖 + 语音识别
set -e
cd "$(dirname "$0")"
npm install --no-audit --no-fund
pip install -q faster-whisper scipy
echo "完成。测试渲染：npx remotion render src/index.ts Test out/test.mp4"
