// EP01 particle target shapes. Same particle index i moves between states.
import { rng } from "../components/anim";

export const N = 16000;
export const STATES = ["point", "lineage", "race", "earth", "cosmos", "haze", "holes", "star", "triple", "carbon", "puddle", "bubbles"] as const;
export type State = (typeof STATES)[number];

type V3 = [number, number, number];
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
const unit = (r: () => number): V3 => {
  const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
  return [s * Math.cos(a), s * Math.sin(a), z];
};
const fill = (fn: (r: () => number, i: number) => V3, seed: number) => {
  const r = rng(seed);
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) out.set(fn(r, i), i * 3);
  return out;
};

/** aux = [seed, lineage height 0..1, lineage branch id (0 = trunk)] */
export const AUX = new Float32Array(N * 3);
/** flags = [race winner, earth 13% zone, bubble id 0..1 (lit if < 1/40), puddle water] */
export const FLAGS = new Float32Array(N * 4);
export const TARGET: V3 = [0, 0.3, 0];
export const BUBBLES = 40;

const trunk = (h: number): V3 => [0.35 * Math.sin(h * 5) + 0.15 * Math.sin(h * 13), -2.7 + 5.6 * h, 0];

export const buildShapes = (): Record<State, Float32Array> => {
  const r0 = rng(42);
  for (let i = 0; i < N; i++) AUX[i * 3] = r0();

  // lineage: an unbroken trunk + many side branches that will die off
  const nBranch = 160;
  const br = rng(3);
  const branches = Array.from({ length: nBranch }, (_, k) => ({
    h0: 0.02 + 0.95 * br(), side: br() < 0.5 ? -1 : 1, len: 0.35 + 1.1 * br(), curl: (br() - 0.5) * 1.2, id: (k + 1) / (nBranch + 1),
  }));
  const lineage = fill((r, i) => {
    if (i % 5 < 2) {
      const h = r();
      AUX[i * 3 + 1] = h; AUX[i * 3 + 2] = 0;
      const p = trunk(h);
      return [p[0] + gauss(r) * 0.018, p[1] + gauss(r) * 0.018, gauss(r) * 0.02];
    }
    const b = branches[i % nBranch];
    const t = Math.pow(r(), 0.8);
    const base = trunk(b.h0);
    const dx = b.side * t * b.len, dy = t * b.len * (0.45 + 0.3 * b.curl) - b.curl * t * t * 0.4;
    AUX[i * 3 + 1] = b.h0 + t * 0.05; AUX[i * 3 + 2] = b.id;
    return [base[0] + dx + gauss(r) * 0.012, base[1] + dy + gauss(r) * 0.012, gauss(r) * 0.05];
  }, 4);

  // race: start positions in a wide band on the left; motion is computed in the shader
  const race = fill((r, i) => {
    FLAGS[i * 4] = i % 1999 === 0 ? 1 : 0; // ~8 particles form the winner
    if (FLAGS[i * 4]) return [-5.2 + gauss(r) * 0.04, 0.3 + gauss(r) * 0.04, gauss(r) * 0.04];
    return [-7.5 + r() * 4.2, 0.3 + gauss(r) * 1.2, (r() - 0.5) * 2.5];
  }, 5);

  // earth: sphere; four caps (~3.3% area each) mark the "deadly" 13%; one cap faces the camera
  const caps: V3[] = [[0, 0, 1], [0.8, 0.5, -0.33], [-0.7, -0.6, -0.4], [-0.3, 0.9, -0.3]].map((v) => {
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l] as V3;
  });
  const capCos = Math.cos((21 * Math.PI) / 180);
  const earth = fill((r, i) => {
    const u = unit(r);
    const rad = i % 9 === 0 ? 1.38 + r() * 0.1 : 1.3;
    FLAGS[i * 4 + 1] = caps.some((c) => c[0] * u[0] + c[1] * u[1] + c[2] * u[2] > capCos) ? 1 : 0;
    return [u[0] * rad, u[1] * rad + 0.35, u[2] * rad];
  }, 6);

  // cosmos: clumpy "galaxies"; haze: smooth fog; holes: a few dense knots
  const cr = rng(7);
  const centers: V3[] = Array.from({ length: 70 }, () => [(cr() - 0.5) * 11, (cr() - 0.5) * 6 + 0.3, (cr() - 0.5) * 6]);
  const cosmos = fill((r, i) => {
    if (i % 4 === 0) return [(r() - 0.5) * 11, (r() - 0.5) * 6 + 0.3, (r() - 0.5) * 6];
    const c = centers[i % centers.length];
    const s = 0.12 + 0.25 * ((i % 7) / 7);
    return [c[0] + gauss(r) * s, c[1] + gauss(r) * s * 0.6, c[2] + gauss(r) * s];
  }, 8);
  const haze = fill((r) => [(r() - 0.5) * 11, (r() - 0.5) * 6 + 0.3, (r() - 0.5) * 6], 9);
  const holes = fill((r, i) => {
    const c = centers[(i % 7) * 9];
    return [c[0] + gauss(r) * 0.06, c[1] + gauss(r) * 0.06, c[2] + gauss(r) * 0.06];
  }, 10);

  const star = fill((r, i) => {
    const u = unit(r);
    const rad = i % 3 === 0 ? 0.9 + Math.pow(r(), 2) * 0.9 : Math.cbrt(r()) * 0.9;
    return [u[0] * rad, u[1] * rad + 0.35, u[2] * rad];
  }, 11);
  const tri: V3[] = [0, 1, 2].map((k) => [Math.cos(Math.PI / 2 + (k * 2 * Math.PI) / 3) * 1.25, Math.sin(Math.PI / 2 + (k * 2 * Math.PI) / 3) * 1.25 + 0.3, 0]);
  const triple = fill((r, i) => {
    const c = tri[i % 3];
    const u = unit(r), rad = Math.cbrt(r()) * 0.38;
    return [c[0] + u[0] * rad, c[1] + u[1] * rad, c[2] + u[2] * rad];
  }, 12);
  const nuc = fill((r) => unit(r), 13).slice(0, 36);
  const carbon = fill((r, i) => {
    const k = i % 12;
    const c: V3 = [nuc[k * 3] * 0.58, nuc[k * 3 + 1] * 0.58 + 0.3, nuc[k * 3 + 2] * 0.58];
    const u = unit(r), rad = Math.cbrt(r()) * 0.15;
    return [c[0] + u[0] * rad, c[1] + u[1] * rad, c[2] + u[2] * rad];
  }, 14);

  // puddle: ground + pit outline (earth tone) and water filling the pit exactly
  const W = 1.7, D = 1.25, G = 0.25;
  const puddle = fill((r, i) => {
    const water = i % 20 < 13;
    FLAGS[i * 4 + 3] = water ? 1 : 0;
    if (!water) {
      if (i % 2) { // ground line
        const x = (r() < 0.5 ? -1 : 1) * (W + r() * 3.6);
        return [x, G + gauss(r) * 0.015, gauss(r) * 0.15];
      }
      const x = (r() * 2 - 1) * W; // pit wall
      return [x, G - D * Math.sqrt(Math.max(0, 1 - (x / W) ** 2)) + gauss(r) * 0.015, gauss(r) * 0.15];
    }
    for (;;) {
      const x = (r() * 2 - 1) * W, y = G - r() * D;
      if (((x / W) ** 2 + ((y - G) / D) ** 2) < 0.96 && y < G - 0.03) return [x, y, gauss(r) * 0.12];
    }
  }, 15);

  // bubbles: many small universes; bubble 0 (ours) sits in front and is the only lit one
  const bb = rng(16);
  const bubs = Array.from({ length: BUBBLES }, (_, k) =>
    k === 0 ? { c: [0, 0.35, 1.2] as V3, rad: 0.75 } : { c: [(bb() - 0.5) * 11, (bb() - 0.5) * 5.5 + 0.3, -1 - bb() * 5] as V3, rad: 0.25 + bb() * 0.45 });
  const bubbles = fill((r, i) => {
    const k = i % BUBBLES;
    FLAGS[i * 4 + 2] = k / BUBBLES;
    const u = unit(r), b = bubs[k];
    const rad = b.rad * (i % 4 === 0 ? Math.cbrt(r()) : 1);
    return [b.c[0] + u[0] * rad, b.c[1] + u[1] * rad, b.c[2] + u[2] * rad];
  }, 17);

  return {
    point: fill((r) => [TARGET[0] + gauss(r) * 0.03, TARGET[1] + gauss(r) * 0.03, gauss(r) * 0.03], 1),
    lineage, race, earth, cosmos, haze, holes, star, triple, carbon, puddle, bubbles,
  };
};

export const buildSky = (n = 2200) =>
  fill((r) => {
    const [ux, uy, uz] = unit(r);
    const rad = 30 + r() * 20;
    return [ux * rad, uy * rad, uz * rad - 10];
  }, 99).slice(0, n * 3);
