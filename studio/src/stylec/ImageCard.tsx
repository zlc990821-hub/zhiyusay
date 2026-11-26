// A real image living in the particle world: particles assemble into the picture (pointillist),
// then the true image "develops" on top inside a thin gold frame; on exit the image fades back to particles.
import React from "react";
import { Img, staticFile } from "remotion";
import { clamp, easeOut } from "../components/anim";

export type CardPlace = { cx: number; cy: number; w: number; aspect: number };

/**
 * aspect = displayed height / width. crop = horizontal slice of the source [x0, x1] (fractions) to show.
 * hideRight = { from, until }: cover the source from fraction `from` to the right edge until time `until` (wipe reveal).
 */
export const ImageCard: React.FC<{
  t: number; src: string; p: CardPlace; develop: number; out: number; frame?: boolean; credit?: string; dur?: number;
  bg?: string; crop?: [number, number]; hideRight?: { from: number; until: number };
}> = ({ t, src, p, develop, out, frame = true, credit, dur = 0.9, bg, crop, hideRight }) => {
  const a = easeOut(clamp((t - develop) / dur)) * clamp((out - t) / 0.6);
  if (a <= 0) return null;
  const h = p.w * p.aspect, x = p.cx - p.w / 2, y = p.cy - h / 2;
  const [c0, c1] = crop ?? [0, 1];
  const innerW = p.w / (c1 - c0);
  const hide = hideRight ? 1 - easeOut(clamp((t - hideRight.until) / 0.8)) : 0;
  return (
    <g opacity={a}>
      {frame && <rect x={x - 10} y={y - 10} width={p.w + 20} height={h + 20} fill="none" stroke="#f2c94c" strokeWidth={2} style={{ filter: "drop-shadow(0 0 10px rgba(242,201,76,0.6))" }} />}
      <foreignObject x={x} y={y} width={p.w} height={h}>
        <div style={{ width: p.w, height: h, overflow: "hidden", position: "relative", background: bg }}>
          <Img src={staticFile(src)} style={{ position: "absolute", left: -c0 * innerW, top: 0, width: innerW, height: h, display: "block" }} />
          {hide > 0 && hideRight && <div style={{ position: "absolute", left: (hideRight.from - c0) / (c1 - c0) * p.w, top: 0, right: 0, bottom: 0, background: "#05060a", opacity: hide }} />}
        </div>
      </foreignObject>
      {credit && <text x={x + p.w} y={y + h + 34} textAnchor="end" fontFamily="sans-serif" fontSize={18} fill="rgba(244,241,234,0.55)">{credit}</text>}
    </g>
  );
};
