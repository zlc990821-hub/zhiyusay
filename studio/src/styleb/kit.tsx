// Style B — flat vector illustration kit (characters, creatures, props). All shapes are drawn in SVG,
// centred on x = 0 and standing on y = 0 (ground), facing right.
import React from "react";

export const P = {
  night: "#0e1a2c", night2: "#18294a", ink: "#0b1322",
  cream: "#f6efe2", gold: "#f2c14e", coral: "#ef6f5e", teal: "#3fb6a8", teal2: "#2a8f86",
  sky: "#5aa9e6", ocean: "#2e6fb3", ocean2: "#245a94", land: "#2f8f6b", land2: "#246f54",
  purple: "#7a6bd1", grey: "#5b6577", greyL: "#8892a3", red: "#e84a3c",
};

const Eye: React.FC<{ x: number; y: number; r?: number; look?: number; blink?: number }> = ({ x, y, r = 9, look = 0.3, blink = 0 }) => (
  <g>
    <ellipse cx={x} cy={y} rx={r} ry={r * (1 - 0.9 * blink)} fill="#fff" />
    <circle cx={x + r * look} cy={y} r={r * 0.5 * (1 - blink)} fill={P.ink} />
  </g>
);

type C = { t: number; color?: string; dead?: number };

/** dead: 0 alive → 1 dead (greyed, eyes closed) */
const tone = (c: string, dead = 0) => (dead > 0.5 ? P.grey : c);

export const Cell: React.FC<C> = ({ t, color = P.teal, dead = 0 }) => (
  <g transform="translate(0,-70)">
    {Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2, w = Math.sin(t * 8 + i) * 6;
      return <line key={i} x1={Math.cos(a) * 58} y1={Math.sin(a) * 58} x2={Math.cos(a) * (74 + w)} y2={Math.sin(a) * (74 + w)} stroke={tone(color, dead)} strokeWidth={5} strokeLinecap="round" />;
    })}
    <circle r={60} fill={tone(color, dead)} />
    <circle r={60} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={4} />
    <circle cx={-14} cy={10} r={20} fill="#fff" fillOpacity={0.18} />
    <Eye x={8} y={-10} r={11} blink={dead} />
    <Eye x={32} y={-10} r={11} blink={dead} />
  </g>
);

export const Fish: React.FC<C> = ({ t, color = P.coral, dead = 0 }) => {
  const sw = Math.sin(t * 7) * 10;
  return (
    <g transform={`translate(0,-75) rotate(${dead * 90})`}>
      <path d={`M -70 0 L -125 ${-38 + sw} L -125 ${38 + sw} Z`} fill={tone(color, dead)} />
      <ellipse rx={85} ry={48} fill={tone(color, dead)} />
      <path d="M -10 -46 Q 10 -80 40 -44 Z" fill={tone(color, dead)} />
      <ellipse cx={-5} cy={14} rx={38} ry={16} fill="#fff" fillOpacity={0.18} />
      <Eye x={45} y={-10} r={12} blink={dead} />
    </g>
  );
};

export const Lizard: React.FC<C> = ({ t, color = P.teal, dead = 0 }) => {
  const step = Math.sin(t * 10) * 10;
  return (
    <g transform={`translate(0,-34) rotate(${dead * 90})`}>
      <path d={`M -80 0 Q -160 ${-10 + step / 2} -200 18`} stroke={tone(color, dead)} strokeWidth={16} fill="none" strokeLinecap="round" />
      {[-45, 40].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={10} x2={x + (i ? step : -step)} y2={34} stroke={tone(color, dead)} strokeWidth={10} strokeLinecap="round" />
          <line x1={x + 10} y1={10} x2={x + 10 + (i ? -step : step)} y2={34} stroke={tone(color, dead)} strokeWidth={10} strokeLinecap="round" />
        </g>
      ))}
      <ellipse rx={95} ry={28} fill={tone(color, dead)} />
      <ellipse cx={110} cy={-6} rx={40} ry={24} fill={tone(color, dead)} />
      <Eye x={118} y={-14} r={9} blink={dead} />
    </g>
  );
};

export const Shrew: React.FC<C> = ({ t, color = "#c98b5a", dead = 0 }) => {
  const hop = Math.abs(Math.sin(t * 6)) * 8;
  return (
    <g transform={`translate(0,${-48 - hop}) rotate(${dead * 90})`}>
      <path d="M -60 10 Q -120 -10 -130 30" stroke={tone(color, dead)} strokeWidth={8} fill="none" strokeLinecap="round" />
      <ellipse rx={66} ry={44} fill={tone(color, dead)} />
      <ellipse cx={62} cy={-10} rx={42} ry={30} fill={tone(color, dead)} />
      <path d="M 95 -14 L 128 -4 L 96 6 Z" fill={tone(color, dead)} />
      <circle cx={128} cy={-4} r={6} fill={P.ink} />
      <circle cx={48} cy={-38} r={16} fill={tone(color, dead)} />
      <circle cx={48} cy={-38} r={8} fill="#f3b6a5" />
      <ellipse cx={-10} cy={12} rx={34} ry={16} fill="#fff" fillOpacity={0.15} />
      <Eye x={78} y={-16} r={9} blink={dead} />
    </g>
  );
};

export const Ape: React.FC<C> = ({ t, color = "#8a6a55", dead = 0 }) => {
  const sw = Math.sin(t * 6) * 12;
  return (
    <g transform={`rotate(${dead * 90} 0 -60)`}>
      <line x1={-18} y1={-60} x2={-26 - sw / 2} y2={0} stroke={tone(color, dead)} strokeWidth={18} strokeLinecap="round" />
      <line x1={18} y1={-60} x2={26 + sw / 2} y2={0} stroke={tone(color, dead)} strokeWidth={18} strokeLinecap="round" />
      <ellipse cy={-110} rx={46} ry={62} fill={tone(color, dead)} />
      <line x1={-30} y1={-140} x2={-55 + sw} y2={-30} stroke={tone(color, dead)} strokeWidth={16} strokeLinecap="round" />
      <line x1={30} y1={-140} x2={55 - sw} y2={-30} stroke={tone(color, dead)} strokeWidth={16} strokeLinecap="round" />
      <circle cy={-196} r={40} fill={tone(color, dead)} />
      <ellipse cx={10} cy={-188} rx={26} ry={22} fill="#e8c9a8" />
      <Eye x={2} y={-200} r={8} blink={dead} />
      <Eye x={24} y={-200} r={8} blink={dead} />
    </g>
  );
};

/** The series character "你": round head, teal body. arm: 0 down … 1 raised (holding the torch). */
export const You: React.FC<{ t: number; arm?: number; look?: number; scale?: number; mood?: "calm" | "wonder" }> = ({ t, arm = 0, look = 0.3, scale = 1, mood = "calm" }) => {
  const bob = Math.sin(t * 2.2) * 3;
  const ax = 46 + 10 * arm, ay = -150 - 90 * arm;
  return (
    <g transform={`scale(${scale}) translate(0,${bob})`}>
      <line x1={-16} y1={-70} x2={-20} y2={0} stroke={P.ink} strokeWidth={16} strokeLinecap="round" />
      <line x1={16} y1={-70} x2={20} y2={0} stroke={P.ink} strokeWidth={16} strokeLinecap="round" />
      <rect x={-44} y={-180} width={88} height={120} rx={40} fill={P.teal} />
      <rect x={-44} y={-180} width={88} height={120} rx={40} fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={4} />
      <line x1={-36} y1={-140} x2={-58} y2={-80} stroke={P.teal2} strokeWidth={16} strokeLinecap="round" />
      <line x1={34} y1={-140} x2={ax} y2={ay} stroke={P.teal2} strokeWidth={16} strokeLinecap="round" />
      <circle cy={-226} r={52} fill={P.cream} />
      <Eye x={-14 + look * 6} y={-232 - (mood === "wonder" ? 4 : 0)} r={10} look={look} />
      <Eye x={18 + look * 6} y={-232 - (mood === "wonder" ? 4 : 0)} r={10} look={look} />
      {mood === "wonder" ? <ellipse cx={4 + look * 6} cy={-200} rx={7} ry={9} fill={P.ink} /> : <path d={`M ${-6 + look * 6} -204 Q ${4 + look * 6} -196 ${14 + look * 6} -204`} stroke={P.ink} strokeWidth={4} fill="none" strokeLinecap="round" />}
    </g>
  );
};

export const Flame: React.FC<{ t: number; size?: number }> = ({ t, size = 1 }) => {
  const f = 1 + Math.sin(t * 17) * 0.06 + Math.sin(t * 29) * 0.04;
  return (
    <g transform={`scale(${size})`}>
      <circle r={70} fill={P.gold} opacity={0.18} />
      <circle r={42} fill={P.gold} opacity={0.25} />
      <path d={`M 0 ${-60 * f} C 30 -20 34 10 0 30 C -34 10 -30 -20 0 ${-60 * f} Z`} fill={P.coral} />
      <path d={`M 0 ${-34 * f} C 16 -8 18 10 0 22 C -18 10 -16 -8 0 ${-34 * f} Z`} fill={P.gold} />
      <path d="M 0 -8 C 7 2 7 12 0 16 C -7 12 -7 2 0 -8 Z" fill={P.cream} />
    </g>
  );
};

export const Sauropod: React.FC<{ t: number; dead?: number }> = ({ t, dead = 0 }) => {
  const c = dead > 0 ? `rgb(${Math.round(70 + 20 * (1 - dead))},${Math.round(150 - 70 * dead)},${Math.round(120 - 40 * dead)})` : "#4f9a78";
  const nod = Math.sin(t * 1.3) * 6;
  return (
    <g>
      {[-120, -60, 60, 120].map((x) => <rect key={x} x={x - 20} y={-120} width={40} height={120} rx={14} fill={c} />)}
      <ellipse cy={-170} rx={200} ry={95} fill={c} />
      <path d="M -180 -160 Q -380 -120 -460 -60" stroke={c} strokeWidth={40} fill="none" strokeLinecap="round" />
      <path d={`M 150 -210 Q 230 -360 ${300 + nod} -460`} stroke={c} strokeWidth={46} fill="none" strokeLinecap="round" />
      <ellipse cx={318 + nod} cy={-470} rx={52} ry={32} fill={c} />
      <circle cx={334 + nod} cy={-480} r={7} fill={dead > 0.5 ? c : P.ink} />
      <ellipse cx={-20} cy={-140} rx={140} ry={40} fill="#fff" fillOpacity={0.08} />
    </g>
  );
};

export const TRex: React.FC<{ t: number; dead?: number }> = ({ t, dead = 0 }) => {
  const c = dead > 0 ? `rgb(${Math.round(200 - 110 * dead)},${Math.round(110 - 30 * dead)},${Math.round(80 + 10 * dead)})` : "#c96b4b";
  const jaw = Math.max(0, Math.sin(t * 3)) * 10;
  return (
    <g>
      <path d="M -40 -160 Q -200 -170 -280 -90" stroke={c} strokeWidth={46} fill="none" strokeLinecap="round" />
      <rect x={-50} y={-110} width={34} height={110} rx={14} fill={c} />
      <rect x={10} y={-110} width={34} height={110} rx={14} fill={c} />
      <ellipse cx={0} cy={-170} rx={100} ry={80} fill={c} />
      <path d="M 50 -220 Q 90 -280 130 -300" stroke={c} strokeWidth={60} fill="none" strokeLinecap="round" />
      <path d={`M 90 -340 L 230 -320 L 230 ${-290 + jaw} L 110 ${-280 + jaw} Z`} fill={c} />
      <ellipse cx={130} cy={-320} rx={60} ry={38} fill={c} />
      <line x1={70} y1={-170} x2={100} y2={-150} stroke={c} strokeWidth={12} strokeLinecap="round" />
      <circle cx={150} cy={-332} r={8} fill={dead > 0.5 ? c : P.ink} />
    </g>
  );
};

/** Tiny tadpole-like sperm, head at origin, swimming right. */
export const Swimmer: React.FC<{ t: number; seed: number; color?: string }> = ({ t, seed, color = P.cream }) => {
  const ph = t * 14 + seed * 10;
  const d = `M -10 0 Q -30 ${Math.sin(ph) * 10} -50 ${Math.sin(ph - 1) * 4} T -90 ${Math.sin(ph - 2) * 8}`;
  return (
    <g>
      <path d={d} stroke={color} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.85} />
      <ellipse rx={13} ry={9} fill={color} />
    </g>
  );
};
