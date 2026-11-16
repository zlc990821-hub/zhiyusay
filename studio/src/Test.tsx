import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { OscillatingSphere } from "./components/OscillatingSphere";
import { SERIF } from "./fonts";

export const Test: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OscillatingSphere />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 140 }}>
        <div style={{ fontFamily: SERIF, fontSize: 64, color: "#f3e6d0", letterSpacing: 12, opacity }}>
          不知道，所以继续探索
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
