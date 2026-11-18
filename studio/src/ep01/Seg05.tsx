// 第 01 期 · 05 测试二：把记录复制（录音 496.5–575.8）
// 场 20 AI 里的亲人、场 21 传送机、场 22 不可能就是你
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, NameBar, Still, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, SERIF, SANS } from "./common";
import { drawClueMap, clueById, clueOn } from "./clue";
import { person, headPos, memoryOrb, label, chip } from "./figures";

export const T05 = 496.5, E05 = 575.8;
export const SEG05_FRAMES = sec(E05 - T05);
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const GOLD_RGB = "255,200,130", BLUE_RGB = "140,185,255";

// 开头：接上一段，发现一的光分出一份影子
const drawCarry = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = 1 - fin(t, 498.2, 0.6);
  if (a <= 0) return;
  const f = clueById("found1");
  const P = (x: number, y: number) => ({ x: 960 + (x - 760) * 1.12, y: 540 + (y - 700) * 1.12 });
  const p = P(f.x, f.y);
  glow(ctx, p.x, p.y, 64, 0.9 * a); glow(ctx, p.x + 360, p.y - 60, 60, 0.45 * a, "160,200,255");
};

// ---------- 场 20：聊天气泡聚成一个空心的人形 ----------
const BUBBLES = ["在吗？", "吃饭了没有", "早点睡，别熬夜", "降温了，记得加衣服", "到家了吗", "妈妈想你了", "周末回来吗", "路上慢点"];
const OUTLINE = (() => {   // 人形轮廓上的点
  const pts: [number, number][] = [];
  for (let i = 0; i < 40; i++) { const th = (i / 40) * Math.PI * 2; pts.push([Math.cos(th) * 70, -260 + Math.sin(th) * 75]); }
  for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([-150 - 20 * Math.sin(u * Math.PI), -160 + u * 360]); pts.push([150 + 20 * Math.sin(u * Math.PI), -160 + u * 360]); }
  for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([lerp(-150, 150, u), -165 - 20 * Math.sin(u * Math.PI)]); pts.push([lerp(-150, 150, u), 200]); }
  return pts;
})();
const drawChat = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 505.9, 0.6) * (1 - fin(t, 516.6, 0.5));
  if (a <= 0) return;
  const gather = fin(t, 508.8, 1.8);
  BUBBLES.forEach((b, i) => {
    const at = 506.1 + i * 0.32;
    const on = fin(t, at, 0.35);
    const x0 = 300 + (i % 4) * 440 + (rand(i, 2) - 0.5) * 80, y0 = 230 + Math.floor(i / 4) * 160 + (rand(i, 3) - 0.5) * 50;
    const x = lerp(x0, 960, gather), y = lerp(y0, 520, gather);
    chip(ctx, b, x, y, 50, a * on * (1 - gather), SERIF, i % 2 ? GOLD_RGB : BLUE_RGB);
  });
  // 人形：由一圈小光点组成，中间是空的
  const fig = fin(t, 509.6, 1.4);
  OUTLINE.forEach(([x, y], i) => glow(ctx, 960 + x * (0.6 + 0.4 * fig), 600 + y * (0.6 + 0.4 * fig), 9, 0.7 * a * fig * (0.7 + 0.3 * Math.sin(t * 3 + i))));
  const no = fin(t, 512.3, 0.5);
  if (no > 0) label(ctx, "它不是他", 960, 380, 92, a * no, DISPLAY, "255,225,190");
};

// ---------- 场 21：传送机 ----------
const BL = { x: 480, y: 610 }, BR = { x: 1440, y: 610 };
const booth = (ctx: CanvasRenderingContext2D, x: number, y: number, a: number, warn: number, name: string) => {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.strokeStyle = warn > 0 ? `rgba(255,${Math.round(200 - 120 * warn)},${Math.round(150 - 110 * warn)},0.8)` : "rgba(255,205,150,0.6)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x - 150, y - 300, 300, 520, 26); ctx.stroke();
  ctx.fillStyle = "rgba(255,205,150,0.05)"; ctx.fill();
  ctx.restore();
  glow(ctx, x, y - 300, 120, 0.35 * a);
  label(ctx, name, x, y + 270, 58, a, SERIF);
};
const drawTeleport = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 521.0, 0.6) * (1 - fin(t, 554.2, 0.5));
  if (a <= 0) return;
  const fault = t > 543.6 ? 0.5 + 0.5 * Math.sin((t - 543.6) * 14) * (1 - fin(t, 546.5, 0.6)) : 0;
  booth(ctx, BL.x, BL.y, a, fault, "地球"); booth(ctx, BR.x, BR.y, a, 0, "火星");
  // 地球上的你：走进机器 → 被扫描 → 拆成粒子；故障时其实还在
  const walk = fin(t, 524.0, 1.4);
  const dis = fin(t, 529.2, 1.2), back = fin(t, 544.4, 1.0);
  const you = { x: lerp(200, BL.x, walk), y: BL.y + 70, s: 0.8, alpha: a * walk * (1 - dis + back) };
  person(ctx, you);
  // 扫描线
  const sc = clamp((t - 526.8) / 1.8);
  if (sc > 0 && sc < 1) {
    const y = BL.y - 290 + sc * 500;
    const g = ctx.createLinearGradient(BL.x - 150, y, BL.x + 150, y);
    g.addColorStop(0, "rgba(140,200,255,0)"); g.addColorStop(0.5, `rgba(170,215,255,${0.9 * a})`); g.addColorStop(1, "rgba(140,200,255,0)");
    ctx.fillStyle = g; ctx.fillRect(BL.x - 150, y - 3, 300, 6);
    glow(ctx, BL.x, y, 120, 0.25 * a, "150,200,255");
  }
  // 原子：从地球飞到火星，重组成一模一样的人
  const fly = clamp((t - 529.6) / 2.6), build = fin(t, 532.3, 2.0);
  if (dis > 0 && build < 1) {
    for (let i = 0; i < 90; i++) {
      const sx = BL.x + (rand(i, 2) - 0.5) * 120, sy = BL.y + 200 - rand(i, 3) * 380;
      const tx = BR.x + (rand(i, 4) - 0.5) * 120, ty = BR.y + 200 - rand(i, 5) * 380;
      const k = clamp(fly * 1.3 - rand(i, 6) * 0.3);
      const x = lerp(sx, tx, k), y = lerp(sy, ty, k) - Math.sin(k * Math.PI) * 220;
      glow(ctx, x, y, 8, 0.75 * a * dis * (1 - build), "170,210,255");
    }
  }
  const mars = { x: BR.x, y: BR.y + 70, s: 0.8, alpha: a * build };
  person(ctx, mars);
  // 火星上的人有你全部的记忆
  memoryOrb(ctx, headPos(mars, 70).x, headPos(mars, 70).y, 34, a * fin(t, 536.2, 0.6), GOLD_RGB, t);
  chip(ctx, "只是坐了一趟车", BR.x + 10, BR.y - 380, 50, a * fin(t, 539.6, 0.5) * (1 - fin(t, 543.4, 0.5)), SERIF);
  // 故障：地球上的你还在 → 两个人拿着同一份记录
  memoryOrb(ctx, headPos(you, 70).x, headPos(you, 70).y, 34, a * fin(t, 547.8, 0.6), GOLD_RGB, t + 1);
  chip(ctx, "机器故障", BL.x, BL.y - 380, 50, a * fault > 0.05 ? a * fin(t, 543.8, 0.3) * (1 - fin(t, 547.0, 0.5)) : 0, SERIF, "255,120,90");
  const q = fin(t, 549.5, 0.6);
  if (q > 0) label(ctx, "哪一个，才是你？", 960, 200, 96, a * q, DISPLAY, "255,225,190");
};

// ---------- 场 22：回到对调 → 三条清单 → 线索指向下一个问题 ----------
const drawSwapBack = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 554.5, 0.6) * (1 - fin(t, 562.8, 0.5));
  if (a <= 0) return;
  const you = { x: 600, y: 640, s: 1.2, upper: Math.PI * 1.5, legs: 0, alpha: a };
  const fr = { x: 1280, y: 640, s: 1.2, upper: Math.PI, legs: 0, alpha: a };
  person(ctx, you); person(ctx, fr);
  memoryOrb(ctx, headPos(you, 80).x, headPos(you, 80).y, 50, a, BLUE_RGB, t);
  memoryOrb(ctx, headPos(fr, 80).x, headPos(fr, 80).y, 50, a, GOLD_RGB, t + 1);
  label(ctx, "？", 960, 330, 200, a * fin(t, 559.0, 0.6), DISPLAY, "255,225,190");
};
const drawList = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 563.0, 0.5) * (1 - fin(t, 569.9, 0.5));
  if (a <= 0) return;
  const items: [string, number][] = [["会被写进去", 563.2], ["会自己改变", 564.8], ["还能被复制", 566.0]];
  items.forEach(([s, at], i) => {
    const on = fin(t, at, 0.4);
    label(ctx, s, 880, 280 + i * 120, 72, a * on, SERIF, "243,230,208", "right");
    label(ctx, "✓", 960, 280 + i * 120, 72, a * fin(t, at + 0.35, 0.3), SANS, "255,200,130", "left");
  });
  label(ctx, "不可能就是你", 960, 690, 110, a * fin(t, 567.6, 0.5), DISPLAY, "255,225,190");
};
const drawNext = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 570.0, 0.6);
  if (a <= 0) return;
  drawClueMap(ctx, t, {
    vis: (id) => (["common", "piaget", "loftus", "mall", "challenger", "rat", "found1"].includes(id) ? a : id === "parfit" ? a * clueOn("parfit", t) : 0),
    bright: (id) => (id === "found1" || id === "parfit" ? 1 : 0.45),
    label: (id) => (id === "found1" || id === "parfit" ? 1 : 0),
  });
  // 一根光线伸向下一个空位
  const p = clueById("parfit"), q = clueById("found2");
  const k = fin(t, 573.4, 1.2);
  if (k > 0) {
    ctx.strokeStyle = `rgba(255,205,140,${0.5 * a})`; ctx.lineWidth = 2.2; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(lerp(p.x, q.x, k), lerp(p.y, q.y, k)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255,205,140,${0.6 * k})`; ctx.beginPath(); ctx.arc(q.x, q.y, 34, 0, Math.PI * 2); ctx.stroke();
    label(ctx, "？", q.x, q.y, 52, k, DISPLAY, "255,225,190");
  }
};

export const Seg05: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`],
    "在吗？吃饭了没有早点睡，别熬夜降温了记得加衣服到家妈想你周末回来路上慢它不是他地球火星只坐一趟车机器故障哪个才你会被写进去自己改变还能复制✓可能就德里克·帕菲特1942–2017英国哲学家发现：记忆份记录能的常识");
  const t = useT(T05);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => {
    drawCarry(ctx, tt); drawChat(ctx, tt); drawTeleport(ctx, tt); drawSwapBack(ctx, tt); drawList(ctx, tt); drawNext(ctx, tt);
  }, []);
  return (
    <AbsoluteFill style={{ background: "#08080b" }}>
      <Clip src="ep01/clips/phone.mp4" from={T05} a={498.6} b={506.2} zoom={[1.0, 1.07]} fi={0.5} fo={0.4} />
      <Still src="ep01/raw/parfit.jpg" from={T05} a={516.9} b={521.3} zoom={[1.0, 1.06]} height={900} x={300} fade={0.4} />
      <NameBar name="德里克·帕菲特" years="1942–2017  英国哲学家" t={t} a={517.2} b={521.0} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <Film t={t} />
      <Subtitles t={t} hide={(x) => (x > 552.1 && x < 554.4) || (x > 563.1 && x < 570.0)} />
    </AbsoluteFill>
  );
};
