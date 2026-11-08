#!/usr/bin/env python3
"""asr.py — 配音转写（faster-whisper，逐词时间戳），给 align.py 用

  python3 engine/asr.py <音频/视频> <out.json> [--model medium]

依赖：pip install faster-whisper；模型首次运行自动从 HuggingFace 下载（Systran/faster-whisper-*）。
"""
import argparse, json, subprocess, time
import numpy as np

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--model', default='medium')
    ap.add_argument('--prompt', default='以下是普通话的句子。'); a = ap.parse_args()
    from faster_whisper import WhisperModel
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    audio = np.frombuffer(raw, np.float32)
    t0 = time.time()
    m = WhisperModel(a.model, device='cpu', compute_type='int8', cpu_threads=4)
    segs, _ = m.transcribe(audio, language='zh', word_timestamps=True, vad_filter=False, initial_prompt=a.prompt)
    out = [{'start': s.start, 'end': s.end, 'text': s.text, 'words': [{'s': w.start, 'e': w.end, 'w': w.word} for w in s.words]} for s in segs]
    json.dump(out, open(a.out, 'w'), ensure_ascii=False, indent=0)
    print(f'✓ {len(out)} 段，{time.time() - t0:.0f}s → {a.out}')

if __name__ == '__main__':
    main()
