"""人声效果链（pedalboard，Spotify 开源）：更清楚，但保留原来的音色。
用法：python3 studio/tools/voice_chain.py 降噪后.wav 输出.wav
每一步的改动都很小（不超过 3 dB），目的是「擦干净玻璃」，不是换一个声音：
  1 低切 75Hz：去掉桌面震动、空调等低频隆隆声
  2 220Hz 减 2.5dB：减轻闷、厚的感觉（手机近讲时低频偏多）
  3 3.2kHz 加 3dB：咬字更清楚（辅音所在的频段）
  4 9kHz 以上加 1.5dB：一点空气感
  5 去齿音：只在「s、x、c」这类声音太尖时压 5–9kHz
  6 轻压缩 2.5:1：大小声更平均，手机外放也听得清
最后线性调到 -16 LUFS，限幅器把峰值压在 -1.5dB 以下。
"""
import sys, wave, subprocess, re
import numpy as np
from scipy import signal
from pedalboard import Pedalboard, HighpassFilter, PeakFilter, HighShelfFilter, Compressor, Gain

from scipy.ndimage import minimum_filter1d, uniform_filter1d


def peak_limit(x, sr, ceiling_db=-1.8, look_ms=2.0, release_ms=80.0):
    """前瞻式峰值限幅：只在超过上限的瞬间压低，不加任何补偿增益（pedalboard 的 Limiter 会自动补偿，不能用）"""
    c = 10 ** (ceiling_db / 20)
    g = np.minimum(1.0, c / (np.abs(x) + 1e-9))
    L = max(1, int(sr * look_ms / 1000))
    g = minimum_filter1d(g, size=2 * L + 1)
    g = uniform_filter1d(g, size=L)
    a = np.exp(-1.0 / (sr * release_ms / 1000))   # 释放：慢慢回到 1
    out = np.empty_like(g); prev = 1.0
    for i in range(0, len(g), 4096):              # 分块的一阶平滑，压低立即生效，恢复按 release
        blk = g[i:i + 4096]
        res = np.empty_like(blk)
        for j, v in enumerate(blk):
            prev = v if v < prev else a * prev + (1 - a) * v
            res[j] = prev
        out[i:i + 4096] = res
    return (x * out).astype(np.float32)


src, dst = sys.argv[1], sys.argv[2]
w = wave.open(src); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768

pre = Pedalboard([
    Gain(12.0),
    HighpassFilter(75),
    PeakFilter(220, -2.5, 0.9),
    PeakFilter(3200, 3.0, 0.8),
    HighShelfFilter(9000, 1.5, 0.7),
])
y = pre(x, sr)

# 去齿音：分出 5–9kHz，按它的包络超出门限的部分做增益衰减
sos = signal.butter(4, [5000, 9000], "band", fs=sr, output="sos")
hi = signal.sosfiltfilt(sos, y)
lp60 = signal.butter(2, 60, "low", fs=sr, output="sos")
env = np.sqrt(np.maximum(signal.sosfilt(lp60, hi ** 2), 0) + 1e-12)   # 滤波后可能略小于 0，先截到 0，否则开方得 NaN
full = np.sqrt(np.maximum(signal.sosfilt(lp60, y ** 2), 0) + 1e-12)
ratio_db = 20 * np.log10(env / full)           # 齿音能量占整体的比例
over = np.clip(ratio_db - (-9.0), 0, None)     # 超过 -9dB 才处理
gr = 10 ** (-np.minimum(over * 0.7, 8) / 20)   # 最多压 8dB
y = y - hi + hi * gr.astype(np.float32)

comp = Pedalboard([Compressor(threshold_db=-24, ratio=2.5, attack_ms=10, release_ms=160)])
y = comp(y.astype(np.float32), sr)
assert np.isfinite(y).all(), "效果链出现了 NaN"

# 响度：用 ffmpeg 的 EBU R128 测量（和平台一致），线性增益到 -16 LUFS，
# 再用限幅器把偶尔的峰值压到 -1.8dB 以下；测两轮，把限幅造成的偏差补回来
def write(path, arr):
    with wave.open(path, "wb") as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr)
        o.writeframes((np.clip(arr, -1, 1) * 32767).astype(np.int16).tobytes())


def lufs(arr):
    write(dst, arr)
    r = subprocess.run(["ffmpeg", "-nostats", "-i", dst, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])


L0 = lufs(y)
z = y
for _ in range(2):
    z = peak_limit(z * 10 ** ((-16.0 - lufs(z)) / 20), sr, ceiling_db=-2.8)
write(dst, z)
print(f"ok {dst}  处理前 {L0:.1f} → 处理后 {lufs(z):.1f} LUFS")
