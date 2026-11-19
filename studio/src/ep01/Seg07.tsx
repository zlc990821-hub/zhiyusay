// 第 01 期 · 07 第三个发现：看着的那个（录音 703.0–759.6）
// 场 27 日记重现、场 28 看得见她、场 29 六亿个此刻
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, Subtitles, glow, rand, sec, smooth, useFonts, useT, SERIF } from "./common";
import { Bed, Chapter, ClueList, CL, DESK } from "./kit";
import { drawLine, drawPaper, Entry, S1, S2, lineY } from "./Opening";
import { chip } from "./figures";

export const T07 = 703.0, E07 = 759.6;
export const SEG07_FRAMES = sec(E07 - T07);
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);

// ---------- 场 27：同一页日记，越划越满，最后变成空白 ----------
const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n);
const ENTRIES: Entry[] = Array.from({ length: 20 }, (_, i) => {
  const m = 31 + i * 23, h = 8 + Math.floor(m / 60);
  const text = `${h}:${pad2(m % 60)} ${i % 3 === 1 ? S2 : S1}`;
  // 前三行跟着讲述写、划掉，之后越来越快
  const a = i === 0 ? 708.6 : i === 1 ? 714.6 : 716.9 + (i - 2) * 0.24;
  const b = a + (i < 2 ? 1.8 : 0.2);
  const strike = i === 0 ? 713.4 : i === 1 ? 716.4 : b + 0.05;
  return { line: i, text, a, b, strike };
});
const drawDiary = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 705.8, 0.8) * (1 - fin(t, 726.6, 0.8));
  if (a <= 0) return;
  const blank = fin(t, 723.0, 1.6);   // 记录没了、书写停了：字迹淡去
  // 先贴近正在写的那几行，页面写满时拉远成整页
  const back = smooth((t - 716.4) / 4.4);
  // 拉远后整页放进画面：顶上不出画，底下给字幕留位置
  const s = 1.45 + (0.4 - 1.45) * back;
  const cx = -110 * (1 - back), cy = lineY(1) * (1 - back) + 125 * back;
  ctx.save(); ctx.translate(960, 520); ctx.scale(s, s); ctx.translate(-cx, -cy); ctx.rotate(-0.01);
  drawPaper(ctx, 7, a);
  ctx.globalAlpha = 1;
  ENTRIES.forEach((e) => drawLine(ctx, e, t, a * (1 - blank)));
  ctx.restore();
};

// ---------- 场 29：六亿个此刻 ----------
const N = 1700;
const STAR = Array.from({ length: N }, (_, i) => ({ x: rand(i, 1) * 1920, y: rand(i, 2) * 1080, at: 737.0 + rand(i, 3) * 9.5, life: 0.35 + rand(i, 4) * 1.0, r: 2.5 + rand(i, 5) * 3.5 }));
const ONE = { x: 1180, y: 430 };   // 被推近的那一颗
const drawMoments = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 737.0, 0.6) * (1 - fin(t, 751.0, 0.8));
  if (a <= 0) return;
  const push = smooth((t - 746.6) / 3.6);
  const sc = 1 + 3.5 * push;
  ctx.save(); ctx.translate(960, 540); ctx.scale(sc, sc); ctx.translate(-(960 + (ONE.x - 960) * push), -(540 + (ONE.y - 540) * push));
  ctx.globalCompositeOperation = "lighter";
  STAR.forEach((p) => {
    // 一闪即灭：大多数没有留下任何痕迹
    const u = (t - p.at) / p.life;
    if (u < 0 || u > 1) return;
    const k = Math.sin(u * Math.PI);
    const al = k * a * (1 - push * 0.8);
    ctx.fillStyle = `rgba(255,${210 + Math.round(30 * rand(p.x, 7))},${170 + Math.round(60 * rand(p.y, 8))},${0.95 * al})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,200,140,${0.18 * al})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  // 那一颗：一直亮着
  const one = fin(t, 746.4, 0.8);
  const ox = 960 + (ONE.x - (960 + (ONE.x - 960) * push)) * sc, oy = 540 + (ONE.y - (540 + (ONE.y - 540) * push)) * sc;
  glow(ctx, ox, oy, 40 + 50 * push, 0.95 * a * one);
  chip(ctx, "一生，约 6 亿个三秒钟长的「此刻」", 960, 160, 52, a * fin(t, 740.4, 0.6) * (1 - fin(t, 746.4, 0.5)), SERIF);
};


export const Seg07: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`],
    "07第三个发现：看着的那个线索清单→？★发现一：记忆，更像是一份记录二你是正在书写过去的人三还有一个，看这切它不在任何页日记里0123456789:我现在，才真正醒过来。彻底地了一生，约6亿个三秒钟长的「此刻」发现：记忆是份记录你在书写看着那它不任何页日里");
  const t = useT(T07);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => { drawDiary(ctx, tt); drawMoments(ctx, tt); }, []);
  return (
    <AbsoluteFill style={{ background: "#08080b" }}>
      {/* 打底：夜里的窗（克莱夫的日记）→ 公园里的一对（看得见她）→ 夜晚城市的万家灯火（六亿个此刻）→ 案头（线索清单） */}
      <Bed from={T07} clips={[
        { src: "ep01/clips/b_window.mp4", a: T07, b: 727.8, dim: 0.5 },
        { src: "ep01/clips/b_city.mp4", a: 736.8, b: 751.4, dim: 0.42, zoom: [1.0, 1.12] },
        { src: DESK, a: 750.6, b: E07, dim: 0.32, blur: 4 },
      ]} />
      <Clip src="ep01/clips/couple_park.mp4" from={T07} a={727.4} b={737.2} zoom={[1.0, 1.07]} fi={0.6} fo={0.5} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <ClueList t={t} a={750.6} b={E07 + 0.6} items={[
        { text: CL.find1, at: 750.8, kind: "find" },
        { text: CL.find2, at: 751.0, kind: "find" },
        { text: CL.find3, at: 752.4, kind: "find" },
        { text: "它不在任何一页日记里", at: 757.5, kind: "sum" },
      ]} top={250} />
      <Chapter t={t} no="07" title="第三个发现：看着的那个" at={703.2} end={E07 + 1} />
      <Film t={t} />
      <Subtitles t={t} />
    </AbsoluteFill>
  );
};

