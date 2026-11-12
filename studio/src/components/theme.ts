import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-serif-sc/500.css";
import "@fontsource/noto-serif-sc/700.css";
import { continueRender, delayRender } from "remotion";

export const FONT_SANS = '"Noto Sans SC", "WenQuanYi Zen Hei", sans-serif';
export const FONT_SERIF = '"Noto Serif SC", "Noto Sans SC", serif';

export const COLORS = {
  bg: "#05060a",
  text: "#f4f1ea",
  dim: "rgba(244,241,234,0.62)",
};

/** Six narrative layers — fixed series-wide colour code. */
export const LAYERS: Record<string, { zh: string; color: string }> = {
  S: { zh: "科学", color: "#4f9dff" },
  H: { zh: "古籍", color: "#c79a5b" },
  P: { zh: "哲学", color: "#a77bff" },
  T: { zh: "天元假说", color: "#f2c94c" },
  E: { zh: "思想实验", color: "#3ecf8e" },
  F: { zh: "架空设定", color: "#ff5f57" },
};

/** Block rendering until the CJK glyph subsets for `text` are loaded (fontsource splits by unicode-range). */
export const loadFonts = (text: string) => {
  if (typeof document === "undefined") return;
  const h = delayRender("fonts");
  const specs = [`400 40px "Noto Sans SC"`, `500 40px "Noto Sans SC"`, `500 40px "Noto Serif SC"`, `700 40px "Noto Serif SC"`];
  Promise.all(specs.map((s) => document.fonts.load(s, text)))
    .then(() => document.fonts.ready)
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
};
