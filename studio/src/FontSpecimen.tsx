import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { FONTS } from "./fontLibrary";

const NAMES = ["留心录", "离心力", "晓灵问天", "不知道研究所"];

export const FontSpecimen: React.FC = () => {
  const [handle] = useState(() => delayRender("加载字体样张"));
  useEffect(() => {
    const text = NAMES.join("") + "字体";
    Promise.all(FONTS.map((f) => document.fonts.load(`${f.family === "LXGW WenKai" ? 500 : 400} 64px "${f.family}"`, text)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#07070a", padding: "60px 70px", color: "#f3e6d0" }}>
      <div style={{ fontFamily: '"Noto Sans SC"', fontSize: 26, color: "#9a8f80", marginBottom: 28 }}>
        字体样张 · 全部 OFL 开源授权，可免费商用
      </div>
      {FONTS.map((f) => (
        <div key={f.family} style={{ display: "flex", alignItems: "center", height: 138, borderTop: "1px solid #222" }}>
          <div style={{ width: 380, fontFamily: '"Noto Sans SC"' }}>
            <div style={{ fontSize: 28 }}>{f.name}</div>
            <div style={{ fontSize: 18, color: "#8a8174", marginTop: 6, lineHeight: 1.4 }}>{f.tone}</div>
          </div>
          {NAMES.map((n) => (
            <div key={n} style={{ flex: 1, fontFamily: `"${f.family}"`, fontWeight: f.family === "LXGW WenKai" ? 500 : 400, fontSize: n.length > 4 ? 44 : 62, letterSpacing: 4, whiteSpace: "nowrap" }}>{n}</div>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};
