#!/usr/bin/env node
/**
 * 逐帧渲染：本地静态服务器 + N 个无头 Chromium 并行，每个 worker 把 JPEG 帧
 * 直接管道给 ffmpeg 编成分段，最后无损拼接。也可只截几张静帧做检查。
 *
 *   node engine/render.mjs projects/benford                 # 全片 → projects/benford/out/video.mp4
 *   node engine/render.mjs projects/benford --from 0 --to 30 # 只渲前 30 秒（样片）
 *   node engine/render.mjs projects/benford --stills 3,12,40 # 静帧 → out/stills/ + contact.jpg
 *   options: --workers 4 --fps 30 --quality 0.93
 */
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const proj = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const OUT = path.join(proj, 'out');
const workers = +opt('workers', Math.max(1, Math.min(6, os.cpus().length)));
const quality = +opt('quality', 0.93);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) throw 0;
    const buf = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${path.relative(ROOT, proj).split(path.sep).join('/')}/index.html`;

const run = (cmd, a, stdin) => new Promise((res, rej) => {
  const p = spawn(cmd, a, { stdio: [stdin ? 'pipe' : 'ignore', 'ignore', 'inherit'] });
  p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${cmd} exit ${c}`))));
  if (stdin) stdin(p);
});

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  if (errs.length) console.warn('⚠ page errors:\n  ' + errs.join('\n  '));
  return page;
}
const grab = (page, t, type = 'jpeg') => page.evaluate(([t, type, q]) => {
  window.__render(t);
  return window.__canvas.toDataURL('image/' + type, q).split(',')[1];
}, [t, type, quality]);

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
try {
  await mkdir(OUT, { recursive: true });
  const meta0 = await (async () => { const p = await openPage(browser); const m = await p.evaluate(() => ({ ...window.__meta, cues: window.__cues(), music: window.__music(), subs: window.__subs() })); await p.close(); return m; })();
  await writeFile(path.join(OUT, 'cues.json'), JSON.stringify({ duration: meta0.duration, bpm: meta0.bpm, music: meta0.music, cues: meta0.cues }, null, 1));
  await writeFile(path.join(OUT, 'subs.json'), JSON.stringify(meta0.subs, null, 1));
  const fps = +opt('fps', meta0.fps);

  const stills = opt('stills', null);
  if (stills) {
    const dir = path.join(OUT, 'stills'); await mkdir(dir, { recursive: true });
    const page = await openPage(browser);
    const ts = stills.split(',').map(Number);
    for (const t of ts) await writeFile(path.join(dir, `t${t.toFixed(1).padStart(6, '0')}.png`), Buffer.from(await grab(page, t, 'png'), 'base64'));
    const cols = Math.min(4, ts.length), rows = Math.ceil(ts.length / cols);
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(dir, 't*.png'), '-vf', `scale=480:-1,tile=${cols}x${rows}:padding=4`, '-frames:v', '1', path.join(OUT, 'contact.jpg')]);
    console.log(`✓ ${ts.length} stills → ${dir}  contact → ${path.join(OUT, 'contact.jpg')}`);
  } else {
    const from = +opt('from', 0), to = Math.min(+opt('to', meta0.duration), meta0.duration);
    const f0 = Math.round(from * fps), f1 = Math.round(to * fps), N = f1 - f0;
    const per = Math.ceil(N / workers);
    const segDir = path.join(OUT, 'seg'); await rm(segDir, { recursive: true, force: true }); await mkdir(segDir, { recursive: true });
    let done = 0; const t0 = Date.now();
    const tick = setInterval(() => { const el = (Date.now() - t0) / 1000; process.stdout.write(`\r  frames ${done}/${N}  ${(done / el).toFixed(1)} fps  `); }, 1000);
    await Promise.all([...Array(workers)].map(async (_, w) => {
      const a = f0 + w * per, b = Math.min(f1, a + per); if (a >= b) return;
      const page = await openPage(browser);
      const seg = path.join(segDir, `s${String(w).padStart(2, '0')}.mp4`);
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-vf', 'scale=in_range=full:out_range=tv', '-color_range', 'tv', '-r', String(fps), seg], async (p) => {
        for (let f = a; f < b; f++) {
          const buf = Buffer.from(await grab(page, f / fps), 'base64');
          if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
          done++;
        }
        p.stdin.end();
      });
      await page.close();
    }));
    clearInterval(tick);
    const list = path.join(segDir, 'list.txt');
    const segs = [...Array(workers)].map((_, w) => `file 's${String(w).padStart(2, '0')}.mp4'`).filter((_, w) => f0 + w * per < f1);
    await writeFile(list, segs.join('\n'));
    const name = opt('out', from === 0 && to === meta0.duration ? 'video.mp4' : `video_${from}-${to}.mp4`);
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, name)]);
    await rm(segDir, { recursive: true, force: true });
    console.log(`\n✓ ${N} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${path.join(OUT, name)}`);
  }
} finally {
  await browser.close();
  server.close();
}
