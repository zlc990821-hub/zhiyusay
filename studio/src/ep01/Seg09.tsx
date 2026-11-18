// 第 01 期 · 09 最后一条线索（录音 819.3–875.6，之后接品牌片尾）
// 场 32 上香、场 33 去了哪里、场 34 留言
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, KeyText, Subtitles, glow, sec, smooth, useFonts, useT, DISPLAY, HAND } from "./common";
import { drawClueMap } from "./clue";

export const T09 = 819.3, E09 = 875.6;
export const SEG09_FRAMES = sec(E09 - T09);
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);

// 一个手写的名字，慢慢变淡
const Name: React.FC<{ t: number }> = ({ t }) => {
  const o = fin(t, 831.2, 0.8) * (1 - fin(t, 837.8, 0.6));
  if (o <= 0) return null;
  const ink = 1 - 0.8 * smooth((t - 832.6) / 5.0);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: o }}>
      <div style={{ width: 900, height: 560, background: "linear-gradient(160deg,#e9dcc2,#d3bf9c)", boxShadow: "0 30px 90px rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", transform: "rotate(-1.5deg)" }}>
        <div style={{ fontFamily: HAND, fontSize: 230, color: `rgba(29,36,51,${ink})`, letterSpacing: 30, filter: `blur(${(1 - ink) * 3}px)` }}>外婆</div>
      </div>
    </AbsoluteFill>
  );
};

// 三颗光：记录留在地上，书写的和看着的飘向黑暗深处
const COL = 960, ROW = { tian: 250, ren: 500, di: 750 };
const drawGone = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 837.9, 0.8) * (1 - fin(t, 847.6, 0.8));
  if (a <= 0) return;
  const drift = smooth((t - 841.6) / 5.0);
  glow(ctx, COL, ROW.di, 66, 0.55 * a);                                                     // 地：写在地上的记录，还在
  glow(ctx, COL - 140 * drift, ROW.ren - 260 * drift, 66 * (1 - 0.6 * drift), 0.85 * a * (1 - 0.8 * drift) * fin(t, 838.2, 0.4));  // 人：书写的那一个
  glow(ctx, COL + 120 * drift, ROW.tian - 200 * drift, 78 * (1 - 0.6 * drift), 0.9 * a * (1 - 0.8 * drift) * fin(t, 839.6, 0.4)); // 天：看着的那一个
};

// 整张线索图暗下来，只剩一个光点；最后它安静地亮着，变成片尾的光环
const drawEnd = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 847.6, 0.8);
  if (a <= 0) return;
  const dim = fin(t, 849.0, 2.5);
  const mapA = a * (1 - fin(t, 852.4, 1.5));
  if (mapA > 0) drawClueMap(ctx, t, { vis: () => mapA, bright: (id) => (id === "found3" ? 1.2 : 1 - 0.9 * dim), label: () => 0, scale: 0.92 });
  // 剩下的那一个光点移到画面中间，安静地亮着
  const mv = smooth((t - 851.9) / 2.0);
  const fx = 960 + (1420 - 960) * 0.92, fy = 540 + (900 - 540) * 0.92;
  const x = fx + (960 - fx) * mv, y = fy + (470 - fy) * mv;
  const breath = 1 + 0.08 * Math.sin(t * 1.4);
  glow(ctx, x, y, (70 + 30 * mv) * breath, 0.95 * a);
  // 结尾：光点向外扩成一圈光环，接品牌片尾
  const ring = fin(t, 873.6, 2.0);
  if (ring > 0) {
    ctx.strokeStyle = `rgba(255,205,140,${0.35 * ring})`; ctx.lineWidth = 2;
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(960, 470, 130 * k * ring, 40 * k * ring, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
};

export const Seg09: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`], "外婆此刻，正在看着这段记忆的是谁？");
  const t = useT(T09);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => { drawGone(ctx, tt); drawEnd(ctx, tt); }, []);
  return (
    <AbsoluteFill style={{ background: "#060608" }}>
      <Clip src="ep01/clips/incense.mp4" from={T09} a={823.9} b={831.6} zoom={[1.0, 1.08]} fi={0.8} fo={0.5} />
      <Name t={t} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <KeyText text="此刻，正在看着这段记忆的，是谁？" t={t} a={867.6} b={872.8} size={84} font={DISPLAY} y={-260} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => x > 867.7 && x < 872.7} />
    </AbsoluteFill>
  );
};

// 品牌片尾（离心力 + 口号），叠上最后一句的字幕；录音时间 875.6 起
import { Outro } from "../brand/Outro";
export const OUTRO_FRAMES = 240;
export const Ep01Outro: React.FC = () => {
  const t = useT(E09);
  return (
    <AbsoluteFill>
      <Outro />
      <Subtitles t={t} hide={(x) => x > 881.0} />
    </AbsoluteFill>
  );
};
