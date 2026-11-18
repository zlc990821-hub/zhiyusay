"""人声降噪（DeepFilterNet，开源，MIT/Apache）。在独立环境里运行：
    /root/dfenv/bin/python studio/tools/voice_denoise.py 输入.wav 输出.wav [最大降噪dB=12]
只压掉噪声和一部分房间回声，最大降噪量有上限，避免把人声「洗」得发干、变色。
环境：python3 -m venv /root/dfenv && /root/dfenv/bin/pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu && /root/dfenv/bin/pip install deepfilternet
（不要装进系统 Python：它会把 numpy 降到 1.x，弄坏 scipy。）
模型：GitHub 下载被拦，改从 Hugging Face 的 fal/DeepFilterNet3（Apache-2.0）取 config.ini 和 model.safetensors，
放到 /root/dfmodels/DeepFilterNet3/，再把 safetensors 存成 checkpoints/model_120.ckpt.best（见 setup.sh）。
"""
import sys, wave, warnings
import numpy as np
warnings.filterwarnings("ignore")
import torch
from df.enhance import init_df, enhance

src, dst = sys.argv[1], sys.argv[2]
lim = float(sys.argv[3]) if len(sys.argv) > 3 else 12.0
w = wave.open(src)
sr, ch = w.getframerate(), w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
if ch > 1:
    x = x.reshape(-1, ch).mean(1)
assert sr == 48000, "先转成 48kHz"
model, state, _ = init_df(model_base_dir="/root/dfmodels/DeepFilterNet3")
torch.set_num_threads(4)
out = []
blk = 48000 * 30  # 分段处理，段间重叠 1 秒做交叉淡化
ov = 48000
pos = 0
y = np.zeros_like(x)
while pos < len(x):
    a, b = max(0, pos - ov), min(len(x), pos + blk)
    e = enhance(model, state, torch.from_numpy(x[a:b]).unsqueeze(0), atten_lim_db=lim).squeeze(0).numpy()
    if a == 0:
        y[a:b] = e
    else:
        fade = np.linspace(0, 1, ov, dtype=np.float32)
        y[a:a + ov] = y[a:a + ov] * (1 - fade) + e[:ov] * fade
        y[a + ov:b] = e[ov:]
    pos = b
    print(f"{b / len(x):.0%}", flush=True)
with wave.open(dst, "wb") as o:
    o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr)
    o.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
