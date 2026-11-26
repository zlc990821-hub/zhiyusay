// EP02 第2期《你看到的世界，是真的吗？》— style C (particles → silhouettes + gold outlines), continuous world camera.
// Shot list: episodes/EP02_现实/SHOTLIST.md
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { clamp, easeInOut, easeOut, fade, keyNum, rng } from "../components/anim";
import { COLORS, FONT_SANS, FONT_SERIF, loadFonts } from "../components/theme";
import { Subtitles, Sub } from "../components/Subtitles";
import { LayerTags } from "../components/LayerTag";
import { Cam, Key, N, paint, solid, Stage, StateDef, useStates } from "./Stage";
import { loadSilhouettes, Mask, sample, sampleImage } from "./sampler";
import { ImageCard } from "./ImageCard";
import { Place, SIL } from "./silhouettes";
import subs from "../../../episodes/EP02_现实/subtitles.json";
import tl from "../../../episodes/EP02_现实/timeline.json";

export const EP02_DURATION = tl.duration;
const W = 1920, H = 1080;
loadFonts((subs as Sub[]).map((s) => s.text).join("") + "第2期你看到的世界，是真的吗？天元纪元·盲点视神经穿出的地方没有感光细胞每秒约3次扫视剪辑长短波长纳米品红单一2015那条裙子蓝黑白金AB阿尼尔赛斯受控的幻觉约0.1秒真实你看到的康德1781科学：检验哪一幅预测更准那看这幅画的又是谁？下一期《谁在看？》×✓人眼蜜蜂紫外线");

// ───────── world layout (screen-pixel world coords) ─────────
const C = { x: 1360, y: 540 };
const P = {
  eyeSide: { cx: C.x, cy: C.y, size: 520 },
  eyeL: { cx: C.x - 230, cy: C.y, size: 380 }, eyeR: { cx: C.x + 230, cy: C.y, size: 380 },
  brain: { cx: C.x, cy: 500, size: 560 },
  cam: { cx: C.x - 330, cy: 540, size: 420 }, brainR: { cx: C.x + 360, cy: 520, size: 380 },
  eyeF: { cx: C.x, cy: 500, size: 760 },
  dressL: { cx: C.x - 260, cy: 520, size: 520 }, dressR: { cx: C.x + 260, cy: 520, size: 520 },
  flower: { cx: C.x, cy: 500, size: 560 },
  flowerS: { cx: C.x - 230, cy: 520, size: 470 }, human: { cx: C.x + 260, cy: 520, size: 520 },
} satisfies Record<string, Place>;
const DOT = { x: 1760, y: 540 }, CROSS = { x: 960, y: 540 };
const BOARD = { x: C.x - 300, y: 200, s: 120, n: 5 };
const SPEC = { x0: C.x - 640, x1: C.x + 640, y: 600 };

const CAMK: [number, number, number, number][] = [
  [0, C.x, 540, 1], [15.4, C.x, 540, 1], [19.6, C.x, C.y, 1.15], [23.0, C.x, C.y, 1.15], [24.4, C.x, C.y, 1.0],
  [36.0, C.x, 520, 1.0], [42.0, C.x, 540, 1.0], [195.0, C.x, 540, 1.0], [201.5, C.x, 540, 1.0], [206.0, C.x, 540, 0.55],
  [221.0, C.x, 540, 0.55], [224.5, C.x, 540, 1.0],
];
const camAt = (t: number): Cam => ({
  x: keyNum(t, CAMK.map((k) => [k[0], k[1]] as [number, number])),
  y: keyNum(t, CAMK.map((k) => [k[0], k[2]] as [number, number])),
  z: keyNum(t, CAMK.map((k) => [k[0], k[3]] as [number, number])),
});
const camTf = (c: Cam) => `translate(${W / 2},${H / 2}) scale(${c.z}) translate(${-c.x},${-c.y})`;

const KEYS = tl.particles as Key[];

// ───────── original images (MATERIALS.md) ─────────
type Card = { id: string; src: string; cx: number; cy: number; w: number; aspect: number; develop: number; out: number; mode: string; fallback: string; credit: string };
const CARDS = (tl as unknown as { cards: Card[] }).cards;
/** ids of cards whose image actually loaded (missing files fall back to the older particle states) */
const LOADED = new Set<string>();
const has = (id: string) => LOADED.has(id);
const cardSrc = (c: Card) => `EP02_现实/${c.src}`;
/** how much of the frame is currently covered by a developed photo (particles dim underneath) */
const cover = (t: number) => Math.max(0, ...CARDS.filter((c) => has(c.id) && c.fallback).map((c) => easeOut(clamp((t - c.develop) / 0.9)) * clamp((c.out - t) / 0.6)));

// saccade: iris offset in px (slow left/right while "looking in the mirror", then 3 jumps per second)
const irisOff = (t: number): [number, number] => {
  if (t < 55.4) return [0, 0];
  if (t < 64.9) return [Math.sin((t - 55.4) * 1.3) * 90, 0];
  if (t < 79.4) {
    const k = Math.floor((t - 64.9) * 3), f = (t - 64.9) * 3 - k;
    const r1 = rng(100 + k), r0 = rng(99 + k);
    const a: [number, number] = [(r0() - 0.5) * 220, (r0() - 0.5) * 110], b: [number, number] = [(r1() - 0.5) * 220, (r1() - 0.5) * 110];
    const e = clamp(f / 0.12);
    return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
  }
  return [0, 0];
};

// ───────── particle states ─────────
const g = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
const mix2 = (a: Float32Array, b: Float32Array, share: number) => {
  const out = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { const src = i % 100 < share * 100 ? a : b; out[i * 2] = src[i * 2]; out[i * 2 + 1] = src[i * 2 + 1]; }
  return out;
};
const spectrumRGB = (u: number): [number, number, number] => {
  // u: 0 = violet (short) … 1 = red (long)
  const stops: [number, [number, number, number]][] = [[0, [0.55, 0.3, 1]], [0.2, [0.25, 0.45, 1]], [0.4, [0.2, 0.9, 0.9]], [0.55, [0.35, 1, 0.4]], [0.7, [1, 0.95, 0.3]], [0.85, [1, 0.55, 0.2]], [1, [1, 0.2, 0.2]]];
  for (let k = 0; k < stops.length - 1; k++) {
    const [u0, c0] = stops[k], [u1, c1] = stops[k + 1];
    if (u <= u1) { const f = (u - u0) / (u1 - u0); return [0, 1, 2].map((j) => c0[j] + (c1[j] - c0[j]) * f) as [number, number, number]; }
  }
  return [1, 0.2, 0.2];
};

const buildStates = async (): Promise<Record<string, StateDef>> => {
  const m = (await loadSilhouettes()) as Record<string, Mask>;
  const S: Record<string, StateDef> = {};
  const r = rng(7);
  const pt = (x: number, y: number, spread = 5) => Float32Array.from({ length: N * 2 }, (_, k) => (k % 2 ? y : x) + (r() - 0.5) * spread);

  S.dust = { pos: Float32Array.from({ length: N * 2 }, (_, k) => (k % 2 ? r() * H : r() * W)), col: solid([0.75, 0.8, 1]), bright: new Float32Array(N).fill(0.12) };
  S.dot = { pos: pt(DOT.x, DOT.y, 3), col: solid([1, 1, 1]), bright: new Float32Array(N).fill(0.05) };
  S.eyeSide = { pos: sample(m.eyeSide, N, P.eyeSide, 1), col: solid([0.85, 0.9, 1.0], [1, 0.82, 0.55], 0.15) };
  S.eyes2 = { pos: mix2(sample(m.eyeSide, N, P.eyeL, 2), sample(m.eyeSide, N, P.eyeR, 3), 0.5), col: solid([0.85, 0.9, 1.0], [1, 0.82, 0.55], 0.15) };
  S.brain = { pos: sample(m.brain, N, P.brain, 4), col: solid([1, 0.72, 0.6], [1, 0.9, 0.7], 0.2) };
  S.pointT = { pos: pt(C.x, 330), col: solid([1, 0.92, 0.78]), bright: new Float32Array(N).fill(0.3) };
  S.camera = { pos: mix2(sample(m.camera, N, P.cam, 5), sample(m.brain, N, P.brainR, 6), 0.6), col: paint((i) => (i % 100 < 60 ? [0.8, 0.85, 0.95] : [1, 0.72, 0.6])) };

  // eye, front view: lids static, iris moves (saccades)
  const lids = sample(m.eyeLids, N, P.eyeF, 7, 0.9), iris = sample(m.eyeIris, N, P.eyeF, 8, 0.35);
  const isIris = Uint8Array.from({ length: N }, (_, i) => (i % 10 < 6 ? 1 : 0));
  S.eyeFront = {
    pos: (t, out) => {
      const [ox, oy] = irisOff(t);
      for (let i = 0; i < N; i++) {
        if (isIris[i]) { out[i * 2] = iris[i * 2] + ox; out[i * 2 + 1] = iris[i * 2 + 1] + oy; } else { out[i * 2] = lids[i * 2]; out[i * 2 + 1] = lids[i * 2 + 1]; }
      }
    },
    col: paint((i) => (isIris[i] ? [0.45, 0.75, 1] : [0.95, 0.92, 0.88])),
  };

  // spectrum band and the red+blue → magenta merge
  const su = new Float32Array(N);
  const spec = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { su[i] = r(); spec[i * 2] = SPEC.x0 + su[i] * (SPEC.x1 - SPEC.x0); spec[i * 2 + 1] = SPEC.y + g(r) * 26; }
  const specCol = paint((i) => spectrumRGB(su[i]));
  S.spectrum = { pos: spec, col: specCol };
  const MAG = { x: C.x, y: 300 };
  const merge = new Float32Array(N * 2);
  const ends = Uint8Array.from({ length: N }, (_, i) => (su[i] < 0.18 || su[i] > 0.85 ? 1 : 0));
  for (let i = 0; i < N; i++) {
    if (ends[i]) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 95; merge[i * 2] = MAG.x + Math.cos(a) * d; merge[i * 2 + 1] = MAG.y + Math.sin(a) * d; }
    else { merge[i * 2] = spec[i * 2]; merge[i * 2 + 1] = spec[i * 2 + 1]; }
  }
  S.merge = { pos: merge, col: paint((i) => (ends[i] ? [1, 0.25, 0.85] : spectrumRGB(su[i]))), bright: Float32Array.from({ length: N }, (_, i) => (ends[i] ? 1.6 : 0.35)) };

  // two dresses: blue/black vs white/gold stripes
  const dl = sample(m.dress, N, P.dressL, 9), dr = sample(m.dress, N, P.dressR, 10);
  const dress = mix2(dl, dr, 0.5);
  S.dress2 = {
    pos: dress,
    col: paint((i) => {
      const left = i % 100 < 50, y = dress[i * 2 + 1];
      const band = Math.floor((y - 260) / 55) % 2 === 0;
      return left ? (band ? [0.25, 0.4, 1.0] : [0.12, 0.12, 0.16]) : band ? [1, 0.98, 0.92] : [0.95, 0.75, 0.35];
    }),
  };

  // checkerboard particles aligned with the SVG illusion board
  const chk = new Float32Array(N * 2), chkB = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const cx = Math.floor(r() * BOARD.n), cy = Math.floor(r() * BOARD.n);
    chk[i * 2] = BOARD.x + (cx + r()) * BOARD.s; chk[i * 2 + 1] = BOARD.y + (cy + r()) * BOARD.s;
    chkB[i] = (cx + cy) % 2 === 0 ? 1.2 : 0.35;
  }
  S.checker = { pos: chk, col: solid([0.9, 0.9, 0.9]), bright: chkB };
  S.brain2 = { pos: sample(m.brain, N, P.brain, 11), col: solid([1, 0.72, 0.6], [1, 0.9, 0.7], 0.2) };

  // flower: human colours → bee (UV) colours with nectar-guide "runways"
  const fl = sample(m.flower, N, P.flower, 12);
  const petal = (i: number) => fl[i * 2 + 1] < P.flower.cy + 40;
  S.flower = { pos: fl, col: paint((i) => (petal(i) ? [1, 0.85, 0.3] : [0.35, 0.85, 0.45])) };
  const guide = (i: number) => {
    const dx = fl[i * 2] - P.flower.cx, dy = fl[i * 2 + 1] - (P.flower.cy - 30);
    const a = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
    return d < 200 && Math.abs(Math.sin(a * 3.5)) < 0.22;
  };
  S.flowerUV = { pos: fl, col: paint((i) => (!petal(i) ? [0.3, 0.6, 0.45] : guide(i) ? [1, 0.95, 1] : [0.55, 0.35, 1])), bright: Float32Array.from({ length: N }, (_, i) => (petal(i) && guide(i) ? 2.4 : 1)) };

  // half flower, half you
  S.halfYou = { pos: mix2(sample(m.flower, N, P.flowerS, 13), sample(m.human, N, P.human, 14), 0.5), col: paint((i) => (i % 100 < 50 ? (i % 3 ? [1, 0.85, 0.3] : [0.35, 0.85, 0.45]) : [1, 0.85, 0.58])) };
  S.pointE = { pos: pt(C.x, 360), col: solid([1, 0.92, 0.78]), bright: new Float32Array(N).fill(0.35) };
  for (const c of CARDS) {
    try {
      const im = await sampleImage(staticFile(cardSrc(c)), N, { cx: c.cx, cy: c.cy, size: c.w }, 50 + c.id.length);
      S[`img:${c.id}`] = { pos: im.pos, col: im.col };
      LOADED.add(c.id);
    } catch {
      if (c.fallback) S[`img:${c.id}`] = S[c.fallback];
    }
  }
  return S;
};

// ───────── overlays ─────────
const OutlineDefs = () => (
  <defs>
    <filter id="ol2" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="d" />
      <feComposite in="d" in2="SourceAlpha" operator="out" result="o" />
      <feFlood floodColor="#f2c94c" />
      <feComposite in2="o" operator="in" result="line" />
      <feGaussianBlur in="line" stdDeviation="5" result="glow" />
      <feMerge><feMergeNode in="glow" /><feMergeNode in="line" /></feMerge>
    </filter>
    <radialGradient id="shadowG" cx="0.5" cy="0.5" r="0.5"><stop offset="0.45" stopColor="#000" stopOpacity="0.4" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
  </defs>
);
const Outline: React.FC<{ id: string; k: string; p: Place; t: number; a: number; b: number; s?: number }> = ({ id, k, p, t, a, b, s = 0.85 }) => {
  const o = fade(t, a, b, 0.35, 0.35);
  if (o <= 0) return null;
  const rev = easeOut(clamp((t - a) / 0.8));
  return (
    <g opacity={o * s}>
      <clipPath id={`e2-${id}`}><rect x={p.cx - p.size / 2 - 20} y={p.cy + p.size / 2 + 20 - (p.size + 40) * rev} width={p.size + 40} height={(p.size + 40) * rev} /></clipPath>
      <g clipPath={`url(#e2-${id})`}><g filter="url(#ol2)" transform={`translate(${p.cx - p.size / 2},${p.cy - p.size / 2}) scale(${p.size / 600})`} dangerouslySetInnerHTML={{ __html: SIL[k] }} /></g>
    </g>
  );
};
const Callout: React.FC<{ t: number; a: number; b: number; big: string; small: string; y?: number; x?: number }> = ({ t, a, b, big, small, y = 0.06, x = 0.5 }) => {
  const o = fade(t, a, b, 0.45, 0.45);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%, ${(1 - easeOut(clamp((t - a) / 0.6))) * 14}px)`, textAlign: "center", opacity: o, whiteSpace: "nowrap" }}>
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 60, letterSpacing: 4, color: COLORS.text, textShadow: "0 0 30px rgba(0,0,0,0.85)" }}>{big}</div>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, letterSpacing: 4, color: COLORS.dim, marginTop: 8 }}>{small}</div>
    </div>
  );
};
const Big: React.FC<{ t: number; lines: [string, number][]; out: number; size?: number; top?: number; gold?: boolean }> = ({ t, lines, out, size = 84, top, gold }) => {
  const o = clamp((out - t) / 0.6);
  if (t < lines[0][1] - 0.1 || o <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: top === undefined ? "center" : "flex-start", alignItems: "center", paddingTop: top }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", opacity: o }}>
        {lines.map(([txt, at]) => (
          <div key={txt} style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: size, letterSpacing: size * 0.16, color: gold ? "#f2c94c" : COLORS.text, textShadow: "0 0 40px rgba(0,0,0,0.9)" }}>
            {Array.from(txt).map((ch, i) => { const p = easeOut(clamp((t - at - i * 0.07) / 0.45)); return <span key={i} style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>{ch}</span>; })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Adelson-style checker-shadow illusion, drawn so that squares A and B have exactly the same grey. */
const Checker: React.FC<{ t: number }> = ({ t }) => {
  const o = fade(t, 136.6, 153.0, 0.8, 0.8);
  if (o <= 0) return null;
  const mask = fade(t, 141.0, 143.8, 0.5, 0.5);
  const L = 200, D = 120; // light / dark squares; shadow factor 0.6 makes a light square in shadow = 120
  const A = { cx: 1, cy: 2 }, B = { cx: 3, cy: 3 }; // A: dark square in light; B: light square in shadow → both rgb(120)
  const sq = (cx: number, cy: number) => ({ x: BOARD.x + cx * BOARD.s, y: BOARD.y + cy * BOARD.s });
  const g8 = (v: number) => `rgb(${v},${v},${v})`;
  const sc = { x: BOARD.x + 3.4 * BOARD.s, y: BOARD.y + 3.4 * BOARD.s };
  return (
    <g opacity={o}>
      <clipPath id="boardClip"><rect x={BOARD.x} y={BOARD.y} width={BOARD.s * BOARD.n} height={BOARD.s * BOARD.n} /></clipPath>
      {Array.from({ length: BOARD.n * BOARD.n }, (_, k) => {
        const cx = k % BOARD.n, cy = Math.floor(k / BOARD.n);
        const { x, y } = sq(cx, cy);
        const lit = (cx + cy) % 2 === 0 ? L : D;
        return <rect key={k} x={x} y={y} width={BOARD.s} height={BOARD.s} fill={g8(lit)} />;
      })}
      {/* soft shadow cast by the cylinder: multiplies by 0.6 at its core */}
      <g clipPath="url(#boardClip)">
        <ellipse cx={sc.x} cy={sc.y} rx={BOARD.s * 1.9} ry={BOARD.s * 1.9} fill="url(#shadowG)" />
      </g>
      <rect x={sq(B.cx, B.cy).x} y={sq(B.cx, B.cy).y} width={BOARD.s} height={BOARD.s} fill={g8(D)} />
      {/* cylinder */}
      <g transform={`translate(${BOARD.x + BOARD.s * 4.6},${BOARD.y + BOARD.s * 2.4})`}>
        <rect x={-55} y={-120} width={110} height={220} fill="#3f8f5a" />
        <ellipse cy={-120} rx={55} ry={18} fill="#5fb27a" />
        <ellipse cy={100} rx={55} ry={18} fill="#3f8f5a" />
      </g>
      {[A, B].map((q, i) => <text key={i} x={sq(q.cx, q.cy).x + BOARD.s / 2} y={sq(q.cx, q.cy).y + BOARD.s / 2 + 16} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={44} fill="#e8e8e8">{i ? "B" : "A"}</text>)}
      {mask > 0 && (
        <g opacity={mask}>
          <path d={`M 0 0 H ${W * 2} V ${H} H 0 Z M ${sq(A.cx, A.cy).x} ${sq(A.cx, A.cy).y} h ${BOARD.s} v ${BOARD.s} h ${-BOARD.s} Z M ${sq(B.cx, B.cy).x} ${sq(B.cx, B.cy).y} h ${BOARD.s} v ${BOARD.s} h ${-BOARD.s} Z`} fill="#05060a" fillRule="evenodd" />
          <rect x={sq(A.cx, A.cy).x + BOARD.s / 2 - 6} y={sq(A.cx, A.cy).y + BOARD.s} width={12} height={sq(B.cx, B.cy).y - sq(A.cx, A.cy).y - BOARD.s} fill={g8(D)} />
          <rect x={sq(A.cx, A.cy).x + BOARD.s / 2 - 6} y={sq(B.cx, B.cy).y + BOARD.s / 2 - 6} width={sq(B.cx, B.cy).x - sq(A.cx, A.cy).x} height={12} fill={g8(D)} />
        </g>
      )}
    </g>
  );
};

const World: React.FC<{ t: number }> = ({ t }) => {
  // blind-spot test chart
  const chart = fade(t, 0.6, 19.6, 0.8, 1.2);
  const dotO = 1 - clamp((t - 15.6) / 0.6);
  // optic-disc ring on the eye cross-section
  const disc = fade(t, 19.9, 23.2, 0.5, 0.6);
  // painted-over hole in the field of view
  const fov = fade(t, 25.4, 33.0, 0.6, 0.6);
  const paint = easeOut(clamp((t - 30.6) / 2.2));
  // camera → brain beam, red cross
  const beam = fade(t, 45.4, 52.8, 0.5, 0.5);
  const beamP = clamp((t - 45.6) / 2.4);
  const cross = easeOut(clamp((t - 50.9) / 0.8));
  // mirror frame around the eye
  const mirror = fade(t, 53.0, 64.8, 0.8, 0.8);
  // spectrum labels and magenta swatch
  const specO = fade(t, 86.0, 113.4, 0.6, 0.8);
  const swatch = fade(t, 96.0, 104.2, 0.5, 0.5);
  const swX = C.x - 600 + 1200 * clamp((t - 99.4) / 3.6);
  // dresses' light guesses
  const lamp = fade(t, 133.0, 136.4, 0.5, 0.5), shade = fade(t, 130.2, 136.4, 0.5, 0.5);
  // controlled hallucination: guesses out, signals back
  const ch = fade(t, 155.2, 186.0, 0.8, 0.8);
  const guess = clamp((t - 155.4) / 2.0), signal = clamp((t - 158.5) / 2.0);
  // flower frames & Kant
  const frames = fade(t, 201.4, 224.6, 1.0, 1.0);
  const draw = easeOut(clamp((t - 201.6) / 1.6));
  const bee = fade(t, 189.2, 201.0, 0.6, 0.6);
  return (
    <g>
      {chart > 0 && !has("bs") && (
        <g opacity={chart}>
          <g transform={`translate(${CROSS.x},${CROSS.y})`} stroke="#f2c94c" strokeWidth={10} strokeLinecap="round">
            <line x1={-32} y1={-32} x2={32} y2={32} /><line x1={32} y1={-32} x2={-32} y2={32} />
          </g>
          <circle cx={DOT.x} cy={DOT.y} r={34} fill="#f4f1ea" opacity={dotO} />
        </g>
      )}
      {!has("eye") && <Outline id="es" k="eyeSide" p={P.eyeSide} t={t} a={19.0} b={23.4} />}
      {disc > 0 && !has("eye") && (
        <g opacity={disc}>
          <circle cx={P.eyeSide.cx + 0.25 * P.eyeSide.size} cy={P.eyeSide.cy + 0.06 * P.eyeSide.size} r={26} fill="none" stroke="#ef6f5e" strokeWidth={4} style={{ filter: "drop-shadow(0 0 10px #ef6f5e)" }} />
          <line x1={P.eyeSide.cx + 0.25 * P.eyeSide.size + 26} y1={P.eyeSide.cy + 0.06 * P.eyeSide.size} x2={P.eyeSide.cx + 360} y2={P.eyeSide.cy + 180} stroke="#ef6f5e" strokeWidth={2} />
        </g>
      )}
      <Outline id="el" k="eyeSide" p={P.eyeL} t={t} a={23.6} b={25.6} />
      <Outline id="er" k="eyeSide" p={P.eyeR} t={t} a={23.8} b={25.6} />
      {fov > 0 && (
        <g opacity={fov}>
          <rect x={C.x - 520} y={260} width={1040} height={560} rx={24} fill="rgba(90,169,230,0.06)" stroke="#9fc4ff" strokeOpacity={0.4} strokeWidth={2} />
          <circle cx={C.x + 400} cy={360} r={60} fill="#05060a" />
          <circle cx={C.x + 400} cy={360} r={60 * paint} fill="rgba(159,196,255,0.25)" stroke="#f2c94c" strokeWidth={3} strokeDasharray="8 8" />
        </g>
      )}
      <Outline id="br" k="brain" p={P.brain} t={t} a={33.2} b={36.0} />
      <Outline id="cm" k="camera" p={P.cam} t={t} a={43.0} b={52.6} />
      <Outline id="bR" k="brain" p={P.brainR} t={t} a={43.4} b={52.6} />
      {beam > 0 && (
        <g opacity={beam}>
          <line x1={P.cam.cx + 120} y1={540} x2={P.cam.cx + 120 + (P.brainR.cx - P.cam.cx - 260) * beamP} y2={520} stroke="#f2c94c" strokeWidth={3} strokeDasharray="10 10" />
          <rect x={P.cam.cx + 120 + (P.brainR.cx - P.cam.cx - 300) * beamP - 30} y={490} width={60} height={44} rx={4} fill="none" stroke="#f4f1ea" strokeWidth={2.5} />
        </g>
      )}
      {cross > 0 && t < 53.0 && (
        <g stroke="#ef6f5e" strokeWidth={14} strokeLinecap="round" opacity={fade(t, 50.9, 53.0, 0.1, 0.6)} style={{ filter: "drop-shadow(0 0 12px #ef6f5e)" }}>
          <line x1={C.x - 160} y1={380} x2={C.x - 160 + 320 * cross} y2={380 + 320 * cross} />
          <line x1={C.x + 160} y1={380} x2={C.x + 160 - 320 * clamp(cross * 1.4 - 0.4)} y2={380 + 320 * clamp(cross * 1.4 - 0.4)} />
        </g>
      )}
      {mirror > 0 && <rect x={C.x - 460} y={150} width={920} height={700} rx={340} fill="none" stroke="#9fc4ff" strokeOpacity={0.45 * mirror} strokeWidth={3} />}
      {specO > 0 && (
        <g opacity={specO}>
          <text x={SPEC.x0} y={SPEC.y + 90} fontFamily={FONT_SANS} fontSize={28} fill="rgba(244,241,234,0.7)">短 · 约 400 纳米</text>
          <text x={SPEC.x1} y={SPEC.y + 90} textAnchor="end" fontFamily={FONT_SANS} fontSize={28} fill="rgba(244,241,234,0.7)">长 · 约 700 纳米</text>
          <line x1={SPEC.x0} y1={SPEC.y + 56} x2={SPEC.x1} y2={SPEC.y + 56} stroke="rgba(244,241,234,0.35)" strokeWidth={2} />
          {swatch > 0 && (
            <g opacity={swatch}>
              <rect x={swX - 55} y={300} width={110} height={110} rx={10} fill="#ff2fd6" style={{ filter: "drop-shadow(0 0 18px #ff2fd6)" }} />
              <line x1={swX} y1={410} x2={swX} y2={SPEC.y - 40} stroke="#ff8ae8" strokeWidth={2} strokeDasharray="6 8" />
              {t > 101 && <text x={swX} y={SPEC.y - 50} textAnchor="middle" fontFamily={FONT_SANS} fontSize={30} fill="#ff8ae8">？</text>}
            </g>
          )}
        </g>
      )}
      {!has("dress") && <Outline id="dl" k="dress" p={P.dressL} t={t} a={113.8} b={136.4} s={0.55} />}
      {!has("dress") && <Outline id="dr" k="dress" p={P.dressR} t={t} a={114.0} b={136.4} s={0.55} />}
      {shade > 0 && !has("dress") && <ellipse cx={P.dressR.cx} cy={520} rx={300} ry={330} fill="rgba(90,140,255,0.12)" stroke="#9fc4ff" strokeOpacity={0.4 * shade} strokeDasharray="6 10" strokeWidth={2} opacity={shade} />}
      {lamp > 0 && !has("dress") && (
        <g opacity={lamp} transform={`translate(${P.dressL.cx},170)`}>
          <path d="M -60 0 L 60 0 L 36 -60 L -36 -60 Z" fill="none" stroke="#f2c94c" strokeWidth={3} />
          <path d="M -60 0 L -220 380 M 60 0 L 220 380" stroke="#f2c94c" strokeOpacity={0.35} strokeWidth={2} />
        </g>
      )}
      {!has("chk") && <Checker t={t} />}
      <Outline id="b2" k="brain" p={P.brain} t={t} a={153.6} b={186.0} s={0.7} />
      {ch > 0 && (
        <g opacity={ch}>
          {[-1, 1].map((sd) => (
            <g key={sd}>
              <path d={`M ${C.x + sd * 260} 470 Q ${C.x + sd * 420} 360 ${C.x + sd * (300 + 400 * guess)} ${420 - 60 * guess}`} fill="none" stroke="#f2c94c" strokeWidth={3} strokeDasharray="10 10" />
              <path d={`M ${C.x + sd * 760} 620 Q ${C.x + sd * 520} 680 ${C.x + sd * (760 - 470 * signal)} ${620 - 40 * signal}`} fill="none" stroke="#9fc4ff" strokeWidth={3} />
            </g>
          ))}
          <text x={C.x - 700} y={330} fontFamily={FONT_SANS} fontSize={26} fill="#f2c94c" opacity={guess}>猜测 →</text>
          <text x={C.x + 560} y={720} fontFamily={FONT_SANS} fontSize={26} fill="#9fc4ff" opacity={signal}>← 眼睛的信号</text>
        </g>
      )}
      {!has("mim") && <Outline id="fl" k="flower" p={P.flower} t={t} a={186.4} b={233.6} s={0.55} />}
      {bee > 0 && (
        <g opacity={bee} transform={`translate(${C.x + 360 + Math.sin(t * 2) * 20},${300 + Math.cos(t * 3) * 12})`} fill="none" stroke="#f2c94c" strokeWidth={3}>
          <ellipse rx={46} ry={28} /><line x1={-10} y1={-26} x2={-10} y2={26} /><line x1={12} y1={-26} x2={12} y2={26} />
          <ellipse cx={-6} cy={-46} rx={26} ry={18} strokeOpacity={0.7} /><ellipse cx={18} cy={-44} rx={22} ry={15} strokeOpacity={0.7} />
          <circle cx={52} cy={-4} r={14} />
        </g>
      )}
      {frames > 0 && (
        <g opacity={frames} fill="none" stroke="#f2c94c" strokeWidth={4}>
          <rect x={C.x - 330} y={170} width={660} height={700} pathLength={1} strokeDasharray={`${draw} 1`} />
          <rect x={C.x - 330 - 900} y={170} width={660} height={700} strokeOpacity={0.5} pathLength={1} strokeDasharray={`${draw} 1`} />
          <rect x={C.x - 330 + 900} y={170} width={660} height={700} strokeOpacity={0.5} pathLength={1} strokeDasharray={`${draw} 1`} />
          <g opacity={draw * 0.6} transform={`translate(${C.x - 900},500)`}>
            {Array.from({ length: 7 }, (_, i) => <ellipse key={i} cy={-95} rx={46} ry={88} transform={`rotate(${(i / 7) * 360})`} stroke="#b48cff" strokeWidth={3} />)}
            {Array.from({ length: 7 }, (_, i) => <line key={`g${i}`} x1={0} y1={0} x2={0} y2={-150} transform={`rotate(${(i / 7) * 360})`} stroke="#fff" strokeWidth={2} />)}
          </g>
          {!has("kant") && <text x={C.x + 900} y={540} textAnchor="middle" fontFamily={FONT_SERIF} fontSize={180} fill="#f2c94c" stroke="none" opacity={draw * 0.5}>?</text>}
          <text x={C.x} y={930} textAnchor="middle" fontFamily={FONT_SANS} fontSize={34} fill="rgba(244,241,234,0.75)" stroke="none">人眼</text>
          <text x={C.x - 900} y={930} textAnchor="middle" fontFamily={FONT_SANS} fontSize={34} fill="rgba(244,241,234,0.6)" stroke="none">蜜蜂</text>
          <text x={C.x + 900} y={930} textAnchor="middle" fontFamily={FONT_SANS} fontSize={34} fill="rgba(244,241,234,0.6)" stroke="none">{has("kant") ? "康德：事物本身？" : "事物本身？"}</text>
        </g>
      )}
      <Outline id="hy" k="human" p={P.human} t={t} a={235.0} b={240.0} />
      {/* original images */}
      {CARDS.filter((c) => has(c.id)).map((c) => (
        <ImageCard key={c.id} t={t} src={cardSrc(c)} p={{ cx: c.cx, cy: c.cy, w: c.w, aspect: c.aspect }} develop={c.develop} out={c.out} credit={c.credit} />
      ))}
      {has("chk") && !has("proof") && (() => {
        // proof on the original: dim everything except the A→B column, then bridge A and B with same-grey bars (rgb 111, sampled from the image)
        const m = fade(t, 141.0, 143.8, 0.5, 0.5);
        if (m <= 0) return null;
        const hx = C.x - 40, hy = 362, hw = 100, hh = 220;
        return (
          <g opacity={m}>
            <path d={`M ${C.x - 1200} -200 H ${C.x + 1200} V 1300 H ${C.x - 1200} Z M ${hx} ${hy} h ${hw} v ${hh} h ${-hw} Z`} fill="rgba(5,6,10,0.88)" fillRule="evenodd" />
            <rect x={C.x + 35} y={395} width={16} height={160} fill="rgb(111,111,111)" />
            <rect x={C.x - 35} y={395} width={16} height={160} fill="rgb(111,111,111)" />
          </g>
        );
      })()}
      {has("dress") && (
        <g fontFamily={FONT_SERIF} fontWeight={700} fontSize={46} fill={COLORS.text}>
          <text x={C.x - 300} y={520} textAnchor="end" opacity={fade(t, 117.2, 136.2, 0.4, 0.5)}>蓝黑？</text>
          <text x={C.x + 300} y={520} opacity={fade(t, 118.4, 136.2, 0.4, 0.5)}>白金？</text>
          <text x={C.x + 300} y={590} fontFamily={FONT_SANS} fontWeight={400} fontSize={26} fill="#9fc4ff" opacity={fade(t, 130.2, 136.2, 0.4, 0.5)}>← 猜它在阴影里</text>
          <text x={C.x - 300} y={590} textAnchor="end" fontFamily={FONT_SANS} fontWeight={400} fontSize={26} fill="#f2c94c" opacity={fade(t, 133.0, 136.2, 0.4, 0.5)}>猜它在暖光下 →</text>
        </g>
      )}
    </g>
  );
};

/** Film strip: frames march left; during saccades frames are cut out and the gap closes. */
const FilmStrip: React.FC<{ t: number }> = ({ t }) => {
  const o = fade(t, 64.6, 82.2, 0.6, 0.6);
  if (o <= 0) return null;
  const n = 14, fw = 150, y = 840;
  const shift = ((t - 64.6) * 180) % fw;
  return (
    <svg width={W} height={H} style={{ position: "absolute", opacity: o }}>
      <rect x={0} y={y - 10} width={W} height={fw * 0.66 + 20} fill="rgba(10,12,18,0.7)" />
      {Array.from({ length: n }, (_, k) => {
        const x = k * fw - shift;
        const id = Math.floor((t - 64.6) * 180 / fw) + k;
        const cut = t > 72.4 && id % 3 === 0;
        return (
          <g key={k}>
            <rect x={x + 8} y={y} width={fw - 16} height={fw * 0.66} rx={6} fill={cut ? "rgba(239,111,94,0.2)" : "rgba(159,196,255,0.12)"} stroke={cut ? "#ef6f5e" : "rgba(244,241,234,0.4)"} strokeWidth={2} strokeDasharray={cut ? "6 6" : undefined} />
            {cut && <text x={x + fw / 2} y={y + fw * 0.42} textAnchor="middle" fontFamily={FONT_SANS} fontSize={30} fill="#ef6f5e">✂</text>}
          </g>
        );
      })}
    </svg>
  );
};

const LagClock: React.FC<{ t: number }> = ({ t }) => {
  const o = fade(t, 175.0, 186.0, 0.6, 0.6);
  if (o <= 0) return null;
  const now = (t - 175) * 0.5;
  return (
    <svg width={W} height={H} style={{ position: "absolute", opacity: o }}>
      {[{ y: 800, lab: "真实", lag: 0, c: "#9fc4ff" }, { y: 870, lab: "你看到的", lag: 0.1, c: "#f2c94c" }].map((r) => (
        <g key={r.lab}>
          <text x={560} y={r.y + 9} textAnchor="end" fontFamily={FONT_SANS} fontSize={26} fill={r.c}>{r.lab}</text>
          <line x1={590} y1={r.y} x2={1590} y2={r.y} stroke="rgba(244,241,234,0.25)" strokeWidth={2} />
          <circle cx={590 + 1000 * (((now - r.lag) % 1) + 1) % 1} cy={r.y} r={10} fill={r.c} />
        </g>
      ))}
      <text x={1640} y={846} fontFamily={FONT_SERIF} fontWeight={700} fontSize={36} fill={COLORS.text}>约 0.1 秒</text>
    </svg>
  );
};

const UI: React.FC<{ t: number }> = ({ t }) => {
  const ti = easeOut(clamp((t - 38.6) / 0.9));
  const to = fade(t, 38.4, 42.2, 0.8, 0.5);
  return (
    <AbsoluteFill>
      <FilmStrip t={t} />
      <LagClock t={t} />
      {to > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: to }}>
          <div style={{ textAlign: "center", marginTop: 80 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: "#f2c94c", transform: `translateY(${(1 - ti) * 12}px)` }}>天元纪元 · 第2期</div>
            <div style={{ marginTop: 26, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 92, letterSpacing: 10, color: COLORS.text, transform: `translateY(${(1 - ti) * 20}px)` }}>你看到的世界，是真的吗？</div>
            <div style={{ margin: "34px auto 0", height: 1, width: 560 * ti, background: "linear-gradient(90deg, transparent, rgba(244,241,234,0.7), transparent)" }} />
          </div>
        </AbsoluteFill>
      )}
      <Callout t={t} a={20.0} b={25.4} big="盲点" small="视神经穿出的地方 · 没有感光细胞" />
      <Callout t={t} a={65.0} b={72.2} big="每秒约 3 次" small="眼球跳动（扫视）时，大脑会暂时“关掉”画面" />
      <Callout t={t} a={96.0} b={99.3} big="品红" small="" />
      <Callout t={t} a={99.4} b={104.0} big="光谱里没有它" small="没有任何单一波长对应品红" />
      <Callout t={t} a={113.6} b={121.0} big="2015 · 那条裙子" small="同一张照片，两种颜色" />
      <Callout t={t} a={162.2} b={170.6} big="受控的幻觉" small="阿尼尔·赛斯，神经科学家" />
      <Callout t={t} a={207.9} b={214.8} big="康德 · 1781" small="《纯粹理性批判》：我们只能认识显现给我们的样子" />
      <Callout t={t} a={214.9} b={222.6} big="科学：检验哪一幅预测更准" small="" />
      <Big t={t} lines={[["不知道，", 239.87], ["所以，继续探索。", 241.03]]} out={243.4} size={84} top={260} />
      <Big t={t} lines={[["那看这幅画的，又是谁？", 243.6]]} out={246.4} size={68} />
      {t > 246.2 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade(t, 246.2, EP02_DURATION, 0.6, 0.4) }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: "#f2c94c" }}>下一期</div>
            <div style={{ marginTop: 22, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 72, letterSpacing: 10, color: COLORS.text }}>《谁在看？》</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const EP02: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const states = useStates(buildStates);
  const cam = camAt(t);
  const gain = keyNum(t, tl.gain as [number, number][]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, #0b0e18 0%, ${COLORS.bg} 70%)` }}>
      {states && (
        <ThreeCanvas width={W} height={H} orthographic camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 1000 }} gl={{ antialias: true }}>
          <Stage t={t} states={states} keys={KEYS} gain={gain * 1.7 * (1 - 0.9 * cover(t))} size={3.2} cam={cam} />
        </ThreeCanvas>
      )}
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <OutlineDefs />
        <g transform={camTf(cam)}><World t={t} /></g>
      </svg>
      <UI t={t} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)" }} />
      <LayerTags tags={tl.tags} />
      <Subtitles subs={subs as Sub[]} hide={["不知道，", "所以，继续探索。"]} />
      <Audio src={staticFile("EP02_现实/audio/vo_edit.wav")} />
      <Audio src={staticFile("EP02_现实/audio/sfx.wav")} />
    </AbsoluteFill>
  );
};

export { easeInOut };
