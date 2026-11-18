// 人物剪影：暗色身体 + 暖色轮廓光，可以站、躺、坐起（上身绕髋部旋转）
import { glow } from "./common";

export type Pose = { x: number; y: number; s?: number; upper?: number; legs?: number; alpha?: number; rim?: string; fill?: string };
// upper / legs：方向角（弧度）。站立 upper=-π/2、legs=π/2；头朝左躺下 upper=π、legs=0；坐起 upper=-π/2、legs=0
export const person = (ctx: CanvasRenderingContext2D, p: Pose) => {
  const s = p.s ?? 1, a = p.alpha ?? 1;
  if (a <= 0.01) return;
  const up = p.upper ?? -Math.PI / 2, lg = p.legs ?? Math.PI / 2;
  const rim = p.rim ?? "255,205,150", fill = p.fill ?? "#1f1b17";
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(p.x, p.y);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  // 腿
  ctx.save(); ctx.rotate(lg);
  for (const off of [-17, 17]) {
    ctx.beginPath(); ctx.roundRect(0, off * s - 15 * s, 175 * s, 30 * s, 14 * s);
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = `rgba(${rim},0.55)`; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
  // 上身 + 头
  ctx.save(); ctx.rotate(up);
  ctx.beginPath();
  ctx.moveTo(0, -38 * s); ctx.lineTo(0, 38 * s);
  ctx.quadraticCurveTo(70 * s, 60 * s, 145 * s, 52 * s);
  ctx.quadraticCurveTo(160 * s, 0, 145 * s, -52 * s);
  ctx.quadraticCurveTo(70 * s, -60 * s, 0, -38 * s);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = `rgba(${rim},0.6)`; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(190 * s, 0, 33 * s, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
};

// 头顶的位置（用来放记忆光）
export const headPos = (p: Pose, lift = 70) => {
  const s = p.s ?? 1, up = p.upper ?? -Math.PI / 2;
  const hx = p.x + Math.cos(up) * 190 * s, hy = p.y + Math.sin(up) * 190 * s;
  return { x: hx, y: hy - lift * s };
};

export const crown = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-40, 18); ctx.lineTo(-44, -18); ctx.lineTo(-20, 2); ctx.lineTo(0, -28); ctx.lineTo(20, 2); ctx.lineTo(44, -18); ctx.lineTo(40, 18); ctx.closePath();
  ctx.fillStyle = "rgba(240,190,110,0.9)"; ctx.fill();
  ctx.strokeStyle = "rgba(255,235,190,0.9)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  glow(ctx, x, y, 60 * s, 0.25 * a);
};

// 一团记忆光：外圈慢慢转动的小光点
export const memoryOrb = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, rgb: string, t: number) => {
  if (a <= 0.01) return;
  glow(ctx, x, y, r * 2.2, 0.75 * a, rgb);
  for (let i = 0; i < 7; i++) {
    const th = t * 0.9 + (i / 7) * Math.PI * 2;
    glow(ctx, x + Math.cos(th) * r, y + Math.sin(th) * r * 0.45, 10, 0.6 * a, rgb);
  }
};

export const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, a: number, font: string, color = "243,230,208", align: CanvasTextAlign = "center") => {
  if (a <= 0.01) return;
  ctx.save();
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 10;
  ctx.fillStyle = `rgba(${color},${a})`; ctx.fillText(text, x, y);
  ctx.restore();
};

// 一个圆角标签（记忆碎片、问题卡等）
export const chip = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, a: number, font: string, rgb = "255,205,150") => {
  if (a <= 0.01) return;
  ctx.save();
  ctx.font = `${size}px ${font}`;
  const w = ctx.measureText(text).width + size * 1.1, h = size * 1.6;
  ctx.globalAlpha = a;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = "rgba(25,22,19,0.85)"; ctx.fill();
  ctx.strokeStyle = `rgba(${rgb},0.6)`; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(243,230,208,1)";
  ctx.fillText(text, x, y + 1);
  ctx.restore();
};
