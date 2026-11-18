// 第 01 期 · 03 第二道裂缝：记忆自己也在变（录音 270.9–397.5）
// 场 12 挑战者号、场 13 巴特莱特的故事、场 14 老鼠与蛋白质、场 15 日志
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Corner, Film, KeyText, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, HAND, SERIF, SANS, GOLD } from "./common";
import { drawClueMap, clueOn } from "./clue";
import { chip } from "./figures";

export const T03 = 270.9, E03 = 397.5;
export const SEG03_FRAMES = sec(E03 - T03);
const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);
const INK = "#1d2433";

// ---------- 场 12：两张手写卡片 ----------
type Seg = { s: string; hot?: boolean };
const CARD86: Seg[][] = [[{ s: "我在" }, { s: "宗教课上", hot: true }, { s: "，" }], [{ s: "有几个人走进来说起这件事。" }], [{ s: "下课后回到宿舍，" }], [{ s: "看电视新闻才知道细节。" }]];
const CARD88: Seg[][] = [[{ s: "我第一次听说，是在" }], [{ s: "宿舍里，和室友一起看电视", hot: true }, { s: "。" }], [{ s: "插播了一条快讯，" }], [{ s: "我们都惊呆了。" }]];
const HandCard: React.FC<{ t: number; x: number; at: number; writeA: number; writeB: number; title: string; lines: Seg[][]; hotAt: number; stampAt?: number; rot: number }> = ({ t, x, at, writeA, writeB, title, lines, hotAt, stampAt, rot }) => {
  const o = fin(t, at, 0.6) * (1 - fin(t, 307.2, 0.6));
  if (o <= 0) return null;
  const total = lines.reduce((n, l) => n + l.reduce((m, sg) => m + sg.s.length, 0), 0);
  const shown = Math.floor(clamp((t - writeA) / (writeB - writeA)) * total);
  let k = 0;
  const hot = fin(t, hotAt, 0.4), pulse = 1 + 0.06 * Math.sin(Math.max(0, t - 304.1) * 7) * fin(t, 304.1, 0.3) * (1 - fin(t, 306.5, 0.3));
  return (
    <div style={{ position: "absolute", left: x, top: 150, width: 760, height: 600, opacity: o, transform: `rotate(${rot}deg) translateY(${(1 - o) * 30}px)`,
      background: "linear-gradient(165deg,#eee3cb,#d8c6a3)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", padding: "38px 46px", boxSizing: "border-box" }}>
      <div style={{ fontFamily: SANS, fontSize: 46, color: "#6b5a43", marginBottom: 18 }}>{title}</div>
      {lines.map((ln, i) => (
        <div key={i} style={{ fontFamily: HAND, fontSize: 52, color: INK, lineHeight: 1.75, whiteSpace: "nowrap" }}>
          {ln.map((sg, j) => {
            const vis = sg.s.slice(0, Math.max(0, shown - k)); k += sg.s.length;
            return <span key={j} style={sg.hot ? { background: `rgba(214,72,52,${0.28 * hot})`, boxShadow: `0 4px 0 rgba(200,60,45,${0.9 * hot})`, display: "inline-block", transform: `scale(${sg.hot ? pulse : 1})` } : undefined}>{vis}</span>;
          })}
        </div>
      ))}
      {stampAt !== undefined && t > stampAt ? (
        <div style={{ position: "absolute", right: 40, bottom: 34, padding: "6px 22px", border: "5px solid rgba(190,50,40,0.85)", color: "rgba(190,50,40,0.9)", fontFamily: DISPLAY, fontSize: 60, letterSpacing: 8,
          transform: `rotate(-12deg) scale(${1.5 - 0.5 * fin(t, stampAt, 0.18)})`, opacity: fin(t, stampAt, 0.18) }}>非常确定</div>
      ) : null}
    </div>
  );
};

// ---------- 场 13：故事的三个版本 ----------
type W = { s: string; cut?: boolean; swap?: boolean };
const V1: W[] = [{ s: "一天夜里，两个年轻人到河边去" }, { s: "猎海豹", swap: true }, { s: "。忽然听见战斗的呼喊，五只" }, { s: "独木舟", swap: true }, { s: "朝他们划来：「我们去打仗，你们一起来吧。」打到一半，有人说：" }, { s: "「他们是幽灵。」", cut: true }];
const V2: W[] = [{ s: "两个年轻人去河边" }, { s: "打猎", swap: true }, { s: "。一群人划着" }, { s: "小船", swap: true }, { s: "过来，叫他们一起去打仗。后来他才知道，" }, { s: "那些人是幽灵。", cut: true }];
const V3: W[] = [{ s: "两兄弟去" }, { s: "钓鱼", swap: true }, { s: "，遇到一群打仗的人。一个受了伤，回家后死了。" }];
const Version: React.FC<{ t: number; x: number; w: number; at: number; title: string; words: W[] }> = ({ t, x, w, at, title, words }) => {
  const o = fin(t, at, 0.6) * (1 - fin(t, 330.6, 0.5));
  if (o <= 0) return null;
  const cut = fin(t, 324.4, 0.5), swap = fin(t, 328.1, 0.5);
  return (
    <div style={{ position: "absolute", left: x, top: 120, width: w, opacity: o, transform: `translateY(${(1 - o) * 30}px)` }}>
      <div style={{ fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.7)", marginBottom: 14 }}>{title}</div>
      <div style={{ background: "rgba(28,24,20,0.9)", border: "1.5px solid rgba(231,184,115,0.35)", borderRadius: 12, padding: "22px 26px", fontFamily: SERIF, fontSize: 46, lineHeight: 1.55, color: GOLD }}>
        {words.map((wd, i) => (
          <span key={i} style={{
            textDecoration: wd.cut && cut > 0.5 ? "line-through" : "none", textDecorationColor: "#e0604a", textDecorationThickness: 4,
            opacity: wd.cut ? 1 - 0.55 * cut : 1,
            background: wd.swap ? `rgba(242,176,102,${0.3 * swap})` : "none", color: wd.swap && swap > 0.5 ? "#ffd59a" : undefined, borderRadius: 6,
          }}>{wd.s}</span>
        ))}
      </div>
    </div>
  );
};

// ---------- 场 14：老鼠的记忆光团 ----------
const ORB = { x: 760, y: 430 };
const drawRat = (ctx: CanvasRenderingContext2D, t: number) => {
  if (t < 341.6 || t > 364.6) return;
  const a = fin(t, 343.0, 0.8) * (1 - fin(t, 363.9, 0.6));
  const weak = 1 - 0.65 * fin(t, 351.3, 1.0) * (1 - fin(t, 353.7, 0.8));
  const recall = fin(t, 353.7, 0.6);
  const loose = smooth((t - 357.4) / 1.4) * (1 - smooth((t - 359.4) / 1.6));  // 散开 → 重新凝固
  const reform = fin(t, 359.4, 1.6);
  const N = 70;
  for (let i = 0; i < N; i++) {
    const th = rand(i, 1) * Math.PI * 2, r0 = 18 + rand(i, 2) * 52;
    // 重新凝固后，形状变了一点：整体往右上偏、拉长
    const rx = r0 * (1 + 0.35 * reform * rand(i, 5)), ry = r0 * (1 - 0.25 * reform);
    const sx = ORB.x + Math.cos(th + t * 0.4) * rx + 40 * reform, sy = ORB.y + Math.sin(th + t * 0.4) * ry - 20 * reform;
    const fx = sx + Math.cos(th) * 260 * loose * (0.5 + rand(i, 3)), fy = sy + Math.sin(th) * 200 * loose * (0.5 + rand(i, 4));
    glow(ctx, fx, fy, 9, 0.55 * a * weak * (0.6 + 0.4 * recall), "255,190,120");
  }
  glow(ctx, ORB.x + 40 * reform, ORB.y - 20 * reform, 80, 0.55 * a * weak * (1 - 0.8 * loose), "255,190,120");
  chip(ctx, "阻止蛋白质合成的药", ORB.x + 330, ORB.y - 150, 48, fin(t, 346.4, 0.5) * (1 - fin(t, 353.2, 0.5)) * a, SERIF, "140,185,255");
  chip(ctx, "想起来的那一刻", ORB.x + 300, ORB.y - 150, 48, fin(t, 353.9, 0.5) * (1 - fin(t, 357.3, 0.5)) * a, SERIF);
  chip(ctx, "松动 → 再存一次", ORB.x + 320, ORB.y - 150, 48, fin(t, 357.6, 0.5) * (1 - fin(t, 363.6, 0.5)) * a, SERIF);
};

// ---------- 场 15：日志，每翻开一次就被重写一次 ----------
const DIARY = [
  ["那年", "夏天", "，", "外婆", "带我去", "海边", "。"],
  ["那年", "夏天", "，", "妈妈", "带我去", "海边", "。"],
  ["那年", "秋天", "，", "妈妈", "带我去", "湖边", "。"],
];
const drawBook = (ctx: CanvasRenderingContext2D, t: number) => {
  if (t < 364.0 || t > 373.2) return;
  const a = fin(t, 364.3, 0.5) * (1 - fin(t, 372.6, 0.6));
  const opens = [364.6, 368.3, 370.3];
  let v = 0; opens.forEach((o, i) => { if (t >= o) v = i; });
  const flip = opens.map((o) => clamp((t - o + 0.5) / 0.5)).find((f) => f > 0 && f < 1) ?? 0;
  ctx.save(); ctx.globalAlpha = a;
  ctx.translate(960, 500);
  // 书页
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 50;
  ctx.fillStyle = "#e6d8bb"; ctx.fillRect(-800, -300, 1600, 600);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(120,95,60,0.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -300); ctx.lineTo(0, 300); ctx.stroke();
  // 翻页的那一下：一页从右翻到左
  if (flip > 0) {
    const w = 800 * Math.cos(flip * Math.PI);
    ctx.fillStyle = "rgba(240,228,205,0.95)"; ctx.fillRect(0, -300, w, 600);
  }
  // 右页的文字（左页是空白的旧页）
  ctx.font = `56px ${HAND}`; ctx.textBaseline = "middle";
  let x = 50;
  DIARY[v].forEach((w, i) => {
    const changed = v > 0 && DIARY[v][i] !== DIARY[v - 1][i];
    const cw = ctx.measureText(w).width;
    if (changed) { ctx.fillStyle = `rgba(214,72,52,${0.25 * (1 - flip)})`; ctx.fillRect(x - 4, -40, cw + 8, 80); }
    ctx.fillStyle = changed ? "#9a2d22" : INK;
    ctx.fillText(w, x, 0);
    x += cw;
  });
  ctx.font = `46px ${SANS}`; ctx.fillStyle = "rgba(90,70,45,0.8)";
  ctx.fillText(`第 ${v + 1} 次翻开`, 50, -220);
  ctx.restore();
};

// ---------- 场 15 末：线索图，「整个拿掉」时光点一个个熄灭 ----------
const ORDER = ["common", "piaget", "loftus", "mall", "challenger", "rat"];
const drawMap = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 384.2, 0.6);
  if (a <= 0) return;
  drawClueMap(ctx, t, {
    vis: (id) => (ORDER.slice(0, 4).includes(id) ? a : id === "challenger" || id === "rat" ? clueOn(id, t) : 0),
    bright: (id) => { const k = ORDER.indexOf(id); return k < 0 ? 1 : 1 - 0.85 * fin(t, 394.0 + k * 0.38, 0.4); },
    scale: 0.92, cy: 520,
  });
};

const drawQ = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = fin(t, 331.0, 0.5) * (1 - fin(t, 334.8, 0.4));
  if (a <= 0) return;
  glow(ctx, 960, 470, 120, 0.5 * a);
  ctx.save(); ctx.globalAlpha = a; ctx.font = `220px ${DISPLAY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#f3e6d0"; ctx.shadowColor = "rgba(255,170,90,0.6)"; ctx.shadowBlur = 40; ctx.fillText("？", 960, 470); ctx.restore();
};

export const Seg03: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`, `"hongleixingshu"`],
    "我在宗教课上，有几个人走进来说起这件事。下课后回到宿舍看电视新闻才知道细节第一次听说是和室友一起插播了一条快讯们都惊呆非常确定1986年1月29日事发第二天1988两半以后原文复述再一一天夜里两个年轻人到河边去猎海豹忽然听见战斗的呼喊五只独木舟朝他划来打仗吧一半说幽灵群船叫后才知道那些兄弟钓鱼遇受伤回家死阻止蛋白质合成药想起来刻松动存那年夏秋天外婆妈带湖第翻开奈瑟示意据巴特莱特NASA？最珍贵的记忆也可能被改写得最多常识＝皮亚杰假童年词撒下地碎玻璃商场走丢过挑战者号成了另样子时记忆会");
  const t = useT(T03);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => { drawQ(ctx, tt); drawRat(ctx, tt); drawBook(ctx, tt); drawMap(ctx, tt); }, []);
  const ratDim = 1 - 0.5 * fin(t, 353.7, 1.0);
  return (
    <AbsoluteFill style={{ background: "#0b0a09" }}>
      {/* 场 12 */}
      <Clip src="ep01/clips/challenger.mp4" from={T03} a={270.9} b={276.4} zoom={[1.0, 1.05]} fi={0.3} />
      <Corner text="NASA，1986" t={t} a={271.1} b={276.3} />
      <HandCard t={t} x={140} at={277.4} writeA={281.0} writeB={286.8} title="1986 年 1 月 29 日（事发第二天）" lines={CARD86} hotAt={298.4} rot={-1.5} />
      <HandCard t={t} x={1020} at={287.5} writeA={288.4} writeB={293.6} title="1988 年（两年半以后）" lines={CARD88} hotAt={298.4} stampAt={301.1} rot={1.2} />
      <Corner text="Neisser & Harsch, 1992" t={t} a={278.4} b={307.2} />
      {/* 场 13 */}
      <Version t={t} x={80} w={760} at={312.4} title="原文" words={V1} />
      <Version t={t} x={900} w={560} at={315.8} title="第一次复述" words={V2} />
      <Version t={t} x={1500} w={360} at={318.9} title="再复述一次" words={V3} />
      <Corner text="示意，据巴特莱特，1932" t={t} a={312.6} b={330.6} />
      {/* 场 14 */}
      <Clip src="ep01/clips/microscope.mp4" from={T03} a={335.0} b={341.7} zoom={[1.0, 1.06]} fi={0.4} />
      <Clip src="ep01/clips/rat.mp4" from={T03} a={341.7} b={364.5} zoom={[1.08, 1.16]} fo={0.6} style={{ filter: `brightness(${ratDim})` }} />
      <Corner text="Nader, Schafe & LeDoux, 2000" t={t} a={335.3} b={364.2} />
      {/* 场 15 */}
      <Clip src="ep01/clips/album.mp4" from={T03} a={372.6} b={384.4} zoom={[1.0, 1.08]} fi={0.5} fo={0.5} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <KeyText text="最珍贵的记忆，也可能被改写得最多" t={t} a={379.6} b={384.2} size={76} font={DISPLAY} y={290} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => x > 379.6 && x < 384.2} />
    </AbsoluteFill>
  );
};
