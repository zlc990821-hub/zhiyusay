import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { COLORS, FONT_SANS, FONT_SERIF } from "./theme";

/**
 * Series cover template (all ratios, everything centred).
 * Hierarchy (user rule): the EPISODE TITLE is the biggest element.
 * - badge:  "天元纪元 · 第N期" small gold, top centre
 * - title:  the episode title (片名), largest; 1 line on wide covers, may wrap to 2 on tall ones
 * - sub:    one short hook line, small, under a thin gold rule
 * - visual: the episode's key image, centred in the lower part (children)
 * Text stays inside the central 4:3 safe area so a 16:9 cover survives a 4:3 crop.
 */
export type CoverText = { badge: string; titleWide: string[]; titleTall: string[]; sub: string };

export const CoverLayout: React.FC<{ text: CoverText; children: React.ReactNode }> = ({ text, children }) => {
  const { width, height } = useVideoConfig();
  const ar = width / height;
  const tall = ar < 1;
  const hook = tall ? text.titleTall : text.titleWide;
  // size the hook by the shorter usable dimension
  const safeW = tall ? width * 0.86 : Math.min(width, height * (4 / 3)) * 0.9;
  const longest = Math.max(...hook.map((l) => Array.from(l).length));
  const hookSize = Math.min(safeW / (longest * 1.06), height * (tall ? 0.12 : 0.17));
  const top = height * (ar < 0.6 ? 0.16 : tall ? 0.09 : 0.08);
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {children}
      {/* darken behind the text so it reads at thumbnail size */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(5,6,10,0.92) 0%, rgba(5,6,10,0.75) ${tall ? 32 : 38}%, rgba(5,6,10,0) ${tall ? 52 : 62}%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: top, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: hookSize * 0.22, letterSpacing: hookSize * 0.1, color: "#f2c94c", paddingLeft: hookSize * 0.1 }}>{text.badge}</div>
        <div style={{ marginTop: hookSize * 0.16 }}>
          {hook.map((l) => (
            <div key={l} style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: hookSize, lineHeight: 1.15, letterSpacing: hookSize * 0.05, paddingLeft: hookSize * 0.05, color: COLORS.text, whiteSpace: "nowrap", textShadow: "0 0 36px rgba(0,0,0,0.95), 0 4px 10px rgba(0,0,0,0.8)" }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ marginTop: hookSize * 0.22, width: hookSize * 2.6, height: 2, background: "linear-gradient(90deg, transparent, #f2c94c, transparent)" }} />
        <div style={{ marginTop: hookSize * 0.16, fontFamily: FONT_SANS, fontWeight: 500, fontSize: hookSize * 0.26, letterSpacing: hookSize * 0.04, color: "rgba(244,241,234,0.88)", textShadow: "0 0 16px rgba(0,0,0,0.9)" }}>{text.sub}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
