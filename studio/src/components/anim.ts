// Shared timing helpers (seconds-based, deterministic).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

/** Interpolate a numeric keyframe list [[t, v], ...] with ease-in-out. */
export const keyNum = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t < t1) return v0 + (v1 - v0) * easeInOut((t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
};

/** Fade envelope: 0 before `a`, ramps to 1 over `fi`, holds, ramps out over `fo` ending at `b`. */
export const fade = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) =>
  Math.min(clamp((t - a) / fi), clamp((b - t) / fo));

/** Seeded PRNG (mulberry32). */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};
