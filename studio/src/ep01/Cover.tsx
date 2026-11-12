import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Particles } from "./Particles";
import { CoverLayout, CoverText } from "../components/CoverLayout";
import { loadFonts } from "../components/theme";

export const EP01_COVER: CoverText = {
  badge: "天元纪元 · 第1期",
  titleWide: ["我为什么会存在？"],
  titleTall: ["我为什么", "会存在？"],
  sub: "四十亿年，一次没输过",
};
loadFonts(EP01_COVER.badge + EP01_COVER.titleTall.join("") + EP01_COVER.sub);

/** Key visual: the unbroken golden lineage rising from the bottom centre, dead branches faint around it. */
export const Cover01: React.FC = () => {
  const { width, height } = useVideoConfig();
  const ar = width / height;
  const cam: [number, number, number] = ar > 1.6 ? [0, 2.85, 7.6] : ar > 1.1 ? [0, 3.0, 8.4] : ar > 0.65 ? [0, 3.3, 9.6] : [0, 3.4, 10.5];
  return (
    <CoverLayout text={EP01_COVER}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 85%, #1a2238 0%, #05060a 62%)" }} />
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.1, far: 200, position: [0, 0, 8] }} gl={{ antialias: true }}>
        <Particles t={14.6} height={height} cam={cam} boost={1.3} />
      </ThreeCanvas>
    </CoverLayout>
  );
};
