// EP01 style C, part 2 (46 s → end). Same particle system, same world camera as part 1.
// Shot list & transitions: see episodes/EP01_存在/SHOTLIST_C.md
import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, easeOut, fade, keyNum, rng } from "../components/anim";
import { COLORS, FONT_SANS, FONT_SERIF, LAYERS, loadFonts } from "../components/theme";
import { Key, N, paint, solid, StateDef } from "./Stage";
import { Mask, sample } from "./sampler";
import { Place, SIL } from "./silhouettes";

const W = 1920, H = 1080;
loadFonts("引力核力空间能量疏密起伏约1/100000宇宙早期物质的小十倍聚不成星系大坍缩黑洞霍伊尔·1953恒星怎么造出这么多碳？碳原子核的能级预言实验证实✓微调Fine-tuning道格拉斯亚当斯《银河系漫游指南》作者年演讲“这个坑，是专门为我挖的”人择原理布兰登卡特尚无法观测验证多重宇宙程度也有争议纯属偶然更深的原因一二三莱布尼茨自然与神恩的原则为什么有东西存在而不是什么都没有不知道所以继续探索下一期你看到的世界真吗今天未来38亿前科学古籍哲学");
type V = [number, number, number];

// ───────── world layout ─────────
const COS = { x: 900, y: 520 };          // cosmos centred on where the Earth was
const STAR = { x: 1500, y: 300 };         // the galaxy/star we push into
const PIT = { x: 1500, y: 880, w: 330, d: 230 };
const BUB = { x: 1500, y: 780, r: 270 };  // our bubble (contains the puddle)
const END = { x: 960, y: 470 };
const FIG2: Place = { cx: 960, cy: 470, size: 600 };
const MINI: Place = { cx: BUB.x, cy: BUB.y - 30, size: 170 };

export const CAMK2: [number, number, number, number][] = [
  [46.2, 900, 520, 1.0], [49.4, 900, 520, 0.42], [66.8, 900, 520, 0.42], [69.6, STAR.x, STAR.y, 1.6], [90.6, STAR.x, STAR.y, 1.6],
  [93.4, PIT.x, 760, 1.0], [116.6, PIT.x, 760, 1.0], [119.8, BUB.x, BUB.y, 0.5], [123.6, BUB.x, BUB.y, 0.5], [128.0, BUB.x, BUB.y, 0.72],
  [153.8, BUB.x, BUB.y, 0.72], [158.6, BUB.x, BUB.y, 1.0], [170.4, BUB.x, BUB.y, 1.0], [172.4, 960, 540, 1.0],
];

const LIN2 = [["cell", 172.2], ["fish", 173.1], ["lizard", 174.0], ["shrew", 174.9], ["ape", 175.8], ["human2", 176.7]] as const;
export const KEYS2: Key[] = [
  [46.2, "globe"], [49.2, "cosmos"], [61.4, "cosmos"], [62.6, "haze"], [63.8, "haze"], [64.9, "holes"], [66.6, "holes"], [67.6, "cosmos"],
  [68.2, "cosmos"], [70.0, "star"], [74.4, "star"], [75.8, "triple"], [79.2, "triple"], [80.4, "carbon"], [90.4, "carbon"], [91.6, "drop"],
  [92.6, "puddle"], [106.4, "puddle"], [110.6, "vapor"], [111.2, "vapor"], [114.6, "puddle"], [116.6, "puddle"], [119.6, "bubbles"],
  [154.6, "bubbles"], [157.6, "pointB"], [171.2, "pointB"], [172.2, "cell2"],
  ...LIN2.slice(1).map(([k, at]): Key => [at, k === "human2" ? "human2" : `${k}2`]),
  [187.6, "human2"], [188.8, "pointE"],
];

// ───────── states ─────────
export const addStates2 = (S: Record<string, StateDef>, m: Record<string, Mask>) => {
  const g = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
  // cosmos: clumpy galaxies around the old Earth position; one clump sits exactly where Earth was
  const cr = rng(21);
  const centers: [number, number][] = [[COS.x, COS.y], [STAR.x, STAR.y]];
  for (let k = 0; k < 80; k++) centers.push([COS.x + (cr() - 0.5) * 4200, COS.y + (cr() - 0.5) * 2300]);
  const cos = new Float32Array(N * 2), haze = new Float32Array(N * 2), holes = new Float32Array(N * 2);
  const r = rng(22);
  for (let i = 0; i < N; i++) {
    const c = centers[i % 5 === 0 ? 0 : i % centers.length];
    const s = i % 5 === 0 ? 30 : 40 + 60 * ((i % 7) / 7);
    const field = i % 6 === 0;
    cos[i * 2] = field ? COS.x + (r() - 0.5) * 4400 : c[0] + g(r) * s * 1.4;
    cos[i * 2 + 1] = field ? COS.y + (r() - 0.5) * 2500 : c[1] + g(r) * s;
    haze[i * 2] = COS.x + (r() - 0.5) * 4400; haze[i * 2 + 1] = COS.y + (r() - 0.5) * 2500;
    const h = centers[2 + (i % 9) * 7];
    holes[i * 2] = h[0] + g(r) * 14; holes[i * 2 + 1] = h[1] + g(r) * 14;
  }
  S.cosmos = { pos: cos, col: paint((i, rr) => (i % 5 === 0 ? [0.4, 0.9, 0.62] : rr() < 0.2 ? [1, 0.82, 0.6] : [0.75, 0.82, 1.0])), bright: Float32Array.from({ length: N }, (_, i) => (i % 5 === 0 ? 1.0 : 2.4)) };
  S.haze = { pos: haze, col: solid([0.6, 0.7, 0.95]), bright: new Float32Array(N).fill(1.8) };
  S.holes = { pos: holes, col: solid([1, 0.45, 0.35], [0.9, 0.4, 0.9], 0.3), bright: new Float32Array(N).fill(2.0) };

  // star → three helium nuclei → carbon nucleus (all at STAR)
  const ball = (cx: number, cy: number, rad: number, i: number, rr: () => number) => {
    const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * rad;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  };
  const star = new Float32Array(N * 2), tri = new Float32Array(N * 2), carb = new Float32Array(N * 2);
  const nuc: [number, number][] = [];
  for (let k = 0; k < 12; k++) { const a = k * 2.4, d = 22 + 14 * Math.sqrt(k); nuc.push([STAR.x + Math.cos(a) * d * 1.6, STAR.y + Math.sin(a) * d * 1.6]); }
  for (let i = 0; i < N; i++) {
    const [sx, sy] = i % 4 === 0 ? ball(STAR.x, STAR.y, 230, i, r) : ball(STAR.x, STAR.y, 165, i, r);
    star[i * 2] = sx; star[i * 2 + 1] = sy;
    const k = i % 3, ang = -Math.PI / 2 + (k * 2 * Math.PI) / 3;
    const [tx, ty] = ball(STAR.x + Math.cos(ang) * 120, STAR.y + Math.sin(ang) * 120, 62, i, r);
    tri[i * 2] = tx; tri[i * 2 + 1] = ty;
    const n = nuc[i % 12];
    const [cx, cy] = ball(n[0], n[1], 26, i, r);
    carb[i * 2] = cx; carb[i * 2 + 1] = cy;
  }
  S.star = { pos: star, col: solid([1, 0.8, 0.45], [1, 0.6, 0.35], 0.3), bright: new Float32Array(N).fill(0.7) };
  S.triple = { pos: tri, col: solid([1, 0.86, 0.6], [0.7, 0.85, 1], 0.2) };
  S.carbon = { pos: carb, col: paint((i) => (i % 12 < 6 ? [1, 0.82, 0.45] : [0.65, 0.82, 1.0])) };

  // water drop, puddle, vapour
  const drop = new Float32Array(N * 2), pud = new Float32Array(N * 2), vap = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    const [dx, dy] = ball(PIT.x, 610, 34, i, r);
    drop[i * 2] = dx; drop[i * 2 + 1] = dy;
    for (;;) {
      const x = (r() * 2 - 1) * PIT.w, y = r() * PIT.d;
      if ((x / PIT.w) ** 2 + (y / PIT.d) ** 2 < 0.93 && y > 6) { pud[i * 2] = PIT.x + x; pud[i * 2 + 1] = PIT.y + y; break; }
    }
    vap[i * 2] = PIT.x + g(r) * 260; vap[i * 2 + 1] = PIT.y - 140 - Math.abs(g(r)) * 260 - r() * 120;
  }
  S.drop = { pos: drop, col: solid([0.55, 0.8, 1.0]), bright: new Float32Array(N).fill(0.8) };
  S.puddle = { pos: pud, col: solid([0.45, 0.72, 1.0], [0.85, 0.95, 1], 0.2) };
  S.vapor = { pos: vap, col: solid([0.75, 0.85, 1.0]), bright: new Float32Array(N).fill(0.55) };

  // bubbles: many universes; ours (centred on the puddle) is lit
  const bb = rng(23);
  const bubs = Array.from({ length: 36 }, (_, k) => (k === 0 ? { x: BUB.x, y: BUB.y, r: BUB.r } : { x: BUB.x + (bb() - 0.5) * 3900, y: BUB.y + (bb() - 0.5) * 2200, r: 60 + bb() * 150 }))
    .map((b, k) => (k > 0 && Math.hypot(b.x - BUB.x, b.y - BUB.y) < 480 ? { ...b, x: b.x + (b.x < BUB.x ? -420 : 420) } : b));
  const bub = new Float32Array(N * 2);
  const ours = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const k = i % 4 === 0 ? 0 : i % bubs.length;
    ours[i] = k === 0 ? 1 : 0;
    const b = bubs[k], a = r() * Math.PI * 2, rad = b.r * (i % 3 === 0 ? Math.sqrt(r()) : 0.97 + r() * 0.06);
    bub[i * 2] = b.x + Math.cos(a) * rad; bub[i * 2 + 1] = b.y + Math.sin(a) * rad;
  }
  S.bubbles = {
    pos: bub, col: paint((i) => (ours[i] ? [1, 0.85, 0.55] : [0.6, 0.7, 1.0])),
    bright: (t, out) => {
      const lit = clamp((t - 120.8) / 1.6) * (1 - clamp((t - 153.6) / 1.2));
      for (let i = 0; i < N; i++) out[i] = ours[i] ? 1.0 + 1.4 * lit : 1.6 - 0.9 * lit;
    },
  };

  const pB = new Float32Array(N * 2), pE = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    pB[i * 2] = BUB.x + (r() - 0.5) * 6; pB[i * 2 + 1] = BUB.y + (r() - 0.5) * 6;
    pE[i * 2] = END.x + (r() - 0.5) * 6; pE[i * 2 + 1] = END.y - 120 + (r() - 0.5) * 6;
  }
  S.pointB = { pos: pB, col: solid([1, 0.92, 0.78]), bright: new Float32Array(N).fill(0.3) };
  S.pointE = { pos: pE, col: solid([1, 0.92, 0.78]), bright: new Float32Array(N).fill(0.35) };

  // the lineage replay
  const cols: Record<string, V> = { cell: [0.5, 0.9, 0.85], fish: [0.55, 0.8, 1], lizard: [0.6, 0.95, 0.65], shrew: [1, 0.78, 0.55], ape: [1, 0.72, 0.48] };
  for (const k of Object.keys(cols)) S[`${k}2`] = { pos: sample(m[k], N, FIG2, 60 + k.length), col: solid(cols[k]) };
  S.human2 = { pos: sample(m.human, N, FIG2, 70), col: solid([1, 0.85, 0.58]) };
};

// ───────── overlays ─────────
type CamT = (c: { x: number; y: number; z: number }) => string;
const Outline: React.FC<{ id: string; k: string; p: Place; t: number; a: number; b: number; strength?: number }> = ({ id, k, p, t, a, b, strength = 0.85 }) => {
  const o = fade(t, a, b, 0.35, 0.35);
  if (o <= 0) return null;
  const rev = easeOut(clamp((t - a) / 0.8));
  return (
    <g opacity={o * strength}>
      <clipPath id={`c2-${id}`}><rect x={p.cx - p.size / 2 - 20} y={p.cy + p.size / 2 + 20 - (p.size + 40) * rev} width={p.size + 40} height={(p.size + 40) * rev} /></clipPath>
      <g clipPath={`url(#c2-${id})`}>
        <g filter="url(#gold-outline)" transform={`translate(${p.cx - p.size / 2},${p.cy - p.size / 2}) scale(${p.size / 600})`} dangerouslySetInnerHTML={{ __html: SIL[k] }} />
      </g>
    </g>
  );
};

const Callout: React.FC<{ t: number; a: number; b: number; big: string; small: string; y?: number; x?: number; large?: boolean }> = ({ t, a, b, big, small, y = 0.06, x = 0.5, large }) => {
  const o = fade(t, a, b, 0.45, 0.45);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%, ${(1 - easeOut(clamp((t - a) / 0.6))) * 14}px)`, textAlign: "center", opacity: o, whiteSpace: "nowrap" }}>
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: large ? 96 : 64, letterSpacing: large ? 16 : 4, color: COLORS.text, textShadow: "0 0 30px rgba(0,0,0,0.85)" }}>{big}</div>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, letterSpacing: 4, color: COLORS.dim, marginTop: 8 }}>{small}</div>
    </div>
  );
};

const Knobs: React.FC<{ t: number }> = ({ t }) => {
  const o = fade(t, 49.6, 67.6, 0.8, 0.8);
  if (o <= 0) return null;
  const labels = ["引力", "核力", "空间能量", "疏密起伏"];
  const turn = keyNum(t, [[56.5, 0], [61.4, 0], [62.4, -70], [63.8, -70], [64.8, 75], [66.6, 75], [67.4, 0]]);
  return (
    <div style={{ position: "absolute", bottom: 150, width: "100%", display: "flex", justifyContent: "center", gap: 110, opacity: o }}>
      {labels.map((l, i) => {
        const p = easeOut(clamp((t - 49.8 - i * 0.25) / 0.5));
        const focus = i === 3 ? clamp((t - 56.5) / 0.5) : 0;
        const dim = t > 56.5 ? (i === 3 ? 1 : 0.35) : 1;
        const wig = t > 53 && t < 56.4 ? 20 * Math.sin((t - 53) * 6 + i * 1.7) * Math.sin(((t - 53) / 3.4) * Math.PI) : 0;
        const ang = (i === 3 ? turn : 0) + wig;
        const c = i === 3 && focus > 0 ? "#f2c94c" : "#f4f1ea";
        return (
          <div key={l} style={{ textAlign: "center", opacity: p * dim, transform: `translateY(${(1 - p) * 16}px)` }}>
            <svg width="110" height="110" viewBox="-55 -55 110 110">
              <circle r="44" fill="rgba(10,12,18,0.55)" stroke={c} strokeOpacity={0.5 + 0.5 * focus} strokeWidth="1.5" />
              {Array.from({ length: 11 }, (_, k) => { const a = (-135 + k * 27) * (Math.PI / 180); return <line key={k} x1={Math.sin(a) * 48} y1={-Math.cos(a) * 48} x2={Math.sin(a) * 53} y2={-Math.cos(a) * 53} stroke="rgba(244,241,234,0.4)" strokeWidth="1.2" />; })}
              <line x1="0" y1="0" x2={Math.sin((ang * Math.PI) / 180) * 34} y2={-Math.cos((ang * Math.PI) / 180) * 34} stroke={c} strokeWidth="3" strokeLinecap="round" />
              <circle r="5" fill={c} />
            </svg>
            <div style={{ fontFamily: FONT_SANS, fontSize: 26, letterSpacing: 4, color: COLORS.text, marginTop: 6 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

const Levels: React.FC<{ t: number }> = ({ t }) => {
  const o = fade(t, 75.2, 90.6, 0.6, 0.6);
  if (o <= 0) return null;
  const pred = easeOut(clamp((t - 76.6) / 0.8));
  const scan = t > 83.4 && t < 85.8 ? (t - 83.4) / 2.4 : -1;
  const found = easeOut(clamp((t - 85.8) / 0.6));
  const x = 1440, ys = [860, 740, 640, 440, 320];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <line x1={x - 14} y1={300} x2={x - 14} y2={880} stroke="rgba(244,241,234,0.25)" strokeWidth={1.5} />
        {ys.map((y, i) => <line key={i} x1={x} y1={y} x2={x + 280} y2={y} stroke="rgba(244,241,234,0.4)" strokeWidth={1.5} />)}
        {scan >= 0 && <line x1={x - 20} y1={880 - scan * 580} x2={x + 300} y2={880 - scan * 580} stroke="#9fc4ff" strokeWidth={2} opacity={0.8} style={{ filter: "drop-shadow(0 0 8px #5aa9e6)" }} />}
        <line x1={x} y1={540} x2={x + 280 * pred} y2={540} stroke={found > 0 ? "#f2c94c" : "#f4f1ea"} strokeWidth={found > 0 ? 4 : 2} strokeDasharray={found > 0.5 ? "0" : "10 9"} style={found > 0 ? { filter: `drop-shadow(0 0 ${12 * found}px #f2c94c)` } : undefined} />
      </svg>
      <div style={{ position: "absolute", left: x + 296, top: 522, opacity: pred, fontFamily: FONT_SANS, fontSize: 24, color: found > 0.5 ? "#f2c94c" : COLORS.text, letterSpacing: 2, whiteSpace: "nowrap" }}>{found > 0.5 ? "实验证实 ✓" : "预言的能级？"}</div>
      <div style={{ position: "absolute", left: x - 14, top: 262, fontFamily: FONT_SANS, fontSize: 22, color: COLORS.dim, letterSpacing: 4 }}>碳原子核的能级</div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ layer: string }> = ({ layer }) => {
  const L = LAYERS[layer];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "3px 12px 3px 9px", borderRadius: 5, border: `1px solid ${L.color}66`, background: "rgba(10,12,18,0.6)", fontFamily: FONT_SANS, fontSize: 22, color: "#e9e6df", letterSpacing: 2 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: L.color, boxShadow: `0 0 8px ${L.color}` }} />{L.zh}
    </span>
  );
};
const VIEWS = [{ at: 143.4, text: "纯属偶然", layers: ["P"] }, { at: 147.0, text: "多重宇宙", layers: ["S", "P"] }, { at: 150.0, text: "更深的原因", layers: ["P"] }];
const Views: React.FC<{ t: number }> = ({ t }) => {
  const first = t >= 143.3 && t < 155.2 ? clamp((155.2 - t) / 0.6) : 0;
  const again = fade(t, 184.1, 188.1, 0.5, 0.6);
  const o = Math.max(first, again);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 70, opacity: o }}>
      <div style={{ display: "flex", gap: 40 }}>
        {VIEWS.map((v, i) => {
          const p = again > 0 ? easeOut(clamp((t - 184.1 - i * 0.15) / 0.4)) : easeOut(clamp((t - v.at) / 0.5));
          return (
            <div key={v.text} style={{ opacity: p, transform: `translateY(${(1 - p) * 14}px)`, width: 300, padding: "22px 0 20px", borderRadius: 8, borderTop: "2px solid #f2c94c", background: "rgba(10,12,18,0.55)", textAlign: "center" }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 22, color: "#f2c94c", letterSpacing: 6 }}>{["一", "二", "三"][i]}</div>
              <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 42, letterSpacing: 6, color: COLORS.text, margin: "8px 0 14px" }}>{v.text}</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{v.layers.map((l) => <Chip key={l} layer={l} />)}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const BigLines: React.FC<{ t: number; lines: [string, number][]; out: number; size?: number; top?: number }> = ({ t, lines, out, size = 80, top }) => {
  const o = clamp((out - t) / 0.6);
  if (t < lines[0][1] - 0.1 || o <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: top === undefined ? "center" : "flex-start", alignItems: "center", paddingTop: top }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", opacity: o }}>
        {lines.map(([txt, at]) => (
          <div key={txt} style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: size, letterSpacing: size * 0.18, color: COLORS.text, textShadow: "0 0 40px rgba(0,0,0,0.9)" }}>
            {Array.from(txt).map((ch, i) => { const p = easeOut(clamp((t - at - i * 0.07) / 0.45)); return <span key={i} style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>{ch}</span>; })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** World-space line art for part 2 (drawn inside the camera transform). */
const World2: React.FC<{ t: number }> = ({ t }) => {
  const pitO = fade(t, 91.8, 117.6, 0.4, 0.6);
  const pitDraw = easeOut(clamp((t - 91.8) / 1.6));
  const pulse = t > 102.6 && t < 103.8 ? Math.sin(((t - 102.6) / 1.2) * Math.PI) : 0;
  const back = t > 111 && t < 116.6 ? 0.5 + 0.5 * Math.sin(((t - 111) / 5.6) * Math.PI) : 0;
  const shrink = easeOut(clamp((t - 116.6) / 3.0));
  const sun = fade(t, 105.4, 112.6, 1.0, 1.4);
  const sunY = 650 - 220 * easeOut(clamp((t - 105.4) / 4));
  const bubO = fade(t, 118.8, 155.0, 0.8, 0.8);
  const mini = fade(t, 121.0, 154.0, 0.6, 0.8);
  // the pit shrinks into our bubble (it *is* our universe)
  const s = 1 - 0.55 * shrink, ox = BUB.x + (PIT.x - BUB.x) * s, oy = BUB.y + 60 * shrink + (PIT.y - BUB.y) * s;
  const pitPath = `M ${PIT.x - 900} ${PIT.y} L ${PIT.x - PIT.w} ${PIT.y} A ${PIT.w} ${PIT.d} 0 0 0 ${PIT.x + PIT.w} ${PIT.y} L ${PIT.x + 900} ${PIT.y}`;
  return (
    <g>
      {pitO > 0 && (
        <g opacity={pitO * (1 - 0.6 * shrink)} transform={`translate(${ox - PIT.x * s},${oy - PIT.y * s}) scale(${s})`}>
          <path d={pitPath} fill="none" stroke="#f2c94c" strokeWidth={3 + 4 * (pulse + back)} pathLength={1} strokeDasharray={`${pitDraw} 1`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${8 + 14 * (pulse + back)}px #f2c94c)` }} />
          {t > 103.8 && t < 107.2 && <text x={PIT.x} y={PIT.y - 60} textAnchor="middle" fontFamily={FONT_SERIF} fontSize={40} fill={COLORS.text} opacity={fade(t, 103.8, 107.2, 0.4, 0.5)} letterSpacing={6}>“这个坑，是专门为我挖的”</text>}
        </g>
      )}
      {sun > 0 && (
        <g opacity={sun} transform={`translate(${PIT.x + 520},${sunY})`}>
          <circle r={56} fill="rgba(255,210,140,0.15)" stroke="#f2c94c" strokeWidth={3} style={{ filter: "drop-shadow(0 0 16px #f2c94c)" }} />
          {Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return <line key={k} x1={Math.cos(a) * 76} y1={Math.sin(a) * 76} x2={Math.cos(a) * 100} y2={Math.sin(a) * 100} stroke="#f2c94c" strokeWidth={3} strokeLinecap="round" />; })}
        </g>
      )}
      {bubO > 0 && <circle cx={BUB.x} cy={BUB.y} r={BUB.r + 14} fill="none" stroke="#f2c94c" strokeOpacity={0.6 * bubO * clamp((t - 120.8) / 1.5)} strokeWidth={3} style={{ filter: "drop-shadow(0 0 14px #f2c94c)" }} />}
      {mini > 0 && (
        <g opacity={mini}>
          <Outline id="mini" k="human" p={MINI} t={t} a={121.0} b={154.0} strength={1} />
          <text x={MINI.cx + 70} y={MINI.cy - 70} fontFamily={FONT_SERIF} fontWeight={700} fontSize={48} fill="#f2c94c" opacity={fade(t, 121.6, 128.0, 0.4, 0.6)}>?</text>
        </g>
      )}
      {LIN2.map(([k, at], i) => <Outline key={k} id={`r${k}`} k={k === "human2" ? "human" : k} p={FIG2} t={t} a={at + 0.15} b={i === 5 ? 187.6 : at + 0.75} strength={i === 5 ? 0.9 : 0.75} />)}
    </g>
  );
};

/** Screen-space UI for part 2. */
const UI2: React.FC<{ t: number }> = ({ t }) => {
  const eraO = fade(t, 172.0, 187.4, 0.5, 0.6);
  const prog = clamp((t - 172.2) / (176.7 - 172.2));
  const fut = easeOut(clamp((t - 181.5) / 1.6));
  return (
    <AbsoluteFill>
      <Knobs t={t} />
      <Levels t={t} />
      <Views t={t} />
      {eraO > 0 && (
        <svg width={W} height={H} style={{ position: "absolute", opacity: eraO }}>
          <line x1={480} y1={860} x2={1280} y2={860} stroke="rgba(244,241,234,0.3)" strokeWidth={2} />
          <line x1={480} y1={860} x2={480 + 800 * prog} y2={860} stroke="#f2c94c" strokeWidth={3} />
          {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={480 + 160 * i} cy={860} r={prog * 5 >= i - 0.01 ? 7 : 4} fill={prog * 5 >= i - 0.01 ? "#f2c94c" : "rgba(244,241,234,0.4)"} />)}
          <line x1={1280} y1={860} x2={1280 + 300 * fut} y2={860} stroke="#f2c94c" strokeWidth={3} strokeDasharray="4 12" strokeLinecap="round" />
          {fut > 0 && <circle cx={1280 + 300 * fut} cy={860} r={8} fill="#f2c94c" style={{ filter: "drop-shadow(0 0 10px #f2c94c)" }} />}
          <text x={480} y={900} textAnchor="middle" fontFamily={FONT_SANS} fontSize={22} fill="rgba(244,241,234,0.6)">约 38 亿年前</text>
          <text x={1280} y={900} textAnchor="middle" fontFamily={FONT_SANS} fontSize={22} fill="rgba(244,241,234,0.6)">今天</text>
          {fut > 0 && <text x={1580} y={900} textAnchor="middle" fontFamily={FONT_SANS} fontSize={22} fill="#f2c94c" opacity={fut}>未来</text>}
        </svg>
      )}
      <Callout t={t} a={56.6} b={61.4} big="约 1 / 100000" small="宇宙早期物质的疏密起伏" y={0.07} />
      <Callout t={t} a={61.5} b={63.7} big="小十倍" small="聚不成星系" y={0.07} />
      <Callout t={t} a={63.8} b={67.4} big="大十倍" small="大量坍缩成黑洞" y={0.07} />
      <Callout t={t} a={69.4} b={75.0} big="霍伊尔 · 1953" small="恒星怎么造出这么多碳？" y={0.06} />
      <Callout t={t} a={87.8} b={90.8} big="微调" small="Fine-tuning" y={0.06} large />
      <Callout t={t} a={94.5} b={98.0} big="道格拉斯·亚当斯" small="《银河系漫游指南》作者 · 1998 年演讲" y={0.06} />
      <Callout t={t} a={128.1} b={135.0} big="人择原理" small="布兰登·卡特，1973" y={0.06} />
      <Callout t={t} a={135.2} b={141.1} big="尚无法观测验证" small="多重宇宙 · “微调”程度也有争议" y={0.06} />
      <Callout t={t} a={161.4} b={165.0} big="莱布尼茨 · 1714" small="《自然与神恩的原则》" y={0.42} />
      <BigLines t={t} lines={[["为什么有东西存在，", 165.1], ["而不是什么都没有？", 166.7]]} out={171.8} size={76} />
      <BigLines t={t} lines={[["不知道，", 188.16], ["所以，继续探索。", 189.42]]} out={191.9} size={84} top={300} />
      {t > 192 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade(t, 192.0, 195.05, 0.8, 0.5) }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: "#f2c94c" }}>下一期</div>
            <div style={{ marginTop: 22, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 64, letterSpacing: 8, color: COLORS.text }}>《你看到的世界，是真的吗？》</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const Part2: React.FC<{ t: number; camTf: CamT; cam: { x: number; y: number; z: number } }> = ({ t, camTf, cam }) => (
  <>
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <g transform={camTf(cam)}><World2 t={t} /></g>
    </svg>
    <UI2 t={t} />
  </>
);

export const HIDE2 = ["为什么有东西存在，而不是什么都没有？", "不知道，", "所以，继续探索。"];
export const TAGS2 = [
  { layer: "S", in: 46.2, out: 90.6 }, { layer: "P", in: 91.2, out: 128.0 }, { layer: "S", in: 128.0, out: 141.2 }, { layer: "P", in: 128.0, out: 141.2 }, { layer: "P", in: 155.0, out: 172.0 },
];
export const GAIN2: [number, number][] = [[158.4, 1], [163.6, 0], [168.8, 0], [170.2, 0.75], [172.4, 1], [194.4, 1], [195.05, 0]];
