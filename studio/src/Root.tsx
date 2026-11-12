import React from "react";
import { Composition } from "remotion";
import { EP00 } from "./ep00/EP00";
import { Cover } from "./ep00/Cover";
import timeline from "../../episodes/EP00_人类/timeline.json";

export const Root: React.FC = () => (
  <>
    <Composition id="EP00" component={EP00} durationInFrames={Math.round(timeline.duration * timeline.fps)} fps={timeline.fps} width={1920} height={1080} />
    <Composition id="EP00-Cover-16x9" component={Cover} defaultProps={{ layout: "wide" as const }} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="EP00-Cover-4x3" component={Cover} defaultProps={{ layout: "wide" as const }} durationInFrames={1} fps={30} width={1440} height={1080} />
    <Composition id="EP00-Cover-3x4" component={Cover} defaultProps={{ layout: "tall" as const }} durationInFrames={1} fps={30} width={1080} height={1440} />
  </>
);
