import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { ParticleField } from "./ParticleField";
import { CoverLayout, CoverText } from "../components/CoverLayout";
import { loadFonts } from "../components/theme";

export const EP00_COVER: CoverText = {
  badge: "天元纪元 · 序章",
  hookWide: ["你到底是什么？"],
  hookTall: ["你到底", "是什么？"],
  title: "序章｜《人类：我们究竟是什么？》",
};
loadFonts(EP00_COVER.badge + EP00_COVER.hookWide.join("") + EP00_COVER.title);

/** Key visual: the particle hand rising from the bottom centre, fingertips just under the title. */
export const Cover: React.FC = () => {
  const { width, height } = useVideoConfig();
  const ar = width / height;
  // camera height / distance tuned per aspect so fingertips sit at ~52% (wide) or ~50% (tall) of the frame
  const cam: [number, number, number] = ar > 1.6 ? [0.3, 2.15, 7.6] : ar > 1.1 ? [0.3, 2.3, 8.6] : ar > 0.65 ? [0.3, 2.75, 9.6] : [0.3, 2.6, 10.2];
  return (
    <CoverLayout text={EP00_COVER}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 80%, #1a2238 0%, #05060a 60%)" }} />
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.1, far: 200, position: [0, 0, 8] }} gl={{ antialias: true }}>
        <ParticleField t={24.8} width={width} height={height} cam={cam} boost={1.5} />
      </ThreeCanvas>
    </CoverLayout>
  );
};
