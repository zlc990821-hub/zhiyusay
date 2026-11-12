// Style B sample: EP01 opening (0–46.5 s) as flat vector illustration with a recurring character.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, easeInOut, easeOut, fade, keyNum, rng } from "../components/anim";
import { COLORS, FONT_SANS, FONT_SERIF, loadFonts } from "../components/theme";
import { Subtitles, Sub } from "../components/Subtitles";
import { LayerTags } from "../components/LayerTag";
import { Ape, Cell, Fish, Flame, Lizard, P, Sauropod, Shrew, Swimmer, TRex, You } from "./kit";
import subs from "../../../episodes/EP01_存在/subtitles.json";

export const STYLEB_DURATION = 46.5;
loadFonts((subs as Sub[]).map((s) => s.text).join("") + "连胜纪录年败单细胞鱼爬行动物早期哺乳动物古猿你我为什么会存在？天元纪元第1期6600万年前我们的远祖约13%会引发大灭绝的撞击区域撞击点希克苏鲁伯0123456789,");

const W = 1920, H = 1080;

// ───────────────────────── Scene 1: the 4-billion-year relay ─────────────────────────
const XS = [0, 900, 1800, 2700, 3600, 4500];
const NAMES = ["单细胞", "鱼", "爬行动物", "早期哺乳动物", "古猿", "你"];
const GROUND = 720;
const camX = (t: number) => keyNum(t, [[0, 4500], [9.0, 4500], [9.55, 0], [10.7, 0], [15.2, 4500], [16.0, 4556]]);
const camY = (t: number) => keyNum(t, [[0, 560], [15.2, 560], [16.0, 400]]);
const camS = (t: number) => keyNum(t, [[0, 1.3], [9.0, 1.45], [9.55, 1.3], [10.7, 1.3], [12.9, 1.1], [15.2, 1.3], [16.0, 4.5]]);

const Creature: React.FC<{ i: number; t: number; dead?: number }> = ({ i, t, dead = 0 }) => {
  const k = [Cell, Fish, Lizard, Shrew, Ape][i];
  return k ? React.createElement(k, { t, dead }) : null;
};

const Relay: React.FC<{ t: number }> = ({ t }) => {
  const cx = camX(t), cy = camY(t), s = camS(t);
  const v = Math.abs(camX(t + 0.02) - cx) / 0.02;
  const blur = Math.min(14, v / 900);
  const torchX = t < 9.0 ? 4556 : t < 10.7 ? 0 : cx;
  const torchY = t < 9.0 ? 400 : 430 + Math.sin(t * 5) * 8;
  const relayOn = t >= 10.7;
  return (
    <g transform={`translate(${W / 2 - cx * s},${H / 2 - cy * s}) scale(${s})`} style={{ filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
      {/* ocean then land */}
      <rect x={-1200} y={GROUND - 40} width={2550} height={900} fill={P.ocean} />
      <path d={`M -1200 ${GROUND - 40} ${Array.from({ length: 52 }, (_, k) => `Q ${-1175 + k * 50} ${GROUND - 52 + Math.sin(t * 2 + k) * 4} ${-1150 + k * 50} ${GROUND - 40}`).join(" ")}`} fill={P.ocean2} />
      <rect x={1350} y={GROUND} width={4600} height={900} fill={P.land} />
      <rect x={1350} y={GROUND} width={4600} height={18} fill={P.land2} />
      <path d={`M 1300 ${GROUND + 40} Q 1350 ${GROUND - 10} 1420 ${GROUND}`} fill={P.land} />
      {/* dotted relay path */}
      <line x1={-150} y1={430} x2={4560} y2={430} stroke={P.gold} strokeOpacity={0.35} strokeWidth={4} strokeDasharray="4 22" strokeLinecap="round" />
      {/* side branches that didn't make it */}
      {XS.slice(0, 5).map((x, i) =>
        [330, 560].map((dx, j) => {
          const bx = x + dx;
          const d = relayOn ? clamp((cx - bx + 200) / 260) : t < 9 ? 1 : 0;
          return (
            <g key={`${i}${j}`} transform={`translate(${bx},${GROUND + (i < 2 ? 0 : -6)}) scale(0.62)`} opacity={1 - 0.65 * d}>
              <Creature i={i} t={t + i + j} dead={d} />
            </g>
          );
        }),
      )}
      {/* the line that never broke */}
      {XS.map((x, i) => {
        const lit = t < 9.0 ? 1 : relayOn ? clamp((cx - x + 60) / 120) : i === 0 ? 1 : 0;
        return (
          <g key={x} transform={`translate(${x},${GROUND})`}>
            <ellipse cy={6} rx={110} ry={14} fill={P.gold} opacity={0.35 * lit} />
            {i < 5 ? <Creature i={i} t={t} /> : <You t={t} arm={t < 9.0 ? 1 : clamp((t - 14.6) / 0.6)} look={0.2} />}
            <text y={70} textAnchor="middle" fontFamily={FONT_SANS} fontSize={34} fill={P.cream} opacity={0.4 + 0.6 * lit} letterSpacing={4}>{NAMES[i]}</text>
          </g>
        );
      })}
      {/* the fire being passed on */}
      <g transform={`translate(${torchX},${torchY})`}><Flame t={t} size={0.9} /></g>
    </g>
  );
};

const Scoreboard: React.FC<{ t: number }> = ({ t }) => {
  const o = fade(t, 2.2, 15.6, 0.5, 0.5);
  if (o <= 0) return null;
  const val = t < 9.06 ? 4e9 : t < 10.7 ? 0 : (Math.round((clamp((camX(t)) / 4500) * 4e9) / 1e7) * 1e7);
  const pop = t > 2.2 && t < 2.7 ? 1 + 0.15 * Math.sin(((t - 2.2) / 0.5) * Math.PI) : 1;
  return (
    <div style={{ position: "absolute", top: 50, left: "50%", transform: `translateX(-50%) scale(${pop})`, opacity: o, display: "flex", alignItems: "center", gap: 28, padding: "18px 34px", borderRadius: 18, background: "rgba(11,19,34,0.82)", border: `3px solid ${P.gold}` }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 28, color: P.gold, letterSpacing: 6 }}>连胜纪录</div>
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 64, color: P.cream, fontVariantNumeric: "tabular-nums", minWidth: 520, textAlign: "center" }}>
        {val.toLocaleString("en-US")}<span style={{ fontSize: 34, marginLeft: 10 }}>年</span>
      </div>
      <div style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: 30, color: P.ink, background: P.gold, padding: "6px 16px", borderRadius: 10 }}>0 败</div>
    </div>
  );
};

// ───────────────────────── Scene 2: the race ─────────────────────────
const SW = (() => {
  const r = rng(5);
  return Array.from({ length: 140 }, (_, i) => ({
    y0: 520 + (r() - 0.5) * 640, x0: -120 - r() * 520, sp: i === 0 ? 1 : 0.5 + 0.45 * r(), cap: i === 0 ? 1 : 0.55 + 0.35 * r(), seed: r(),
  }));
})();
const EGG = { x: 1440, y: 520, r: 200 };
const Race: React.FC<{ t: number }> = ({ t }) => {
  const p = clamp((t - 15.9) / 3.1);
  const hit = clamp((t - 19.0) / 0.5);
  return (
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="egg"><stop offset="0" stopColor={P.cream} /><stop offset="0.7" stopColor="#f5d58c" /><stop offset="1" stopColor={P.gold} /></radialGradient>
      </defs>
      <circle cx={EGG.x} cy={EGG.y} r={EGG.r * (1.5 + 0.6 * hit)} fill={P.gold} opacity={0.12 + 0.25 * hit} />
      <circle cx={EGG.x} cy={EGG.y} r={EGG.r * (1 + 0.04 * Math.sin(t * 2))} fill="url(#egg)" />
      <circle cx={EGG.x - 60} cy={EGG.y - 60} r={50} fill="#fff" opacity={0.35} />
      {SW.map((s, i) => {
        const prog = Math.min(p * s.sp, s.cap);
        const tx = EGG.x - EGG.r + 6;
        const x = s.x0 + (tx - s.x0) * prog;
        const y = s.y0 + (EGG.y - s.y0) * prog * 0.85 + Math.sin(t * 3 + s.seed * 20) * 14;
        const out = i === 0 ? 1 - clamp((t - 19.1) / 0.4) : 1 - clamp((p * s.sp - s.cap + 0.05) / 0.25);
        if (out <= 0) return null;
        return <g key={i} transform={`translate(${x},${y}) rotate(${(EGG.y - s.y0) * 0.02})`} opacity={out * (i === 0 ? 1 : 0.75)}><Swimmer t={t} seed={s.seed} color={i === 0 ? P.gold : P.cream} /></g>;
      })}
      {t > 19.6 && (
        <g opacity={easeOut(clamp((t - 19.6) / 0.5))}>
          <text x={EGG.x} y={EGG.y + 26} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={120} fill={P.ink}>你</text>
        </g>
      )}
    </svg>
  );
};

// ───────────────────────── Scene 3: title ─────────────────────────
const Title: React.FC<{ t: number }> = ({ t }) => {
  const qo = fade(t, 21.7, 25.3, 0.5, 0.4);
  const to = fade(t, 25.1, 27.1, 0.6, 0.4);
  const ti = easeOut(clamp((t - 25.1) / 0.8));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <circle cx={960} cy={1700} r={900} fill={P.night2} />
        <circle cx={960} cy={1700} r={900} fill="none" stroke={P.gold} strokeOpacity={0.4} strokeWidth={3} />
        <g transform="translate(960,805)"><You t={t} mood="wonder" look={0} scale={0.85} /></g>
        <g transform={`translate(1060,560) scale(${easeOut(clamp((t - 22.4) / 0.4))})`}>
          <circle r={46} fill={P.cream} /><text y={20} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={60} fill={P.ink}>?</text>
        </g>
      </svg>
      <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", opacity: qo, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 96, letterSpacing: 14, color: P.cream }}>
        {Array.from("我，为什么会存在？").map((c, i) => <span key={i} style={{ opacity: easeOut(clamp((t - 21.7 - i * 0.08) / 0.4)) }}>{c}</span>)}
      </div>
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", opacity: to }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: P.gold, transform: `translateY(${(1 - ti) * 10}px)` }}>天元纪元 · 第1期</div>
        <div style={{ marginTop: 18, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 110, letterSpacing: 12, color: P.cream, transform: `translateY(${(1 - ti) * 16}px)` }}>我为什么会存在？</div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 4: the asteroid ─────────────────────────
const IMPACT = 30.4;
const ASH = (() => { const r = rng(9); return Array.from({ length: 90 }, () => ({ x: r() * W, s: 0.4 + r(), p: r() })); })();
const Dinos: React.FC<{ t: number }> = ({ t }) => {
  const after = clamp((t - IMPACT) / 1.2);
  const dead = clamp((t - 31.5) / 2.0);
  const push = 1 + 0.05 * clamp((t - 27.1) / 10);
  const ast = clamp((t - 28.4) / (IMPACT - 28.4));
  const ax = 1950 + (1240 - 1950) * ast * ast, ay = -120 + (640 + 120) * ast * ast;
  const flash = t > IMPACT ? Math.exp(-(t - IMPACT) * 3) : 0;
  const wave = t > IMPACT ? clamp((t - IMPACT) / 2.2) : 0;
  const pop = easeOut(clamp((t - 33.7) / 0.6));
  const mix = (a: string, b: string) => (after > 0.5 ? b : a);
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="sky0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24285a" /><stop offset="0.75" stopColor="#d9805a" /></linearGradient>
          <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a0f12" /><stop offset="0.75" stopColor="#a8392a" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#sky0)" />
        <rect width={W} height={H} fill="url(#sky1)" opacity={after} />
        <path d="M 120 760 L 420 360 L 520 380 L 760 760 Z" fill={mix("#4a3b5c", "#3a2224")} />
        <path d="M 420 360 L 470 300 L 520 380 Z" fill={P.coral} opacity={0.8} />
        <path d="M 0 700 Q 400 560 900 680 Q 1400 560 1920 660 L 1920 1080 L 0 1080 Z" fill={mix("#3f6e58", "#3b3434")} />
        {t > 28.3 && ast < 1 && (
          <g>
            <line x1={ax + 320} y1={ay - 340} x2={ax} y2={ay} stroke={P.gold} strokeWidth={14} strokeLinecap="round" opacity={0.6} />
            <circle cx={ax} cy={ay} r={26} fill={P.cream} />
            <circle cx={ax} cy={ay} r={44} fill={P.gold} opacity={0.4} />
          </g>
        )}
        {wave > 0 && <ellipse cx={1240} cy={650} rx={80 + wave * 1400} ry={40 + wave * 500} fill="none" stroke={P.cream} strokeWidth={10 * (1 - wave)} opacity={1 - wave} />}
        <path d="M 0 820 L 1920 820 L 1920 1080 L 0 1080 Z" fill={mix("#356049", "#2f2b2b")} />
        <g transform={`translate(560,${822 + 70 * dead}) scale(0.95)`} opacity={1 - 0.8 * dead}><Sauropod t={t} dead={dead} /></g>
        <g transform={`translate(1430,${822 + 70 * dead}) scale(0.9)`} opacity={1 - 0.8 * dead}><TRex t={t} dead={dead} /></g>
        {/* burrow + our ancestor */}
        <ellipse cx={1000} cy={905} rx={190} ry={52} fill={mix("#2c4b3a", "#262222")} />
        <ellipse cx={1000} cy={910} rx={100} ry={24} fill={P.ink} />
        <g transform={`translate(1000,${980 - 75 * pop}) scale(0.8)`}><Shrew t={t * pop} /></g>
        {[200, 330, 1650, 1780].map((x, i) => (
          <g key={x} transform={`translate(${x},1000)`}>
            {[-50, -20, 10, 40].map((a) => <path key={a} d={`M 0 0 Q ${a} -90 ${a * 2.2} ${-150 - (i % 2) * 30}`} stroke={mix("#2f7d5a", "#3a3434")} strokeWidth={12} fill="none" strokeLinecap="round" />)}
          </g>
        ))}
        {after > 0 && ASH.map((a, i) => <circle key={i} cx={(a.x + Math.sin(t + i) * 20) % W} cy={((a.p + (t - IMPACT) * 0.08 * a.s) % 1) * H} r={3 + 2 * a.s} fill="#d8cfc4" opacity={0.5 * after} />)}
      </svg>
      {flash > 0.01 && <AbsoluteFill style={{ background: "#fff6e6", opacity: flash }} />}
      <Chip t={t} at={27.3} out={31.4} y={110} big="6600 万年前" small="希克苏鲁伯撞击 · 今墨西哥尤卡坦半岛" />
      {pop > 0 && (
        <div style={{ position: "absolute", left: 1140, top: 700, opacity: fade(t, 34.2, 37.8, 0.4, 0.4), fontFamily: FONT_SANS, fontWeight: 500, fontSize: 34, color: P.ink, background: P.gold, padding: "8px 20px", borderRadius: 12 }}>← 我们的远祖</div>
      )}
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ t: number; at: number; out: number; y: number; big: string; small: string }> = ({ t, at, out, y, big, small }) => {
  const o = fade(t, at, out, 0.4, 0.4);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: y, left: "50%", transform: `translate(-50%, ${(1 - easeOut(clamp((t - at) / 0.5))) * 14}px)`, opacity: o, textAlign: "center", padding: "16px 40px", borderRadius: 16, background: "rgba(11,19,34,0.78)" }}>
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 64, color: P.cream, letterSpacing: 4 }}>{big}</div>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, color: "rgba(246,239,226,0.75)", letterSpacing: 3, marginTop: 4 }}>{small}</div>
    </div>
  );
};

// ───────────────────────── Scene 5: the 13% ─────────────────────────
const PATCHES = [
  { x: -48, y: 22, r: 46, at: 39.0 }, { x: 205, y: 40, r: 40, at: 39.5 }, { x: -135, y: -120, r: 36, at: 40.0 }, { x: 40, y: 175, r: 36, at: 40.5 },
];
const Globe: React.FC<{ t: number }> = ({ t }) => {
  const R = 300;
  const enter = easeInOut(clamp((t - 37.6) / 1.2));
  const pin = clamp((t - 43.4) / 0.5);
  const donut = easeOut(clamp((t - 39.0) / 1.6)) * 0.13;
  const C = 2 * Math.PI * 110;
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="gl"><circle r={R} /></clipPath>
          <radialGradient id="shade" cx="0.35" cy="0.35" r="0.8"><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.45" /></radialGradient>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill={P.red} /><rect width="5" height="14" fill="#ff8a7a" /></pattern>
        </defs>
        {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={(i * 337) % W} cy={(i * 191) % H} r={1.5 + (i % 3)} fill={P.cream} opacity={0.25 + 0.2 * Math.sin(t * 2 + i)} />)}
        <g transform={`translate(${760},${540 + Math.sin(t * 1.2) * 6}) scale(${1.6 - 0.6 * enter})`}>
          <circle r={R + 18} fill={P.sky} opacity={0.15} />
          <g clipPath="url(#gl)">
            <circle r={R} fill={P.ocean} />
            <path d="M -200 -190 C -140 -250 -20 -240 0 -180 C 20 -140 -40 -100 -55 -60 C -70 -25 -30 0 -10 10 L -40 40 C -100 20 -150 -40 -210 -90 Z" fill={P.land} />
            <path d="M -30 50 C 20 40 70 70 80 120 C 90 180 30 250 0 300 C -20 240 -45 180 -55 125 C -62 90 -55 65 -30 50 Z" fill={P.land} />
            <path d="M 170 -160 C 230 -180 290 -120 300 -60 C 310 10 270 90 225 130 C 190 90 170 30 160 -20 C 150 -80 140 -130 170 -160 Z" fill={P.land} />
            <ellipse cx={-70} cy={-265} rx={60} ry={30} fill={P.land} />
            {PATCHES.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r * easeOut(clamp((t - p.at) / 0.4))} fill="url(#hatch)" opacity={0.85} />)}
            <circle r={R} fill="url(#shade)" />
          </g>
          <circle r={R} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={3} />
          {pin > 0 && (
            <g transform={`translate(-48,${22 - 220 * (1 - easeOut(pin))})`}>
              <path d="M 0 0 C -10 -30 -34 -46 -34 -70 A 34 34 0 1 1 34 -70 C 34 -46 10 -30 0 0 Z" fill={P.gold} stroke={P.ink} strokeWidth={4} />
              <circle cy={-70} r={12} fill={P.ink} />
            </g>
          )}
        </g>
        {/* donut */}
        <g transform="translate(1440,470)" opacity={easeOut(clamp((t - 38.8) / 0.6))}>
          <circle r={110} fill="none" stroke={P.ocean2} strokeWidth={38} />
          <circle r={110} fill="none" stroke={P.red} strokeWidth={38} strokeDasharray={`${C * donut} ${C}`} transform="rotate(-90)" />
          <text y={22} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={64} fill={P.cream}>{Math.round(donut * 100)}%</text>
          <text y={200} textAnchor="middle" fontFamily={FONT_SANS} fontSize={28} fill={P.cream} opacity={0.8}>会引发大灭绝的撞击区域</text>
          <text y={240} textAnchor="middle" fontFamily={FONT_SANS} fontSize={22} fill={P.cream} opacity={0.5}>Kaiho & Oshima, 2017</text>
        </g>
      </svg>
      {pin > 0.6 && (
        <div style={{ position: "absolute", left: 560, top: 300, opacity: easeOut(clamp((t - 43.8) / 0.4)), fontFamily: FONT_SANS, fontWeight: 500, fontSize: 32, color: P.ink, background: P.gold, padding: "8px 20px", borderRadius: 12 }}>撞击点 · 希克苏鲁伯</div>
      )}
    </AbsoluteFill>
  );
};

// ───────────────────────── composition ─────────────────────────
export const EP01StyleB: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const o1 = clamp(t / 0.8) * clamp((16.0 - t) / 0.3);
  const o2 = fade(t, 15.75, 21.9, 0.3, 0.6);
  const o3 = fade(t, 21.5, 27.4, 0.5, 0.5);
  const o4 = fade(t, 27.1, 38.6, 0.4, 1.0);
  const o5 = clamp((t - 37.6) / 1.0) * clamp((STYLEB_DURATION - t) / 0.6);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${P.night2} 0%, ${P.night} 70%)` }} />
      {o1 > 0 && (
        <AbsoluteFill style={{ opacity: o1 }}>
          <svg width={W} height={H} style={{ position: "absolute" }}>
            {Array.from({ length: 80 }, (_, i) => <circle key={i} cx={((i * 263 - camX(t) * 0.05) % W + W) % W} cy={(i * 131) % 600} r={1.4 + (i % 3)} fill={P.cream} opacity={0.3 + 0.2 * Math.sin(t * 2 + i)} />)}
            <Relay t={t} />
          </svg>
          <Scoreboard t={t} />
        </AbsoluteFill>
      )}
      {o2 > 0 && <AbsoluteFill style={{ opacity: o2 }}><Race t={t} /></AbsoluteFill>}
      {t > 15.3 && t < 16.4 && <AbsoluteFill style={{ background: `radial-gradient(circle, ${P.cream} 0%, ${P.gold} 30%, rgba(242,193,78,0) 70%)`, opacity: Math.sin(clamp((t - 15.3) / 1.1) * Math.PI) * 0.95 }} />}
      {o3 > 0 && <AbsoluteFill style={{ opacity: o3 }}><Title t={t} /></AbsoluteFill>}
      {o4 > 0 && <AbsoluteFill style={{ opacity: o4, transform: `scale(${1 - 0.5 * easeInOut(clamp((t - 37.6) / 1.0))})` }}><Dinos t={t} /></AbsoluteFill>}
      {o5 > 0 && <AbsoluteFill style={{ opacity: o5 }}><Globe t={t} /></AbsoluteFill>}
      <LayerTags tags={[{ layer: "S", in: 2.4, out: 21.5 }, { layer: "S", in: 27.3, out: 46.2 }]} />
      <Subtitles subs={(subs as Sub[]).filter((s) => s.start < STYLEB_DURATION)} hide={["所以——我，为什么会存在？"]} />
      <Audio src={staticFile("EP01_存在/audio/vo_edit.wav")} endAt={Math.round(STYLEB_DURATION * fps)} />
      <Audio src={staticFile("EP01_存在/styleB/audio/sfx.wav")} />
    </AbsoluteFill>
  );
};

export { COLORS };
