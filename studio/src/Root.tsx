import { Composition } from "remotion";
import { Test } from "./Test";
import { FontSpecimen } from "./FontSpecimen";
import { Intro } from "./brand/Intro";
import { Outro } from "./brand/Outro";
import { Opening, OPENING_FRAMES } from "./ep01/Opening";
import { GlassRoot, GLASS_FRAMES } from "./ep01/Glass";
import { SoulsRoot, SOULS_FRAMES } from "./ep01/Souls";
import { HandTest } from "./ep01/HandTest";
import { Seg01, SEG01_FRAMES } from "./ep01/Seg01";
import { Seg02a, Seg02c, SEG02A_FRAMES, SEG02C_FRAMES } from "./ep01/Seg02";
import { Seg03, SEG03_FRAMES } from "./ep01/Seg03";
import { Seg04, SEG04_FRAMES } from "./ep01/Seg04";
import { Seg05, SEG05_FRAMES } from "./ep01/Seg05";
import { Seg06, SEG06_FRAMES } from "./ep01/Seg06";
import { Seg07, SEG07_FRAMES } from "./ep01/Seg07";
import { Seg09, SEG09_FRAMES, Ep01Outro, OUTRO_FRAMES } from "./ep01/Seg09";

export const Root: React.FC = () => (
  <>
    <Composition id="Test" component={Test} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="FontSpecimen" component={FontSpecimen} durationInFrames={1} fps={30} width={1920} height={1560} />
    <Composition id="FontSpecimen2" component={FontSpecimen} durationInFrames={1} fps={30} width={1920} height={2920} />
    <Composition id="NameSpecimen" component={FontSpecimen} durationInFrames={1} fps={30} width={1920} height={760} />
    <Composition id="BrandIntro" component={Intro} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="BrandOutro" component={Outro} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg01" component={Seg01} durationInFrames={SEG01_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg02a" component={Seg02a} durationInFrames={SEG02A_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg02c" component={Seg02c} durationInFrames={SEG02C_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg03" component={Seg03} durationInFrames={SEG03_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg04" component={Seg04} durationInFrames={SEG04_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg05" component={Seg05} durationInFrames={SEG05_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg06" component={Seg06} durationInFrames={SEG06_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg07" component={Seg07} durationInFrames={SEG07_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Seg09" component={Seg09} durationInFrames={SEG09_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Outro" component={Ep01Outro} durationInFrames={OUTRO_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="HandTest" component={HandTest} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Opening" component={Opening} durationInFrames={OPENING_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Glass" component={GlassRoot} durationInFrames={GLASS_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Ep01Souls" component={SoulsRoot} durationInFrames={SOULS_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
