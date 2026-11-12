"""Clean and re-time a voiceover according to an edit.json.

Usage: python3 -I tools/edit_vo.py <episode_audio_dir>
Reads  <dir>/edit.json and <dir>/<source>
Writes <dir>/vo_edit.wav (48k stereo, loudness-normalised) and <dir>/timemap.json

Optional "cuts" remove raw intervals (retakes / misreads). Gaps are inserted at the quietest 20 ms point within +-0.25 s of each "at" time,
so cuts always land in a pause. timemap.json maps raw-time -> edited-time.
"""
import json, subprocess, sys, os, wave
import numpy as np

d = sys.argv[1]
cfg = json.load(open(os.path.join(d, "edit.json")))
src = os.path.join(d, cfg["source"])
SR = 48000
tmp = os.path.join(d, "_clean.wav")

# 1) clean: high-pass, mild denoise, gentle compression (mono)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", str(SR),
                "-af", "highpass=f=70,afftdn=nf=-48:nr=10,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120:makeup=2",
                "-c:a", "pcm_f32le", tmp], check=True)
r = subprocess.run(["ffmpeg", "-v", "error", "-i", tmp, "-f", "f32le", "-"], capture_output=True, check=True)
a = np.frombuffer(r.stdout, np.float32).copy()

def quietest(t, win=0.25, hop=0.01, frame=0.02):
    best, bt = 1e9, t
    for c in np.arange(t - win, t + win, hop):
        s = a[int(c * SR): int((c + frame) * SR)]
        e = float((s ** 2).mean()) if len(s) else 1e9
        if e < best:
            best, bt = e, c + frame / 2
    return round(bt, 3)

# gap_frame: width of the quiet window the gap must sit in (0.12 s keeps gaps clear of word onsets; EP00 used 0.02)
GF = cfg.get("gap_frame", 0.02)
gaps = sorted([(quietest(g["at"] - GF / 2 + 0.01, frame=GF), g["add"]) for g in cfg["gaps"]])
# "cuts": raw intervals to remove (retakes, misreads, over-long pauses); boundaries are chosen by hand in silence
removed = sorted([(c["from"], c["to"]) for c in cfg.get("cuts", [])])
keep, cur = [], cfg["start"]
for c0, c1 in removed:
    if c0 > cur: keep.append([cur, c0])
    cur = max(cur, c1)
keep.append([cur, cfg["end"]])
for gt, _ in gaps:
    assert any(k0 < gt < k1 for k0, k1 in keep), f"gap at {gt} falls inside a cut"

fade = int(0.01 * SR)
def piece(t0, t1):
    s = a[int(t0 * SR): int(t1 * SR)].copy()
    ramp = np.linspace(0, 1, fade, dtype=np.float32)
    s[:fade] *= ramp; s[-fade:] *= ramp[::-1]
    return s

out = [np.zeros(int(cfg["lead"] * SR), np.float32)]
segments = []  # (raw_start, raw_end, edit_start)
t_edit = cfg["lead"]
gi = 0
for k0, k1 in keep:
    cur = k0
    points = [(gt, add) for gt, add in gaps if k0 < gt < k1]
    for at, add in points + [(k1, 0.0)]:
        out.append(piece(cur, at)); segments.append([cur, at, t_edit])
        t_edit += at - cur
        if add:
            out.append(np.zeros(int(add * SR), np.float32)); t_edit += add
        cur = at
out.append(np.zeros(int(cfg["tail"] * SR), np.float32)); t_edit += cfg["tail"]
cuts = gaps
y = np.concatenate(out)

raw = os.path.join(d, "_edit_raw.wav")
with wave.open(raw, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())

# 2) two-pass loudness normalisation -> stereo
L = cfg["loudness"]
ln = f"loudnorm=I={L['I']}:TP={L['TP']}:LRA={L['LRA']}"
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", ln + ":print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"): m.rindex("}") + 1])
ln2 = (ln + f":measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
       f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", ln2, "-ar", str(SR), "-ac", "2",
                os.path.join(d, "vo_edit.wav")], check=True)
os.remove(tmp); os.remove(raw)
json.dump({"duration": round(len(y) / SR, 3), "segments": segments}, open(os.path.join(d, "timemap.json"), "w"), indent=1)
print("duration", round(len(y) / SR, 2), "cuts", cuts)
