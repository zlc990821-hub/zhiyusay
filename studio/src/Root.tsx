import React from "react";
import { Composition } from "remotion";
import { EP00 } from "./ep00/EP00";
import { Cover } from "./ep00/Cover";
import { EP01 } from "./ep01/EP01";
import { Cover01 } from "./ep01/Cover";
import tl01 from "../../episodes/EP01_存在/timeline.json";
import timeline from "../../episodes/EP00_人类/timeline.json";

export const Root: React.FC = () => (
  <>
    <Composition id="EP00" component={EP00} durationInFrames={Math.round(timeline.duration * timeline.fps)} fps={timeline.fps} width={1920} height={1080} />
    <Composition id="EP01" component={EP01} durationInFrames={Math.round(tl01.duration * tl01.fps)} fps={tl01.fps} width={1920} height={1080} />
    <Composition id="EP00-Cover-16x9" component={Cover} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="EP00-Cover-4x3" component={Cover} durationInFrames={1} fps={30} width={1440} height={1080} />
    <Composition id="EP00-Cover-3x4" component={Cover} durationInFrames={1} fps={30} width={1080} height={1440} />
    <Composition id="EP00-Cover-9x16" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="EP01-Cover-16x9" component={Cover01} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="EP01-Cover-4x3" component={Cover01} durationInFrames={1} fps={30} width={1440} height={1080} />
    <Composition id="EP01-Cover-3x4" component={Cover01} durationInFrames={1} fps={30} width={1080} height={1440} />
    <Composition id="EP01-Cover-9x16" component={Cover01} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
