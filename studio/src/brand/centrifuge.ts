// 「离心」品牌片头片尾的共享绘制逻辑（Canvas 2D，按帧确定性计算，保证每次渲染一致）
export const W = 1920;
export const H = 1080;
export const CX = W / 2;
export const CY = H / 2 - 20;
export const GOLD = "255, 196, 120";
export const PALE = "255, 232, 196";
export const N = 220;

// 确定性伪随机
export const rand = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 * salt + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type P = { r: number; k: number; th0: number; size: number; tilt: number };
export const PARTICLES: P[] = Array.from({ length: N }, (_, i) => ({
  r: 90 + Math.pow(rand(i, 1), 0.8) * 450,
  k: 0.65 + rand(i, 2) * 0.7,
  th0: rand(i, 3) * Math.PI * 2,
  size: 1.1 + rand(i, 4) * 2.2,
  tilt: (rand(i, 5) - 0.5) * 0.12,
}));

export const FLAT = 0.3; // 轨道压扁，形成倾斜的透视感

export const orbitPos = (p: P, theta: number, radiusScale = 1) => {
  const r = p.r * radiusScale;
  const x = Math.cos(theta) * r;
  const y = Math.sin(theta) * r * FLAT;
  // 轻微倾角
  const xr = x * Math.cos(p.tilt) - y * Math.sin(p.tilt);
  const yr = x * Math.sin(p.tilt) + y * Math.cos(p.tilt);
  const depth = Math.sin(theta); // 下半圈在前
  return { x: CX + xr, y: CY + yr, depth };
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp(t), 3);

export const drawCore = (ctx: CanvasRenderingContext2D, intensity: number, radius = 1) => {
  if (intensity <= 0.001) return;
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 180 * radius);
  g.addColorStop(0, `rgba(${PALE}, ${0.95 * intensity})`);
  g.addColorStop(0.08, `rgba(${GOLD}, ${0.7 * intensity})`);
  g.addColorStop(0.35, `rgba(${GOLD}, ${0.12 * intensity})`);
  g.addColorStop(1, `rgba(${GOLD}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, 180 * radius, 0, Math.PI * 2);
  ctx.fill();
};

// 胶片颗粒与暗角
export const drawFilm = (ctx: CanvasRenderingContext2D, frame: number, grain = 0.07) => {
  const v = ctx.createRadialGradient(CX, H / 2, H * 0.35, CX, H / 2, H * 1.05);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  const gw = 480, gh = 270;
  const off = document.createElement("canvas");
  off.width = gw; off.height = gh;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(gw, gh);
  for (let i = 0; i < gw * gh; i++) {
    const n = rand(i + frame * 7919, 9) * 255;
    img.data[i * 4] = n; img.data[i * 4 + 1] = n; img.data[i * 4 + 2] = n;
    img.data[i * 4 + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = grain;
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(off, 0, 0, W, H);
  ctx.restore();
};
