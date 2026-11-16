import { Composition } from "remotion";
import { Test } from "./Test";
import { FontSpecimen } from "./FontSpecimen";

export const Root: React.FC = () => (
  <>
    <Composition id="Test" component={Test} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="FontSpecimen" component={FontSpecimen} durationInFrames={1} fps={30} width={1920} height={1560} />
  </>
);
