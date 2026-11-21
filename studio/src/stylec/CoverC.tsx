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

export const EP02_COVER_C: CoverText = {
  badge: "天元纪元 · 第2期",
  titleWide: ["你看到的世界，是真的吗？"],
  titleTall: ["你看到的世界，", "是真的吗？"],
  sub: "你的眼睛里，有一个看不见的洞",
};
loadFonts(EP02_COVER_C.badge + EP02_COVER_C.titleTall.join("") + EP02_COVER_C.sub);

/** Generic style-C cover: one silhouette (particles + gold outline) under the CoverLayout typography. */
export const CoverC: React.FC = () => <SilCover text={EP01_COVER_C} sil="human" col={[1, 0.85, 0.58]} />;
export const CoverC2: React.FC = () => <SilCover2 />;
export const SilCover: React.FC<{ text: CoverText; sil: string; col: [number, number, number]; outline?: boolean }> = ({ text, sil, col, outline = true }) => {
  const { width, height } = useVideoConfig();
  const p = placeFor(width, height);
  const states = useStates(async (): Promise<Record<string, StateDef>> => {
    const m = await loadSilhouettes();
    return { k: { pos: sample(m[sil], 14000, p, 11, sil === "eyeLids" ? 0.9 : 0.4), col: solid(col) } };
  });
  return (
    <CoverLayout text={text}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 80%, #18203a 0%, #05060a 62%)" }} />
      {states && (
        <ThreeCanvas width={width} height={height} orthographic camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 1000 }}>
          <Stage t={5} states={states} keys={[[0, "k"]]} gain={1.9} size={3.4} cam={{ x: width / 2, y: height / 2, z: 1 }} />
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
        <g filter="url(#cov-outline)" transform={`translate(${p.cx - p.size / 2},${p.cy - p.size / 2}) scale(${p.size / 600})`} dangerouslySetInnerHTML={{ __html: outline ? SIL[sil] : "" }} />
      </svg>
    </CoverLayout>
  );
};

/** EP02: an eye (lids + iris) — two silhouettes layered. */
const SilCover2: React.FC = () => {
  const { width, height } = useVideoConfig();
  const p = placeFor(width, height);
  const pe = { ...p, size: p.size * 1.25 };
  const states = useStates(async (): Promise<Record<string, StateDef>> => {
    const m = await loadSilhouettes();
    const lids = sample(m.eyeLids, 14000, pe, 7, 0.9), iris = sample(m.eyeIris, 14000, pe, 8, 0.35);
    const pos = new Float32Array(28000);
    for (let i = 0; i < 14000; i++) { const src = i % 10 < 6 ? iris : lids; pos[i * 2] = src[i * 2]; pos[i * 2 + 1] = src[i * 2 + 1]; }
    const col = new Float32Array(42000);
    for (let i = 0; i < 14000; i++) col.set(i % 10 < 6 ? [0.45, 0.75, 1] : [0.95, 0.92, 0.88], i * 3);
    return { k: { pos, col } };
  });
  return (
    <CoverLayout text={EP02_COVER_C}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 80%, #18203a 0%, #05060a 62%)" }} />
      {states && (
        <ThreeCanvas width={width} height={height} orthographic camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 1000 }}>
          <Stage t={5} states={states} keys={[[0, "k"]]} gain={1.9} size={3.4} cam={{ x: width / 2, y: height / 2, z: 1 }} />
        </ThreeCanvas>
      )}
    </CoverLayout>
  );
};
