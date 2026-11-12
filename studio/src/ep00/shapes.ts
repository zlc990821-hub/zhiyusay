// Particle target shapes for EP00. Every state has the same particle count; index i moves between states.
import { rng } from "../components/anim";

export const N = 16000;
export const STATES = ["point", "hand", "nebula", "star", "burst", "planet", "cells", "network", "wave", "twohands", "eye", "human"] as const;
export type State = (typeof STATES)[number];

type V2 = [number, number];
const len = (x: number, y: number) => Math.hypot(x, y);
const sdCapsule = (p: V2, a: V2, b: V2, r: number) => {
  const pax = p[0] - a[0], pay = p[1] - a[1], bax = b[0] - a[0], bay = b[1] - a[1];
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return len(pax - bax * h, pay - bay * h) - r;
};
const sdRoundBox = (p: V2, c: V2, hw: number, hh: number, r: number) => {
  const qx = Math.abs(p[0] - c[0]) - hw + r, qy = Math.abs(p[1] - c[1]) - hh + r;
  return len(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const smin = (a: number, b: number, k = 0.08) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const deg = (d: number) => (d * Math.PI) / 180;

/** Signed distance to a stylised open right hand (palm facing viewer), units ~ 3.4 tall. */
const handSdf = (p: V2) => {
  let d = sdRoundBox(p, [0, -0.5], 0.62, 0.66, 0.26);
  const fingers: [number, number, number, number][] = [
    // base x, angle (deg from vertical, + = right), length, radius
    [-0.44, -9, 1.0, 0.15],
    [-0.14, -2, 1.18, 0.155],
    [0.16, 4, 1.08, 0.15],
    [0.45, 12, 0.84, 0.13],
  ];
  for (const [x, a, l, r] of fingers) {
    const b: V2 = [x, -0.05];
    d = smin(d, sdCapsule(p, b, [x + Math.sin(deg(a)) * l, -0.05 + Math.cos(deg(a)) * l], r));
  }
  d = smin(d, sdCapsule(p, [-0.5, -0.75], [-0.5 + Math.cos(deg(140)) * 0.95, -0.75 + Math.sin(deg(140)) * 0.95], 0.17), 0.15);
  d = smin(d, sdCapsule(p, [0, -1.0], [0, -2.1], 0.44), 0.2);
  return d;
};

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

const sampleSdf = (seed: number, sdf: (p: V2) => number, box: [number, number, number, number], place: (x: number, y: number, z: number, i: number) => [number, number, number], fadeBelow?: [number, number]) => {
  const r = rng(seed);
  const out = new Float32Array(N * 3);
  const [x0, x1, y0, y1] = box;
  let i = 0;
  while (i < N) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
    const d = sdf([x, y]);
    const edge = i % 3 === 0; // a third of the particles trace the outline
    if (edge ? Math.abs(d) > 0.018 : d > 0) continue;
    if (fadeBelow && y < fadeBelow[0] && r() > Math.max(0, (y - fadeBelow[1]) / (fadeBelow[0] - fadeBelow[1]))) continue;
    const depth = Math.min(1, Math.max(0.25, -d * 3));
    out.set(place(x, y, (r() - 0.5) * 0.35 * depth, i), i * 3);
    i++;
  }
  return out;
};

const HAND_BOX: [number, number, number, number] = [-1.6, 1.6, -2.3, 1.7];
const makeHand = (seed: number) =>
  sampleSdf(seed, handSdf, HAND_BOX, (x, y, z) => [x * 1.25, y * 1.25 + 0.45, z], [-1.3, -2.1]);

/** Standing human silhouette, ~3.7 units tall. */
const humanSdf = (p: V2) => {
  let d = len(p[0], p[1] - 1.55) - 0.3;
  d = smin(d, sdCapsule(p, [0, 1.2], [0, 1.05], 0.12), 0.1);
  d = smin(d, sdRoundBox(p, [0, 0.45], 0.42, 0.62, 0.2), 0.12);
  d = smin(d, sdCapsule(p, [-0.42, 0.95], [-0.62, -0.25], 0.11), 0.1);
  d = smin(d, sdCapsule(p, [0.42, 0.95], [0.62, -0.25], 0.11), 0.1);
  d = smin(d, sdCapsule(p, [-0.2, -0.1], [-0.27, -1.9], 0.14), 0.1);
  d = smin(d, sdCapsule(p, [0.2, -0.1], [0.27, -1.9], 0.14), 0.1);
  return d;
};

const fill = (fn: (r: () => number, i: number) => [number, number, number], seed: number) => {
  const r = rng(seed);
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) out.set(fn(r, i), i * 3);
  return out;
};

const unit = (r: () => number): [number, number, number] => {
  const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
  return [s * Math.cos(a), s * Math.sin(a), z];
};

/** Per-particle auxiliary data: [seed, group, param]. group = cell id / edge id in [0,1); param = position along an edge (-1 for nodes). */
export const buildAux = () => {
  const r = rng(42);
  const aux = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    aux[i * 3] = r();
    aux[i * 3 + 1] = GROUP[i];
    aux[i * 3 + 2] = PARAM[i];
  }
  return aux;
};
const GROUP = new Float32Array(N);
const PARAM = new Float32Array(N).fill(-1);

const makeCells = () => {
  const r = rng(6);
  const centers: V2[] = [];
  for (let row = -3; row <= 3; row++)
    for (let col = -6; col <= 6; col++) centers.push([col * 0.62 + (row % 2 ? 0.31 : 0), row * 0.54 + 0.35]);
  const order = centers.map((_, k) => k).sort(() => r() - 0.5); // random cell ids so "neurons" are scattered
  return fill((rr, i) => {
    const k = i % centers.length;
    GROUP[i] = order[k] / centers.length;
    const [cx, cy] = centers[k];
    const kind = rr();
    const a = rr() * Math.PI * 2;
    const rad = kind < 0.55 ? 0.25 + gauss(rr) * 0.01 : kind < 0.8 ? Math.abs(gauss(rr)) * 0.065 : rr() * 0.22;
    return [cx + Math.cos(a) * rad * 1.05, cy + Math.sin(a) * rad, gauss(rr) * 0.03];
  }, 7);
};

const makeNetwork = () => {
  const r = rng(8);
  const nodes: [number, number, number][] = [];
  for (let k = 0; k < 150; k++) nodes.push([(r() - 0.5) * 8.5, (r() - 0.5) * 4.2 + 0.3, (r() - 0.5) * 3]);
  const edges: [number, number][] = [];
  nodes.forEach((a, i) => {
    const near = nodes.map((b, j) => [Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), j]).sort((x, y) => x[0] - y[0]);
    for (const [, j] of near.slice(1, 4)) if (i < j) edges.push([i, j]);
  });
  const eg = edges.map(() => r());
  return fill((rr, i) => {
    if (i % 7 === 0) {
      const n = nodes[(i / 7) % nodes.length | 0];
      return [n[0] + gauss(rr) * 0.035, n[1] + gauss(rr) * 0.035, n[2] + gauss(rr) * 0.035];
    }
    const e = i % edges.length;
    const [a, b] = [nodes[edges[e][0]], nodes[edges[e][1]]];
    const u = rr();
    GROUP[i] = GROUP[i] || eg[e];
    PARAM[i] = u;
    return [a[0] + (b[0] - a[0]) * u + gauss(rr) * 0.01, a[1] + (b[1] - a[1]) * u + gauss(rr) * 0.01, a[2] + (b[2] - a[2]) * u];
  }, 9);
};

const melody = (x: number) => 0.55 * Math.sin(x * 1.25) + 0.28 * Math.sin(x * 3.1 + 1) + 0.12 * Math.sin(x * 6.7 + 2);

export const buildShapes = (): Record<State, Float32Array> => {
  const hand = makeHand(11);
  const hand2 = makeHand(12);
  return {
    point: fill((r) => [gauss(r) * 0.03, gauss(r) * 0.03 + 0.45, gauss(r) * 0.03], 1),
    hand,
    nebula: fill((r) => {
      // wispy cloud: radius ~ sqrt, warped by low-frequency sines
      const [ux, uy, uz] = unit(r);
      const rad = 1.2 + 4.2 * Math.sqrt(r());
      const w = 0.6 * Math.sin(ux * 3 + uy * 2) + 0.4 * Math.sin(uz * 4 - ux);
      return [ux * rad * (1 + 0.25 * w), uy * rad * 0.7 * (1 + 0.25 * w), uz * rad - 1.5];
    }, 2),
    star: fill((r, i) => {
      if (i % 10 < 7) return [gauss(r) * 0.28, gauss(r) * 0.28 + 0.2, gauss(r) * 0.28];
      const [ux, uy, uz] = unit(r);
      const rad = 0.45 + 1.1 * Math.pow(r(), 2.2);
      return [ux * rad, uy * rad + 0.2, uz * rad];
    }, 3),
    burst: fill((r, i) => {
      const [ux, uy, uz] = unit(r);
      const rad = i % 5 < 3 ? 4.6 + gauss(r) * 0.45 : 1.2 + 4.6 * Math.sqrt(r());
      return [ux * rad, uy * rad * 0.8 + 0.2, uz * rad];
    }, 4),
    planet: fill((r, i) => {
      const [ux, uy, uz] = unit(r);
      const rad = i % 8 === 0 ? 1.32 + r() * 0.14 : 1.2;
      return [ux * rad, uy * rad + 0.35, uz * rad];
    }, 5),
    cells: makeCells(),
    network: makeNetwork(),
    wave: fill((r, i) => {
      const x = -4.6 + r() * 9.2;
      const layer = i % 3; // three parallel voices of the same melody
      const y = melody(x) * (1 - layer * 0.18) + 0.35 + (layer - 1) * 0.22 + gauss(r) * 0.025;
      return [x, y, (layer - 1) * 0.15 + gauss(r) * 0.03];
    }, 10),
    twohands: (() => {
      const out = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const src = i % 2 ? hand : hand2;
        const s = i % 2 ? 1 : -1;
        out[i * 3] = src[i * 3] * 0.7 + s * 1.75;
        out[i * 3 + 1] = (src[i * 3 + 1] - 0.45) * 0.7 + 0.45;
        out[i * 3 + 2] = src[i * 3 + 2];
      }
      return out;
    })(),
    eye: fill((r, i) => {
      const k = i % 10;
      if (k < 4) { // lids
        const x = -2.3 + r() * 4.6;
        const h = 0.95 * Math.pow(Math.max(0, 1 - (x / 2.3) ** 2), 0.8);
        return [x, (i % 2 ? h : -h) * 1 + 0.35 + gauss(r) * 0.012, gauss(r) * 0.04];
      }
      const a = r() * Math.PI * 2;
      const rad = k < 7 ? 0.62 + gauss(r) * 0.012 : k < 9 ? 0.3 + r() * 0.3 : Math.sqrt(r()) * 0.26;
      return [Math.cos(a) * rad, Math.sin(a) * rad + 0.35, gauss(r) * 0.03];
    }, 13),
    human: sampleSdf(14, humanSdf, [-1.0, 1.0, -2.1, 1.95], (x, y, z) => [x, y * 1.0 + 0.2, z]),
  };
};

/** Faint static background stars, far away. */
export const buildSky = (n = 2200) =>
  fill((r) => {
    const [ux, uy, uz] = unit(r);
    const rad = 30 + r() * 20;
    return [ux * rad, uy * rad, uz * rad - 10];
  }, 99).slice(0, n * 3);
