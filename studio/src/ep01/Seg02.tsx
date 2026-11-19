// 第 01 期 · 02 第一道裂缝（不含碎玻璃那一场）
// Seg02a 137.9–196.0：场 8 皮亚杰的假童年；Seg02c 237.5–270.9：场 10 商场里走丢、场 11 小结
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useCallback } from "react";
import { Bed, Chapter, ClueList, CL, DESK } from "./kit";
import { Canvas, Clip, Corner, Film, KeyText, NameBar, Still, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, HAND, SERIF, SANS, GOLD } from "./common";

export const T02A = 137.9, E02A = 196.0, T02C = 237.5, E02C = 270.9;
export const SEG02A_FRAMES = sec(E02A - T02A), SEG02C_FRAMES = sec(E02C - T02C);

const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);

// 「他记得的画面」：固定的画框标签
const FrameTag: React.FC<{ t: number; a: number; b: number; text: string }> = ({ t, a, b, text }) => {
  const o = fin(t, a, 0.6) * (1 - fin(t, b - 0.5, 0.5));
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 270, top: 124, padding: "8px 22px", borderRadius: 30, background: "rgba(15,13,11,0.75)", border: "1.5px solid rgba(231,184,115,0.45)",
      fontFamily: SERIF, fontSize: 50, color: GOLD, letterSpacing: 4, opacity: o }}>{text}</div>
  );
};

// 保姆的信：手写，从右边滑进来，压在定格画面上
const Letter: React.FC<{ t: number }> = ({ t }) => {
  const inn = fin(t, 175.6, 0.9), out = fin(t, 184.4, 0.6);
  if (inn <= 0 || out >= 1) return null;
  const lines: [string, number][] = [["皮亚杰先生、太太：", 176.2], ["我信了教，想要忏悔。", 178.0], ["当年那块手表，", 180.6], ["我要还给你们。", 181.6]];
  return (
    <div style={{ position: "absolute", left: 1010 + (1 - inn) * 900, top: 170 + out * 400, width: 640, height: 640, opacity: 1 - out,
      transform: `rotate(${-3 + out * 18}deg)`, background: "linear-gradient(160deg,#ece0c6,#d5c29f)", boxShadow: "0 30px 80px rgba(0,0,0,0.75)", padding: "60px 56px", boxSizing: "border-box" }}>
      {lines.map(([s, at], i) => (
        <div key={i} style={{ fontFamily: HAND, fontSize: 58, color: "#1d2433", lineHeight: 1.6, opacity: fin(t, at, 0.5), whiteSpace: "nowrap" }}>{s}</div>
      ))}
    </div>
  );
};

// 「整件事都是她编的」：定格的画面像纸一样从中间撕开
const TEAR = Array.from({ length: 13 }, (_, i) => [52 + (rand(i, 3) - 0.5) * 7, (i / 12) * 100]);
const Torn: React.FC<{ t: number }> = ({ t }) => {
  if (t < 169.5 || t > 189.6) return null;
  const a = fin(t, 169.5, 0.3);
  const tear = smooth((t - 184.3) / 1.3);
  const z = 1 + 0.08 * clamp((t - 169.5) / 14);
  const left = `polygon(0% 0%, ${TEAR.map(([x, y]) => `${x}% ${y}%`).join(", ")}, 0% 100%)`;
  const right = `polygon(100% 0%, ${TEAR.map(([x, y]) => `${x}% ${y}%`).join(", ")}, 100% 100%)`;
  const half = (clip: string, dir: number) => (
    <AbsoluteFill style={{ clipPath: clip, transform: `translateX(${dir * tear * 620}px) rotate(${dir * tear * 7}deg)`, opacity: a * (1 - fin(t, 186.4, 0.8)) }}>
      <Img src={staticFile("ep01/raw/carriage_still.jpg")} style={{ width: "100%", height: "100%", transform: `scale(${z})` }} />
    </AbsoluteFill>
  );
  return <>{half(left, -1)}{half(right, 1)}</>;
};


export const Seg02a: React.FC = () => {
  useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`],
    "02第一道裂缝：记忆可以被写进去让·皮亚杰瑞士心理学家他记得的画面卢米埃尔兄弟约皮亚杰先生、太太：我信了教，想要忏悔。当年那块手表，要还给你们常识＝的假童年1896–1980");
  const t = useT(T02A);
  return (
    <AbsoluteFill style={{ background: "#0b0a09" }}>
      <Bed from={T02A} clips={[
        { src: "ep01/clips/b_kids.mp4", a: 137.9, b: 150.8, dim: 0.38, blur: 2 },
      ]} />
      <Still src="ep01/raw/piaget.png" from={T02A} a={T02A} b={150.5} zoom={[1.0, 1.06]} height={880} x={300} fade={0.5} bg="transparent" />
      <NameBar name="让·皮亚杰" years="1896–1980  瑞士心理学家" t={t} a={141.2} b={150.0} />
      {/* 他「记得」的画面：一个固定的老胶片画框，里面依次换镜头 */}
      <Clip src="ep01/clips/lum_carriage.mp4" from={T02A} a={150.3} b={157.4} zoom={[1.0, 1.05]} fi={0.4} />
      <Clip src="ep01/clips/lum_crowd.mp4" from={T02A} a={157.4} b={163.8} zoom={[1.0, 1.04]} />
      <Clip src="ep01/clips/lum_police.mp4" from={T02A} a={163.8} b={169.6} zoom={[1.0, 1.04]} />
      <Torn t={t} />
      <Letter t={t} />
      <FrameTag t={t} a={150.6} b={184.4} text="他记得的画面" />
      <Corner text="卢米埃尔兄弟，约 1896" t={t} a={150.6} b={184.4} />
      {/* 「两岁的记忆，记错很正常」→ 孩子；「那成年人呢？」→ 车站里的大人 */}
      <Bed from={T02A} clips={[
        { src: "ep01/clips/b_kids.mp4", a: 186.2, b: 193.9, start: 4, dim: 0.62 },
        { src: "ep01/clips/b_commute.mp4", a: 193.5, b: E02A, dim: 0.62 },
      ]} />
      <Chapter t={t} no="02" title="第一道裂缝：记忆可以被写进去" at={138.0} end={E02A + 1} />
      <Film t={t} />
      <Subtitles t={t} />
    </AbsoluteFill>
  );
};

// ---------------- Seg02c：商场里走丢 ----------------
const People: React.FC<{ t: number }> = ({ t }) => {
  const o = fin(t, 246.4, 0.6) * (1 - fin(t, 253.0, 0.5));
  if (o <= 0) return null;
  const lit = fin(t, 249.9, 0.5);
  return (
    <div style={{ position: "absolute", left: 270, top: 130, padding: "20px 30px", borderRadius: 18, background: "rgba(14,12,10,0.8)", border: "1.5px solid rgba(231,184,115,0.4)", opacity: o, display: "flex", alignItems: "center", gap: 26 }}>
      {[0, 1, 2, 3].map((i) => {
        const on = i === 0 ? lit : 0;
        const c = on > 0.5 ? "#f2b066" : "rgba(240,225,200,0.35)";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: on > 0.5 ? "drop-shadow(0 0 12px rgba(242,176,102,0.9))" : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: c }} />
            <div style={{ width: 48, height: 58, borderRadius: "22px 22px 6px 6px", background: c, marginTop: 6 }} />
          </div>
        );
      })}
      <div style={{ fontFamily: SANS, fontSize: 64, color: GOLD, opacity: lit, marginLeft: 10 }}>约 1/4</div>
    </div>
  );
};
const Recall: React.FC<{ t: number; text: string; at: number; x: number; y: number }> = ({ t, text, at, x, y }) => {
  const o = fin(t, at, 0.7) * (1 - fin(t, 258.9, 0.6));
  if (o <= 0) return null;
  return <div style={{ position: "absolute", left: x, top: y, fontFamily: HAND, fontSize: 76, color: "#f6dcae", opacity: o, transform: `translateY(${(1 - o) * 14}px) rotate(-2deg)`,
    textShadow: "0 0 22px rgba(255,170,90,0.75), 0 2px 6px rgba(0,0,0,0.9)" }}>{text}</div>;
};


export const Seg02c: React.FC = () => {
  useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`],
    "02第一道裂缝：记忆可以被写进去线索清单→？★0123456789只要没人来改，的总是可靠吧清清楚楚童年是别编换一个就多出碎玻璃没发生过事也能想起来从外面约1/4我在哭……一个老人牵着我资料：普林格档案，百货公司老片记忆，可以从外面被写进去常识＝的皮亚杰假童年一个词撒下地碎玻璃商场里走丢过");
  const t = useT(T02C);
  return (
    <AbsoluteFill style={{ background: "#0b0a09" }}>
      <Bed from={T02C} clips={[
        { src: "ep01/clips/store_a.mp4", a: 237.5, b: 246.7, dim: 0.85, sat: 1 },
        { src: "ep01/clips/store_arcade.mp4", a: 246.4, b: 251.3, dim: 0.85, sat: 1, zoom: [1.02, 1.06] },
        { src: "ep01/clips/store_b.mp4", a: 251.0, b: 259.7, rate: 0.78, dim: 0.85, sat: 1, zoom: [1.0, 1.08] },
        { src: DESK, a: 259.3, b: E02C, dim: 0.32, blur: 4 },
      ]} />
      <People t={t} />
      <Recall t={t} text="我在哭……" at={253.2} x={330} y={150} />
      <Recall t={t} text="一个老人牵着我" at={255.4} x={900} y={260} />
      <Corner text="资料：普林格档案，百货公司老片" t={t} a={240.4} b={259.0} />
      <ClueList t={t} a={259.3} b={E02C + 0.6} items={[
        { text: CL.common, at: 259.6, crackAt: 259.6 },
        { text: CL.piaget, at: 260.2 },
        { text: CL.loftus, at: 260.8 },
        { text: CL.mall, at: 261.4 },
        { text: CL.sumIn, at: 262.3, kind: "sum" },
        { text: "只要没人来改，我的记忆总是可靠的吧？", at: 265.2, kind: "ask" },
      ]} />
      <Chapter t={t} no="02" title="第一道裂缝：记忆可以被写进去" at={138.0} end={E02C + 1} />
      <Film t={t} />
      <Subtitles t={t} />
    </AbsoluteFill>
  );
};
void glow;
