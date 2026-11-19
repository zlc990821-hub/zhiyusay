// 第 01 期 · 00 开场（录音 0–73.4 秒）+ 本期主题片头（不放账号名，IP 只在片尾）
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { useCallback } from "react";
import { Intro } from "../brand/Intro";
import { PARTICLES, orbitPos, CX, CY } from "../brand/centrifuge";
import { Canvas, Clip, Film, KeyText, Label, Subtitles, glow, rand, sec, smooth, clamp, useFonts, useT, HAND, DISPLAY, SANS, SERIF } from "./common";

export const OPEN_END = 73.4;
export const OPENING_FRAMES = sec(OPEN_END) + 240;

// ---------------- 日记页（S2–S4） ----------------
export const FS = 56, LH = 84, TOP = -700, X0 = -450;
export const lineY = (i: number) => TOP + i * LH;
export const S1 = "我现在，才真正醒过来。";
export const S2 = "我现在，彻彻底底地醒了。";
export type Entry = { line: number; text: string; a: number; b: number; strike: number };
const PRE = ["7:09", "7:22", "7:46", "8:02", "8:10", "8:17"];
const ENTRIES: Entry[] = [
  ...PRE.map((tm, k) => ({ line: 2 + k, text: `${tm} ${k % 3 === 2 ? S2 : S1}`, a: -10, b: -9, strike: -8 })),
  { line: 8, text: `8:31 ${S1}`, a: 15.94, b: 20.2, strike: 22.82 },
  { line: 9, text: `9:06 ${S2}`, a: 25.24, b: 28.9, strike: 30.3 },
  // 拉远时，这一页的其余几行飞快地写满、划掉
  ...["9:34", "9:51", "10:08", "10:20", "10:37", "10:59", "11:12", "11:30", "11:46", "12:01"].map((tm, k) => ({
    line: 10 + k, text: `${tm} ${k % 2 ? S2 : S1}`, a: 30.4 + k * 0.27, b: 30.6 + k * 0.27, strike: 30.66 + k * 0.27,
  })),
];
const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n);

const strikePath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, p: number, seed: number) => {
  ctx.beginPath();
  const n = 24;
  for (let k = 0; k <= n * p; k++) {
    const u = k / n;
    const yy = y + Math.sin(u * 9 + seed) * 3 + (rand(seed * 31 + k, 2) - 0.5) * 2.5 - u * 6;
    k === 0 ? ctx.moveTo(x + u * w, yy) : ctx.lineTo(x + u * w, yy);
  }
  ctx.stroke();
};

export const drawLine = (ctx: CanvasRenderingContext2D, e: Entry, t: number, alpha = 1) => {
  if (t < e.a) return;
  const y = lineY(e.line);
  ctx.font = `${FS}px ${HAND}`;
  const w = ctx.measureText(e.text).width;
  const p = clamp((t - e.a) / (e.b - e.a));
  ctx.save();
  ctx.beginPath(); ctx.rect(X0 - 10, y - FS * 1.2, w * p + 12, FS * 1.6); ctx.clip();
  ctx.fillStyle = `rgba(28,34,48,${0.9 * alpha})`;
  ctx.fillText(e.text, X0, y);
  ctx.restore();
  if (t >= e.strike) {
    ctx.strokeStyle = `rgba(28,34,48,${0.85 * alpha})`;
    ctx.lineWidth = 4; ctx.lineCap = "round";
    strikePath(ctx, X0 - 8, y - FS * 0.32, w + 16, clamp((t - e.strike) / 0.4), e.line);
  }
};

export const drawPaper = (ctx: CanvasRenderingContext2D, seed: number, alpha: number) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 60;
  const g = ctx.createLinearGradient(-550, -950, 550, 950);
  g.addColorStop(0, "#e9dcc2"); g.addColorStop(1, "#d6c3a0");
  ctx.fillStyle = g; ctx.fillRect(-550, -950, 1100, 1900);
  ctx.shadowBlur = 0;
  for (let k = 0; k < 4; k++) { // 纸上的旧渍
    const x = (rand(seed * 7 + k, 3) - 0.5) * 900, y = (rand(seed * 11 + k, 5) - 0.5) * 1700, r = 120 + rand(seed + k, 9) * 260;
    const s = ctx.createRadialGradient(x, y, 0, x, y, r);
    s.addColorStop(0, "rgba(150,110,60,0.10)"); s.addColorStop(1, "rgba(150,110,60,0)");
    ctx.fillStyle = s; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.strokeStyle = "rgba(90,110,140,0.22)"; ctx.lineWidth = 2;
  for (let i = 0; i < 21; i++) { ctx.beginPath(); ctx.moveTo(-500, lineY(i) + 16); ctx.lineTo(500, lineY(i) + 16); ctx.stroke(); }
  ctx.strokeStyle = "rgba(170,60,50,0.25)";
  ctx.beginPath(); ctx.moveTo(X0 - 30, -950); ctx.lineTo(X0 - 30, 950); ctx.stroke();
  ctx.restore();
};

const ease = (x: number) => smooth(x);
const camera = (t: number) => {
  // 返回：缩放、页面坐标里的画面中心
  const s0 = 1.1 + 0.75 * ease((t - 9.6) / 6), cy0 = lineY(4.5) + (lineY(8) - lineY(4.5)) * ease((t - 9.6) / 6);
  const drift = clamp((t - 15.6) / 14);
  let s = s0 + 0.1 * drift, cy = cy0 + LH * 0.6 * drift, cx = -110;
  const back = ease((t - 29.6) / 3.6);
  s = s * Math.pow(0.3 / s, back);
  cy = cy * (1 - back);
  cx = cx * (1 - back);
  return { s, cx, cy };
};

const drawDiary = (ctx: CanvasRenderingContext2D, t: number) => {
  ctx.fillStyle = "#0d0b09"; ctx.fillRect(0, 0, 1920, 1080);
  const { s, cx, cy } = camera(t);
  ctx.save();
  ctx.translate(960, 540); ctx.scale(s, s); ctx.translate(-cx, -cy); ctx.rotate(-0.012);
  // 周围的其他日记页
  const back = clamp((t - 29.6) / 3.6);
  if (back > 0) {
    for (let col = -2; col <= 2; col++) for (let row = -1; row <= 1; row++) {
      if (!col && !row) continue;
      const d = Math.hypot(col, row);
      const a = smooth((t - 30.0 - d * 0.45) / 0.6);
      if (a <= 0) continue;
      ctx.save(); ctx.translate(col * 1250, row * 2050); ctx.rotate((rand(col * 5 + row, 4) - 0.5) * 0.05);
      drawPaper(ctx, col * 3 + row + 20, a);
      let h = 7 + ((col + 2) * 3 + row + 1) * 2, m = Math.floor(rand(col + row * 7, 6) * 50);
      for (let i = 1; i < 21; i++) {
        m += 9 + Math.floor(rand(i + col * 31 + row * 17, 8) * 20); if (m >= 60) { h += 1; m -= 60; }
        const e = { line: i, text: `${h % 24}:${pad2(m)} ${i % 3 === 2 ? S2 : S1}`, a: -2, b: -1, strike: -1 };
        drawLine(ctx, e, 99, a);
      }
      ctx.restore();
    }
  }
  drawPaper(ctx, 1, 1);
  ENTRIES.forEach((e) => drawLine(ctx, e, t));
  ctx.restore();
  // 柔光与暗角
  const v = ctx.createRadialGradient(960, 520, 300, 960, 540, 1150);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, 1920, 1080);
};

// ---------------- 光点（S7–S10） ----------------
const P3 = [{ x: 960, y: 290 }, { x: 960, y: 500 }, { x: 960, y: 710 }];
const flick = (t: number, i: number) => 0.62 + 0.25 * Math.sin(t * (5.1 + i * 1.7) + i * 2) + 0.13 * Math.sin(t * (13.3 + i * 2.3) + i);
const drawLights = (ctx: CanvasRenderingContext2D, t: number) => {
  const breath = 1 + 0.08 * Math.sin((t * Math.PI * 2) / 3.2);
  const appear = smooth((t - 47.3) / 1.0);
  const split = smooth((t - 52.2) / 1.0);
  const merge = smooth((t - 67.9) / 0.9);
  // 三颗光的亮度：出现 → 迷信时暗下去 → 不确定时又闪起来 → 大字时退后
  const lvl = t < 54.4 ? 1 : t < 57.7 ? 1 - 0.9 * smooth((t - 54.4) / 1.2) : t < 59.7 ? 0.1 + 0.25 * smooth((t - 57.7) / 1.2) : 0.35 + 0.65 * smooth((t - 59.7) / 1.0);
  const dimKey = 1 - 0.65 * smooth((t - 63.6) / 0.6) * (1 - smooth((t - 67.2) / 0.6));
  // 第一颗线索：亮起，开始绕圈
  const ig = t - 68.86;
  if (ig > 0) {
    glow(ctx, CX, CY, 260 * Math.exp(-ig * 2.5) + 60, 0.9 * Math.exp(-ig * 1.5) + 0.35);
    const ring = clamp(ig / 0.9);
    if (ring < 1) { ctx.strokeStyle = `rgba(255,210,150,${0.45 * (1 - ring)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, CY, 40 + 500 * ring, (40 + 500 * ring) * 0.3, 0, 0, Math.PI * 2); ctx.stroke(); }
    const u = Math.max(0, t - 69.4);
    const th = (tt: number) => Math.PI / 2 + 0.5 * tt + 0.16 * tt * tt * tt;
    const end = 1 - smooth((t - 73.0) / 0.4);
    if (u > 0) {
      for (let j = 0; j < 14; j++) { // 光迹
        const tt = Math.max(0, u - j * 0.025);
        const rr = 420 * smooth(tt / 2.2);
        const x = CX + Math.cos(th(tt)) * rr, y = CY + Math.sin(th(tt)) * rr * 0.3;
        glow(ctx, x, y, 34 * (1 - j / 16), 0.8 * (1 - j / 14) * end);
      }
      // 轨道上开始出现的其他光点（接片头）
      const ringA = 0.3 * smooth((t - 71.6) / 1.4) * end;
      if (ringA > 0) {
        ctx.globalCompositeOperation = "lighter";
        PARTICLES.forEach((p, i) => {
          const q = orbitPos(p, p.th0 + p.k * th(u) * 0.6);
          ctx.fillStyle = `rgba(255,200,130,${ringA * (0.4 + 0.6 * rand(i, 2))})`;
          ctx.beginPath(); ctx.arc(q.x, q.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }
};

// 三支烛火的亮度：说到「迷信」暗下去，「不确定了」又亮起来，大字出现时退后
const candleLvl = (t: number) => {
  const a = 0.75 - 0.45 * smooth((t - 54.4) / 1.2) + 0.12 * smooth((t - 57.7) / 1.2) + 0.33 * smooth((t - 59.7) / 1.0);
  return a * (1 - 0.45 * smooth((t - 63.6) / 0.6) * (1 - smooth((t - 67.2) / 0.6)));
};

export const Opening: React.FC = () => {
  const ready = useFonts([`"hongleixingshu"`, `"Source Han Serif CN for Display"`, `"Noto Sans SC"`, `"Noto Serif SC"`],
    "0123456789:我现在，才真正醒过来。彻底地了不止一个自己？1985·英国");
  const t = useT(0);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => {
    if (tt >= 9.75 && tt < 34.2) drawDiary(ctx, tt);
    else if (tt >= 68.4) drawLights(ctx, tt);
  }, []);
  return (
    <AbsoluteFill style={{ background: "#050507" }}>
      <Sequence durationInFrames={sec(OPEN_END)}>
        <Clip src="ep01/clips/s1_hand.mp4" from={0} a={0} b={9.75} zoom={[1.0, 1.08]} fi={1.4} />
        <Clip src="ep01/clips/s5_hug.mp4" from={0} a={34.2} b={42.6} zoom={[1.02, 1.08]} />
        <Clip src="ep01/clips/s6_photo.mp4" from={0} a={42.6} b={48.1} zoom={[1.0, 1.12]} fo={0.9} />
        {/* 「这个还在的」：一支烛火 →「人有三魂」：三支烛火（说到「迷信」暗下去，「不确定了」又亮起来）→「当一回侦探」：放大镜与文件 */}
        <Clip src="ep01/clips/b_candle1.mp4" from={0} a={47.4} b={52.4} zoom={[1.04, 1.1]} fi={0.8} fo={0.5} style={{ filter: "brightness(0.8)" }} />
        <Clip src="ep01/clips/b_candles3.mp4" from={0} a={51.9} b={68.1} zoom={[1.0, 1.08]} fi={0.5} fo={0.5}
          style={{ filter: `brightness(${candleLvl(t)})` }} />
        <Clip src="ep01/clips/b_magnify.mp4" from={0} a={67.6} b={OPEN_END} zoom={[1.0, 1.06]} fi={0.5} style={{ filter: "brightness(0.5) saturate(0.8)" }} />
        {ready && ((t >= 68.4) || (t >= 9.75 && t < 34.2)) ? <Canvas t={t} draw={draw} /> : null}
        <Label text="1985 · 英国" t={t} a={1.2} b={9.4} />
        <KeyText text="不止一个自己？" t={t} a={63.7} b={67.6} size={124} font={DISPLAY} />
        <Film t={t} />
        <Subtitles t={t} hide={(x) => x > 63.6 && x < 66.6} />
      </Sequence>
      <Sequence from={sec(OPEN_END)} durationInFrames={240}>
        <Clip src="ep01/clips/b_archive.mp4" from={0} a={0} b={8} zoom={[1.0, 1.08]} fi={0.6} style={{ filter: "brightness(0.38) saturate(0.8)" }} />
        <Intro title="记忆之外" kicker="第 01 期" sub="我，是我的记忆吗？" transparent />
        <Audio src={staticFile("brand/intro.wav")} />
      </Sequence>
      <Audio src={staticFile("ep01/voice_open.wav")} />
      <Audio src={staticFile("ep01/sfx_open.wav")} volume={1.26} />
    </AbsoluteFill>
  );
};
void SANS; void SERIF;
