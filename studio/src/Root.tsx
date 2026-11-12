import React from "react";
import { Composition } from "remotion";
import { EP00 } from "./ep00/EP00";
import timeline from "../../episodes/EP00_人类/timeline.json";

export const Root: React.FC = () => (
  <>
    <Composition id="EP00" component={EP00} durationInFrames={Math.round(timeline.duration * timeline.fps)} fps={timeline.fps} width={1920} height={1080} />
  </>
);
