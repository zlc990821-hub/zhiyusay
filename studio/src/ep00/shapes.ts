// Particle target shapes for EP00. Every state has the same particle count; index i moves between states.
import { rng } from "../components/anim";

export const N = 16000;
export const STATES = ["point", "hand", "nebula", "star", "burst", "planet"] as const;
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

const makeHand = (seed: number) => {
  const r = rng(seed);
  const out = new Float32Array(N * 3);
  const S = 1.25, OY = 0.45;
  let i = 0;
  while (i < N) {
    const x = (r() - 0.5) * 3.2, y = -2.3 + r() * 4.0;
    const d = handSdf([x, y]);
    const edge = i % 3 === 0; // a third of the particles trace the outline
    if (edge ? Math.abs(d) > 0.018 : d > 0) continue;
    if (y < -1.3 && r() > Math.max(0, (y + 2.1) / 0.8)) continue; // wrist fades out
    const depth = Math.min(1, Math.max(0.25, -d * 3));
    out[i * 3] = x * S;
    out[i * 3 + 1] = y * S + OY;
    out[i * 3 + 2] = (r() - 0.5) * 0.35 * depth;
    i++;
  }
  return out;
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

export const buildShapes = (): Record<State, Float32Array> => {
  const hand = makeHand(11);
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
  };
};

/** Faint static background stars, far away. */
export const buildSky = (n = 2200) =>
  fill((r) => {
    const [ux, uy, uz] = unit(r);
    const rad = 30 + r() * 20;
    return [ux * rad, uy * rad, uz * rad - 10];
  }, 99).slice(0, n * 3);
