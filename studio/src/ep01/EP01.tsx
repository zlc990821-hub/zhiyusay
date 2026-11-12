import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Particles } from "./Particles";
import { Asteroid, Callouts, Ending, Knobs, Levels, QuestionAndTitle, Quote, Sun, Views, Vignette } from "./Overlays";
import { Subtitles, Sub } from "../components/Subtitles";
import { LayerTags, Tag } from "../components/LayerTag";
import { COLORS, loadFonts } from "../components/theme";
import subs from "../../../episodes/EP01_存在/subtitles.json";
import timeline from "../../../episodes/EP01_存在/timeline.json";

loadFonts(
  (subs as Sub[]).map((s) => s.text).join("") + JSON.stringify(timeline) + "0123456789科学古籍哲学天元假说思想实验架空设定✓？",
);

// lines drawn as big type are hidden from the subtitle track
const HIDE = ["所以——我，为什么会存在？", "为什么有东西存在，而不是什么都没有？", "不知道，", "所以，继续探索。"];

export const EP01: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, #0b0e18 0%, ${COLORS.bg} 70%)` }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.1, far: 200, position: [0, 0, 8] }} gl={{ antialias: true }}>
        <Particles t={t} height={height} />
      </ThreeCanvas>
      <Sun t={t} />
      <Asteroid t={t} />
      <Knobs t={t} />
      <Levels t={t} />
      <Callouts t={t} />
      <Views t={t} />
      <QuestionAndTitle t={t} />
      <Quote t={t} />
      <Ending t={t} />
      <Vignette />
      <LayerTags tags={timeline.tags as Tag[]} />
      <Subtitles subs={subs as Sub[]} hide={HIDE} />
      <Audio src={staticFile("EP01_存在/audio/vo_edit.wav")} />
      <Audio src={staticFile("EP01_存在/audio/sfx.wav")} />
    </AbsoluteFill>
  );
};
