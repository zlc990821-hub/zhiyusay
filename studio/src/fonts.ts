import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/700.css";
import "@fontsource/noto-sans-sc/400.css";
import { continueRender, delayRender } from "remotion";

// 等字体加载完再渲染，避免中文字出现方块或换字体
const handle = delayRender("加载中文字体");
document.fonts.ready.then(() => continueRender(handle));

export const SERIF = '"Noto Serif SC", serif';
export const SANS = '"Noto Sans SC", sans-serif';
