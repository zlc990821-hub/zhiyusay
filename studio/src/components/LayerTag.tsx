import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade } from "./anim";
import { FONT_SANS, LAYERS } from "./theme";

export type Tag = { layer: string; in: number; out: number };

/** Top-left chip telling the viewer which narrative layer the current claim belongs to. */
export const LayerTags: React.FC<{ tags: Tag[] }> = ({ tags }) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const active = tags.filter((g) => t >= g.in && t < g.out);
  return (
    <AbsoluteFill style={{ padding: "64px 80px", flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
      {active.map((g) => {
        const L = LAYERS[g.layer];
        const o = fade(t, g.in, g.out, 0.5, 0.5);
        return (
          <div
            key={g.layer + g.in}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 18px 8px 14px",
              borderRadius: 6,
              background: "rgba(10,12,18,0.55)",
              border: `1px solid ${L.color}55`,
              opacity: o,
              transform: `translateY(${(1 - o) * -8}px)`,
              fontFamily: FONT_SANS,
              color: "#e9e6df",
              fontSize: 26,
              letterSpacing: 3,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 2, background: L.color, boxShadow: `0 0 10px ${L.color}` }} />
            {L.zh}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
