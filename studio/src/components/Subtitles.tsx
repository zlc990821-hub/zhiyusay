import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_SANS } from "./theme";

export type Sub = { text: string; start: number; end: number };

/** One line at a time, bottom-centre, short cross-fade. Lines in `hide` are shown elsewhere as big type. */
export const Subtitles: React.FC<{ subs: Sub[]; hide?: string[] }> = ({ subs, hide = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = subs.find((x) => t >= x.start && t < x.end && !hide.includes(x.text));
  if (!s) return null;
  const o = Math.min(1, (t - s.start) / 0.15, (s.end - t) / 0.15);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 92 }}>
      <div
        style={{
          fontFamily: FONT_SANS,
          fontWeight: 500,
          fontSize: 46,
          letterSpacing: 2,
          color: COLORS.text,
          opacity: o,
          textShadow: "0 0 18px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)",
          maxWidth: 1500,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {s.text}
      </div>
    </AbsoluteFill>
  );
};
