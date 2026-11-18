import { AbsoluteFill, OffthreadVideo, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, continueRender, delayRender } from "remotion";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import "../fontLibrary";
import SUBS from "../ep01_subs.json";

export const FPS = 30;
export const SERIF = '"Noto Serif SC", serif';
export const SANS = '"Noto Sans SC", sans-serif';
export const HAND = '"hongleixingshu", "LXGW WenKai", serif';
export const DISPLAY = '"Source Han Serif CN for Display", "Noto Serif SC", serif';
export const KAI = '"XuandongKaishu", "LXGW WenKai", serif';
export const GOLD = "#f3e6d0";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (x: number) => { const v = clamp(x); return v * v * (3 - 2 * v); };
export const fadeInOut = (t: number, a: number, b: number, f = 0.4) => smooth((t - a) / f) * (1 - smooth((t - (b - f)) / f));

// 录音里的全局时间（秒）
export const useT = (from: number) => from + useCurrentFrame() / useVideoConfig().fps;
export const sec = (s: number) => Math.round(s * FPS);

// 等字体加载完：返回 ready，画布要等 ready 以后再画（否则第一帧会用后备字体）
export const useFonts = (families: string[], sample: string) => {
  const [h] = useState(() => delayRender("ep01 字体"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all(families.map((f) => document.fonts.load(`64px ${f}`, sample))).then(() => { setReady(true); continueRender(h); });
  }, [h]);
  return ready;
};

// 字幕：时间以录音为准，文字以稿子为准；hide 为 true 时不显示（关键句大字出现时避免重复）
export const Subtitles: React.FC<{ t: number; hide?: (t: number) => boolean }> = ({ t, hide }) => {
  const s = (SUBS as any).subs.find((x: any) => t >= x.start && t < x.end);
  if (!s || (hide && hide(t))) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 64, pointerEvents: "none" }}>
      <div style={{ fontFamily: SANS, fontSize: 60, color: "#f6efe2", letterSpacing: 2, maxWidth: 1600, textAlign: "center",
        textShadow: "0 0 10px rgba(0,0,0,0.95), 0 2px 3px rgba(0,0,0,0.9)" }}>{s.text}</div>
    </AbsoluteFill>
  );
};

export const KeyText: React.FC<{ text: string; t: number; a: number; b: number; size?: number; font?: string; y?: number }> = ({ text, t, a, b, size = 96, font = SERIF, y = 0 }) => {
  const o = fadeInOut(t, a, b, 0.5);
  if (o <= 0.001) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: font, fontSize: size, color: GOLD, letterSpacing: size * 0.12, opacity: o, transform: `translateY(${y + (1 - o) * 12}px)`,
        textShadow: "0 0 30px rgba(255,190,110,0.35)" }}>{text}</div>
    </AbsoluteFill>
  );
};

export const NameBar: React.FC<{ name: string; years: string; t: number; a: number; b: number }> = ({ name, years, t, a, b }) => {
  const o = fadeInOut(t, a, b, 0.4);
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 120, bottom: 200, opacity: o, transform: `translateX(${(1 - o) * -20}px)` }}>
      <div style={{ width: 80, height: 3, background: "#e7b873", marginBottom: 16 }} />
      <div style={{ fontFamily: SERIF, fontSize: 60, color: GOLD, letterSpacing: 6 }}>{name}</div>
      <div style={{ fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.75)", marginTop: 6 }}>{years}</div>
    </div>
  );
};

export const Corner: React.FC<{ text: string; t: number; a: number; b: number }> = ({ text, t, a, b }) => {
  const o = fadeInOut(t, a, b, 0.4) * 0.8;
  if (o <= 0.001) return null;
  return <div style={{ position: "absolute", right: 90, top: 70, fontFamily: SANS, fontSize: 46, color: "rgba(240,228,206,1)", opacity: o, textShadow: "0 0 8px rgba(0,0,0,0.9)" }}>{text}</div>;
};

export const Label: React.FC<{ text: string; t: number; a: number; b: number }> = ({ text, t, a, b }) => {
  const o = fadeInOut(t, a, b, 0.6) * 0.9;
  if (o <= 0.001) return null;
  return <div style={{ position: "absolute", left: 110, top: 80, fontFamily: SERIF, fontSize: 52, letterSpacing: 6, color: GOLD, opacity: o, textShadow: "0 0 10px rgba(0,0,0,0.9)" }}>{text}</div>;
};

// 一段调好色的视频，放在全局时间 [a, b) 内，带缓慢推拉；fi/fo 为淡入淡出秒数
export const Clip: React.FC<{ src: string; from: number; a: number; b: number; zoom?: [number, number]; fi?: number; fo?: number; rate?: number; start?: number; style?: React.CSSProperties; fit?: "cover" | "contain" }> =
  ({ src, from, a, b, zoom = [1, 1.06], fi = 0, fo = 0, rate = 1, start = 0, style, fit = "cover" }) => (
  <Sequence from={sec(a - from)} durationInFrames={Math.max(1, sec(b - a))} layout="none">
    <ClipInner src={src} len={b - a} zoom={zoom} fi={fi} fo={fo} rate={rate} start={start} style={style} fit={fit} />
  </Sequence>
);
const ClipInner: React.FC<{ src: string; len: number; zoom: [number, number]; fi: number; fo: number; rate: number; start: number; style?: React.CSSProperties; fit: "cover" | "contain" }> = ({ src, len, zoom, fi, fo, rate, start, style, fit }) => {
  const f = useCurrentFrame() / FPS;
  const z = interpolate(f, [0, len], zoom);
  const o = (fi ? smooth(f / fi) : 1) * (fo ? 1 - smooth((f - (len - fo)) / fo) : 1);
  return (
    <AbsoluteFill style={{ opacity: o, overflow: "hidden", ...style }}>
      <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} startFrom={Math.round(start * FPS)} style={{ width: "100%", height: "100%", objectFit: fit, transform: `scale(${z})` }} />
    </AbsoluteFill>
  );
};

// 一张图，缓慢推拉，放在暗色背景里
export const Still: React.FC<{ src: string; from: number; a: number; b: number; zoom?: [number, number]; height?: number; fade?: number; x?: number; y?: number; bg?: string }> = ({ src, from, a, b, zoom = [1, 1.08], height = 900, fade = 0.4, x = 0, y = 0, bg = "#0b0a09" }) => (
  <Sequence from={sec(a - from)} durationInFrames={Math.max(1, sec(b - a))} layout="none">
    <StillInner src={src} len={b - a} zoom={zoom} height={height} fade={fade} x={x} y={y} bg={bg} />
  </Sequence>
);
const StillInner: React.FC<{ src: string; len: number; zoom: [number, number]; height: number; fade: number; x: number; y: number; bg: string }> = ({ src, len, zoom, height, fade, x, y, bg }) => {
  const f = useCurrentFrame() / FPS;
  const z = interpolate(f, [0, len], zoom);
  const o = smooth(f / fade) * (1 - smooth((f - (len - fade)) / fade));
  return (
    <AbsoluteFill style={{ background: bg, justifyContent: "center", alignItems: "center", opacity: o }}>
      <Img src={staticFile(src)} style={{ height, transform: `translate(${x}px, ${y}px) scale(${z})`, filter: "sepia(0.25) saturate(0.8) contrast(1.05)", boxShadow: "0 0 80px rgba(0,0,0,0.8)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

// 透明画布：draw 只依赖全局时间，保证可重复渲染
export const Canvas: React.FC<{ t: number; draw: (ctx: CanvasRenderingContext2D, t: number) => void; style?: React.CSSProperties; w?: number; h?: number }> = ({ t, draw, style, w = 1920, h = 1080 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    draw(ctx, t);
    // 无显卡的软件渲染里，画布被清成全透明后这一层可能不刷新，留下上一帧的画面；画一个看不见的像素强制刷新
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.004)"; ctx.fillRect(0, 0, 1, 1);
  }, [t, draw, w, h]);
  return <canvas ref={ref} width={w} height={h} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }} />;
};

export const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, rgb = "255,200,130") => {
  if (a <= 0.002) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,248,232,${a})`);
  g.addColorStop(0.12, `rgba(${rgb},${a * 0.85})`);
  g.addColorStop(0.45, `rgba(${rgb},${a * 0.18})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = "source-over";
};

export const rand = (i: number, s = 1) => { const x = Math.sin(i * 127.1 * s + s * 311.7) * 43758.5453; return x - Math.floor(x); };

// 代码画面上的轻颗粒与暗角，让它和真实影像质感一致
export const Film: React.FC<{ t: number }> = ({ t }) => (
  <Canvas t={t} draw={(ctx, tt) => {
    const v = ctx.createRadialGradient(960, 540, 380, 960, 540, 1150);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, 1920, 1080);
    const frame = Math.round(tt * 30);
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 2600; i++) {
      const x = rand(i + frame * 977, 3) * 1920, y = rand(i + frame * 613, 7) * 1080;
      ctx.fillStyle = rand(i + frame, 11) > 0.5 ? "#fff" : "#000"; ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }} />
);
