// 第 01 期 · 01 先立一个常识（录音 73.4–137.9）：场 5 记忆对调、场 6 洛克的王子、场 7 第一个常识
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import { Canvas, Film, KeyText, Still, Subtitles, clamp, glow, sec, smooth, useFonts, useT, DISPLAY, SERIF, SANS } from "./common";
import { person, headPos, crown, memoryOrb, label, chip } from "./figures";
import { drawClueMap, clueById } from "./clue";

export const T01 = 73.4, E01 = 137.9;
export const SEG01_FRAMES = sec(E01 - T01);

const GOLD_RGB = "255,200,130", BLUE_RGB = "140,185,255";
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// 场 5：两个人睡着，记忆光对调，第二天左边的人醒来
const scene5 = (ctx: CanvasRenderingContext2D, t: number) => {
  const end = 1 - smooth((t - 104.8) / 0.6);
  if (end <= 0) return;
  // 起点：片头留下的那一颗线索光点，退到一边
  const p0 = smooth((t - 73.4) / 0.8) * (1 - smooth((t - 76.6) / 0.8));
  glow(ctx, 960, 470, 70, 0.8 * p0);
  // 夜 → 清晨
  const dawn = smooth((t - 84.9) / 2.0);
  if (dawn > 0) {
    const g = ctx.createRadialGradient(1700, 120, 50, 1700, 120, 1200);
    g.addColorStop(0, `rgba(255,190,120,${0.18 * dawn * end})`); g.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  }
  // 镜头：醒来时推向左边的人
  const push = smooth((t - 85.5) / 3.0) * (1 - smooth((t - 96.6) / 1.2));
  const sc = 1 + 0.22 * push;
  ctx.save();
  ctx.translate(960, 560); ctx.scale(sc, sc); ctx.translate(-(960 - 330 * push), -560 - 40 * push);
  const aYou = smooth((t - 77.4) / 0.8) * end, aFr = smooth((t - 81.0) / 0.8) * end;
  // 床
  ctx.strokeStyle = `rgba(255,205,150,${0.25 * aYou})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(300, 682); ctx.lineTo(900, 682); ctx.stroke();
  ctx.strokeStyle = `rgba(255,205,150,${0.25 * aFr})`;
  ctx.beginPath(); ctx.moveTo(980, 682); ctx.lineTo(1580, 682); ctx.stroke();
  // 左边的人：85.5 起坐起来
  const sit = smooth((t - 86.2) / 1.8);
  const you = { x: 600, y: 640, s: 1.2, upper: lerp(Math.PI, Math.PI * 1.5, sit), legs: 0, alpha: aYou };
  const fr = { x: 1280, y: 640, s: 1.2, upper: Math.PI, legs: 0, alpha: aFr };
  person(ctx, you); person(ctx, fr);
  label(ctx, "你", 640, 745, 60, aYou * (1 - push), SERIF);
  label(ctx, "好朋友", 1320, 745, 60, aFr * (1 - push), SERIF);
  // 记忆光：金色是你的，蓝色是她的；83 秒时互换
  const hy = headPos(you, 80), hf = headPos(fr, 80);
  const sw = smooth((t - 83.4) / 1.6);
  const arc = Math.sin(sw * Math.PI) * 160;
  const gx = lerp(hy.x, hf.x, sw), gy = lerp(hy.y, hf.y, sw) - arc;   // 金色：你的 → 去她那里
  const bx = lerp(hf.x, hy.x, sw), by = lerp(hf.y, hy.y, sw) - arc;   // 蓝色：她的 → 来你这里
  memoryOrb(ctx, gx, gy, 50, smooth((t - 78.8) / 0.8) * end, GOLD_RGB, t);
  memoryOrb(ctx, bx, by, 50, smooth((t - 82.0) / 0.8) * end, BLUE_RGB, t + 1);
  // 醒来的人记得的，是她的一生
  const chips: [string, number, number, number][] = [["她的童年", 91.6, -250, -30], ["她爱过的人", 93.8, 0, -130], ["昨晚吃了什么", 95.6, 260, -30]];
  chips.forEach(([txt, at, dx, dy]) => {
    const a = smooth((t - at) / 0.5) * (1 - smooth((t - 97.0) / 0.6));
    chip(ctx, txt, bx + dx, by + dy, 46, a, SERIF, BLUE_RGB);
  });
  ctx.restore();
  // 问题卡
  const q = smooth((t - 97.1) / 0.6) * end;
  if (q > 0) {
    ctx.save(); ctx.globalAlpha = q;
    ctx.font = `110px ${DISPLAY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,170,90,0.4)"; ctx.shadowBlur = 30;
    const parts = ["是你，还是", "她", "？"];
    const ws = parts.map((p) => ctx.measureText(p).width), W = ws.reduce((a, b) => a + b, 0);
    let x = 960 - W / 2;
    const hot = smooth((t - 102.8) / 0.4);
    parts.forEach((p, i) => {
      ctx.textAlign = "left";
      ctx.fillStyle = i === 1 ? `rgb(${Math.round(lerp(243, 160, hot))},${Math.round(lerp(230, 200, hot))},${Math.round(lerp(208, 255, hot))})` : "rgb(243,230,208)";
      ctx.fillText(p, x, 200);
      x += ws[i];
    });
    ctx.restore();
  }
};

// 场 6：洛克的王子与鞋匠
const scene6 = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = smooth((t - 105.3) / 0.6) * (1 - smooth((t - 119.6) / 0.6));
  if (a <= 0) return;
  const prince = { x: 1130, y: 640, s: 1.15, alpha: a };
  const fade = 1 - 0.75 * smooth((t - 114.5) / 1.4);
  const cob = { x: 1620, y: 640, s: 1.15, alpha: a };
  person(ctx, { ...prince, alpha: a * fade }); person(ctx, cob);
  crown(ctx, 1130, headPos(prince, 70).y + 22, 1.0, a * fade);
  label(ctx, "王子", 1130, 875, 60, a, SERIF); label(ctx, "鞋匠", 1620, 875, 60, a, SERIF);
  // 王子的意识（带着全部记忆）流进鞋匠
  const flow = smooth((t - 114.4) / 2.0);
  const hp = headPos(prince, 110), hc = headPos(cob, 110);
  const ox = lerp(hp.x, hc.x, flow), oy = lerp(hp.y, hc.y, flow) - Math.sin(flow * Math.PI) * 120;
  memoryOrb(ctx, ox, oy, 38, smooth((t - 111.1) / 0.7) * a, GOLD_RGB, t);
  const still = smooth((t - 117.4) / 0.6);
  crown(ctx, 1620, headPos(cob, 70).y + 22, 1.0, a * still * 0.8);
  label(ctx, "还是王子", 1620, 150, 68, a * still, DISPLAY, "255,215,160");
};

// 场 7：第一个常识 → 线索图第一颗光点 → 裂开
const scene7 = (ctx: CanvasRenderingContext2D, t: number) => {
  if (t < 129.6) return;
  const node = clueById("common");
  const fly = smooth((t - 130.1) / 1.0);
  const a = smooth((t - 129.6) / 0.5);
  // 一颗光从大字中心飞到线索图上的位置
  const x = lerp(960, node.x, fly), y = lerp(520, node.y, fly);
  if (fly < 1) glow(ctx, x, y, 60, 0.9 * a);
  if (fly > 0.6) {
    drawClueMap(ctx, t, { vis: (id) => (id === "common" ? smooth((fly - 0.6) / 0.4) : 0) });
  }
  // 「靠不住」：光点上裂开一道缝
  const crack = smooth((t - 135.3) / 0.5);
  if (crack > 0) {
    ctx.save(); ctx.translate(node.x, node.y);
    ctx.strokeStyle = `rgba(255,250,240,${0.9 * crack})`; ctx.lineWidth = 3; ctx.lineCap = "round";
    const pts = [[-70, -60], [-22, -18], [-34, 6], [8, 22], [-4, 44], [52, 78]];
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    const n = Math.max(1, Math.round(pts.length * crack));
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke(); ctx.restore();
  }
};

export const Seg01: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`],
    "你好朋友她的童年爱过的人昨晚吃了什么是你，还是？王子鞋匠还是约翰·洛克英国哲学家我，就是的记忆常识：＝1632–1704");
  const t = useT(T01);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => { scene5(ctx, tt); scene6(ctx, tt); scene7(ctx, tt); }, []);
  const lockeA = smooth((t - 105.6) / 0.6) * (1 - smooth((t - 119.6) / 0.6));
  return (
    <AbsoluteFill style={{ background: "#07070a" }}>
      {/* 洛克肖像在左三分之一，说明文字在肖像下方 */}
      <Still src="ep01/raw/locke.jpg" from={T01} a={105.3} b={120.1} zoom={[1.0, 1.06]} height={640} x={-540} y={-40} fade={0.6} bg="transparent" />
      {lockeA > 0 ? (
        <div style={{ position: "absolute", left: 420 - 300, width: 600, top: 830, textAlign: "center", opacity: lockeA }}>
          <span style={{ fontFamily: SERIF, fontSize: 56, color: "#f3e6d0", letterSpacing: 4 }}>约翰·洛克</span>
          <span style={{ fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.7)", marginLeft: 20 }}>1632–1704</span>
        </div>
      ) : null}
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <KeyText text="我，就是我的记忆" t={t} a={128.4} b={130.6} size={120} font={DISPLAY} />
      <Film t={t} />
      <Subtitles t={t} hide={(x) => (x > 97.0 && x < 100.6) || (x > 128.4 && x < 130.1)} />
    </AbsoluteFill>
  );
};
void clamp;
