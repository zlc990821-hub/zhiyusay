import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { ParticleField } from "./ParticleField";
import { COLORS, FONT_SANS, FONT_SERIF, loadFonts } from "../components/theme";

// Cover copy. Hook big, fixed-format title small (标题格式：期号｜《片名》).
const COVER = { hook: ["你到底", "是什么？"], kicker: "天元纪元", title: "序章｜《人类：我们究竟是什么？》" };
loadFonts(COVER.hook.join("") + COVER.kicker + COVER.title);

type Layout = "wide" | "tall";

/** Static cover: particle hand (from t=24.8, hand fully formed, facing camera) + type. */
export const Cover: React.FC<{ layout: Layout }> = ({ layout }) => {
  const { width, height } = useVideoConfig();
  const wide = layout === "wide";
  const aspect = width / height;
  // wide: hand on the right third; tall: hand in lower half
  const cam: [number, number, number] = wide ? (aspect > 1.6 ? [-2.0, 0.35, 6.0] : [-2.4, 0.35, 8.6]) : [0, 2.85, 9.0];
  const hookSize = wide ? height * (aspect > 1.6 ? 0.2 : 0.17) : width * 0.2;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${wide ? "68% 50%" : "50% 66%"}, #121829 0%, ${COLORS.bg} 68%)` }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.1, far: 200, position: [0, 0, 8] }} gl={{ antialias: true }}>
        <ParticleField t={24.8} width={width} height={height} cam={cam} boost={1.35} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: wide ? "linear-gradient(90deg, rgba(5,6,10,0.85) 0%, rgba(5,6,10,0.4) 45%, rgba(5,6,10,0) 65%)" : "linear-gradient(180deg, rgba(5,6,10,0.8) 0%, rgba(5,6,10,0.3) 40%, rgba(5,6,10,0) 55%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
      <AbsoluteFill
        style={{
          padding: wide ? `0 0 0 ${width * 0.07}px` : `${height * 0.08}px ${width * 0.08}px 0`,
          justifyContent: wide ? "center" : "flex-start",
          alignItems: wide ? "flex-start" : "center",
          textAlign: wide ? "left" : "center",
        }}
      >
        <div style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: hookSize * 0.2, letterSpacing: hookSize * 0.08, color: "#f2c94c", marginBottom: hookSize * 0.18 }}>{COVER.kicker}</div>
        {COVER.hook.map((l) => (
          <div key={l} style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: hookSize, lineHeight: 1.12, letterSpacing: hookSize * 0.04, color: COLORS.text, textShadow: "0 0 40px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.8)" }}>
            {l}
          </div>
        ))}
        <div style={{ marginTop: hookSize * 0.28, fontFamily: FONT_SANS, fontWeight: 500, fontSize: hookSize * 0.19, letterSpacing: hookSize * 0.02, color: "rgba(244,241,234,0.85)", padding: `${hookSize * 0.05}px ${hookSize * 0.12}px`, borderLeft: wide ? "4px solid #f2c94c" : undefined, borderTop: wide ? undefined : "2px solid rgba(242,201,76,0.8)" }}>
          {COVER.title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
