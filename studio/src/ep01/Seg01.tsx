// 第 01 期 · 01 先立一个常识（录音 73.4–137.9）—— 2026-11-19 改版：素材打底，代码只做叠加
// 记忆对调：两个熟睡的人（分屏）头顶各一团记忆光，光互换 → 醒来的人头顶是她的光
// 洛克：古旧书库打底，肖像 + 「王子」「鞋匠」两个小窗，光从王子流向鞋匠
// 常识：照镜子的人，字一句句浮现 → 线索清单
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, KeyText, Still, Subtitles, sec, smooth, useFonts, useT, DISPLAY, SERIF, SANS, GOLD } from "./common";
import { crown, memoryOrb, label, chip } from "./figures";
import { Bed, Chapter, ClueList, Veil, DESK, CL } from "./kit";

export const T01 = 73.4, E01 = 137.9;
export const SEG01_FRAMES = sec(E01 - T01);
const GOLD_RGB = "255,200,130", BLUE_RGB = "140,185,255";
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);

// 分屏里两个人的头顶位置（按素材画面量出来的）
const HEAD_A = { x: 672, y: 250 }, HEAD_B = { x: 1344, y: 330 };
// 醒来的人头顶
const HEAD_W = { x: 900, y: 175 };

const drawSwap = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 77.6, 0.6) * (1 - fin(t, 104.8, 0.5));
  if (a <= 0) return;
  if (t < 85.2) {
    // 两团记忆光：金色是你的，蓝色是她的；83.4 起互换
    const sw = smooth((t - 83.4) / 1.6);
    const arc = Math.sin(sw * Math.PI) * 170;
    memoryOrb(ctx, lerp(HEAD_A.x, HEAD_B.x, sw), lerp(HEAD_A.y, HEAD_B.y, sw) - arc, 52, a * fin(t, 78.8, 0.6), GOLD_RGB, t);
    memoryOrb(ctx, lerp(HEAD_B.x, HEAD_A.x, sw), lerp(HEAD_B.y, HEAD_A.y, sw) - arc, 52, a * fin(t, 82.0, 0.6), BLUE_RGB, t + 1);
  } else {
    // 醒来的人，头顶是她的光；记得的是她的一生
    memoryOrb(ctx, HEAD_W.x, HEAD_W.y, 56, a * fin(t, 85.6, 0.8), BLUE_RGB, t);
    const chips: [string, number, number, number][] = [["她的童年", 91.6, -330, 70], ["她爱过的人", 93.8, 0, 150], ["昨晚吃了什么", 95.6, 340, 70]];
    chips.forEach(([txt, at, dx, dy]) => chip(ctx, txt, HEAD_W.x + dx, HEAD_W.y + dy, 52, a * fin(t, at, 0.5) * (1 - fin(t, 96.9, 0.5)), SERIF, BLUE_RGB));
  }
};

// 洛克：光从「王子」窗口流向「鞋匠」窗口
const WIN_P = { x: 900, y: 300, w: 440, h: 300 }, WIN_C = { x: 1400, y: 300, w: 440, h: 300 };
const drawLocke = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 105.6, 0.6) * (1 - fin(t, 119.6, 0.5));
  if (a <= 0) return;
  const flow = smooth((t - 114.4) / 2.0);
  const px = WIN_P.x + WIN_P.w / 2, cx = WIN_C.x + WIN_C.w / 2, y = WIN_P.y - 10;
  const x = lerp(px, cx, flow), yy = y - Math.sin(flow * Math.PI) * 120;
  memoryOrb(ctx, x, yy, 40, a * fin(t, 111.1, 0.7), GOLD_RGB, t);
  const still = fin(t, 117.4, 0.6);
  crown(ctx, cx, WIN_C.y - 50, 1.1, a * still);
  label(ctx, "还是王子", cx, WIN_C.y + WIN_C.h + 150, 68, a * still, DISPLAY, "255,215,160");
};

const Win: React.FC<{ t: number; box: typeof WIN_P; src: string; name: string; at: number; dimAt?: number }> = ({ t, box, src, name, at, dimAt }) => {
  const o = fin(t, at, 0.6) * (1 - fin(t, 119.6, 0.5));
  if (o <= 0) return null;
  const dim = dimAt !== undefined ? 1 - 0.55 * fin(t, dimAt, 1.2) : 1;
  return (
    <>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, overflow: "hidden", borderRadius: 14, opacity: o,
        boxShadow: "0 0 0 2px rgba(231,184,115,0.55), 0 24px 60px rgba(0,0,0,0.7)", filter: `brightness(${dim})` }}>
        <Clip src={src} from={T01} a={105.3} b={120.1} zoom={[1.05, 1.12]} style={{ filter: "brightness(0.85)" }} />
      </div>
      <div style={{ position: "absolute", left: box.x, width: box.w, top: box.y + box.h + 18, textAlign: "center", fontFamily: SERIF, fontSize: 60, color: GOLD, opacity: o,
        textShadow: "0 0 12px rgba(0,0,0,0.9)" }}>{name}</div>
    </>
  );
};

// 分屏：你 / 好朋友
const Split: React.FC<{ t: number }> = ({ t }) => {
  const o = fin(t, 77.3, 0.6) * (1 - fin(t, 85.1, 0.5));
  if (o <= 0) return null;
  const half = (left: boolean, src: string, name: string, at: number) => (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: left ? 0 : 966, width: 954, overflow: "hidden", opacity: fin(t, at, 0.6) }}>
      <Clip src={src} from={T01} a={77.3} b={85.6} zoom={[1.02, 1.08]} style={{ filter: `brightness(0.72) saturate(0.85)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: SERIF, fontSize: 64, color: GOLD, letterSpacing: 6,
        textShadow: "0 0 16px rgba(0,0,0,0.95)" }}>{name}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {half(true, "ep01/clips/b_sleep_a.mp4", "你", 77.3)}
      {half(false, "ep01/clips/b_sleep_b.mp4", "好朋友", 80.9)}
      <div style={{ position: "absolute", left: 957, width: 6, top: 0, bottom: 0, background: "#0b0a09" }} />
    </AbsoluteFill>
  );
};

// 问题卡：是你，还是她？
const Question: React.FC<{ t: number }> = ({ t }) => {
  const o = fin(t, 97.1, 0.6) * (1 - fin(t, 104.8, 0.5));
  if (o <= 0) return null;
  const hot = fin(t, 102.8, 0.4);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: o }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 120, color: GOLD, letterSpacing: 10, textShadow: "0 0 30px rgba(0,0,0,0.9)", transform: "translateY(-40px)" }}>
        是你，还是<span style={{ color: `rgb(${Math.round(lerp(243, 160, hot))},${Math.round(lerp(230, 200, hot))},${Math.round(lerp(208, 255, hot))})`, textShadow: hot > 0.5 ? "0 0 30px rgba(140,185,255,0.8)" : "none" }}>她</span>？
      </div>
    </AbsoluteFill>
  );
};

export const Seg01: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`],
    "01先立一个常识你好朋友她的童年爱过的人昨晚吃了什么是你，还是？王子鞋匠还是约翰·洛克1632–1704我之所以，因为记得一生就记忆线索清单：＝");
  const t = useT(T01);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => { drawSwap(ctx, tt); drawLocke(ctx, tt); }, []);
  const lockeA = fin(t, 105.6, 0.6) * (1 - fin(t, 119.6, 0.5));
  return (
    <AbsoluteFill style={{ background: "#0b0a09" }}>
      <Bed from={T01} clips={[
        { src: "ep01/clips/b_bedroom.mp4", a: 73.4, b: 77.8, dim: 0.5 },
        { src: "ep01/clips/b_wake.mp4", a: 84.9, b: 105.5, rate: 0.62, dim: 0.62 },
        { src: "ep01/clips/b_oldlib.mp4", a: 105.0, b: 120.4, dim: 0.42 },
        { src: "ep01/clips/b_mirror.mp4", a: 120.0, b: 130.6, dim: 0.5 },
        { src: DESK, a: 130.1, b: 137.9, dim: 0.32, blur: 4 },
      ]} />
      <Split t={t} />
      <Veil t={t} a={97.0} b={105.3} k={0.5} />
      {/* 洛克 */}
      <Still src="ep01/raw/locke.jpg" from={T01} a={105.3} b={120.1} zoom={[1.0, 1.05]} height={600} x={-560} y={-60} fade={0.6} bg="transparent" />
      {lockeA > 0 ? (
        <div style={{ position: "absolute", left: 400 - 300, width: 600, top: 790, textAlign: "center", opacity: lockeA, textShadow: "0 0 10px rgba(0,0,0,0.9)" }}>
          <span style={{ fontFamily: SERIF, fontSize: 56, color: "#f3e6d0", letterSpacing: 4 }}>约翰·洛克</span>
          <span style={{ fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.75)", marginLeft: 20 }}>1632–1704</span>
        </div>
      ) : null}
      <Win t={t} box={WIN_P} src="ep01/clips/b_castle.mp4" name="王子" at={108.0} dimAt={114.6} />
      <Win t={t} box={WIN_C} src="ep01/clips/b_cobbler.mp4" name="鞋匠" at={110.4} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <Question t={t} />
      {/* 常识：一句句浮现 */}
      <Veil t={t} a={123.2} b={130.4} k={0.35} />
      <KeyText text="我之所以是我，" t={t} a={123.4} b={128.3} size={76} font={SERIF} y={-70} />
      <KeyText text="是因为我记得我的一生" t={t} a={125.0} b={128.3} size={76} font={SERIF} y={40} />
      <KeyText text="我，就是我的记忆" t={t} a={128.4} b={130.6} size={124} font={DISPLAY} />
      <ClueList t={t} a={130.3} b={E01 + 0.6} items={[{ text: CL.common, at: 130.6, crackAt: 135.3 }]} top={300} />
      <Chapter t={t} no="01" title="先立一个常识" at={73.6} end={E01 + 1} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => (x > 97.0 && x < 100.6) || (x > 123.4 && x < 130.1)} />
    </AbsoluteFill>
  );
};
