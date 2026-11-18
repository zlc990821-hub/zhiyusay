// 日记手写体候选对比（选字体用）
import { AbsoluteFill } from "remotion";
import { useFonts } from "./common";
const FONTS = ["瑞美加张清平硬笔行书", "千图笔锋手写体", "qiantubifengshouxieti", "LXGW WenKai", "jiangxizhuokai", "slideyouran", "Long Cang", "hongleixingshu"];
const TXT = "8:31 我现在，才真正醒过来。 9:06 我现在，彻彻底底地醒了。";
export const HandTest: React.FC = () => {
  useFonts(FONTS.map((f) => `"${f}"`), TXT);
  return (
    <AbsoluteFill style={{ background: "#e6d8bd", padding: 40 }}>
      {FONTS.map((f) => (
        <div key={f} style={{ display: "flex", alignItems: "baseline", gap: 30, height: 125 }}>
          <div style={{ width: 300, fontSize: 26, fontFamily: "Noto Sans SC", color: "#555" }}>{f}</div>
          <div style={{ fontFamily: `"${f}"`, fontSize: 64, color: "#1c2230" }}>{TXT}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
