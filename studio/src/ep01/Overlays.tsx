import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, easeOut, fade, keyNum } from "../components/anim";
import { COLORS, FONT_SANS, FONT_SERIF, LAYERS } from "../components/theme";
import timeline from "../../../episodes/EP01_存在/timeline.json";

type Callout = { in: number; out: number; big: string; small: string; x?: number; y?: number; large?: boolean };

export const Callouts: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    {(timeline.callouts as Callout[]).map((c) => {
      const o = fade(t, c.in, c.out, 0.45, 0.45);
      if (o <= 0) return null;
      const rise = (1 - easeOut(clamp((t - c.in) / 0.6))) * 14;
      return (
        <div key={c.in + c.big} style={{ position: "absolute", left: `${(c.x ?? 0.5) * 100}%`, top: `${(c.y ?? 0.1) * 100}%`, transform: `translate(-50%, ${rise}px)`, textAlign: "center", opacity: o, whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: c.large ? 96 : 64, letterSpacing: c.large ? 16 : 4, color: COLORS.text, textShadow: "0 0 30px rgba(0,0,0,0.85)" }}>{c.big}</div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, letterSpacing: 4, color: COLORS.dim, marginTop: 8, textShadow: "0 0 12px rgba(0,0,0,0.9)" }}>{c.small}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

const BigLines: React.FC<{ t: number; lines: [string, number][]; size?: number; top?: number; out: number }> = ({ t, lines, size = 84, top, out }) => {
  const o = clamp((out - t) / 0.6);
  if (t < lines[0][1] - 0.1 || o <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: top === undefined ? "center" : "flex-start", alignItems: "center", paddingTop: top }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", opacity: o }}>
        {lines.map(([txt, at]) => (
          <div key={txt} style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: size, letterSpacing: size * 0.18, color: COLORS.text, textShadow: "0 0 40px rgba(0,0,0,0.9)" }}>
            {Array.from(txt).map((ch, i) => {
              const p = easeOut(clamp((t - at - i * 0.07) / 0.45));
              return <span key={i} style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>{ch}</span>;
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const QuestionAndTitle: React.FC<{ t: number }> = ({ t }) => {
  const q = timeline.question, ti = timeline.title;
  const tIn = easeOut(clamp((t - ti.in - 0.2) / 0.9));
  const tO = fade(t, ti.in + 0.2, ti.out, 0.9, 0.5);
  return (
    <>
      <BigLines t={t} lines={[[q.text, q.in]]} size={100} out={q.out} />
      {tO > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center", opacity: tO }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: "#f2c94c", transform: `translateY(${(1 - tIn) * 12}px)` }}>{ti.kicker}</div>
            <div style={{ marginTop: 26, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 96, letterSpacing: 12, color: COLORS.text, transform: `translateY(${(1 - tIn) * 20}px)`, textShadow: "0 0 50px rgba(0,0,0,0.9)" }}>{ti.text}</div>
            <div style={{ margin: "34px auto 0", height: 1, width: 520 * tIn, background: "linear-gradient(90deg, transparent, rgba(244,241,234,0.7), transparent)" }} />
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};

export const Asteroid: React.FC<{ t: number }> = ({ t }) => {
  const A = timeline.asteroid;
  const p = clamp((t - A.t0) / (A.t1 - A.t0));
  const fl = t - timeline.flash;
  const flash = fl < 0 ? 0 : 0.85 * Math.exp(-fl * 3.5);
  const ring = fl > 0 && fl < 2.5 ? fl / 2.5 : 0;
  return (
    <AbsoluteFill>
      {t > A.t0 && p < 1 && (
        <svg width="1920" height="1080" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="trail" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffb070" stopOpacity="0" />
              <stop offset="1" stopColor="#fff1d6" stopOpacity="1" />
            </linearGradient>
          </defs>
          {(() => {
            const e = p * p;
            const x = A.from[0] + (A.to[0] - A.from[0]) * e, y = A.from[1] + (A.to[1] - A.from[1]) * e;
            const tx = x + (A.from[0] - A.to[0]) * 0.18, ty = y + (A.from[1] - A.to[1]) * 0.18;
            return (
              <>
                <line x1={tx} y1={ty} x2={x} y2={y} stroke="url(#trail)" strokeWidth={6} strokeLinecap="round" />
                <circle cx={x} cy={y} r={7} fill="#fff6e0" style={{ filter: "drop-shadow(0 0 14px #ffb070)" }} />
              </>
            );
          })()}
        </svg>
      )}
      {ring > 0 && (
        <svg width="1920" height="1080" style={{ position: "absolute" }}>
          <circle cx={A.to[0]} cy={A.to[1]} r={20 + ring * 260} fill="none" stroke="#ffcf9a" strokeOpacity={0.7 * (1 - ring)} strokeWidth={3} />
        </svg>
      )}
      {flash > 0.01 && <AbsoluteFill style={{ background: `radial-gradient(circle at ${A.to[0] / 19.2}% ${A.to[1] / 10.8}%, rgba(255,240,215,1) 0%, rgba(255,150,90,0.5) 22%, rgba(0,0,0,0) 60%)`, opacity: flash }} />}
    </AbsoluteFill>
  );
};

/** Four "cosmic dials"; the last one (density ripples) is turned both ways. */
export const Knobs: React.FC<{ t: number }> = ({ t }) => {
  const K = timeline.knobs;
  const o = fade(t, K.in, K.out, 0.8, 0.8);
  if (o <= 0) return null;
  const [w0, w1] = K.wiggle;
  const turn = keyNum(t, K.turn as [number, number][]);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", justifyContent: "center", gap: 120 }}>
        {K.labels.map((l, i) => {
          const focus = i === 3 ? clamp((t - K.focus) / 0.5) : 0;
          const dim = t > K.focus ? (i === 3 ? 1 : 0.35) : 1;
          const wig = t > w0 && t < w1 ? 18 * Math.sin((t - w0) * 6 + i * 1.7) * Math.sin(((t - w0) / (w1 - w0)) * Math.PI) : 0;
          const ang = (i === 3 ? turn : 0) + wig;
          const ring = i === 3 ? `rgba(242,201,76,${0.35 + 0.65 * focus})` : "rgba(244,241,234,0.45)";
          return (
            <div key={l} style={{ textAlign: "center", opacity: dim }}>
              <svg width="120" height="120" viewBox="-60 -60 120 120">
                <circle r="46" fill="rgba(10,12,18,0.6)" stroke={ring} strokeWidth="2" />
                {Array.from({ length: 11 }, (_, k) => {
                  const a = (-135 + k * 27) * (Math.PI / 180);
                  return <line key={k} x1={Math.sin(a) * 52} y1={-Math.cos(a) * 52} x2={Math.sin(a) * 58} y2={-Math.cos(a) * 58} stroke="rgba(244,241,234,0.4)" strokeWidth="1.5" />;
                })}
                <line x1="0" y1="0" x2={Math.sin((ang * Math.PI) / 180) * 36} y2={-Math.cos((ang * Math.PI) / 180) * 36} stroke={i === 3 ? "#f2c94c" : "#f4f1ea"} strokeWidth="4" strokeLinecap="round" />
                <circle r="6" fill={i === 3 ? "#f2c94c" : "#f4f1ea"} />
              </svg>
              <div style={{ fontFamily: FONT_SANS, fontSize: 28, letterSpacing: 4, color: COLORS.text, marginTop: 8 }}>{l}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Energy-level ladder: the predicted level appears dashed, then lights up when found. */
export const Levels: React.FC<{ t: number }> = ({ t }) => {
  const L = timeline.levels;
  const o = fade(t, L.in, L.out, 0.6, 0.6);
  if (o <= 0) return null;
  const pred = easeOut(clamp((t - L.predict) / 0.8));
  const found = easeOut(clamp((t - L.found) / 0.6));
  const x = 1380, ys = [880, 720, 600, 470, 330];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        <line x1={x - 10} y1={300} x2={x - 10} y2={900} stroke="rgba(244,241,234,0.25)" strokeWidth={1.5} />
        {ys.map((y, i) => <line key={i} x1={x} y1={y} x2={x + 300} y2={y} stroke="rgba(244,241,234,0.45)" strokeWidth={2} />)}
        <line x1={x} y1={535} x2={x + 300 * pred} y2={535} stroke={found > 0 ? "#f2c94c" : "#f4f1ea"} strokeWidth={found > 0 ? 4 : 2.5} strokeDasharray={found > 0.5 ? "0" : "12 10"} style={found > 0 ? { filter: `drop-shadow(0 0 ${14 * found}px #f2c94c)` } : undefined} />
      </svg>
      <div style={{ position: "absolute", left: x + 320, top: 515, opacity: pred, fontFamily: FONT_SANS, fontSize: 26, color: found > 0.5 ? "#f2c94c" : COLORS.text, letterSpacing: 2, whiteSpace: "nowrap" }}>
        {found > 0.5 ? "实验证实 ✓" : "预言的能级？"}
      </div>
      <div style={{ position: "absolute", left: x, top: 250, fontFamily: FONT_SANS, fontSize: 24, color: COLORS.dim, letterSpacing: 4 }}>碳原子核的能级</div>
    </AbsoluteFill>
  );
};

export const Sun: React.FC<{ t: number }> = ({ t }) => {
  const S = timeline.sun;
  const o = fade(t, S.in, S.out, 1.2, 1.5);
  if (o <= 0) return null;
  const rise = easeOut(clamp((t - S.in) / 4));
  return <div style={{ position: "absolute", left: 1500, top: 420 - rise * 260, width: 180, height: 180, borderRadius: 90, opacity: o, background: "radial-gradient(circle, rgba(255,236,190,1) 0%, rgba(255,190,110,0.8) 35%, rgba(255,150,80,0) 70%)" }} />;
};

const Chip: React.FC<{ layer: string; size?: number }> = ({ layer, size = 24 }) => {
  const L = LAYERS[layer];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "3px 12px 3px 9px", borderRadius: 5, border: `1px solid ${L.color}66`, background: "rgba(10,12,18,0.6)", fontFamily: FONT_SANS, fontSize: size, color: "#e9e6df", letterSpacing: 2 }}>
      <span style={{ width: size * 0.45, height: size * 0.45, borderRadius: 2, background: L.color, boxShadow: `0 0 8px ${L.color}` }} />
      {L.zh}
    </span>
  );
};

/** The three views, as a centred row of cards (also recalled for the comment prompt). */
export const Views: React.FC<{ t: number }> = ({ t }) => {
  const V = timeline.views as { in: number; text: string; layers: string[] }[];
  const [a0, a1] = timeline.viewsAgain;
  const first = clamp((timeline.viewsOut - t) / 0.6) * (t >= V[0].in - 0.1 ? 1 : 0);
  const again = fade(t, a0, a1, 0.5, 0.6);
  const o = Math.max(first, again);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 120, opacity: o }}>
      <div style={{ display: "flex", gap: 48 }}>
        {V.map((v, i) => {
          const p = again > 0 ? easeOut(clamp((t - a0 - i * 0.15) / 0.4)) : easeOut(clamp((t - v.in) / 0.5));
          return (
            <div key={v.text} style={{ opacity: p, transform: `translateY(${(1 - p) * 16}px)`, width: 330, padding: "26px 0 24px", borderRadius: 10, border: "1px solid rgba(244,241,234,0.25)", background: "rgba(10,12,18,0.55)", textAlign: "center" }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 24, color: "#f2c94c", letterSpacing: 6 }}>{["一", "二", "三"][i]}</div>
              <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: COLORS.text, margin: "10px 0 16px" }}>{v.text}</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{v.layers.map((l) => <Chip key={l} layer={l} />)}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Quote: React.FC<{ t: number }> = ({ t }) => {
  const Q = timeline.quote;
  return <BigLines t={t} lines={Q.text.map((x, i) => [x, Q.in + i * 1.6] as [string, number])} size={76} out={Q.out} />;
};

export const Ending: React.FC<{ t: number }> = ({ t }) => {
  const E = timeline.ending;
  const [na, nb, nAt] = E.next as [string, string, number];
  const no = fade(t, nAt, E.out, 0.8, 0.6);
  return (
    <>
      <BigLines t={t} lines={[E.a as [string, number], E.b as [string, number]]} size={84} top={300} out={nAt - 0.1} />
      {no > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: no }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: "#f2c94c" }}>{na}</div>
            <div style={{ marginTop: 22, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 64, letterSpacing: 8, color: COLORS.text }}>{nb}</div>
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
);
