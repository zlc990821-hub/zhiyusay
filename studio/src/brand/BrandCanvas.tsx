import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayoutEffect, useRef, useState } from "react";
import "../fontLibrary";
import { W, H } from "./centrifuge";

export const TITLE_FONT = '"Source Han Serif CN for Display"';
export const SUB_FONT = '"Zhuque Fangsong (technical preview)"';

// 一个按帧绘制的画布：draw(ctx, 秒, 帧) 必须只依赖时间，保证可重复渲染
export const BrandCanvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D, t: number, frame: number) => void; sample?: string; transparent?: boolean }> = ({ draw, sample = "", transparent = false }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [fontsReady, setFontsReady] = useState(false);
  const [handle] = useState(() => delayRender("加载片头字体"));

  useLayoutEffect(() => {
    Promise.all([
      document.fonts.load(`190px ${TITLE_FONT}`, "离心力" + sample),
      document.fonts.load(`48px ${SUB_FONT}`, "不知道，所以继续探索离心力" + sample),
    ]).then(() => {
      setFontsReady(true);
      continueRender(handle);
    });
  }, [handle]);

  useLayoutEffect(() => {
    if (!fontsReady || !ref.current) return;
    const ctx = ref.current.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (transparent) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = "rgba(0,0,0,0.004)"; ctx.fillRect(0, 0, 1, 1); }
    else { ctx.fillStyle = "#050507"; ctx.fillRect(0, 0, W, H); }
    draw(ctx, frame / fps, frame);
  }, [frame, fps, draw, fontsReady, transparent]);

  return (
    <AbsoluteFill style={{ backgroundColor: transparent ? "transparent" : "#050507" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};

// 画标题，并让一道光带从左到右扫过字面
export const drawTitle = (
  ctx: CanvasRenderingContext2D,
  opts: { x: number; y: number; reveal: number; sweep: number | null; alpha: number; spacing?: number; text?: string; size?: number }
) => {
  const text = opts.text ?? "离心力";
  const size = opts.size ?? 240;
  const { x, y, reveal, sweep, alpha } = opts;
  if (alpha <= 0.001 || reveal <= 0) return;
  const spacing = opts.spacing ?? 64;
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const o = off.getContext("2d")!;
  o.font = `${size}px ${TITLE_FONT}`;
  (o as any).letterSpacing = `${spacing}px`;
  o.textAlign = "center";
  o.textBaseline = "middle";
  const m = o.measureText(text);
  const left = x - m.width / 2 - 20;
  const right = x + m.width / 2 + 20;
  const g = o.createLinearGradient(0, y - 125, 0, y + 125);
  g.addColorStop(0, "#fff1d8");
  g.addColorStop(0.55, "#f2cf98");
  g.addColorStop(1, "#c58f4e");
  o.fillStyle = g;
  o.shadowColor = "rgba(255, 190, 110, 0.55)";
  o.shadowBlur = 28;
  // spacing 会在最后一个字后面也加间距，向右补偿一半让视觉居中
  o.fillText(text, x + spacing / 2, y);
  // 光带：只落在字上
  if (sweep !== null) {
    const sx = left + (right - left) * sweep;
    o.globalCompositeOperation = "source-atop";
    const band = o.createLinearGradient(sx - 120, 0, sx + 120, 0);
    band.addColorStop(0, "rgba(255,255,255,0)");
    band.addColorStop(0.5, "rgba(255,255,255,0.95)");
    band.addColorStop(1, "rgba(255,255,255,0)");
    o.fillStyle = band;
    o.fillRect(sx - 120, 0, 240, H);
  }
  // 揭示：只显示光带走过的部分
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(0, 0, left + (right - left) * reveal, H);
  ctx.clip();
  ctx.drawImage(off, 0, 0);
  ctx.restore();
};

export const drawSubtitle = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, alpha: number, color = "220, 205, 180", spacing = 16) => {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${size}px ${SUB_FONT}`;
  (ctx as any).letterSpacing = `${spacing}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `rgb(${color})`;
  ctx.fillText(text, x + spacing / 2, y);
  ctx.restore();
};
