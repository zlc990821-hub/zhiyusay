// Rasterise SVG silhouettes in the browser and sample them into particle targets (pixel space, y down).
import { rng } from "../components/anim";
import { Place, SIL } from "./silhouettes";

export type Pts = Float32Array; // x, y pairs in screen pixels

const loadImg = (markup: string, px: number) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 600 600">${markup}</svg>`;
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });

export type Mask = { inside: Int32Array; edge: Int32Array; px: number };

export const rasterise = async (markup: string, px = 400): Promise<Mask> => {
  const img = await loadImg(markup, px);
  const c = document.createElement("canvas");
  c.width = px; c.height = px;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, px, px);
  const a = ctx.getImageData(0, 0, px, px).data;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < px && y < px && a[(y * px + x) * 4 + 3] > 128;
  const inside: number[] = [], edge: number[] = [];
  for (let y = 0; y < px; y++)
    for (let x = 0; x < px; x++) {
      if (!on(x, y)) continue;
      inside.push(y * px + x);
      if (!on(x - 2, y) || !on(x + 2, y) || !on(x, y - 2) || !on(x, y + 2)) edge.push(y * px + x);
    }
  return { inside: Int32Array.from(inside), edge: Int32Array.from(edge), px };
};

/** Sample N points from a mask into a placed box. edgeShare of points trace the outline. */
export const sample = (m: Mask, N: number, p: Place, seed: number, edgeShare = 0.4): Pts => {
  const r = rng(seed);
  const out = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    const src = r() < edgeShare && m.edge.length ? m.edge : m.inside;
    const k = src[Math.floor(r() * src.length)];
    const x = (k % m.px) + r() - 0.5, y = Math.floor(k / m.px) + r() - 0.5;
    out[i * 2] = p.cx + (x / m.px - 0.5) * p.size;
    out[i * 2 + 1] = p.cy + (y / m.px - 0.5) * p.size;
  }
  return out;
};

let cache: Promise<Record<string, Mask>> | null = null;
export const loadSilhouettes = () => {
  if (!cache) cache = Promise.all(Object.entries(SIL).map(async ([k, v]) => [k, await rasterise(v)] as const)).then(Object.fromEntries);
  return cache;
};

// ───────── equirectangular land mask for the particle globe ─────────
const LAND: [number, number][][] = [
  [[-165, 65], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-70, 43], [-80, 30], [-81, 25], [-90, 29], [-97, 26], [-97, 20], [-91, 18], [-88, 21], [-87, 17], [-84, 10], [-80, 8], [-92, 15], [-105, 20], [-112, 28], [-118, 34], [-124, 40], [-125, 48], [-135, 58], [-150, 60]],
  [[-80, 8], [-75, 11], [-62, 10], [-50, 0], [-35, -7], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-72, -50], [-75, -40], [-71, -18], [-81, -5]],
  [[-55, 60], [-45, 60], [-20, 70], [-25, 82], [-60, 82], [-70, 76]],
  [[-10, 36], [0, 43], [-5, 48], [5, 52], [10, 58], [5, 62], [15, 70], [30, 70], [40, 65], [30, 55], [40, 45], [28, 40], [20, 40], [12, 44], [15, 38], [5, 43]],
  [[-17, 21], [-10, 35], [10, 37], [32, 31], [43, 12], [51, 12], [40, -5], [40, -15], [33, -27], [20, -35], [15, -25], [12, -5], [8, 4], [-8, 5], [-17, 14]],
  [[30, 55], [40, 45], [36, 36], [48, 30], [57, 25], [66, 25], [77, 8], [80, 15], [90, 22], [98, 16], [104, 1], [110, 20], [122, 30], [122, 40], [130, 43], [142, 52], [160, 60], [180, 66], [180, 72], [140, 74], [100, 78], [70, 73], [50, 70], [40, 65]],
  [[114, -22], [130, -12], [142, -11], [153, -27], [146, -39], [135, -35], [115, -34]],
  [[-180, -70], [180, -70], [180, -90], [-180, -90]],
];
export const landMask = async () => {
  const w = 720, h = 360;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  for (const poly of LAND) {
    ctx.beginPath();
    poly.forEach(([lo, la], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, ((lo + 180) / 360) * w, ((90 - la) / 180) * h));
    ctx.closePath(); ctx.fill();
  }
  const a = ctx.getImageData(0, 0, w, h).data;
  return (lon: number, lat: number) => {
    const x = Math.min(w - 1, Math.max(0, Math.round(((lon + 180) / 360) * w)));
    const y = Math.min(h - 1, Math.max(0, Math.round(((90 - lat) / 180) * h)));
    return a[(y * w + x) * 4 + 3] > 128;
  };
};
