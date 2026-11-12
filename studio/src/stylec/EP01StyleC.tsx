// Style C sample (EP01 opening, 0–46.5 s): the original cinematic particle look, but particles assemble into
// recognisable figures, each traced by a glowing gold outline; titles keep the centred serif typography.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { clamp, easeInOut, easeOut, fade, keyNum, rng } from "../components/anim";
import { COLORS, FONT_SANS, FONT_SERIF, loadFonts } from "../components/theme";
import { Subtitles, Sub } from "../components/Subtitles";
import { LayerTags } from "../components/LayerTag";
import { Cam, Key, N, paint, solid, Stage, StateDef, useStates } from "./Stage";
import { landMask, loadSilhouettes, sample } from "./sampler";
import { Place, SIL } from "./silhouettes";
import subs from "../../../episodes/EP01_存在/subtitles.json";

export const STYLEC_DURATION = 46.5;
const W = 1920, H = 1080;
loadFonts((subs as Sub[]).map((s) => s.text).join("") + "40亿年一次都没输过的连胜单细胞鱼早期四足动物哺乳动物古猿你约38亿年前今天上亿个只有一个抵达我为什么会存在？天元纪元·第1期6600万年前希克苏鲁伯撞击今墨西哥尤卡坦半岛我们的远祖约13%会引发大灭绝的撞击区域撞击点0123456789%,");

// ───────── layout ─────────
const FIG: Place = { cx: 960, cy: 470, size: 600 };
const LINE = [
  { k: "cell", name: "单细胞", at: 9.7, col: [0.5, 0.9, 0.85] },
  { k: "fish", name: "鱼", at: 10.9, col: [0.55, 0.8, 1.0] },
  { k: "lizard", name: "早期四足动物", at: 12.0, col: [0.6, 0.95, 0.65] },
  { k: "shrew", name: "早期哺乳动物", at: 13.1, col: [1.0, 0.78, 0.55] },
  { k: "ape", name: "古猿", at: 14.2, col: [1.0, 0.72, 0.48] },
  { k: "human", name: "你", at: 15.2, col: [1.0, 0.85, 0.58] },
] as const;
const SAURO: Place = { cx: 600, cy: 600, size: 640 };
const TREX: Place = { cx: 1350, cy: 640, size: 560 };
const MAMMAL: Place = { cx: 960, cy: 720, size: 380 };
const EGG = { x: 1440, y: 520, r: 135 };
const GLOBE = { x: 900, y: 520, R: 300 };
const YUC = { lon: -89, lat: 21 };
const globeRot = (t: number) => keyNum(t, [[37.6, 20], [43.2, 75]]) * (Math.PI / 180);
const projYuc = (t: number) => {
  const lo = (YUC.lon * Math.PI) / 180 + globeRot(t), la = (YUC.lat * Math.PI) / 180;
  return { x: GLOBE.x + GLOBE.R * Math.cos(la) * Math.sin(lo), y: GLOBE.y - GLOBE.R * Math.sin(la) };
};

const SKY = { x: 1600, y: 200 };
type CamK = [number, number, number, number];
const CAMK: CamK[] = [
  [0, 960, 540, 1], [15.2, 960, 540, 1], [16.6, 900, 540, 0.92], [19.0, 1100, 530, 1.0], [20.8, 1440, 520, 2.0],
  [22.6, SKY.x, 360, 1.0], [26.4, SKY.x, 360, 1.0], [28.0, 960, 540, 1.0], [33.6, 960, 540, 1.0], [36.4, 960, 700, 1.35],
  [37.4, 960, 700, 1.35], [38.8, 900, 520, 1.0],
];
export const camAt = (t: number): Cam => ({
  x: keyNum(t, CAMK.map((k) => [k[0], k[1]] as [number, number])),
  y: keyNum(t, CAMK.map((k) => [k[0], k[2]] as [number, number])),
  z: keyNum(t, CAMK.map((k) => [k[0], k[3]] as [number, number])),
});
const camTf = (c: Cam) => `translate(${W / 2},${H / 2}) scale(${c.z}) translate(${-c.x},${-c.y})`;

const KEYS: Key[] = [
  [0, "point"], [1.6, "point"], [3.4, "human0"], [9.0, "human0"],
  ...LINE.flatMap((l, i): Key[] => [[l.at, i === 5 ? "human" : l.k], [l.at + 0.5, i === 5 ? "human" : l.k]]),
  [16.6, "race"], [21.2, "race"], [22.4, "sky"], [27.0, "sky"], [28.4, "dinos"], [30.8, "dinos"], [32.2, "ash"], [33.6, "ash"],
  [34.5, "mammal"], [37.4, "mammal"], [38.8, "globe"],
];

// ───────── particle states ─────────
const buildStates = async (): Promise<Record<string, StateDef>> => {
  const m = await loadSilhouettes();
  const land = await landMask();
  const S: Record<string, StateDef> = {};
  const r0 = rng(1);
  const pt = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { pt[i * 2] = 960 + (r0() - 0.5) * 6; pt[i * 2 + 1] = 470 + (r0() - 0.5) * 6; }
  S.point = { pos: pt, col: solid([1, 0.92, 0.78]), bright: new Float32Array(N).fill(0.25) };
  const sk = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { sk[i * 2] = SKY.x + (r0() - 0.5) * 6; sk[i * 2 + 1] = SKY.y + (r0() - 0.5) * 6; }
  S.sky = { pos: sk, col: solid([1, 0.9, 0.7]), bright: new Float32Array(N).fill(0.3) };
  S.human0 = { pos: sample(m.human, N, FIG, 11), col: solid([1, 0.85, 0.58]) };
  LINE.forEach((l, i) => { S[i === 5 ? "human" : l.k] = { pos: sample(m[l.k], N, FIG, 20 + i), col: solid(l.col as unknown as [number, number, number]) }; });

  // race: swim from a band on the left to the egg; only particle cluster #0 arrives
  const rr = rng(5);
  const st = Float32Array.from({ length: N * 2 }, (_, k) => (k % 2 ? 520 + (rr() - 0.5) * 560 : -80 + rr() * 640));
  const sp = Float32Array.from({ length: N }, (_, i) => (i % 700 === 0 ? 1 : 0.45 + 0.5 * rr()));
  const cap = Float32Array.from({ length: N }, (_, i) => (i % 700 === 0 ? 1 : 0.55 + 0.33 * rr()));
  const raceP = (t: number) => clamp((t - 16.0) / 3.0);
  S.race = {
    pos: (t, out) => {
      const p = raceP(t);
      for (let i = 0; i < N; i++) {
        const pr = Math.min(p * sp[i], cap[i]);
        const tx = EGG.x - EGG.r + 4, ty = EGG.y;
        out[i * 2] = st[i * 2] + (tx - st[i * 2]) * pr;
        out[i * 2 + 1] = st[i * 2 + 1] + (ty - st[i * 2 + 1]) * pr * 0.9 + Math.sin(t * 4 + i) * 10 * (1 - pr);
      }
    },
    col: paint((i) => (i % 700 === 0 ? [1, 0.82, 0.45] : [0.88, 0.92, 1.0])),
    bright: (t, out) => {
      const p = raceP(t);
      for (let i = 0; i < N; i++) {
        const win = i % 700 === 0;
        out[i] = win ? 3.0 : 1 - clamp((p * sp[i] - cap[i] + 0.04) / 0.2) * 0.95;
      }
    },
  };

  // dinosaurs, ash, mammal
  const half = new Float32Array(N * 2);
  const a = sample(m.sauropod, N, SAURO, 30), b = sample(m.trex, N, TREX, 31);
  for (let i = 0; i < N; i++) { const src = i % 5 < 3 ? a : b; half[i * 2] = src[i * 2]; half[i * 2 + 1] = src[i * 2 + 1]; }
  S.dinos = { pos: half, col: paint((i, r) => (i % 5 < 3 ? (r() < 0.15 ? [0.8, 1, 0.9] : [0.45, 0.9, 0.7]) : r() < 0.15 ? [1, 0.85, 0.7] : [1, 0.55, 0.4])) };
  const ra = rng(8);
  S.ash = { pos: Float32Array.from({ length: N * 2 }, (_, k) => (k % 2 ? 760 + ra() * 320 : ra() * W)), col: solid([0.62, 0.6, 0.62], [0.9, 0.5, 0.4], 0.08), bright: new Float32Array(N).fill(0.6) };
  S.mammal = { pos: sample(m.shrew, N, MAMMAL, 32, 0.5), col: solid([1, 0.78, 0.55]) };

  // globe: points on a sphere, rotated and projected each frame; land/ocean/deadly zones coloured
  const rg = rng(12);
  const lon = new Float32Array(N), lat = new Float32Array(N);
  for (let i = 0; i < N; i++) { const z = rg() * 2 - 1; lat[i] = Math.asin(z); lon[i] = rg() * Math.PI * 2 - Math.PI; }
  const ZONES = [[-89, 21, 9, 39.0], [50, 27, 9, 39.4], [75, 62, 10, 39.8], [5, 3, 7, 40.2], [3, 57, 6, 40.6], [-66, 9, 6, 41.0]];
  const zoneAt = new Float32Array(N).fill(1e9);
  const isLand = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const lo = (lon[i] * 180) / Math.PI, la = (lat[i] * 180) / Math.PI;
    isLand[i] = land(lo, la) ? 1 : 0;
    for (const [zl, za, zr, zt] of ZONES) {
      const d = Math.acos(Math.min(1, Math.sin(lat[i]) * Math.sin((za * Math.PI) / 180) + Math.cos(lat[i]) * Math.cos((za * Math.PI) / 180) * Math.cos(lon[i] - (zl * Math.PI) / 180)));
      if (d < (zr * Math.PI) / 180) zoneAt[i] = Math.min(zoneAt[i], zt);
    }
  }
  const gcol = paint((i) => (isLand[i] ? [0.45, 1.0, 0.6] : [0.3, 0.5, 1.0]));
  S.globe = {
    pos: (t, out) => {
      const ph = globeRot(t);
      for (let i = 0; i < N; i++) {
        out[i * 2] = GLOBE.x + GLOBE.R * Math.cos(lat[i]) * Math.sin(lon[i] + ph);
        out[i * 2 + 1] = GLOBE.y - GLOBE.R * Math.sin(lat[i]);
      }
    },
    col: gcol,
    bright: (t, out) => {
      const ph = globeRot(t);
      for (let i = 0; i < N; i++) {
        const z = Math.cos(lat[i]) * Math.cos(lon[i] + ph);
        const zone = clamp((t - zoneAt[i]) / 0.4);
        out[i] = (z > 0 ? 0.9 + 1.8 * z : 0.12) * (isLand[i] ? 1.7 : 0.45) * (1 + 1.2 * zone);
        if (zone > 0) { gcol[i * 3] = 0.3 + 0.7 * zone + (isLand[i] ? 0.1 * (1 - zone) : 0); gcol[i * 3 + 1] = (isLand[i] ? 0.9 : 0.55) * (1 - zone) + 0.28 * zone; gcol[i * 3 + 2] = (isLand[i] ? 0.62 : 1.0) * (1 - zone) + 0.22 * zone; }
      }
    },
  };
  return S;
};

// ───────── overlays ─────────
const OutlineDefs = () => (
  <defs>
    <filter id="gold-outline" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="d" />
      <feComposite in="d" in2="SourceAlpha" operator="out" result="o" />
      <feFlood floodColor="#f2c94c" />
      <feComposite in2="o" operator="in" result="line" />
      <feGaussianBlur in="line" stdDeviation="5" result="glow" />
      <feMerge><feMergeNode in="glow" /><feMergeNode in="line" /></feMerge>
    </filter>
  </defs>
);

/** Glowing outline of a silhouette, revealed bottom-up. */
const Outline: React.FC<{ id: string; k: string; p: Place; t: number; a: number; b: number; strength?: number }> = ({ id, k, p, t, a, b, strength = 0.85 }) => {
  const o = fade(t, a, b, 0.35, 0.35);
  if (o <= 0) return null;
  const rev = easeOut(clamp((t - a) / 0.8));
  return (
    <g opacity={o * strength}>
      <clipPath id={`c-${id}`}><rect x={p.cx - p.size / 2 - 20} y={p.cy + p.size / 2 + 20 - (p.size + 40) * rev} width={p.size + 40} height={(p.size + 40) * rev} /></clipPath>
      <g clipPath={`url(#c-${id})`}>
        <g filter="url(#gold-outline)" transform={`translate(${p.cx - p.size / 2},${p.cy - p.size / 2}) scale(${p.size / 600})`} dangerouslySetInnerHTML={{ __html: SIL[k] }} />
      </g>
    </g>
  );
};

const Callout: React.FC<{ t: number; a: number; b: number; big: string; small: string; y?: number; x?: number }> = ({ t, a, b, big, small, y = 0.1, x = 0.5 }) => {
  const o = fade(t, a, b, 0.45, 0.45);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%, ${(1 - easeOut(clamp((t - a) / 0.6))) * 14}px)`, textAlign: "center", opacity: o, whiteSpace: "nowrap" }}>
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 64, letterSpacing: 4, color: COLORS.text, textShadow: "0 0 30px rgba(0,0,0,0.85)" }}>{big}</div>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, letterSpacing: 4, color: COLORS.dim, marginTop: 8 }}>{small}</div>
    </div>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const cam = camAt(t);
  const tlO = fade(t, 9.4, 15.9, 0.5, 0.4);
  const prog = clamp((t - 9.7) / (15.2 - 9.7));
  const egg = fade(t, 15.9, 22.0, 0.3, 1.0);
  const eggDraw = easeOut(clamp((t - 16.0) / 1.2));
  const youTxt = fade(t, 19.6, 21.0, 0.5, 0.5);
  const hit = clamp((t - 19.0) / 0.6);
  const dinoO = fade(t, 26.6, 38.6, 0.6, 0.8);
  const shrink = easeInOut(clamp((t - 37.4) / 1.3));
  const ast = clamp((t - 28.6) / (30.4 - 28.6));
  const ax = SKY.x + (1250 - SKY.x) * ast * ast, ay = SKY.y + (720 - SKY.y) * ast * ast;
  const astO = t < 30.4 ? fade(t, 26.6, 30.5, 0.6, 0.05) : 0;
  const flash = t > 30.4 ? Math.exp(-(t - 30.4) * 3.2) : 0;
  const wave = t > 30.4 ? clamp((t - 30.4) / 2.2) : 0;
  const gl = fade(t, 38.4, STYLEC_DURATION + 1, 0.8, 0.5);
  const donut = easeOut(clamp((t - 39.0) / 1.8)) * 0.13;
  const C = 2 * Math.PI * 110;
  const pin = clamp((t - 43.4) / 0.5);
  const yu = projYuc(t);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <OutlineDefs />
        <g transform={camTf(cam)}>
        <Outline id="h0" k="human" p={FIG} t={t} a={3.8} b={9.0} />
        {LINE.map((l) => <Outline key={l.k + l.at} id={l.k + l.at} k={l.k} p={FIG} t={t} a={l.at + 0.2} b={l.at + 0.75} />)}
        </g>
        {/* era bar (screen UI) */}
        {tlO > 0 && (
          <g opacity={tlO}>
            <line x1={560} y1={860} x2={1360} y2={860} stroke="rgba(244,241,234,0.3)" strokeWidth={2} />
            <line x1={560} y1={860} x2={560 + 800 * prog} y2={860} stroke="#f2c94c" strokeWidth={3} />
            {LINE.map((l, i) => {
              const x = 560 + (800 * i) / 5, on = t >= l.at - 0.1;
              return <circle key={i} cx={x} cy={860} r={on ? 7 : 4} fill={on ? "#f2c94c" : "rgba(244,241,234,0.4)"} />;
            })}
            <text x={560} y={900} textAnchor="middle" fontFamily={FONT_SANS} fontSize={22} fill="rgba(244,241,234,0.6)" letterSpacing={2}>约 38 亿年前</text>
            <text x={1360} y={900} textAnchor="middle" fontFamily={FONT_SANS} fontSize={22} fill="rgba(244,241,234,0.6)" letterSpacing={2}>今天</text>
          </g>
        )}
        <g transform={camTf(cam)}>
        {/* egg */}
        {egg > 0 && (
          <g opacity={egg}>
            <circle cx={EGG.x} cy={EGG.y} r={EGG.r * (1.6 + 0.5 * hit)} fill="#f2c94c" opacity={0.06 + 0.18 * hit} />
            <circle cx={EGG.x} cy={EGG.y} r={EGG.r} fill="rgba(242,201,76,0.08)" stroke="#f2c94c" strokeWidth={3} pathLength={1} strokeDasharray={`${eggDraw} 1`} transform={`rotate(-90 ${EGG.x} ${EGG.y})`} style={{ filter: "drop-shadow(0 0 10px #f2c94c)" }} />
            <circle cx={EGG.x} cy={EGG.y} r={EGG.r + 18} fill="none" stroke="#f2c94c" strokeOpacity={0.35} strokeWidth={1.5} />
            {youTxt > 0 && <text x={EGG.x} y={EGG.y + 30} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={88} fill={COLORS.text} opacity={youTxt}>你</text>}
          </g>
        )}
        {/* prehistoric horizon, line-art */}
        <g transform={`translate(${yu.x},${yu.y}) scale(${1 - 0.92 * shrink}) translate(${-yu.x},${-yu.y})`} opacity={1 - shrink}>
        {dinoO > 0 && (
          <g opacity={dinoO} fill="none" stroke="#f2c94c" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 0 860 Q 420 800 900 850 Q 1400 800 1920 850" strokeOpacity={0.55} strokeWidth={2.5} />
            <path d="M 60 860 L 300 560 L 340 575 L 380 560 L 640 860" strokeOpacity={0.35} strokeWidth={2} />
            <path d="M 300 560 Q 320 500 360 470 M 340 560 Q 360 510 400 500" strokeOpacity={0.25 + 0.4 * clamp((t - 30.4) / 1)} strokeWidth={2} stroke={t > 30.4 ? "#ef6f5e" : "#f2c94c"} />
            {[160, 300, 1600, 1760].map((x) => [-30, -10, 10, 30].map((dx) => <path key={x + dx} d={`M ${x} 900 Q ${x + dx} 840 ${x + dx * 2.2} ${800 + Math.abs(dx)}`} strokeOpacity={0.3} strokeWidth={2} />))}
          </g>
        )}
        <Outline id="sa" k="sauropod" p={SAURO} t={t} a={28.6} b={30.6} strength={0.7} />
        <Outline id="tr" k="trex" p={TREX} t={t} a={28.8} b={30.6} strength={0.7} />
        <Outline id="ma" k="shrew" p={MAMMAL} t={t} a={34.8} b={37.5} />
        {astO > 0 && (
          <g opacity={astO}>
            {ast > 0 && <line x1={ax + 300 * ast} y1={ay - 400 * ast} x2={ax} y2={ay} stroke="#f2c94c" strokeWidth={6} strokeLinecap="round" opacity={0.7} />}
            <circle cx={ax} cy={ay} r={14} fill="#fff6e0" style={{ filter: "drop-shadow(0 0 16px #ffb070)" }} />
          </g>
        )}
        {wave > 0 && <ellipse cx={1250} cy={720} rx={60 + wave * 1300} ry={30 + wave * 420} fill="none" stroke="#fff1d6" strokeWidth={8 * (1 - wave)} opacity={1 - wave} />}
        {/* "our ancestor" leader line */}
        {t > 35 && t < 37.8 && (
          <g opacity={fade(t, 35, 37.8, 0.4, 0.4)}>
            <line x1={1110} y1={690} x2={1300} y2={600} stroke="#f2c94c" strokeWidth={2} />
            <circle cx={1110} cy={690} r={5} fill="#f2c94c" />
            <text x={1310} y={600} fontFamily={FONT_SERIF} fontWeight={700} fontSize={44} letterSpacing={6} fill={COLORS.text}>我们的远祖</text>
          </g>
        )}
        </g>
        {/* globe ring + pin (world) */}
        {gl > 0 && (
          <g opacity={gl}>
            <circle cx={GLOBE.x} cy={GLOBE.y} r={GLOBE.R + 10} fill="none" stroke="#9fc4ff" strokeOpacity={0.35} strokeWidth={2} style={{ filter: "drop-shadow(0 0 12px #5aa9e6)" }} />
            {pin > 0 && (
              <g transform={`translate(${yu.x},${yu.y - 160 * (1 - easeOut(pin))})`} opacity={pin}>
                <path d="M 0 0 C -8 -22 -26 -34 -26 -54 A 26 26 0 1 1 26 -54 C 26 -34 8 -22 0 0 Z" fill="rgba(11,19,34,0.6)" stroke="#f2c94c" strokeWidth={3} style={{ filter: "drop-shadow(0 0 8px #f2c94c)" }} />
                <circle cy={-54} r={8} fill="#f2c94c" />
              </g>
            )}
            {pin > 0.5 && <g opacity={easeOut(clamp((t - 43.8) / 0.4))}><line x1={yu.x + 36} y1={yu.y - 110} x2={yu.x + 36} y2={yu.y - 70} stroke="#f2c94c" strokeWidth={3} /><text x={yu.x + 50} y={yu.y - 80} fontFamily={FONT_SANS} fontSize={28} letterSpacing={3} fill={COLORS.text}>撞击点 · 希克苏鲁伯</text></g>}
          </g>
        )}
        </g>
        {/* donut (screen UI) */}
        {gl > 0 && (
          <g opacity={gl}>
            <g transform="translate(1480,500)" opacity={easeOut(clamp((t - 38.9) / 0.6))}>
              <circle r={110} fill="none" stroke="rgba(244,241,234,0.15)" strokeWidth={10} />
              <circle r={110} fill="none" stroke="#ef6f5e" strokeWidth={10} strokeLinecap="round" strokeDasharray={`${C * donut} ${C}`} transform="rotate(-90)" style={{ filter: "drop-shadow(0 0 8px #ef6f5e)" }} />
              <text y={22} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={60} fill={COLORS.text}>{Math.round(donut * 100)}%</text>
              <text y={180} textAnchor="middle" fontFamily={FONT_SANS} fontSize={26} fill="rgba(244,241,234,0.7)" letterSpacing={2}>会引发大灭绝的撞击区域</text>
              <text y={216} textAnchor="middle" fontFamily={FONT_SANS} fontSize={20} fill="rgba(244,241,234,0.45)">Kaiho & Oshima, 2017</text>
            </g>
          </g>
        )}
      </svg>
      {flash > 0.01 && <AbsoluteFill style={{ background: "radial-gradient(circle at 65% 65%, rgba(255,240,215,1) 0%, rgba(255,150,90,0.55) 25%, rgba(0,0,0,0) 65%)", opacity: flash }} />}
      {/* labels */}
      <Callout t={t} a={2.4} b={9.0} big="40 亿年" small="一次都没输过的连胜" y={0.06} />
      {LINE.map((l) => {
        const o = fade(t, l.at + 0.2, l.at + 1.0, 0.25, 0.3);
        return o > 0 ? <div key={l.name} style={{ position: "absolute", top: 785, width: "100%", textAlign: "center", opacity: o, fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 40, letterSpacing: 8, color: COLORS.text }}>{l.name}</div> : null;
      })}
      <Callout t={t} a={16.0} b={19.8} big="上亿个" small="只有一个抵达" y={0.06} />
      <Callout t={t} a={27.3} b={31.4} big="6600 万年前" small="希克苏鲁伯撞击 · 今墨西哥尤卡坦半岛" y={0.06} />
      {/* question + title (original typography) */}
      <BigQ t={t} />
    </AbsoluteFill>
  );
};

const BigQ: React.FC<{ t: number }> = ({ t }) => {
  const qo = fade(t, 22.4, 25.3, 0.5, 0.4);
  const to = fade(t, 25.1, 27.2, 0.8, 0.5);
  const ti = easeOut(clamp((t - 25.1) / 0.9));
  return (
    <>
      {qo > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: qo }}>
          <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 100, letterSpacing: 18, color: COLORS.text, textShadow: "0 0 40px rgba(0,0,0,0.9)" }}>
            {Array.from("我，为什么会存在？").map((c, i) => { const p = easeOut(clamp((t - 22.4 - i * 0.08) / 0.45)); return <span key={i} style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>{c}</span>; })}
          </div>
        </AbsoluteFill>
      )}
      {to > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: to }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: "#f2c94c", transform: `translateY(${(1 - ti) * 12}px)` }}>天元纪元 · 第1期</div>
            <div style={{ marginTop: 26, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 96, letterSpacing: 12, color: COLORS.text, transform: `translateY(${(1 - ti) * 20}px)` }}>我为什么会存在？</div>
            <div style={{ margin: "34px auto 0", height: 1, width: 520 * ti, background: "linear-gradient(90deg, transparent, rgba(244,241,234,0.7), transparent)" }} />
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};

export const EP01StyleC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const states = useStates(buildStates);
  const gain = clamp((t - 0.3) / 1.2) * keyNum(t, [[0, 1], [STYLEC_DURATION - 0.6, 1], [STYLEC_DURATION, 0]]);
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, #0b0e18 0%, ${COLORS.bg} 70%)` }}>
      {t > 30.4 && t < 38.6 && <AbsoluteFill style={{ background: "radial-gradient(ellipse at 65% 80%, rgba(150,40,25,0.55) 0%, rgba(0,0,0,0) 70%)", opacity: fade(t, 30.4, 38.6, 0.6, 1.0) }} />}
      {states && (
        <ThreeCanvas width={W} height={H} orthographic camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 1000 }} gl={{ antialias: true }}>
          <Stage t={t} states={states} keys={KEYS} gain={gain * 1.7} size={3.2} cam={cam} />
        </ThreeCanvas>
      )}
      <Overlays t={t} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)" }} />
      <LayerTags tags={[{ layer: "S", in: 2.4, out: 21.5 }, { layer: "S", in: 27.3, out: 46.2 }]} />
      <Subtitles subs={(subs as Sub[]).filter((s) => s.start < STYLEC_DURATION)} hide={["所以——我，为什么会存在？"]} />
      <Audio src={staticFile("EP01_存在/audio/vo_edit.wav")} endAt={Math.round(STYLEC_DURATION * fps)} />
      <Audio src={staticFile("EP01_存在/styleC/audio/sfx.wav")} />
    </AbsoluteFill>
  );
};
