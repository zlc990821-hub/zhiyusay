// 第 01 期 · S83–S88 三条线索 → 三魂 → 薪火（录音 759.6–820.2 秒）
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, KAI, SERIF, GOLD } from "./common";
import { drawClueMap, clueById } from "./clue";

export const S0 = 759.6;
export const S_END = 820.2;
export const SOULS_FRAMES = sec(S_END - S0);

// 三颗光：天在上，人在中，地在下
const COL = 960;
const ROW = { tian: 250, ren: 500, di: 750 };
const KEYMAP: Record<string, keyof typeof ROW> = { found1: "di", found2: "ren", found3: "tian" };

// 每颗光的亮度曲线
const env = (t: number, pts: [number, number][]) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) {
    const [a, va] = pts[i - 1], [b, vb] = pts[i];
    return va + (vb - va) * smooth((t - a) / (b - a));
  }
  return pts[pts.length - 1][1];
};
// 「像不像」：轮到谁，谁最亮
const ask = (t: number, row: keyof typeof ROW) => {
  const w = { di: [790.04, 793.05], ren: [793.1, 796.41], tian: [796.46, 800.33] }[row];
  const inAsk = t > 790.0 && t < 800.4;
  if (!inAsk) return 1;
  return t >= w[0] && t < w[1] ? 1.25 : 0.45;
};
const level = (t: number, row: keyof typeof ROW) => {
  const base = {
    di: env(t, [[763.0, 0.25], [763.6, 1], [777.6, 1], [778.6, 0.06], [783.3, 0.06], [784.6, 0.85]]),
    ren: env(t, [[769.3, 0.25], [770.0, 1], [779.8, 1], [780.9, 0.06], [783.6, 0.06], [784.9, 0.85]]),
    tian: env(t, [[775.6, 0.25], [776.3, 1], [781.6, 1], [782.3, 1.2], [784.0, 0.85]]),
  }[row];
  return base * ask(t, row);
};
const flare = (t: number, at: number) => (t > at ? Math.exp(-(t - at) * 2.2) : 0);

const drawRecord = (ctx: CanvasRenderingContext2D, t: number, a: number) => {
  // 地：一卷记录 —— 几行光写成的字迹
  const y0 = ROW.di;
  const lines = 4 + (t > 765.55 ? 1 : 0);
  for (let k = 0; k < lines; k++) {
    const wobble = t > 766.95 ? Math.sin((t - 766.95) * 2 + k * 1.7) * 30 * smooth((t - 766.95) / 0.8) : 0;
    const len = 90 + rand(k, 3) * 90 + wobble;
    const born = k === 4 ? smooth((t - 765.55) / 0.8) : 1;
    const y = y0 - 46 + k * 23;
    ctx.strokeStyle = `rgba(255,214,160,${0.55 * a * born})`; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(COL + 70, y); ctx.lineTo(COL + 70 + len * born, y); ctx.stroke();
    // 被复制：一份一模一样的影子滑向左边
    const cp = smooth((t - 768.31) / 1.2) * (1 - smooth((t - 770.0) / 0.8));
    if (cp > 0) {
      ctx.strokeStyle = `rgba(160,200,255,${0.45 * a * cp})`;
      const ox = COL + 70 + 120 + 160 * cp;
      ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + len * born, y); ctx.stroke();
    }
  }
};
const drawPen = (ctx: CanvasRenderingContext2D, t: number, a: number) => {
  // 人：一道笔光，不停地书写；书写停了，笔迹也停住
  const tEnd = Math.min(t, 780.0);
  const path = (u: number) => ({ x: COL + 80 + ((u * 75) % 190), y: ROW.ren + Math.sin(u * 8) * 30 + Math.sin(u * 3.1) * 12 });
  for (let j = 0; j < 90; j++) {
    const u = tEnd - j * 0.025;
    if (u < 769.3) break;
    const p = path(u), q = path(u - 0.025);
    if (Math.abs(p.x - q.x) > 50) continue;
    ctx.strokeStyle = `rgba(255,220,170,${0.8 * a * (1 - j / 90)})`; ctx.lineWidth = 4.5 * (1 - j / 110);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  const p = path(tEnd);
  glow(ctx, p.x, p.y, 20, 0.8 * a);
};
const drawWatcher = (ctx: CanvasRenderingContext2D, t: number, a: number) => {
  // 天：一个安静注视的光点，一圈一圈的光晕
  for (let k = 0; k < 3; k++) {
    const ph = ((t * 0.35 + k / 3) % 1);
    ctx.strokeStyle = `rgba(255,225,180,${0.35 * a * (1 - ph)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(COL, ROW.tian, 60 + ph * 120, 0, Math.PI * 2); ctx.stroke();
  }
};

const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, font: string, a: number, align: CanvasTextAlign) => {
  if (a <= 0.01) return;
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillStyle = `rgba(243,230,208,${a})`;
  ctx.shadowColor = "rgba(255,180,100,0.5)"; ctx.shadowBlur = 20 * a;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
};

const drawSouls = (ctx: CanvasRenderingContext2D, t: number) => {
  // 1 线索图全景 → 三个发现亮起，其余退去
  const gather = smooth((t - 762.9) / 1.4);
  if (gather < 1) {
    const sc = 0.92 - 0.06 * clamp((t - S0) / 3.3);
    drawClueMap(ctx, t, {
      vis: (id) => (clueById(id).key ? 1 - gather : (1 - gather) * (1 - 0.6 * smooth((t - 761.27) / 0.8))),
      bright: (id) => (clueById(id).key ? 1 + 0.4 * smooth((t - 761.27) / 0.6) : 1),
      label: (id) => (clueById(id).key ? 1 : 0),
      scale: sc,
    });
  }
  // 2 三个发现移到中间，排成一列
  const push = 1 + 0.05 * smooth((t - 800.4) / 8);
  ctx.save(); ctx.translate(960, 500); ctx.scale(push, push); ctx.translate(-960, -500);
  (["found1", "found2", "found3"] as const).forEach((id) => {
    const n = clueById(id), row = KEYMAP[id];
    const sc = 0.89;
    const fx = 960 + (n.x - 960) * sc, fy = 540 + (n.y - 540) * sc;
    const x = fx + (COL - fx) * gather, y = fy + (ROW[row] - fy) * gather;
    if (gather <= 0) return;
    const lv = level(t, row) * smooth(gather * 1.5) * (1 - smooth((t - 808.2) / 0.8));
    const fl = row === "di" ? flare(t, 791.64) : row === "ren" ? flare(t, 795.26) : flare(t, 799.06);
    const breath = 1 + 0.07 * Math.sin(t * 1.6 + ROW[row]);
    glow(ctx, x, y, (row === "tian" ? 78 : 66) * breath * (1 + 0.5 * fl), Math.min(1, 0.85 * lv + 0.4 * fl));
    if (gather > 0.95) {
      if (row === "di") drawRecord(ctx, t, lv);
      if (row === "ren") drawPen(ctx, t, lv);
      if (row === "tian") drawWatcher(ctx, t, lv);
    }
    // 左边：我们查到的；右边：古人的名字
    const left = { di: ["记录", 764.2], ren: ["书写", 769.53], tian: ["看着的", 775.81] }[row] as [string, number];
    const right = { di: ["地魂", 786.04], ren: ["人魂", 787.34], tian: ["天魂", 788.26] }[row] as [string, number];
    const fade = 1 - smooth((t - 808.2) / 0.8);
    const lvl = Math.min(1, lv);
    drawLabel(ctx, left[0], COL - 230, y, 58, SERIF, smooth((t - left[1]) / 0.6) * (0.4 + 0.6 * lvl) * fade, "right");
    drawLabel(ctx, right[0], COL + 330, y, 104, KAI, smooth((t - right[1]) / 0.7) * (0.45 + 0.55 * Math.min(1, ask(t, row))) * fade, "left");
  });
  // 三颗光之间的细线（800 秒以后）
  const thread = smooth((t - 800.6) / 1.5) * (1 - smooth((t - 808.2) / 0.8));
  if (thread > 0) {
    ctx.strokeStyle = `rgba(255,210,150,${0.3 * thread})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(COL, ROW.di - 60); ctx.lineTo(COL, ROW.di - 60 - (ROW.di - ROW.tian - 120) * thread); ctx.stroke();
  }
  ctx.restore();
};

// 庄子原文：竖排，从右往左
const ZZ: [string, number][] = [["指穷于为薪", 809.9], ["火传也", 812.0], ["不知其尽也", 813.35]];
const Zhuangzi: React.FC<{ t: number }> = ({ t }) => {
  const all = smooth((t - 808.6) / 0.5) * (1 - smooth((t - 814.6) / 0.5));
  if (all <= 0.01) return null;
  return (
    <AbsoluteFill style={{ opacity: all }}>
      <div style={{ position: "absolute", right: 640, top: 150, display: "flex", flexDirection: "row-reverse", gap: 70 }}>
        {ZZ.map(([s, at], i) => (
          <div key={i} style={{ writingMode: "vertical-rl", fontFamily: KAI, fontSize: 112, letterSpacing: 14, color: GOLD, opacity: smooth((t - at) / 0.6),
            textShadow: "0 0 30px rgba(255,180,100,0.35)" }}>{s}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 600, top: 170, writingMode: "vertical-rl", fontFamily: SERIF, fontSize: 52, letterSpacing: 8, color: "rgba(243,230,208,0.7)" }}>《庄子·养生主》</div>
    </AbsoluteFill>
  );
};

export const Souls: React.FC = () => {
  const ready = useFonts([`"XuandongKaishu"`, `"Noto Serif SC"`, `"Noto Sans SC"`], "记录书写看着的地魂人魂天魂指穷于为薪火传也不知其尽《庄子·养生主》发现一：记忆是一份记录二你在书写三看着的那一个");
  const t = useT(S0);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => drawSouls(ctx, tt), []);
  return (
    <AbsoluteFill style={{ background: "#050507" }}>
      {ready && t < 809.5 ? <Canvas t={t} draw={draw} /> : null}
      {/* 场 31 薪火：燃烧的木柴压暗，庄子原文浮在上面；「柴会烧完」时字淡去、火变亮；「火，传下去了」叠化成烛火 */}
      <Clip src="ep01/clips/fire.mp4" from={S0} a={808.3} b={817.5} start={0} zoom={[1.0, 1.08]} fi={0.9} fo={0.7}
        style={{ filter: `brightness(${0.38 + 0.62 * smooth((t - 814.6) / 0.9)})` }} />
      <Zhuangzi t={t} />
      <Clip src="ep01/clips/candle.mp4" from={S0} a={816.8} b={S_END} start={0} zoom={[1.0, 1.05]} fi={0.7} fo={0.8} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => (x > 808.5 && x < 814.85) || x > 819.3} />
    </AbsoluteFill>
  );
};
export const SoulsRoot: React.FC = () => (
  <>
    <Souls />
    <Audio src={staticFile("ep01/voice_souls.wav")} />
    <Audio src={staticFile("ep01/sfx_souls.wav")} volume={1.26} />
  </>
);
void rand;
