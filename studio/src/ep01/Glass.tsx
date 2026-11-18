// 第 01 期 · S26–S30 碎玻璃（录音 196.0–237.2 秒）
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { useCallback } from "react";
import { Canvas, Clip, Corner, Film, NameBar, Still, Subtitles, clamp, glow, rand, sec, smooth, useFonts, useT, DISPLAY, SERIF, SANS, GOLD } from "./common";
import { drawClueMap, clueById } from "./clue";

export const G0 = 196.0;
export const G_END = 238.4;
export const GLASS_FRAMES = sec(G_END - G0);

// 左右分屏：同一段录像，只换了一个词
const Panel: React.FC<{ left: boolean; t: number; on: number }> = ({ left, t, on }) => {
  const o = smooth((t - on) / 0.6);
  return (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: left ? 0 : 966, width: 954, overflow: "hidden", opacity: o }}>
      <Clip src="ep01/clips/car_pov.mp4" from={G0} a={202.41} b={208.9} rate={0.87} zoom={[1.05, 1.1]} />
      <Clip src="ep01/clips/car_road.mp4" from={G0} a={208.9} b={215.17} rate={0.8} zoom={[1.05, 1.12]} />
    </div>
  );
};
const Word: React.FC<{ text: string; t: number; at: number; x: number }> = ({ text, t, at, x }) => {
  const k = smooth((t - at) / 0.35);
  if (t < at || t > 215.17) return null;
  return (
    <div style={{ position: "absolute", left: x - 300, width: 600, top: 120, textAlign: "center", fontFamily: DISPLAY, fontSize: 132, letterSpacing: 18, color: GOLD,
      opacity: k, transform: `scale(${1.25 - 0.25 * k})`, textShadow: "0 0 24px rgba(0,0,0,0.95), 0 0 40px rgba(255,170,90,0.35)" }}>
      {text}
      <div style={{ width: 300 * k, height: 5, background: "#e7a35e", margin: "10px auto 0" }} />
    </div>
  );
};

// 柱状图
const Bars: React.FC<{ t: number; a: number; b: number; title: string; unit: string; vals: [number, number]; max: number; fmt: (v: number) => string; note?: { at: number; text: string } }> =
  ({ t, a, b, title, unit, vals, max, fmt, note }) => {
  if (t < a - 0.01 || t > b) return null;
  const o = smooth((t - a) / 0.35) * (1 - smooth((t - (b - 0.3)) / 0.3));
  const grow = (i: number) => smooth((t - a - 0.3 - i * 0.35) / 1.3);
  const names = ["撞毁", "碰撞"];
  return (
    <AbsoluteFill style={{ background: "#0b0a09", opacity: o }}>
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: SERIF, fontSize: 68, color: GOLD, letterSpacing: 8 }}>{title}</div>
      <div style={{ position: "absolute", top: 185, width: "100%", textAlign: "center", fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.6)" }}>{unit}</div>
      {vals.map((v, i) => {
        const h = (v / max) * 420 * grow(i);
        const x = i === 0 ? 700 : 1220;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x - 90, width: 180, bottom: 340, height: h,
              background: i === 0 ? "linear-gradient(#f0b26a, #b8743a)" : "linear-gradient(#a99a86, #6f6457)", boxShadow: i === 0 ? "0 0 40px rgba(240,170,90,0.35)" : "none" }} />
            <div style={{ position: "absolute", left: x - 200, width: 400, bottom: 340 + h + 16, textAlign: "center", fontFamily: SANS, fontSize: 64, color: GOLD, opacity: grow(i) }}>{fmt(v * grow(i))}</div>
            <div style={{ position: "absolute", left: x - 200, width: 400, bottom: 250, textAlign: "center", fontFamily: DISPLAY, fontSize: 68, color: GOLD, letterSpacing: 8 }}>{names[i]}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 480, width: 960, bottom: 338, height: 3, background: "rgba(240,225,200,0.4)" }} />
      {note && t > note.at ? (
        <div style={{ position: "absolute", left: 860, width: 200, top: 330, textAlign: "center", fontFamily: DISPLAY, fontSize: 96, color: "#f6c27f",
          opacity: smooth((t - note.at) / 0.3), transform: `scale(${1.3 - 0.3 * smooth((t - note.at) / 0.3)})` }}>{note.text}</div>
      ) : null}
      <div style={{ position: "absolute", right: 90, top: 70, fontFamily: SANS, fontSize: 46, color: "rgba(240,225,200,0.55)" }}>Loftus &amp; Palmer, 1974</div>
    </AbsoluteFill>
  );
};

// 代码画的碎玻璃碴：随机三角形，闪光
const shards = Array.from({ length: 70 }, (_, i) => ({
  x: rand(i, 1) * 1920, y: rand(i, 2) * 1080, r: 14 + rand(i, 3) * 46, a0: rand(i, 4) * 6.28, spin: (rand(i, 5) - 0.5) * 4,
  vx: (rand(i, 6) - 0.5) * 300, vy: -80 - rand(i, 7) * 260,
}));
const drawShard = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ang: number, a: number, seed: number) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(-r * (0.4 + rand(seed, 8) * 0.5), r * (0.5 + rand(seed, 9) * 0.4)); ctx.lineTo(-r * 0.5, -r * (0.3 + rand(seed, 10) * 0.6)); ctx.closePath();
  ctx.fillStyle = `rgba(220,235,245,${0.16 * a})`; ctx.fill();
  ctx.strokeStyle = `rgba(255,255,255,${0.75 * a})`; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
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
  // 228.25 起：碎玻璃消失 —— 录像里根本没有
  if (t >= 228.25 && t < 230.2) {
    const u = t - 228.25;
    shards.forEach((s, i) => {
      const lift = smooth((u - 0.5 - rand(i, 11) * 0.5) / 0.9);
      const a = (1 - lift) * (0.6 + 0.4 * Math.sin(t * 9 + i));
      if (a > 0.01) drawShard(ctx, s.x + s.vx * lift * 0.4, s.y + s.vy * lift * 0.6, s.r, s.a0 + s.spin * lift, a, i);
    });
  }
  if (t >= 231.0) {
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
  }
};

export const Glass: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Sans SC"`, `"Noto Serif SC"`], "撞毁碰撞估计的车速说看到了碎玻璃的人公里时伊丽莎白·洛夫特斯常识：我＝我的记忆皮亚杰的假童年一个词，撒下一地碎玻璃×2.3%0123456789.");
  const t = useT(G0);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => drawGlassScene(ctx, tt), []);
  return (
    <AbsoluteFill style={{ background: "#0b0a09" }}>
      <Still src="ep01/raw/loftus.jpg" from={G0} a={G0} b={200.6} zoom={[1.0, 1.07]} height={900} fade={0.35} x={300} />
      <NameBar name="伊丽莎白·洛夫特斯" years="1944–  美国心理学家" t={t} a={197.0} b={200.5} />
      <Clip src="ep01/clips/car_road.mp4" from={G0} a={200.55} b={202.41} zoom={[1.0, 1.04]} />
      {t >= 202.41 && t < 215.17 ? (
        <AbsoluteFill>
          <Panel left t={t} on={202.41} />
          <Panel left={false} t={t} on={209.51} />
          <div style={{ position: "absolute", left: 957, width: 6, top: 0, bottom: 0, background: "#0b0a09" }} />
          <Word text="撞毁" t={t} at={204.39} x={477} />
          <Word text="碰撞" t={t} at={212.29} x={1443} />
        </AbsoluteFill>
      ) : null}
      <Corner text="资料：Safety Belt for Susie（1963）" t={t} a={200.6} b={215.1} />
      <Bars t={t} a={215.17} b={221.5} title="估计的车速" unit="公里/小时" vals={[65.7, 54.7]} max={70} fmt={(v) => v.toFixed(1)} />
      <Clip src="ep01/clips/glass_burst.mp4" from={G0} a={221.5} b={223.27} zoom={[1.0, 1.05]} />
      <Clip src="ep01/clips/glass_out.mp4" from={G0} a={223.27} b={224.03} start={1.0} zoom={[1.0, 1.02]} />
      <Bars t={t} a={224.03} b={228.25} title="一周后，说看到了碎玻璃的人" unit="每组 50 人" vals={[32, 14]} max={40} fmt={(v) => `${Math.round(v)}%`} note={{ at: 227.39, text: "×2.3" }} />
      <Clip src="ep01/clips/glass_out.mp4" from={G0} a={228.25} b={229.6} start={0.2} zoom={[1.02, 1.06]} fo={0.6} />
      <Clip src="ep01/clips/car_road.mp4" from={G0} a={229.0} b={231.3} start={0.5} zoom={[1.0, 1.03]} fi={0.6} fo={0.3} />
      {ready ? <Canvas t={t} draw={draw} /> : null}
      <Film t={t} />
      <Subtitles t={t} hide={(x) => x > 236.9} />
    </AbsoluteFill>
  );
};
export const GlassRoot: React.FC = () => (
  <>
    <Glass />
    <Audio src={staticFile("ep01/voice_glass.wav")} />
    <Audio src={staticFile("ep01/sfx_glass.wav")} />
  </>
);
