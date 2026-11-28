#!/usr/bin/env bash
# 新会话恢复制作环境：Remotion 依赖 + 语音识别
set -e
cd "$(dirname "$0")"
npm install --no-audit --no-fund
pip install -q faster-whisper scipy opencc-python-reimplemented yt-dlp internetarchive you-get gallery-dl "scenedetect[opencv-headless]" ffmpeg-normalize auto-editor opentimelineio pyJianYingDraft
pip install -q pedalboard pypinyin
# 人声降噪 DeepFilterNet：放在独立环境里（它会把 numpy 降到 1.x，装进系统 Python 会弄坏 scipy）
if [ ! -x /root/dfenv/bin/python ]; then
  python3 -m venv /root/dfenv
  /root/dfenv/bin/pip install -q torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
  /root/dfenv/bin/pip install -q deepfilternet safetensors
fi
# 模型：GitHub 下载被拦，从 Hugging Face 的 fal/DeepFilterNet3（Apache-2.0）取权重
M=/root/dfmodels/DeepFilterNet3
if [ ! -f $M/checkpoints/model_120.ckpt.best ]; then
  mkdir -p $M/checkpoints
  curl -sSL -o $M/config.ini https://huggingface.co/fal/DeepFilterNet3/resolve/main/config.ini
  curl -sSL -o $M/model.safetensors https://huggingface.co/fal/DeepFilterNet3/resolve/main/model.safetensors
  /root/dfenv/bin/python -c "import torch; from safetensors.torch import load_file; torch.save(load_file('$M/model.safetensors'), '$M/checkpoints/model_120.ckpt.best')"
fi
# 音效库：Mixkit 免费可商用音效（授权不允许单独分发音效文件，所以不入库，按清单下载并去掉首尾静音）
if [ ! -d sfx/lib ]; then
  grep -v '^#' sound/mixkit_manifest.txt | cut -d' ' -f1 | xargs python3 tools/mixkit_sfx.py get sfx/raw/
  mkdir -p sfx/lib
  for f in sfx/raw/*.wav; do
    ffmpeg -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse" -ar 48000 -ac 2 -c:a pcm_s16le "sfx/lib/$(basename "$f")"
  done
fi
echo "完成。测试渲染：npx remotion render src/index.ts Test out/test.mp4"
