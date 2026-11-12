"""Cut the BGM to the episode timeline and duck it under the voiceover.

Usage: python3 -I tools/mix_bgm.py <episode_dir>   -> <episode_dir>/audio/bgm.wav (48k stereo)
timeline.json "bgm":
  segments  [[video_start, music_start, music_end], ...]  pieces of the track placed on the video timeline
  xfade     equal-power crossfade (s) at each splice (splices should sit on bar lines)
  base_db   music gain when nobody speaks; duck_db extra attenuation while the voice is active
"""
import json, os, subprocess, sys, wave
import numpy as np

d = sys.argv[1]
tl = json.load(open(os.path.join(d, "timeline.json")))
B = tl["bgm"]
SR = 48000
N = int(tl["duration"] * SR)

def load(path, ch):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).reshape(-1, ch)

music = load(os.path.join(d, B["file"]), 2)
out = np.zeros((N, 2), np.float32)
xf = int(B["xfade"] * SR)
for k, (v0, m0, m1) in enumerate(B["segments"]):
    pre = xf if k > 0 else 0                       # start early so the splice overlaps
    i0 = int(v0 * SR) - pre
    src = music[int(m0 * SR) - pre: int(m1 * SR)].copy()
    n = min(len(src), N - i0)
    src = src[:n]
    if k > 0:
        src[:xf] *= np.sin(np.linspace(0, np.pi / 2, xf))[:, None]
    if k + 1 < len(B["segments"]):                  # fade-out tail overlapping next piece
        nxt = int(B["segments"][k + 1][0] * SR) - i0
        tail = np.cos(np.linspace(0, np.pi / 2, xf))[:, None]
        src[nxt - xf: nxt] *= tail
        src[nxt:] = 0
    out[i0: i0 + n] += src

fi = int(B.get("fade_in", 0) * SR)
if fi: out[:fi] *= np.linspace(0, 1, fi)[:, None]

# voice activity envelope -> ducking gain
vo = load(os.path.join(d, "audio", "vo_edit.wav"), 1)[:, 0]
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
hop = 480  # 10 ms
lvl = 20 * np.log10(np.sqrt((vo[: N // hop * hop].reshape(-1, hop) ** 2).mean(1)) + 1e-9)
act = (lvl > -38).astype(float)
env = np.zeros_like(act); a_up, a_dn = 1 - np.exp(-1 / 8), 1 - np.exp(-1 / 45)  # ~80 ms attack, ~450 ms release
for i in range(len(act)):
    prev = env[i - 1] if i else 0
    env[i] = prev + (a_up if act[i] > prev else a_dn) * (act[i] - prev)
gain_db = B["base_db"] - B["duck_db"] * env
g = np.repeat(10 ** (gain_db / 20), hop)
g = np.pad(g, (0, N - len(g)), mode="edge")
out *= g[:, None].astype(np.float32)

with wave.open(os.path.join(d, "audio", "bgm.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
print("bgm.wav written, peak", round(float(np.abs(out).max()), 3))
