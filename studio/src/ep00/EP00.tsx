import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { ParticleField } from "./ParticleField";
import { Counter, Elements, Flash, QuestionAndTitle, Vignette } from "./Overlays";
import { Subtitles, Sub } from "../components/Subtitles";
import { LayerTags, Tag } from "../components/LayerTag";
import { COLORS, loadFonts } from "../components/theme";
import subs from "../../../episodes/EP00_人类/subtitles.json";
import timeline from "../../../episodes/EP00_人类/timeline.json";

const ALL_TEXT =
  (subs as Sub[]).map((s) => s.text).join("") + timeline.question.text + timeline.title.text + timeline.title.kicker +
  timeline.elements.map((e) => e.sym + e.zh).join("") + "0123456789,年";
loadFonts(ALL_TEXT);

export const EP00: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, #0b0e18 0%, ${COLORS.bg} 70%)` }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.1, far: 200, position: [0, 0, 8] }} gl={{ antialias: true }}>
        <ParticleField t={t} width={width} height={height} />
      </ThreeCanvas>
      <Flash t={t} />
      <Elements t={t} />
      <Counter t={t} />
      <QuestionAndTitle t={t} />
      <Vignette />
      <LayerTags tags={timeline.tags as Tag[]} />
      <Subtitles subs={subs as Sub[]} hide={[timeline.question.text]} />
      <Audio src={staticFile("EP00_人类/audio/vo_edit.wav")} />
      <Audio src={staticFile("EP00_人类/audio/sfx.wav")} />
    </AbsoluteFill>
  );
};
