// 线索图：每条线索是一个光点，线索之间连成光线。全片共用同一张图，节点位置固定。
import { glow, clamp, smooth, SERIF } from "./common";

export type ClueNode = { id: string; x: number; y: number; label: string; key?: boolean; pos?: "a" | "b" };
export const CLUES: ClueNode[] = [
  { id: "common", x: 330, y: 330, label: "常识：我＝我的记忆", pos: "a" },
  { id: "piaget", x: 610, y: 560, label: "皮亚杰的假童年", pos: "b" },
  { id: "loftus", x: 900, y: 330, label: "一个词，撒下一地碎玻璃", pos: "a" },
  { id: "mall", x: 1140, y: 610, label: "商场里走丢过", pos: "b" },
  { id: "challenger", x: 1500, y: 400, label: "挑战者号：记成了另一个样子", pos: "a" },
  { id: "rat", x: 1640, y: 640, label: "想起时，记忆会松动", pos: "b" },
  { id: "found1", x: 420, y: 830, label: "发现一：记忆是一份记录", key: true, pos: "b" },
  { id: "parfit", x: 780, y: 910, label: "能被复制的记录", pos: "a" },
  { id: "found2", x: 1100, y: 830, label: "发现二：你在书写", key: true, pos: "a" },
  { id: "found3", x: 1420, y: 900, label: "发现三：看着的那一个", key: true, pos: "a" },
];
export const clueById = (id: string) => CLUES.find((c) => c.id === id)!;
const EDGES: [string, string][] = [
  ["common", "piaget"], ["piaget", "loftus"], ["loftus", "mall"], ["mall", "challenger"], ["challenger", "rat"],
  ["rat", "found1"], ["mall", "found1"], ["found1", "parfit"], ["parfit", "found2"], ["found2", "found3"],
];

// vis(id) 返回 0–1 的可见度；dim(id) 返回亮度系数；showLabel(id) 返回标签透明度
export const drawClueMap = (
  ctx: CanvasRenderingContext2D, t: number,
  opt: { vis: (id: string) => number; bright?: (id: string) => number; label?: (id: string) => number; scale?: number; cx?: number; cy?: number; labelSize?: number },
) => {
  const s = opt.scale ?? 1, cx = opt.cx ?? 960, cy = opt.cy ?? 540;
  const P = (n: ClueNode) => ({ x: 960 + (n.x - cx) * s, y: 540 + (n.y - cy) * s });
  ctx.lineCap = "round";
  for (const [a, b] of EDGES) {
    const A = clueById(a), B = clueById(b);
    const v = Math.min(opt.vis(a), opt.vis(b));
    if (v <= 0) continue;
    const pa = P(A), pb = P(B);
    const k = smooth(v);
    const g = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
    const ba = (opt.bright?.(a) ?? 1), bb = (opt.bright?.(b) ?? 1);
    g.addColorStop(0, `rgba(255,205,140,${0.38 * ba * k})`); g.addColorStop(1, `rgba(255,205,140,${0.38 * bb * k})`);
    ctx.strokeStyle = g; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pa.x + (pb.x - pa.x) * k, pa.y + (pb.y - pa.y) * k); ctx.stroke();
  }
  for (const n of CLUES) {
    const v = opt.vis(n.id);
    if (v <= 0) continue;
    const p = P(n), br = opt.bright?.(n.id) ?? 1;
    const pulse = 1 + 0.06 * Math.sin(t * 2.1 + n.x * 0.01);
    glow(ctx, p.x, p.y, (n.key ? 64 : 46) * pulse * Math.min(1.2, 0.6 + 0.6 * s), 0.85 * v * br);
    const la = (opt.label?.(n.id) ?? 1) * clamp(v * 1.5 - 0.3) * Math.min(1, br * 1.2);
    if (la > 0.01) {
      ctx.font = `${opt.labelSize ?? 46}px ${SERIF}`;
      ctx.fillStyle = `rgba(243,230,208,${0.92 * la})`;
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8;
      const w = ctx.measureText(n.label).width;
      if (n.pos) ctx.fillText(n.label, Math.min(1860 - w, Math.max(60, p.x - w / 2)), p.y + (n.pos === "a" ? -70 : 74));
      else ctx.fillText(n.label, p.x + 40 + w > 1860 ? p.x - 40 - w : p.x + 40, p.y - 46);
      ctx.shadowBlur = 0; ctx.textBaseline = "alphabetic";
    }
  }
};

// 每条线索在全片里第一次出现的时间（录音秒数），各段画线索图时用它决定哪些光点已经在
export const CLUE_AT: Record<string, number> = {
  common: 130.1, piaget: 189.4, loftus: 235.9, mall: 259.3, challenger: 384.4, rat: 385.2,
  found1: 481.0, parfit: 563.2, found2: 690.6, found3: 751.1,
};
export const clueOn = (id: string, t: number, d = 0.8) => Math.min(1, Math.max(0, (t - CLUE_AT[id]) / d));
