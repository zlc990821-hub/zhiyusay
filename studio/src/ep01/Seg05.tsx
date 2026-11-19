// 第 01 期 · 05 测试二：把记录复制（录音 496.5–575.8）
// 场 20 AI 里的亲人、场 21 传送机、场 22 不可能就是你
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Bed, Chapter, ClueList, CL, DESK } from "./kit";
import { Canvas, Clip, Film, NameBar, Still, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, SERIF, SANS } from "./common";
import { person, headPos, memoryOrb, label, chip } from "./figures";

export const T05 = 496.5, E05 = 575.8;
export const SEG05_FRAMES = sec(E05 - T05);
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const GOLD_RGB = "255,200,130", BLUE_RGB = "140,185,255";


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
    const x0 = 330 + (i % 4) * 400 + (rand(i, 2) - 0.5) * 60, y0 = 250 + Math.floor(i / 4) * 230 + (i % 2) * 70 + (rand(i, 3) - 0.5) * 40;
    const x = lerp(x0, 960, gather), y = lerp(y0, 520, gather);
    chip(ctx, b, x, y, 58, a * on * (1 - gather), SERIF, i % 2 ? GOLD_RGB : BLUE_RGB);
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
  // 回到第 01 段那两个熟睡的人：头顶的光已经互换（你的是蓝色，她的是金色）
  memoryOrb(ctx, 672, 250, 52, a, BLUE_RGB, t);
  memoryOrb(ctx, 1344, 330, 52, a, GOLD_RGB, t + 1);
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

// 左右两半各放一段素材（地球｜火星，熟睡的你｜好朋友）
const Halves: React.FC<{ t: number; a: number; b: number; left: string; right: string; dim: number }> = ({ t, a, b, left, right, dim }) => {
  const o = fin(t, a, 0.5) * (1 - fin(t, b - 0.5, 0.5));
  if (o <= 0) return null;
  const half = (isLeft: boolean, src: string) => (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: isLeft ? 0 : 966, width: 954, overflow: "hidden" }}>
      <Clip src={src} from={T05} a={a} b={b} zoom={[1.02, 1.08]} style={{ filter: `brightness(${dim}) saturate(0.85)` }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {half(true, left)}{half(false, right)}
      <div style={{ position: "absolute", left: 957, width: 6, top: 0, bottom: 0, background: "#0b0a09" }} />
    </AbsoluteFill>
  );
};

export const Seg05: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`],
    "05测试二：把记录复制线索清单→？★0123456789发现一：记忆，更像是一份记录AI、传送机：录能被复制，出来的却不是你那谁在用这在吗？吃饭了没有早点睡，别熬夜降温了记得加衣服到家妈想你周末回来路上慢它不是他地球火星只坐一趟车机器故障哪个才你会被写进去自己改变还能复制✓可能就德里克·帕菲特1942–2017英国哲学家发现：记忆份记录能的常识");
  const t = useT(T05);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => {
    drawChat(ctx, tt); drawTeleport(ctx, tt); drawSwapBack(ctx, tt); drawList(ctx, tt);
  }, []);
  return (
    <AbsoluteFill style={{ background: "#08080b" }}>
      {/* 打底：手机 → 深夜床上看手机（聊天气泡）→ 书库（帕菲特）→ 地球｜火星分屏（传送机）→ 熟睡的两个人 → 侦探的案头 */}
      <Bed from={T05} clips={[
        { src: DESK, a: 496.5, b: 499.0, dim: 0.32, blur: 4 },
        { src: "ep01/clips/phone.mp4", a: 498.6, b: 506.2, dim: 0.85, sat: 1 },
        { src: "ep01/clips/b_phonebed.mp4", a: 505.8, b: 517.2, dim: 0.35, blur: 2 },
        { src: "ep01/clips/b_oldlib.mp4", a: 516.8, b: 521.5, dim: 0.35 },
      ]} />
      <Halves t={t} a={520.9} b={554.6} left="ep01/clips/b_earth.mp4" right="ep01/clips/b_mars.mp4" dim={0.5} />
      <Halves t={t} a={554.3} b={563.2} left="ep01/clips/b_sleep_a.mp4" right="ep01/clips/b_sleep_b.mp4" dim={0.62} />
      <Bed from={T05} clips={[{ src: DESK, a: 562.9, b: E05, dim: 0.3, blur: 4 }]} />
      <Still src="ep01/raw/parfit.jpg" from={T05} a={516.9} b={521.3} zoom={[1.0, 1.06]} height={860} x={300} fade={0.4} bg="transparent" />
      <NameBar name="德里克·帕菲特" years="1942–2017  英国哲学家" t={t} a={517.2} b={521.0} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <ClueList t={t} a={569.9} b={E05 + 0.6} items={[
        { text: CL.find1, at: 570.0, kind: "find" },
        { text: CL.copy, at: 570.6 },
        { text: "那，是谁在用这份记录？", at: 573.4, kind: "ask" },
      ]} top={250} />
      <Chapter t={t} no="05" title="测试二：把记录复制" at={496.6} end={E05 + 1} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => (x > 552.1 && x < 554.4) || (x > 563.1 && x < 570.0)} />
    </AbsoluteFill>
  );
};
