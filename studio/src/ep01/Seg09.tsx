// 第 01 期 · 09 最后一条线索（录音 819.3–875.6，之后接品牌片尾）
// 场 32 上香、场 33 去了哪里、场 34 留言
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, KeyText, Subtitles, glow, sec, smooth, useFonts, useT, DISPLAY, HAND } from "./common";
import { Bed, Chapter, ClueList, CL, DESK } from "./kit";

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

// 清单收起以后，只剩一个光点，安静地亮在夜里；最后向外扩成一圈光环，接品牌片尾
const drawEnd = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 855.4, 1.2);
  if (a <= 0) return;
  const breath = 1 + 0.08 * Math.sin(t * 1.4);
  glow(ctx, 960, 470, 80 * breath, 0.85 * a * (1 - 0.5 * fin(t, 867.4, 0.6)));
  const ring = fin(t, 873.6, 2.0);
  if (ring > 0) {
    ctx.strokeStyle = `rgba(255,205,140,${0.35 * ring})`; ctx.lineWidth = 2;
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(960, 470, 130 * k * ring, 40 * k * ring, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
};

export const Seg09: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`], "09最后一条线索清单→？★发现一：记忆，更像是一份记录二你是正在书写过去的人三还有一个看这切留给外婆此刻，正在看着这段记忆的是谁？");
  const t = useT(T09);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => { drawGone(ctx, tt); drawEnd(ctx, tt); }, []);
  return (
    <AbsoluteFill style={{ background: "#060608" }}>
      {/* 打底：一排烛火 → 上香 → 烛火（压暗，衬手写的名字）→ 银河（两颗光飘远）→ 案头（线索清单）→ 夜里的窗（今晚睡前） */}
      <Bed from={T09} clips={[
        { src: "ep01/clips/b_altar.mp4", a: T09, b: 824.3, dim: 0.45 },
        { src: "ep01/clips/b_altar.mp4", a: 831.2, b: 838.2, start: 7, dim: 0.3, blur: 3 },
        { src: "ep01/clips/b_milky.mp4", a: 837.8, b: 847.9, start: 12, dim: 0.5 },
        { src: DESK, a: 847.5, b: 855.4, dim: 0.32, blur: 4 },
        { src: "ep01/clips/b_window.mp4", a: 855.0, b: E09, dim: 0.42, zoom: [1.0, 1.1] },
      ]} />
      <Clip src="ep01/clips/incense.mp4" from={T09} a={823.9} b={831.6} zoom={[1.0, 1.08]} fi={0.8} fo={0.5} style={{ filter: "brightness(0.72)" }} />
      <Name t={t} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <ClueList t={t} a={847.6} b={855.4} items={[
        { text: CL.find1, at: 848.0, kind: "find" },
        { text: CL.find2, at: 848.3, kind: "find" },
        { text: CL.find3, at: 848.6, kind: "find" },
        { text: "最后一条线索，留给你", at: 852.0, kind: "ask" },
      ]} top={250} />
      <Chapter t={t} no="09" title="最后一条线索" at={819.5} end={E09 + 0.5} />
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
    <AbsoluteFill style={{ background: "#050507" }}>
      <Clip src="ep01/clips/b_stars.mp4" from={E09} a={E09} b={E09 + 8} zoom={[1.0, 1.08]} fi={0.6} style={{ filter: "brightness(0.42) saturate(0.85)" }} />
      <Outro transparent />
      <Subtitles t={t} hide={(x) => x > 881.0} />
    </AbsoluteFill>
  );
};
