// 第 01 期 · 04 测试一：把记忆拿掉（录音 397.5–496.5）
// 场 16 亨利·莫莱森（一张讲解板）、场 17 克莱夫的音乐、场 18 外婆的糖、场 19 第一个发现
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Bed, Chapter, ClueList, CL, DESK } from "./kit";
import { Canvas, Clip, Corner, Film, KeyText, NameBar, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, HAND, SERIF, SANS } from "./common";
import { chip, label } from "./figures";

export const T04 = 397.5, E04 = 496.5;
export const SEG04_FRAMES = sec(E04 - T04);
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ---------- 场 16：大脑线稿，海马体被取走 ----------
const drawBrain = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 400.3, 0.8) * (1 - fin(t, 422.6, 0.6));   // 段首标题卡退了再出现
  if (a <= 0) return;
  ctx.save(); ctx.translate(700, 430); ctx.globalAlpha = a;
  ctx.strokeStyle = "rgba(255,210,160,0.75)"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // 外轮廓（侧面）
  ctx.beginPath();
  ctx.moveTo(-300, 40); ctx.bezierCurveTo(-330, -150, -150, -270, 40, -260);
  ctx.bezierCurveTo(230, -250, 340, -120, 320, 30);
  ctx.bezierCurveTo(310, 120, 230, 160, 140, 150);
  ctx.bezierCurveTo(100, 190, 40, 200, 0, 170);
  ctx.bezierCurveTo(-120, 190, -260, 160, -300, 40); ctx.stroke();
  // 小脑与脑干
  ctx.beginPath(); ctx.ellipse(200, 170, 95, 55, -0.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60, 180); ctx.bezierCurveTo(70, 250, 80, 300, 70, 340); ctx.moveTo(110, 185); ctx.bezierCurveTo(115, 250, 120, 300, 115, 340); ctx.stroke();
  // 脑回
  ctx.strokeStyle = "rgba(255,210,160,0.35)"; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const x0 = -250 + i * 60, y0 = -150 + Math.sin(i) * 40;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0 + 30, y0 + 40 + rand(i, 2) * 40, x0 - 20, y0 + 90, x0 + 20, y0 + 140); ctx.stroke();
  }
  // 海马体：亮起 → 被取走
  const hl = fin(t, 407.4, 0.5), gone = fin(t, 409.8, 1.2);
  const hx = 30 + gone * 260, hy = 80 + gone * 120;
  ctx.globalAlpha = a * (1 - gone);
  ctx.strokeStyle = `rgba(255,200,120,${0.5 + 0.5 * hl})`; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(hx - 70, hy - 10); ctx.bezierCurveTo(hx - 20, hy + 40, hx + 40, hy + 30, hx + 60, hy - 20); ctx.bezierCurveTo(hx + 75, hy - 50, hx + 50, hy - 60, hx + 35, hy - 40); ctx.stroke();
  ctx.restore();
  glow(ctx, 700 + hx, 430 + hy, 90, 0.6 * hl * a * (1 - gone));
  label(ctx, "海马体", 700 + 40, 430 + 170, 52, a * hl * (1 - gone), SERIF, "255,215,160");
  // 空出来的地方
  ctx.save(); ctx.globalAlpha = a * gone; ctx.setLineDash([10, 10]); ctx.strokeStyle = "rgba(255,210,160,0.6)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(700 + 30, 430 + 80, 85, 45, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
};

// 右边：新认识的人、刚吃完的饭，一出现就淡去
const drawForget = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 412.0, 0.6) * (1 - fin(t, 422.6, 0.6));
  if (a <= 0) return;
  label(ctx, "1953 年以后", 1380, 230, 56, a, SERIF, "255,215,160");
  const items: [string, number, number][] = [["新认识的人", 416.6, 360], ["刚吃完的饭", 419.4, 520]];
  items.forEach(([txt, at, y]) => {
    const on = fin(t, at, 0.4), off = fin(t, at + 1.6, 1.4);
    chip(ctx, txt, 1380 + off * 60, y - off * 20, 56, a * on * (1 - off), SERIF);
    // 淡去时散成小点
    if (off > 0 && off < 1) for (let i = 0; i < 18; i++) glow(ctx, 1380 + (rand(i, 3) - 0.5) * 300 + off * 120, y + (rand(i, 4) - 0.5) * 80 - off * 60, 8, 0.5 * (1 - off) * a);
  });
};

// 镜像描星：第 1、2、3 天，越描越准；每天都说「我从来没做过这个」
const STAR = Array.from({ length: 11 }, (_, i) => { const r = i % 2 ? 46 : 110, th = -Math.PI / 2 + (i * Math.PI) / 5; return [Math.cos(th) * r, Math.sin(th) * r]; });
const drawStars = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 422.9, 0.6) * (1 - fin(t, 438.5, 0.5));
  if (a <= 0) return;
  label(ctx, "看着镜子里的图形，描一颗星星", 960, 175, 56, a * (1 - fin(t, 430.6, 0.5)), SERIF, "255,215,160");
  const days: [number, number, number][] = [[426.4, 3.4, 26], [430.8, 1.8, 11], [432.6, 1.6, 3]];  // 开始、用时、抖动幅度
  days.forEach(([at, dur, wob], d) => {
    const cx = 480 + d * 480, cy = 470;
    const pa = a * fin(t, at - 0.6, 0.5);
    if (pa <= 0) return;
    ctx.save(); ctx.globalAlpha = pa;
    ctx.strokeStyle = "rgba(255,210,160,0.35)"; ctx.lineWidth = 16; ctx.lineJoin = "round";
    ctx.beginPath(); STAR.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y))); ctx.stroke();
    // 描出来的线
    const p = clamp((t - at) / dur);
    ctx.strokeStyle = "rgba(255,240,215,0.95)"; ctx.lineWidth = 3.5;
    ctx.beginPath();
    const n = 200;
    for (let k = 0; k <= n * p; k++) {
      const u = (k / n) * 10, i = Math.floor(u), f = u - i;
      const [x1, y1] = STAR[i], [x2, y2] = STAR[Math.min(10, i + 1)];
      const jx = Math.sin(k * 0.7 + d) * wob * rand(k, d + 2), jy = Math.cos(k * 0.5 + d) * wob * rand(k, d + 5);
      const X = cx + x1 + (x2 - x1) * f + jx, Y = cy + y1 + (y2 - y1) * f + jy;
      k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke(); ctx.restore();
    label(ctx, `第 ${d + 1} 天`, cx, cy - 170, 56, pa, SERIF);
    label(ctx, "「我从来没做过这个」", cx, cy + 175, 50, a * fin(t, 434.5 + d * 0.25, 0.4), HAND, "246,220,174");
  });
};

export const Seg04: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`],
    "04测试一：把记忆拿掉线索清单→？★0123456789亨利、克莱夫、外婆：没了，人还在发现一：记忆更像是一份记录这那它能不被走复制海马体1953年以后新认识的人刚吃完饭看着镜子里图形，描一颗星星第123天「我从来没做过这个」亨利克莱夫外婆发现：记忆是一份记录他手得不·莫莱森（H.M.）1926–2008美国患者韦尔林1938–英国音乐家资料BBC Four一人和可以分开");
  const t = useT(T04);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => { drawBrain(ctx, tt); drawForget(ctx, tt); drawStars(ctx, tt); }, []);
  return (
    <AbsoluteFill style={{ background: "#08080b" }}>
      {/* 打底：屏幕上的脑部扫描（H.M. 的大脑线稿叠在上面）→ 写字的手（描星星）→ 侦探的案头（线索清单） */}
      <Bed from={T04} clips={[
        { src: "ep01/clips/b_brainscreen.mp4", a: 397.5, b: 412.2, dim: 0.3, blur: 2, flip: true },   // 镜像：画面里的人移到右边，不和大脑线稿叠在一起
        { src: "ep01/clips/b_brainscan.mp4", a: 411.8, b: 423.2, dim: 0.3, blur: 2 },
        { src: "ep01/clips/writing.mp4", a: 422.8, b: 442.3, rate: 0.42, dim: 0.28, blur: 3 },
        { src: DESK, a: 475.4, b: E04, dim: 0.32, blur: 4 },
      ]} />
      {/* 场 17、18 的真实影像 */}
      <Clip src="ep01/clips/clive_piano.mp4" from={T04} a={442.0} b={446.6} zoom={[1.0, 1.04]} fi={0.4} />
      <Clip src="ep01/clips/piano_back.mp4" from={T04} a={446.6} b={452.8} zoom={[1.0, 1.06]} />
      <Clip src="ep01/clips/piano_hands.mp4" from={T04} a={452.8} b={460.0} zoom={[1.0, 1.06]} />
      <Clip src="ep01/clips/s5_hug.mp4" from={T04} a={460.0} b={465.6} start={2.5} zoom={[1.02, 1.07]} />
      <Clip src="ep01/clips/grandma.mp4" from={T04} a={465.6} b={475.8} zoom={[1.0, 1.08]} fo={0.6} />
      <NameBar name="克莱夫·韦尔林" years="1938–  英国音乐家" t={t} a={442.4} b={449.0} />
      <Corner text="资料：BBC Four" t={t} a={442.2} b={446.5} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <NameBar name="亨利·莫莱森（H.M.）" years="1926–2008  美国" t={t} a={400.8} b={407.4} />
      <KeyText text="他的手记得，他不记得" t={t} a={438.7} b={442.0} size={110} font={DISPLAY} />
      <ClueList t={t} a={475.5} b={E04 + 0.6} items={[
        { text: CL.three, at: 476.6 },
        { text: CL.find1, at: 481.0, kind: "find" },
        { text: "一个人，和他的这份记录，是可以分开的", at: 486.5, kind: "sum" },
        { text: "那它能不能被拿走？能不能，被复制？", at: 492.6, kind: "ask" },
      ]} top={210} />
      <Chapter t={t} no="04" title="测试一：把记忆拿掉" at={397.6} end={E04 + 1} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => x > 438.7 && x < 441.9} />
    </AbsoluteFill>
  );
};
void lerp; void SANS;
