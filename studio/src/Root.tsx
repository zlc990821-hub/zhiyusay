import { Composition } from "remotion";
import { Test } from "./Test";
import { FontSpecimen } from "./FontSpecimen";
import { Intro } from "./brand/Intro";
import { Outro } from "./brand/Outro";
import { Opening, OPENING_FRAMES } from "./ep01/Opening";
import { GlassRoot, GLASS_FRAMES } from "./ep01/Glass";
import { SoulsRoot, SOULS_FRAMES } from "./ep01/Souls";
import { HandTest } from "./ep01/HandTest";

export const Root: React.FC = () => (
  <>
    <Composition id="Test" component={Test} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="FontSpecimen" component={FontSpecimen} durationInFrames={1} fps={30} width={1920} height={1560} />
    <Composition id="FontSpecimen2" component={FontSpecimen} durationInFrames={1} fps={30} width={1920} height={2920} />
    <Composition id="NameSpecimen" component={FontSpecimen} durationInFrames={1} fps={30} width={1920} height={760} />
    <Composition id="BrandIntro" component={Intro} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="BrandOutro" component={Outro} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="HandTest" component={HandTest} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Opening" component={Opening} durationInFrames={OPENING_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Glass" component={GlassRoot} durationInFrames={GLASS_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Souls" component={SoulsRoot} durationInFrames={SOULS_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
