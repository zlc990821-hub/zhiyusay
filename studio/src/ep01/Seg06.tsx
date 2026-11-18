// 第 01 期 · 06 第二个发现：讲故事的人（录音 575.8–703.0）
// 场 23 里德的将军、场 24 那先的车、场 25 线断了、场 26 讲故事的人
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, KeyText, NameBar, Still, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, HAND, SERIF } from "./common";
import { drawClueMap, clueById, clueOn } from "./clue";
import { person, headPos, label, chip } from "./figures";

export const T06 = 575.8, E06 = 703.0;
export const SEG06_FRAMES = sec(E06 - T06);
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ALL7 = ["common", "piaget", "loftus", "mall", "challenger", "rat", "found1", "parfit"];

// 开头：「洛克的说法很快就有人挑出了问题」——回到第一颗线索，裂缝亮起
const drawOpen = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 575.8, 0.4) * (1 - fin(t, 580.4, 0.5));
  if (a <= 0) return;
  const n = clueById("common");
  drawClueMap(ctx, t, { vis: (id) => (ALL7.includes(id) ? a : 0), bright: (id) => (id === "common" ? 1.3 : 0.3), label: (id) => (id === "common" ? 1 : 0), scale: 1.5, cx: n.x + 150, cy: n.y + 120 });
  const P = { x: 960 + (n.x - n.x - 150) * 1.5, y: 540 + (n.y - n.y - 120) * 1.5 };
  ctx.save(); ctx.translate(P.x, P.y); ctx.scale(1.5, 1.5);
  ctx.strokeStyle = `rgba(255,250,240,${0.9 * a})`; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); [[-70, -60], [-22, -18], [-34, 6], [8, 22], [-4, 44], [52, 78]].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.restore();
};

// ---------- 场 23：小男孩、军官、老将军 ----------
const FIG = [
  { name: "小男孩", x: 430, s: 0.62, at: 584.0, chip: "偷果子，挨了一顿打", chipAt: 585.0 },
  { name: "军官", x: 960, s: 0.92, at: 588.0, chip: "夺下敌人的军旗", chipAt: 590.0 },
  { name: "老将军", x: 1490, s: 0.95, at: 598.6, chip: "记得当年夺旗", chipAt: 599.0 },
];
const drawReid = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 583.8, 0.5) * (1 - fin(t, 620.6, 0.5));
  if (a <= 0) return;
  const base = 780;
  const heads = FIG.map((f) => {
    const p = { x: f.x, y: base - 175 * f.s, s: f.s, alpha: a * fin(t, f.at, 0.6) };
    person(ctx, p);
    label(ctx, f.name, f.x, base + 50, 56, p.alpha, SERIF);
    chip(ctx, f.chip, f.x, 250, 48, a * fin(t, f.chipAt, 0.5) * (1 - fin(t, 604.6, 0.5)), SERIF);
    return headPos(p, 40);
  });
  // 记忆线：男孩—军官（594），军官—将军（599.6）
  const link = (i: number, j: number, at: number, hiAt: number, mark: string) => {
    const k = fin(t, at, 0.8);
    if (k <= 0) return;
    const A = heads[i], B = heads[j];
    const hi = fin(t, hiAt, 0.4);
    ctx.strokeStyle = `rgba(255,${200 + 30 * hi},${130 + 60 * hi},${(0.55 + 0.4 * hi) * a})`; ctx.lineWidth = 3 + 2 * hi;
    ctx.beginPath(); ctx.moveTo(A.x, A.y);
    const mx = (A.x + B.x) / 2, my = Math.min(A.y, B.y) - 90;
    ctx.quadraticCurveTo(mx, my, lerp(A.x, B.x, k), lerp(A.y, B.y, k) - Math.sin(k * Math.PI) * 0); ctx.stroke();
    if (hi > 0) label(ctx, mark, mx, my + 20, 60, a * hi, DISPLAY, "255,225,190");
  };
  link(0, 1, 594.0, 609.4, "＝");
  link(1, 2, 599.6, 605.2, "＝");
  // 男孩—将军：一根虚线，断开、闪烁
  const br = fin(t, 602.4, 0.6);
  if (br > 0) {
    const A = heads[0], B = heads[2];
    const flick = t > 611.6 ? 0.5 + 0.5 * Math.sin((t - 611.6) * 16) : 1;
    ctx.save(); ctx.setLineDash([16, 14]); ctx.strokeStyle = `rgba(255,${t > 611.6 ? 120 : 205},${t > 611.6 ? 100 : 150},${0.6 * a * br * flick})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(960, 120, B.x, B.y); ctx.stroke(); ctx.restore();
    if (t > 611.6) label(ctx, "≠", 960, 190, 72, a * fin(t, 611.8, 0.4) * (1 - fin(t, 617.0, 0.4)), DISPLAY, "255,150,120");
  }
};

// ---------- 场 24：那先的车 → 人 ----------
const drawChariot = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 621.0, 0.6) * (1 - fin(t, 640.6, 0.6));
  if (a <= 0) return;
  const fly = smooth((t - 636.0) / 2.4);
  const part = (dx: number, dy: number, rot: number, hl: number, draw: () => void) => {
    ctx.save(); ctx.translate(dx * fly, dy * fly); ctx.rotate(rot * fly);
    ctx.strokeStyle = `rgba(255,${210 + 20 * hl},${160 + 60 * hl},${(0.7 + 0.3 * hl) * a})`; ctx.lineWidth = 4 + 3 * hl;
    if (hl > 0.1) { ctx.shadowColor = "rgba(255,190,110,0.9)"; ctx.shadowBlur = 24 * hl; }
    draw(); ctx.restore();
  };
  const hAxle = fin(t, 623.6, 0.4) * (1 - fin(t, 626.4, 0.4)), hWheel = fin(t, 626.6, 0.4) * (1 - fin(t, 628.4, 0.4)), hBox = fin(t, 628.6, 0.4) * (1 - fin(t, 635.0, 0.4));
  // 车轮
  part(-280, 260, -1.2, hWheel, () => { ctx.beginPath(); ctx.arc(800, 640, 140, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 8; i++) { const th = (i / 8) * Math.PI; ctx.beginPath(); ctx.moveTo(800 + Math.cos(th) * 140, 640 + Math.sin(th) * 140); ctx.lineTo(800 - Math.cos(th) * 140, 640 - Math.sin(th) * 140); ctx.stroke(); } });
  // 车轴
  part(-60, 380, 0.5, hAxle, () => { ctx.beginPath(); ctx.moveTo(620, 640); ctx.lineTo(980, 640); ctx.stroke(); });
  // 车厢
  part(260, -260, 0.6, hBox, () => { ctx.beginPath(); ctx.moveTo(600, 560); ctx.lineTo(1080, 560); ctx.lineTo(1050, 400); ctx.lineTo(640, 400); ctx.closePath(); ctx.stroke(); });
  // 车辕
  part(420, 120, -0.8, 0, () => { ctx.beginPath(); ctx.moveTo(1060, 520); ctx.quadraticCurveTo(1300, 480, 1500, 420); ctx.stroke(); });
  label(ctx, "车轴", 1060, 640, 56, a * hAxle, SERIF, "255,225,190");
  label(ctx, "车轮", 800, 820, 56, a * hWheel, SERIF, "255,225,190");
  label(ctx, "车厢", 840, 340, 56, a * hBox, SERIF, "255,225,190");
  label(ctx, "车，在哪里？", 960, 200, 84, a * fin(t, 637.4, 0.6), DISPLAY, "255,225,190");
};
const drawSelf = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 640.6, 0.7) * (1 - fin(t, 650.8, 0.5));
  if (a <= 0) return;
  const p = { x: 960, y: 700 - 175, s: 1.0, alpha: a * (1 - 0.75 * fin(t, 645.5, 1.5)) };
  person(ctx, p);
  const parts: [string, number, number, number][] = [["记忆", 641.0, -330, -260], ["细胞", 642.6, 330, -120], ["性格", 644.0, -300, 60]];
  parts.forEach(([s, at, dx, dy]) => {
    const on = fin(t, at, 0.4), off = fin(t, at + 1.6, 1.8);
    chip(ctx, `${s}在变`, 960 + dx * (0.6 + off * 0.9), 480 + dy - off * 80, 52, a * on * (1 - off), SERIF);
  });
  label(ctx, "这就是我？", 960, 200, 84, a * fin(t, 648.8, 0.5), DISPLAY, "255,225,190");
};

// ---------- 场 25：线断了 ----------
const drawBroken = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 650.9, 0.4) * (1 - fin(t, 653.8, 0.4));
  if (a <= 0) return;
  drawClueMap(ctx, t, { vis: (id) => (ALL7.includes(id) ? a : 0), bright: () => 0.6, label: (id) => (id === "parfit" ? 1 : 0) });
  const p = clueById("parfit"), q = clueById("found2");
  const off = fin(t, 651.6, 0.8);
  ctx.save(); ctx.setLineDash([12, 10]); ctx.strokeStyle = `rgba(255,205,140,${0.6 * a * (1 - off)})`; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
};

// ---------- 场 26：同一段经历，两种讲法 ----------
const drawStory = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 660.4, 0.6) * (1 - fin(t, 690.4, 0.6));
  if (a <= 0) return;
  // 时间线
  ctx.strokeStyle = `rgba(255,205,150,${0.5 * a})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(240, 640); ctx.lineTo(1680, 640); ctx.stroke();
  const ev = fin(t, 667.4, 0.5);
  glow(ctx, 760, 640, 40, 0.9 * a * ev);
  label(ctx, "同一段经历", 760, 700, 52, a * ev, SERIF);
  // 两种讲法，交替出现
  const s1 = fin(t, 669.3, 0.5) * (1 - 0.6 * fin(t, 672.0, 0.4) * (1 - fin(t, 675.0, 0.4)));
  const s2 = fin(t, 672.1, 0.5);
  label(ctx, "「我被打败了」", 560, 470, 70, a * s1, HAND, "170,200,255");
  label(ctx, "「我从那里走出来了」", 1040, 400, 70, a * s2, HAND, "255,214,160");
  // 讲的人：一道笔光，在两种讲法之间
  const pen = fin(t, 675.0, 0.5);
  if (pen > 0) {
    const k = 0.5 + 0.5 * Math.sin((t - 675.0) * 1.6);
    const x = lerp(560, 1040, k), y = lerp(520, 450, k) + 60;
    glow(ctx, x, y, 34, 0.9 * a * pen);
    label(ctx, "讲的人", x, y + 60, 50, a * pen * (1 - fin(t, 678.0, 0.4)), SERIF);
  }
  // 皮亚杰那张假童年的照片，钉在时间线最左边，带着它活了十几年
  const pin = fin(t, 678.2, 0.5) * (1 - fin(t, 683.4, 0.5));
  if (pin > 0) {
    label(ctx, "皮亚杰的「记忆」", 360, 540, 48, a * pin, SERIF);
    const run = fin(t, 680.6, 2.0);
    ctx.strokeStyle = `rgba(255,214,160,${0.8 * a * pin})`; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(300, 640); ctx.lineTo(lerp(300, 1100, run), 640); ctx.stroke();
    label(ctx, "活了十几年", lerp(300, 1100, run) - 80, 600, 48, a * pin * run, SERIF, "255,214,160");
  }
  // 今天怎么讲 → 明天的记忆
  const td = fin(t, 683.8, 0.5);
  if (td > 0) {
    glow(ctx, 1240, 640, 30, 0.8 * a * td); label(ctx, "今天怎么讲", 1240, 700, 52, a * td, SERIF);
    const k = fin(t, 688.0, 1.0);
    glow(ctx, 1580, 640, 30, 0.8 * a * k); label(ctx, "明天的记忆", 1580, 700, 52, a * k, SERIF, "255,214,160");
    ctx.strokeStyle = `rgba(255,214,160,${0.8 * a * k})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(1270, 600); ctx.quadraticCurveTo(1410, 520, lerp(1270, 1550, k), lerp(600, 600, k)); ctx.stroke();
  }
};
const drawFound2 = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 690.4, 0.6);
  if (a <= 0) return;
  const stop = fin(t, 699.4, 2.5);
  drawClueMap(ctx, t, {
    vis: (id) => (ALL7.includes(id) ? a : id === "found2" ? clueOn("found2", t) : 0),
    bright: (id) => (id === "found2" ? 1.25 * (1 - 0.7 * stop) : id === "found1" ? 0.8 : 0.35),
    label: (id) => (id === "found2" || id === "found1" ? 1 : 0),
  });
  // 笔尖的光：在发现二旁边写字，「连书写都做不到」时停住、熄灭
  const f = clueById("found2");
  const tt = Math.min(t, 699.4);
  const x = f.x + 60 + ((tt * 70) % 120), y = f.y - 10 + Math.sin(tt * 8) * 14;
  glow(ctx, x, y, 22, 0.9 * a * fin(t, 691.0, 0.5) * (1 - stop));
};

export const Seg06: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`],
    "小男孩军官老将军偷果子，挨了一顿打夺下敌人的旗记得当年＝≠车轴轮厢在哪里？记忆细胞性格变这就是我同一段经历「我被打败了」从那走出来讲的人皮亚杰活十几年今天怎么明天发现二：你书写过去既又不托马斯·里德1710–1796苏格兰哲学家常识：＝能复制录");
  const t = useT(T06);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => {
    drawOpen(ctx, tt); drawReid(ctx, tt); drawChariot(ctx, tt); drawSelf(ctx, tt); drawBroken(ctx, tt); drawStory(ctx, tt); drawFound2(ctx, tt);
  }, []);
  return (
    <AbsoluteFill style={{ background: "#08080b" }}>
      <Still src="ep01/raw/reid.jpg" from={T06} a={580.5} b={584.4} zoom={[1.0, 1.06]} height={900} x={300} fade={0.4} />
      <NameBar name="托马斯·里德" years="1710–1796  苏格兰哲学家" t={t} a={580.8} b={584.2} />
      <Clip src="ep01/clips/writing.mp4" from={T06} a={654.0} b={660.6} zoom={[1.0, 1.06]} fi={0.4} fo={0.4} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <KeyText text="既是他，又不是他" t={t} a={617.4} b={620.8} size={100} font={DISPLAY} y={-330} />
      <KeyText text="一个人是谁，取决于他怎么讲自己的故事" t={t} a={660.8} b={667.0} size={64} font={DISPLAY} y={-330} />
      <KeyText text="你是正在书写过去的人" t={t} a={694.0} b={699.0} size={96} font={DISPLAY} y={-330} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => (x > 617.4 && x < 620.8) || (x > 694.0 && x < 699.0)} />
    </AbsoluteFill>
  );
};
void clamp; void rand;
