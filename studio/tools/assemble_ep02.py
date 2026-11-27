"""第 02 期合成：画面（out/seg/Ep02.mp4，无声）＋人声＋音效原声轨 → 响度规整 → 成片。
用法（在 studio/ 下）：python3 tools/assemble_ep02.py 输出.mp4 [人声.wav] [音效增益dB=-1.5]
人声默认 public/ep02/voice_tts.wav（AI 配音）；用户自己录音后换成录音文件，并按录音重新生成时间轴、重渲画面。
人声先线性调到 -16 LUFS；混音后两遍 loudnorm 到 -14 LUFS、真峰值 -1 dBTP。
"""
import re, subprocess, sys, tempfile

OUT = sys.argv[1]
VOICE = sys.argv[2] if len(sys.argv) > 2 else "public/ep02/voice_tts.wav"
SFX_DB = float(sys.argv[3]) if len(sys.argv) > 3 else -1.5
VIDEO = "out/seg/Ep02.mp4"
tmp = tempfile.mkdtemp()


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-2000:]); raise SystemExit(1)
    return r.stderr


def lufs(path):
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"]))[-1])


vg = -16.0 - lufs(VOICE)
mix = f"{tmp}/mix.wav"
run(["ffmpeg", "-v", "error", "-y", "-i", VOICE, "-i", "public/ep02/sfx.wav", "-filter_complex",
     f"[0]volume={vg:.2f}dB,aresample=48000,pan=stereo|c0=c0|c1=c0[v];[1]volume={SFX_DB}dB[s];[v][s]amix=inputs=2:normalize=0:duration=longest[m]",
     "-map", "[m]", "-ar", "48000", mix])
st = run(["ffmpeg", "-hide_banner", "-i", mix, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"])
js = dict(re.findall(r'"(input_i|input_tp|input_lra|input_thresh|target_offset)"\s*:\s*"([-\d.]+)"', st))
master = f"{tmp}/master.wav"
run(["ffmpeg", "-v", "error", "-y", "-i", mix, "-af",
     f"loudnorm=I=-14:TP=-1.0:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
     f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,"
     "aresample=192000,alimiter=limit=0.87:attack=2:release=80:level=disabled:asc=1,aresample=48000", "-ar", "48000", master])   # 4 倍过采样限幅，真峰值压到 -1dB 以内
run(["ffmpeg", "-v", "error", "-y", "-i", VIDEO, "-i", master, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
     "-shortest", "-movflags", "+faststart", OUT])
print("ok", OUT, f"人声 {vg:+.1f}dB，音效 {SFX_DB:+.1f}dB")
