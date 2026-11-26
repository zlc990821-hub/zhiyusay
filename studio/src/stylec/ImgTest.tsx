import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { solid, Stage, StateDef, useStates } from "./Stage";
import { loadSilhouettes, sample, sampleImage } from "./sampler";
import { ImageCard } from "./ImageCard";

const SRC = "EP02_现实/assets/checker_shadow.svg";
const P = { cx: 960, cy: 520, w: 820 };
export const ImgTest: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const states = useStates(async (): Promise<Record<string, StateDef>> => {
    const m = await loadSilhouettes();
    const im = await sampleImage(staticFile(SRC), 14000, { cx: P.cx, cy: P.cy, size: P.w }, 3);
    return { brain: { pos: sample(m.brain, 14000, { cx: 960, cy: 500, size: 560 }, 4), col: solid([1, 0.72, 0.6]) }, chk: { pos: im.pos, col: im.col } };
  });
  return (
    <AbsoluteFill style={{ background: "#05060a" }}>
      {states && (
        <ThreeCanvas width={1920} height={1080} orthographic camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 1000 }}>
          <Stage t={t} states={states} keys={[[0, "brain"], [1.0, "brain"], [2.6, "chk"]]} gain={1.4 * (1 - Math.min(1, Math.max(0, (t - 3.0) / 0.9)) * 0.85)} size={3.2} />
        </ThreeCanvas>
      )}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <ImageCard t={t} src={SRC} p={{ cx: P.cx, cy: P.cy, w: P.w, aspect: 721 / 948 }} develop={2.9} out={99} credit="Edward H. Adelson · CC BY-SA 4.0" />
      </svg>
    </AbsoluteFill>
  );
};
