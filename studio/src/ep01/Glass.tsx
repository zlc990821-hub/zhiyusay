// 第 01 期 · 场 9 洛夫特斯的碎玻璃（录音 196.0–238.4 秒）
// v2：一个「实验板」画面讲完整个实验（录像屏幕 + 两组问题卡 + 车速 + 50 人点阵），镜头在画面里推拉，不频繁切换
import { AbsoluteFill, Audio, Loop, Sequence, staticFile } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Film, NameBar, Still, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, SERIF, SANS, GOLD } from "./common";
import { drawClueMap, clueById } from "./clue";

export const G0 = 196.0;
export const G_END = 238.4;
export const GLASS_FRAMES = sec(G_END - G0);

const B0 = 200.55;   // 实验板出现
const B1 = 231.0;    // 实验板结束（转到「撞毁」两个字）

// ---------- 实验板的布局（板内坐标 1920×1080） ----------
const SCR = { x: 640, y: 30, w: 640, h: 360 };      // 录像屏幕
const CARD_A = { x: 60, y: 420, w: 880, h: 140 };
const CARD_B = { x: 980, y: 420, w: 880, h: 140 };

// 镜头：在板上推拉，把视线引到正在讲的地方
type Cam = { t: number; s: number; x: number; y: number };
const CAM: Cam[] = [
  { t: 200.55, s: 1.25, x: 960, y: 210 },
  { t: 202.2, s: 1.25, x: 960, y: 210 },
  { t: 203.2, s: 1.0, x: 960, y: 540 },
  { t: 204.0, s: 1.0, x: 960, y: 540 },
  { t: 205.5, s: 1.08, x: 760, y: 520 },
  { t: 209.3, s: 1.08, x: 760, y: 520 },
  { t: 210.6, s: 1.08, x: 1160, y: 520 },
  { t: 214.9, s: 1.08, x: 1160, y: 520 },
  { t: 215.9, s: 1.0, x: 960, y: 540 },
  { t: 218.8, s: 1.0, x: 960, y: 540 },
  { t: 219.8, s: 1.12, x: 960, y: 300 },
  { t: 223.8, s: 1.12, x: 960, y: 300 },
  { t: 224.6, s: 1.0, x: 960, y: 540 },
  { t: 228.4, s: 1.0, x: 960, y: 540 },
  { t: 229.8, s: 2.9, x: 960, y: 210 },
];
const cam = (t: number) => {
  if (t <= CAM[0].t) return CAM[0];
  for (let i = 1; i < CAM.length; i++) if (t <= CAM[i].t) {
    const a = CAM[i - 1], b = CAM[i], k = smooth((t - a.t) / (b.t - a.t));
    return { t, s: a.s + (b.s - a.s) * k, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  }
  return CAM[CAM.length - 1];
};

const fadeIn = (t: number, at: number, d = 0.4) => smooth((t - at) / d);

// 问题卡：一行字，高亮那个被换掉的词；车速在卡片下方单独一行
const Card: React.FC<{ box: typeof CARD_A; t: number; at: number; group: string; word: string; wordAt: number; speed: number; speedAt: number; hot: boolean }> = ({ box, t, at, group, word, wordAt, speed, speedAt, hot }) => {
  const o = fadeIn(t, at, 0.45);
  if (o <= 0) return null;
  const hw = fadeIn(t, wordAt, 0.35);
  const g = smooth((t - speedAt) / 1.3);
  return (
    <>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, opacity: o, transform: `translateY(${(1 - o) * 24}px)`,
        background: "rgba(30,26,22,0.88)", border: "1.5px solid rgba(231,184,115,0.35)", borderRadius: 14, padding: "14px 30px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.65)" }}>{group}</div>
        <div style={{ fontFamily: SERIF, fontSize: 48, color: GOLD, whiteSpace: "nowrap" }}>
          两辆车
          <span style={{ fontFamily: DISPLAY, color: hw > 0.5 ? "#ffc47a" : GOLD, margin: "0 4px", borderBottom: `5px solid rgba(231,163,94,${hw})`,
            textShadow: hw > 0.5 ? "0 0 24px rgba(255,170,90,0.6)" : "none", display: "inline-block", transform: `scale(${1 + 0.15 * hw * (1 - smooth((t - wordAt - 0.35) / 0.4))})` }}>{word}</span>
          的时候，车速大概多少？
        </div>
      </div>
      {t > speedAt ? (
        <div style={{ position: "absolute", left: box.x + 30, top: box.y + box.h + 18, height: 64, display: "flex", alignItems: "center", gap: 20, whiteSpace: "nowrap", opacity: o }}>
          <div style={{ height: 26, width: `${(speed / 70) * 470 * g}px`, background: hot ? "linear-gradient(90deg,#b8743a,#f0b26a)" : "linear-gradient(90deg,#6f6457,#a99a86)", borderRadius: 4,
            boxShadow: hot ? "0 0 24px rgba(240,170,90,0.4)" : "none" }} />
          <div style={{ fontFamily: SANS, fontSize: 60, color: GOLD, opacity: g }}>{(speed * g).toFixed(1)}</div>
          <div style={{ fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.6)", opacity: g }}>公里/小时</div>
        </div>
      ) : null}
    </>
  );
};

// 50 人点阵：说「看到了碎玻璃」的人亮起
const Dots: React.FC<{ x: number; t: number; at: number; n: number; pct: string; hot: boolean }> = ({ x, t, at, n, pct, hot }) => {
  const o = fadeIn(t, at, 0.4);
  if (o <= 0) return null;
  const lit = Math.floor(clamp((t - at - 0.5) / (n * 0.07)) * n);
  return (
    <div style={{ position: "absolute", left: x, top: 665, opacity: o, display: "flex", alignItems: "center", gap: 36 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 22px)", gap: 9 }}>
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{ width: 22, height: 22, borderRadius: 11, background: i < lit ? (hot ? "#f2b066" : "#cbbba4") : "rgba(240,225,200,0.16)",
            boxShadow: i < lit && hot ? "0 0 12px rgba(242,176,102,0.8)" : "none" }} />
        ))}
      </div>
      <div style={{ opacity: smooth((t - at - 0.5 - n * 0.07) / 0.3) }}>
        <div style={{ fontFamily: SANS, fontSize: 64, color: GOLD }}>{n} 人</div>
        <div style={{ fontFamily: SANS, fontSize: 48, color: "rgba(240,225,200,0.7)" }}>{pct}</div>
      </div>
    </div>
  );
};

// 屏幕上浮出的「想象中的裂纹」：219 秒后出现，228.25 秒消失
const CRACKS = Array.from({ length: 16 }, (_, i) => {
  const ang = (i / 16) * Math.PI * 2 + rand(i, 2) * 0.3;
  const pts: [number, number][] = [[0, 0]];
  let r = 0, a = ang;
  for (let k = 0; k < 5; k++) { r += 40 + rand(i * 7 + k, 3) * 70; a += (rand(i * 5 + k, 4) - 0.5) * 0.5; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.8]); }
  return pts;
});
const drawCracks = (ctx: CanvasRenderingContext2D, t: number) => {
  const grow = smooth((t - 221.7) / 0.6);
  const gone = smooth((t - 228.3) / 0.9);
  const a = grow * (1 - gone);
  if (a <= 0.01) return;
  const cx = SCR.w * 0.58, cy = SCR.h * 0.42;
  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = `rgba(235,245,255,${0.85 * a})`; ctx.lineWidth = 1.6; ctx.lineCap = "round";
  CRACKS.forEach((pts, i) => {
    const n = Math.max(1, Math.floor(pts.length * grow * (0.6 + 0.4 * rand(i, 6)))) ;
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let k = 1; k < n; k++) ctx.lineTo(pts[k][0] * (1 - gone * 0.3), pts[k][1] * (1 - gone * 0.3));
    ctx.stroke();
  });
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(0, 0, 30 * k * grow, 24 * k * grow, 0.2, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 26; i++) { // 闪光的碎碴
    const x = (rand(i, 7) - 0.5) * SCR.w * 0.9, y = (rand(i, 8) - 0.5) * SCR.h * 0.8;
    const tw = 0.5 + 0.5 * Math.sin(t * 7 + i * 1.7);
    ctx.fillStyle = `rgba(255,255,255,${0.7 * a * tw})`; ctx.fillRect(x - gone * (rand(i, 9) - 0.5) * 120, y - gone * 80, 3, 3);
  }
  ctx.restore();
};

const Board: React.FC<{ t: number; ready: boolean }> = ({ t, ready }) => {
  const crackDraw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => drawCracks(ctx, tt), []);
  if (t < B0 - 0.01 || t > B1 + 0.5) return null;
  const c = cam(t);
  const o = fadeIn(t, B0, 0.5) * (1 - smooth((t - B1) / 0.4));
  const scrDim = 1 - 0.45 * smooth((t - 219.0) / 0.6) * (1 - smooth((t - 228.25) / 0.6));
  const banner = fadeIn(t, 219.0, 0.5) * (1 - smooth((t - 228.25) / 0.4));
  const period = sec(10.6);
  return (
    <AbsoluteFill style={{ opacity: o, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0",
        transform: `translate(${960 - c.x * c.s}px, ${540 - c.y * c.s}px) scale(${c.s})` }}>
        {/* 录像屏幕 */}
        <div style={{ position: "absolute", left: SCR.x, top: SCR.y, width: SCR.w, height: SCR.h, overflow: "hidden", borderRadius: 10,
          boxShadow: "0 0 0 2px rgba(231,184,115,0.35), 0 20px 60px rgba(0,0,0,0.7)", filter: `brightness(${scrDim})` }}>
          <Sequence from={sec(B0 - G0)} durationInFrames={sec(B1 + 0.5 - B0)} layout="none">
            <Loop durationInFrames={period} layout="none">
              <Sequence durationInFrames={sec(5.6)} layout="none"><Clip src="ep01/clips/car_pov.mp4" from={0} a={0} b={5.6} zoom={[1, 1]} /></Sequence>
              <Sequence from={sec(5.6)} durationInFrames={sec(5.0)} layout="none"><Clip src="ep01/clips/car_road.mp4" from={0} a={0} b={5.0} zoom={[1, 1]} /></Sequence>
            </Loop>
          </Sequence>
          {ready ? <Canvas t={t} draw={crackDraw} w={SCR.w} h={SCR.h} /> : null}
          {banner > 0 ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "14px 0 18px", background: "rgba(10,9,8,0.72)", textAlign: "center", opacity: banner }}>
              <div style={{ fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.7)" }}>一周以后</div>
              <div style={{ fontFamily: SERIF, fontSize: 46, color: GOLD, whiteSpace: "nowrap", opacity: fadeIn(t, 221.55, 0.4) }}>你在录像里看到碎玻璃了吗？</div>
            </div>
          ) : null}
        </div>
        <div style={{ position: "absolute", left: SCR.x + SCR.w + 28, top: SCR.y + 8, fontFamily: SANS, fontSize: 46, lineHeight: 1.5, color: "rgba(240,225,200,0.5)", whiteSpace: "nowrap" }}>
          Loftus &amp; Palmer, 1974<br />录像：1963 年交通安全片
        </div>
        <div style={{ opacity: 1 - smooth((t - 228.25) / 0.5) }}>
          <Card box={CARD_A} t={t} at={202.4} group="A 组" word="撞毁" wordAt={204.39} speed={65.7} speedAt={215.4} hot />
          <Card box={CARD_B} t={t} at={209.51} group="B 组" word="碰撞" wordAt={212.29} speed={54.7} speedAt={215.8} hot={false} />
          <Dots x={CARD_A.x + 30} t={t} at={224.03} n={16} pct="32%" hot />
          <Dots x={CARD_B.x + 30} t={t} at={224.6} n={7} pct="14%" hot={false} />
        </div>
        {t > 227.39 ? (
          <div style={{ position: "absolute", left: 960 - 130, width: 260, top: 690, textAlign: "center", fontFamily: DISPLAY, fontSize: 104, color: "#f6c27f", opacity: (1 - smooth((t - 228.25) / 0.5)),
            transform: `scale(${1.3 - 0.3 * fadeIn(t, 227.39, 0.3)})`, textShadow: "0 0 30px rgba(255,170,90,0.5)" }}><span style={{ opacity: fadeIn(t, 227.39, 0.3) }}>×2.3</span></div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};


// 「撞毁」两个字碎成玻璃碴，落地，再化成光点飞进线索图
let wordCanvas: HTMLCanvasElement | null = null;
const WORD_W = 760, WORD_H = 300, WX = 960 - WORD_W / 2, WY = 470 - WORD_H / 2;
const getWord = () => {
  if (wordCanvas) return wordCanvas;
  const c = document.createElement("canvas"); c.width = WORD_W; c.height = WORD_H;
  const x = c.getContext("2d")!;
  x.font = `230px ${DISPLAY}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#f3e6d0";
  x.shadowColor = "rgba(255,170,90,0.6)"; x.shadowBlur = 30;
  x.fillText("撞毁", WORD_W / 2, WORD_H / 2 + 10);
  wordCanvas = c; return c;
};
const GX = 9, GY = 4;
const gp = (i: number, j: number) => ({
  x: (i / GX) * WORD_W + (i > 0 && i < GX ? (rand(i * 13 + j, 1) - 0.5) * 50 : 0),
  y: (j / GY) * WORD_H + (j > 0 && j < GY ? (rand(i * 7 + j * 3, 2) - 0.5) * 40 : 0),
});
const TRIS: { p: { x: number; y: number }[]; id: number }[] = [];
for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) {
  const a = gp(i, j), b = gp(i + 1, j), c = gp(i + 1, j + 1), d = gp(i, j + 1);
  TRIS.push({ p: [a, b, c], id: TRIS.length }, { p: [a, c, d], id: TRIS.length + 1 });
}
const T_BREAK = 233.41, T_FLY = 235.0;
const drawWord = (ctx: CanvasRenderingContext2D, t: number) => {
  const w = getWord();
  const appear = smooth((t - 231.3) / 0.5);
  if (t < T_BREAK) {
    ctx.globalAlpha = appear; ctx.drawImage(w, WX, WY); ctx.globalAlpha = 1;
    // 字上慢慢出现裂纹
    const crack = smooth((t - 232.6) / 0.8);
    if (crack > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * crack})`; ctx.lineWidth = 1.5;
      TRIS.forEach((tr, k) => { if (rand(k, 3) < crack) { ctx.beginPath(); ctx.moveTo(WX + tr.p[0].x, WY + tr.p[0].y); ctx.lineTo(WX + tr.p[1].x, WY + tr.p[1].y); ctx.stroke(); } });
    }
    return;
  }
  const u = t - T_BREAK;
  const target = clueById("loftus");
  TRIS.forEach((tr) => {
    const cx = (tr.p[0].x + tr.p[1].x + tr.p[2].x) / 3, cy = (tr.p[0].y + tr.p[1].y + tr.p[2].y) / 3;
    const vx = (cx - WORD_W / 2) * 0.9 + (rand(tr.id, 4) - 0.5) * 260, vy = -120 - rand(tr.id, 5) * 200;
    const floor = 760 + rand(tr.id, 6) * 80;
    const uf = Math.min(u, T_FLY - T_BREAK);
    let x = WX + cx + vx * uf * 0.9, y = WY + cy + vy * uf + 0.5 * 1300 * uf * uf;
    let ang = (rand(tr.id, 7) - 0.5) * 7 * uf;
    if (y > floor) { y = floor; ang = (rand(tr.id, 7) - 0.5) * 3; }
    const fly = smooth((t - T_FLY - rand(tr.id, 8) * 0.4) / 1.0);
    if (fly > 0) { x = x + (target.x - x) * fly; y = y + (target.y - y) * fly; }
    const shardA = 1 - fly;
    if (shardA > 0.01) {
      ctx.save(); ctx.globalAlpha = shardA; ctx.translate(x, y); ctx.rotate(ang); ctx.translate(-WX - cx, -WY - cy);
      ctx.beginPath(); ctx.moveTo(WX + tr.p[0].x, WY + tr.p[0].y); ctx.lineTo(WX + tr.p[1].x, WY + tr.p[1].y); ctx.lineTo(WX + tr.p[2].x, WY + tr.p[2].y); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.drawImage(w, WX, WY); ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
    }
    const glint = smooth((t - T_FLY + 0.4) / 0.5) * (1 - fly * 0.7) * (fly < 1 ? 1 : 0);
    if (glint > 0) glow(ctx, x, y, 22, 0.6 * glint);
  });
};

const drawGlassScene = (ctx: CanvasRenderingContext2D, t: number) => {
  if (t < 231.0) return;
  ctx.fillStyle = `rgba(11,10,9,${smooth((t - 231.0) / 0.3)})`; ctx.fillRect(0, 0, 1920, 1080);
  // 线索图：前两条线索已经在，第三条由碎玻璃化成
  const mapA = smooth((t - 235.0) / 0.8);
  if (mapA > 0) {
    drawClueMap(ctx, t, {
      vis: (id) => (id === "common" || id === "piaget" ? mapA : id === "loftus" ? smooth((t - 235.9) / 0.7) : 0),
      label: (id) => (id === "loftus" ? smooth((t - 236.3) / 0.6) : 1),
    });
  }
  drawWord(ctx, t);
};

export const Glass: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Sans SC"`, `"Noto Serif SC"`],
    "撞毁碰撞两辆车的时候，车速大概多少？A组B公里/小时一周以后你在录像里看到碎玻璃了吗人资料：1963年交通安全片伊丽莎白·洛夫特斯美国心理学家常识我＝记忆皮亚杰假童年一个词撒下地×2.3%0123456789.");
  const t = useT(G0);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => drawGlassScene(ctx, tt), []);
  return (
    <AbsoluteFill style={{ background: "#0b0a09" }}>
      <Still src="ep01/raw/loftus.jpg" from={G0} a={G0} b={200.9} zoom={[1.0, 1.07]} height={900} fade={0.35} x={300} />
      <NameBar name="伊丽莎白·洛夫特斯" years="1944–  美国心理学家" t={t} a={197.0} b={200.6} />
      <Board t={t} ready={ready} />
      {ready && t >= 231.0 ? <Canvas t={t} draw={draw} /> : null}
      <Film t={t} />
      <Subtitles t={t} hide={(x) => x > 236.9} />
    </AbsoluteFill>
  );
};
export const GlassRoot: React.FC = () => (
  <>
    <Glass />
    <Audio src={staticFile("ep01/voice_glass.wav")} />
    <Audio src={staticFile("ep01/sfx_glass.wav")} volume={1.26} />
  </>
);
void glow;
