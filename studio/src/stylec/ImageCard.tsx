// A real image living in the particle world: particles assemble into the picture (pointillist),
// then the true image "develops" on top inside a thin gold frame; on exit the image fades back to particles.
import React from "react";
import { Img, staticFile } from "remotion";
import { clamp, easeOut } from "../components/anim";

export type CardPlace = { cx: number; cy: number; w: number; aspect: number };

export const ImageCard: React.FC<{ t: number; src: string; p: CardPlace; develop: number; out: number; frame?: boolean; credit?: string; dur?: number }> = ({ t, src, p, develop, out, frame = true, credit, dur = 0.9 }) => {
  const a = easeOut(clamp((t - develop) / dur)) * clamp((out - t) / 0.6);
  if (a <= 0) return null;
  const h = p.w * p.aspect, x = p.cx - p.w / 2, y = p.cy - h / 2;
  return (
    <g opacity={a}>
      {frame && <rect x={x - 10} y={y - 10} width={p.w + 20} height={h + 20} fill="none" stroke="#f2c94c" strokeWidth={2} style={{ filter: "drop-shadow(0 0 10px rgba(242,201,76,0.6))" }} />}
      <foreignObject x={x} y={y} width={p.w} height={h}>
        <Img src={staticFile(src)} style={{ width: p.w, height: h, display: "block" }} />
      </foreignObject>
      {credit && <text x={x + p.w} y={y + h + 34} textAnchor="end" fontFamily="sans-serif" fontSize={18} fill="rgba(244,241,234,0.55)">{credit}</text>}
    </g>
  );
};
