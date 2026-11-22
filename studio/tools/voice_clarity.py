"""人声咬字清晰度：在已经处理过的人声上再「擦亮」辅音，不改音色。
用法（在 studio/ 下）：python3 tools/voice_clarity.py 输入.wav 输出.wav
  1 300Hz 减 2dB：减轻闷、糊
  2 2.2kHz 加 2dB、4.5kHz 加 1.5dB：辅音所在的频段
  3 辅音起音加强：只在 2–8kHz 突然变响的一瞬间（字头）加强，最多约 +3.5dB，
    元音和持续的声音不变——加速播放时字更短，字头清楚最要紧
  4 去齿音（5–9kHz 超过门限才压），最后线性调到 -16 LUFS，峰值限在 -2.8dB
之后再跑 tools/de_breath.py 去换气（先提清晰度、再去换气，换气声不会被一起抬亮）。
"""
import sys, wave, subprocess, re
import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from pedalboard import Pedalboard, PeakFilter

src, dst = sys.argv[1], sys.argv[2]
w = wave.open(src); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
w.close()

y = Pedalboard([PeakFilter(320, -2.0, 1.0), PeakFilter(2200, 2.0, 1.0), PeakFilter(4500, 1.5, 1.2)])(x, sr)

# 辅音起音加强
band = signal.sosfiltfilt(signal.butter(4, [2000, 8000], "band", fs=sr, output="sos"), y)
p = band.astype(np.float64) ** 2
fast = np.sqrt(np.maximum(signal.sosfilt(signal.butter(2, 200, "low", fs=sr, output="sos"), p), 0) + 1e-12)
slow = np.sqrt(np.maximum(signal.sosfilt(signal.butter(2, 15, "low", fs=sr, output="sos"), p), 0) + 1e-12)
extra = np.clip(fast / slow - 1.2, 0, 1) * 0.5
extra = signal.sosfiltfilt(signal.butter(2, 60, "low", fs=sr, output="sos"), extra)   # 平滑，避免颗粒感
y = y + (extra * band).astype(np.float32)

# 去齿音
hi = signal.sosfiltfilt(signal.butter(4, [5000, 9000], "band", fs=sr, output="sos"), y)
lp60 = signal.butter(2, 60, "low", fs=sr, output="sos")
env = np.sqrt(np.maximum(signal.sosfilt(lp60, hi.astype(np.float64) ** 2), 0) + 1e-12)
full = np.sqrt(np.maximum(signal.sosfilt(lp60, y.astype(np.float64) ** 2), 0) + 1e-12)
over = np.clip(20 * np.log10(env / full) + 9.0, 0, None)
gr = 10 ** (-np.minimum(over * 0.7, 8) / 20)
y = (y - hi + hi * gr).astype(np.float32)
assert np.isfinite(y).all()


def peak_limit(x, ceiling_db=-2.8, look_ms=2.0, release_ms=80.0):
    c = 10 ** (ceiling_db / 20)
    g = np.minimum(1.0, c / (np.abs(x) + 1e-9))
    L = max(1, int(sr * look_ms / 1000))
    g = uniform_filter1d(minimum_filter1d(g, size=2 * L + 1), size=L)
    a = np.exp(-1.0 / (sr * release_ms / 1000)); out = np.empty_like(g); prev = 1.0
    for i in range(len(g)):
        v = g[i]; prev = v if v < prev else a * prev + (1 - a) * v; out[i] = prev
    return (x * out).astype(np.float32)


def write(path, arr):
    with wave.open(path, "wb") as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr)
        o.writeframes((np.clip(arr, -1, 1) * 32767).astype(np.int16).tobytes())


def lufs(arr):
    write(dst, arr)
    r = subprocess.run(["ffmpeg", "-nostats", "-i", dst, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])


z = y
for _ in range(2):
    z = peak_limit(z * 10 ** ((-16.0 - lufs(z)) / 20))
write(dst, z)
print(f"ok {dst}  {lufs(z):.1f} LUFS")
