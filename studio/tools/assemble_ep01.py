"""第 01 期成片合成：拼接各段画面 + 人声（片头处空出 8 秒）+ 全片音效 + 片头片尾音效 → 响度规整 → 成片。
用法（在 studio/ 下）：python3 tools/assemble_ep01.py 输出.mp4
需要：out/ep01_Ep01Opening.mp4、out/seg/*.mp4（见 SEGS）、public/ep01/voice.wav、public/ep01/sfx_full.wav、public/brand/intro.wav、outro.wav
"""
import os, re, subprocess, sys, tempfile

OUT = sys.argv[1]
FPS = 30
# （文件, 取多少帧）——按成片顺序；帧数 = 各段时长 × 30，合计 26748 帧 = 891.6 秒
SEGS = [
    ("out/ep01_Ep01Opening.mp4", 2442),   # 开场 0–73.4 + 主题片头 8 秒
    ("out/seg/Ep01Seg01.mp4", 1935),
    ("out/seg/Ep01Seg02a.mp4", 1743),
    ("out/seg/Ep01Glass.mp4", 1245),      # 196.0–237.5
    ("out/seg/Ep01Seg02c.mp4", 1002),
    ("out/seg/Ep01Seg03.mp4", 3798),
    ("out/seg/Ep01Seg04.mp4", 2970),
    ("out/seg/Ep01Seg05.mp4", 2379),
    ("out/seg/Ep01Seg06.mp4", 3816),
    ("out/seg/Ep01Seg07.mp4", 1698),
    ("out/seg/Ep01Souls.mp4", 1791),      # 759.6–819.3
    ("out/seg/Ep01Seg09.mp4", 1689),
    ("out/seg/Ep01Outro.mp4", 240),
]
TOTAL = sum(n for _, n in SEGS)
FILM = TOTAL / FPS
TITLE_AT, TITLE_LEN = 73.4, 8.0
OUTRO_AT = FILM - 8.0
tmp = tempfile.mkdtemp()


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-3000:]); raise SystemExit(1)
    return r.stderr


for f, n in SEGS:
    assert os.path.exists(f), f"缺少 {f}"

# 1 声音：人声在片头处空出 8 秒，与音效、片头片尾音效混在一起
voice = f"{tmp}/voice_film.wav"
run(["ffmpeg", "-v", "error", "-y", "-i", "public/ep01/voice.wav", "-filter_complex",
     f"[0]atrim=0:{TITLE_AT},asetpts=PTS-STARTPTS[a];[0]atrim={TITLE_AT},asetpts=PTS-STARTPTS[b];"
     f"aevalsrc=0:d={TITLE_LEN}:s=48000[s];[a][s][b]concat=n=3:v=0:a=1,apad,atrim=0:{FILM}[o]",
     "-map", "[o]", "-ac", "2", "-ar", "48000", voice])
mix = f"{tmp}/mix.wav"
run(["ffmpeg", "-v", "error", "-y", "-i", voice, "-i", "public/ep01/sfx_full.wav", "-i", "public/brand/intro.wav", "-i", "public/brand/outro.wav",
     "-filter_complex",
     f"[1]volume=1.26[s];[2]adelay={int(TITLE_AT*1000)}|{int(TITLE_AT*1000)}[i];[3]adelay={int(OUTRO_AT*1000)}|{int(OUTRO_AT*1000)}[o];"
     f"[0][s][i][o]amix=inputs=4:normalize=0:duration=first,atrim=0:{FILM}[m]",
     "-map", "[m]", "-ar", "48000", mix])
# 响度：两遍 loudnorm，线性调到 -14 LUFS，真峰值 -1 dBTP
st = run(["ffmpeg", "-hide_banner", "-i", mix, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"])
js = dict(re.findall(r'"(input_i|input_tp|input_lra|input_thresh|target_offset)"\s*:\s*"([-\d.]+)"', st))
master = f"{tmp}/master.wav"
run(["ffmpeg", "-v", "error", "-y", "-i", mix, "-af",
     f"loudnorm=I=-14:TP=-1.0:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true",
     "-ar", "48000", master])

# 2 画面：按帧截取后拼接
inputs, parts = [], []
for i, (f, n) in enumerate(SEGS):
    inputs += ["-i", f]
    parts.append(f"[{i}:v]trim=end_frame={n},setpts=PTS-STARTPTS,fps={FPS},format=yuv420p[v{i}]")
fc = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(len(SEGS))) + f"concat=n={len(SEGS)}:v=1:a=0[v]"
run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", master, "-filter_complex", fc,
     "-map", "[v]", "-map", f"{len(SEGS)}:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", OUT])
print("ok", OUT, f"{FILM:.1f} 秒")
