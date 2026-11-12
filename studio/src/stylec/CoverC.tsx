// Style C covers: particle silhouette + glowing gold outline as the key visual, CoverLayout typography.
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CoverLayout, CoverText } from "../components/CoverLayout";
import { loadFonts } from "../components/theme";
import { solid, Stage, StateDef, useStates } from "./Stage";
import { loadSilhouettes, sample } from "./sampler";
import { Place, SIL } from "./silhouettes";

export const EP01_COVER_C: CoverText = {
  badge: "天元纪元 · 第1期",
  titleWide: ["我为什么会存在？"],
  titleTall: ["我为什么", "会存在？"],
  sub: "四十亿年，一次没输过",
};
loadFonts(EP01_COVER_C.badge + EP01_COVER_C.titleTall.join("") + EP01_COVER_C.sub);

const placeFor = (w: number, h: number): Place => {
  const ar = w / h;
  if (ar > 1.6) return { cx: w / 2, cy: h * 0.73, size: h * 0.56 };
  if (ar > 1.1) return { cx: w / 2, cy: h * 0.74, size: h * 0.54 };
  if (ar > 0.65) return { cx: w / 2, cy: h * 0.77, size: h * 0.46 };
  return { cx: w / 2, cy: h * 0.78, size: h * 0.42 };
};

export const CoverC: React.FC = () => {
  const { width, height } = useVideoConfig();
  const p = placeFor(width, height);
  const states = useStates(async (): Promise<Record<string, StateDef>> => {
    const m = await loadSilhouettes();
    return { human: { pos: sample(m.human, 14000, p, 11), col: solid([1, 0.85, 0.58]) } };
  });
  return (
    <CoverLayout text={EP01_COVER_C}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 80%, #18203a 0%, #05060a 62%)" }} />
      {states && (
        <ThreeCanvas width={width} height={height} orthographic camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 1000 }}>
          <Stage t={5} states={states} keys={[[0, "human"]]} gain={1.9} size={3.4} cam={{ x: width / 2, y: height / 2, z: 1 }} />
        </ThreeCanvas>
      )}
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <defs>
          <filter id="cov-outline" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="d" />
            <feComposite in="d" in2="SourceAlpha" operator="out" result="o" />
            <feFlood floodColor="#f2c94c" />
            <feComposite in2="o" operator="in" result="line" />
            <feGaussianBlur in="line" stdDeviation="6" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="line" /></feMerge>
          </filter>
        </defs>
        <g filter="url(#cov-outline)" transform={`translate(${p.cx - p.size / 2},${p.cy - p.size / 2}) scale(${p.size / 600})`} dangerouslySetInnerHTML={{ __html: SIL.human }} />
      </svg>
    </CoverLayout>
  );
};
