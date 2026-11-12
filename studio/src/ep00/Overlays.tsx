import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, easeOut, easeOutExpo, fade } from "../components/anim";
import { COLORS, FONT_SANS, FONT_SERIF, LAYERS } from "../components/theme";
import timeline from "../../../episodes/EP00_人类/timeline.json";

/** Element symbols drifting near the star; flung outward by the supernova. */
export const Elements: React.FC<{ t: number }> = ({ t }) => {
  const boom = timeline.flash;
  return (
    <AbsoluteFill>
      {timeline.elements.map((e) => {
        const o = fade(t, e.in, e.out + 1.2, 0.6, 1.2);
        if (o <= 0) return null;
        const fly = easeOutExpo(clamp((t - boom) / 1.6)) * 1.8;
        const x = 0.5 + (e.x - 0.5) * (1 + fly);
        const y = 0.5 + (e.y - 0.5) * (1 + fly);
        const sc = 0.9 + 0.1 * easeOut(clamp((t - e.in) / 0.6)) + fly * 0.3;
        return (
          <div key={e.sym} style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%,-50%) scale(${sc})`, opacity: o * 0.92, textAlign: "center", color: COLORS.text }}>
            <div style={{ fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 64, letterSpacing: 2, textShadow: "0 0 24px rgba(255,200,140,0.6)" }}>{e.sym}</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 22, color: COLORS.dim, letterSpacing: 6, marginTop: -6 }}>{e.zh}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{ t: number }> = ({ t }) => {
  const d = t - timeline.flash;
  const o = d < 0 ? clamp(1 + d / 0.08) * 0.9 : 0.9 * Math.exp(-d * 4);
  if (o < 0.005) return null;
  return <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, rgba(255,240,215,1) 0%, rgba(255,170,110,0.6) 25%, rgba(0,0,0,0) 65%)", opacity: o }} />;
};

export const Counter: React.FC<{ t: number }> = ({ t }) => {
  const [a, b] = timeline.counter;
  const o = fade(t, a - 0.2, b + 1.6, 0.4, 0.8);
  if (o <= 0) return null;
  const v = Math.round(13.8e9 * easeOut(clamp((t - a) / (b - a))) / 1e6) * 1e6;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 96, opacity: o }}>
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 72, color: COLORS.text, letterSpacing: 4, fontVariantNumeric: "tabular-nums", textShadow: "0 0 30px rgba(120,170,255,0.45)" }}>
        {v.toLocaleString("en-US")}
        <span style={{ fontSize: 40, marginLeft: 16, color: COLORS.dim }}>年</span>
      </div>
    </AbsoluteFill>
  );
};

/** The question, then the episode title — both drawn by hand as big type (subtitle for that line is hidden). */
export const QuestionAndTitle: React.FC<{ t: number }> = ({ t }) => {
  const q = timeline.question, ti = timeline.title;
  const chars = Array.from(q.text);
  const qOut = clamp((t - q.out) / 0.6);
  const titleIn = easeOut(clamp((t - ti.in - 0.3) / 1.0));
  const titleO = fade(t, ti.in + 0.3, ti.out, 1.0, 0.6);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {t >= q.in && qOut < 1 && (
        <div style={{ position: "absolute", fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 104, letterSpacing: 18, color: COLORS.text, opacity: 1 - qOut, transform: `translateY(${-qOut * 30}px)`, textShadow: "0 0 40px rgba(0,0,0,0.9)" }}>
          {chars.map((c, i) => {
            const o = easeOut(clamp((t - q.in - i * 0.09) / 0.45));
            return <span key={i} style={{ opacity: o, filter: `blur(${(1 - o) * 8}px)` }}>{c}</span>;
          })}
        </div>
      )}
      {titleO > 0 && (
        <div style={{ position: "absolute", textAlign: "center", opacity: titleO }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 30, letterSpacing: 14, color: "#f2c94c", opacity: 0.9, transform: `translateY(${(1 - titleIn) * 12}px)` }}>{ti.kicker}</div>
          <div style={{ marginTop: 26, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 92, letterSpacing: 10, color: COLORS.text, transform: `translateY(${(1 - titleIn) * 20}px)`, textShadow: "0 0 50px rgba(0,0,0,0.9)" }}>{ti.text}</div>
          <div style={{ margin: "34px auto 0", height: 1, width: 520 * titleIn, background: "linear-gradient(90deg, transparent, rgba(244,241,234,0.7), transparent)" }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
);

type Callout = { in: number; out: number; big: string; small: string; x?: number; y?: number; gold?: boolean; large?: boolean };

/** Key numbers / terms, in sync with the narration. */
export const Callouts: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    {(timeline.callouts as Callout[]).map((c) => {
      const o = fade(t, c.in, c.out, 0.45, 0.45);
      if (o <= 0) return null;
      const rise = (1 - easeOut(clamp((t - c.in) / 0.6))) * 14;
      return (
        <div key={c.in + c.big} style={{ position: "absolute", left: `${(c.x ?? 0.5) * 100}%`, top: `${(c.y ?? 0.15) * 100}%`, transform: `translate(-50%, ${rise}px)`, textAlign: "center", opacity: o, whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: c.large ? 96 : 68, letterSpacing: c.large ? 16 : 4, color: c.gold ? "#ffd27a" : COLORS.text, textShadow: "0 0 30px rgba(0,0,0,0.85)" }}>{c.big}</div>
          <div style={{ fontFamily: FONT_SANS, fontSize: c.large ? 28 : 26, letterSpacing: 4, color: COLORS.dim, marginTop: 8, textShadow: "0 0 12px rgba(0,0,0,0.9)" }}>{c.small}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

/** A thin red beam entering the eye, then a red wash for "seeing red". */
export const RedLight: React.FC<{ t: number }> = ({ t }) => {
  const { beam, wash } = timeline.redLight;
  const grow = easeOut(clamp((t - beam[0]) / 1.2));
  const bo = fade(t, beam[0], beam[1] + 0.8, 0.2, 0.8);
  const wo = fade(t, wash[0], wash[1], 1.2, 2.0);
  return (
    <AbsoluteFill>
      {bo > 0 && (
        <svg width="1920" height="1080" style={{ position: "absolute", opacity: bo }}>
          <defs>
            <linearGradient id="beam" x1="0" x2="1">
              <stop offset="0" stopColor="#ff3b30" stopOpacity="0" />
              <stop offset="1" stopColor="#ff5a4a" stopOpacity="1" />
            </linearGradient>
          </defs>
          <line x1={0} y1={250} x2={960 * grow} y2={250 + (472 - 250) * grow} stroke="url(#beam)" strokeWidth={5} style={{ filter: "drop-shadow(0 0 10px #ff3b30)" }} />
        </svg>
      )}
      {wo > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, rgba(255,40,30,0.55) 0%, rgba(160,10,10,0.25) 40%, rgba(0,0,0,0) 75%)", opacity: wo }} />}
    </AbsoluteFill>
  );
};

type Answer = { in: number; text: string; layers: string[]; note?: string; x: number; y: number };

const Chip: React.FC<{ layer: string; size?: number }> = ({ layer, size = 22 }) => {
  const L = LAYERS[layer];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "3px 12px 3px 9px", borderRadius: 5, border: `1px solid ${L.color}66`, background: "rgba(10,12,18,0.6)", fontFamily: FONT_SANS, fontSize: size, color: "#e9e6df", letterSpacing: 2 }}>
      <span style={{ width: size * 0.45, height: size * 0.45, borderRadius: 2, background: L.color, boxShadow: `0 0 8px ${L.color}` }} />
      {L.zh}
    </span>
  );
};

/** Five answers around the human figure, each ringed in its layer colour. */
export const Answers: React.FC<{ t: number }> = ({ t }) => {
  const out = timeline.answersOut;
  const all = timeline.answers as Answer[];
  const groupO = clamp((out + 0.8 - t) / 0.8);
  if (t < all[0].in - 0.2 || groupO <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: groupO }}>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        {all.map((a, i) => {
          const p = easeOut(clamp((t - a.in) / 1.4));
          if (p <= 0) return null;
          const rx = 300 + i * 70, ry = 150 + i * 34;
          const c = LAYERS[a.layers[0]].color;
          const circ = Math.PI * (rx + ry) * 1.05;
          return <ellipse key={i} cx={960} cy={500} rx={rx} ry={ry} fill="none" stroke={c} strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} transform={`rotate(${-12 + i * 6} 960 500)`} />;
        })}
      </svg>
      {all.map((a) => {
        const o = easeOut(clamp((t - a.in) / 0.6));
        if (o <= 0) return null;
        const left = a.x < 0.5;
        return (
          <div key={a.text} style={{ position: "absolute", left: `${a.x * 100}%`, top: `${a.y * 100}%`, transform: `translate(-50%,-50%) translateX(${(1 - o) * (left ? -20 : 20)}px)`, opacity: o, textAlign: "center" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10 }}>{a.layers.map((l) => <Chip key={l} layer={l} />)}</div>
            <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 44, letterSpacing: 4, color: a.layers[0] === "F" ? "#ffb3ae" : COLORS.text, textShadow: "0 0 20px rgba(0,0,0,0.9)", whiteSpace: "nowrap" }}>{a.text}</div>
            {a.note && <div style={{ fontFamily: FONT_SANS, fontSize: 24, color: "#ff8a82", letterSpacing: 4, marginTop: 6, opacity: easeOut(clamp((t - a.in - 3.4) / 0.5)) }}>{a.note}</div>}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** The road of the series (stations) and the six layers. */
export const Roadmap: React.FC<{ t: number }> = ({ t }) => {
  const R = timeline.roadmap;
  const o = fade(t, R.in, R.out, 0.8, 1.2);
  if (o <= 0) return null;
  const st = R.stations as [string, number][];
  const lineP = easeOut(clamp((t - R.in) / 2.0)) * 0.2 + 0.8 * clamp((t - st[0][1] + 0.4) / (st[st.length - 1][1] - st[0][1] + 0.4));
  const x0 = 260, x1 = 1660, y = 400;
  const glow = clamp((t - R.glow) / 0.6);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        <line x1={x0} y1={y} x2={x0 + (x1 - x0) * lineP} y2={y} stroke="rgba(244,241,234,0.45)" strokeWidth={1.5} />
      </svg>
      {st.map(([name, at], i) => {
        const p = easeOut(clamp((t - at) / 0.5));
        const x = x0 + ((x1 - x0) * i) / (st.length - 1);
        return (
          <div key={name} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", opacity: p, textAlign: "center" }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#f4f1ea", margin: "0 auto", boxShadow: "0 0 14px rgba(255,230,190,0.9)", transform: `scale(${0.5 + 0.5 * p})` }} />
            <div style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)", fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 40, letterSpacing: 4, color: COLORS.text, whiteSpace: "nowrap" }}>{name}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 600, width: "100%", display: "flex", justifyContent: "center", gap: 22 }}>
        {(R.layers as [string, number][]).map(([l, at]) => {
          const p = easeOut(clamp((t - at) / 0.5));
          return (
            <div key={l} style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px) scale(${1 + 0.06 * glow})`, filter: glow > 0 ? `drop-shadow(0 0 ${10 * glow}px ${LAYERS[l].color})` : undefined }}>
              <Chip layer={l} size={36} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** "不知道，/ 所以，继续探索。" and the series mark. */
export const Ending: React.FC<{ t: number }> = ({ t }) => {
  const E = timeline.ending;
  const [ta, aAt] = E.a as [string, number];
  const [tb, bAt] = E.b as [string, number];
  const all = clamp((E.out - t) / 1.6);
  const textsOut = clamp((E.mark - 0.2 - t) / 0.8);
  const line = (txt: string, at: number, size: number) => (
    <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: size, letterSpacing: 18, color: COLORS.text, textShadow: "0 0 40px rgba(0,0,0,0.9)" }}>
      {Array.from(txt).map((c, i) => {
        const o = easeOut(clamp((t - at - i * 0.08) / 0.5));
        return <span key={i} style={{ opacity: o, filter: `blur(${(1 - o) * 8}px)` }}>{c}</span>;
      })}
    </div>
  );
  if (t < aAt - 0.1) return null;
  const mo = easeOut(clamp((t - E.mark) / 1.0)) * all;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 200, textAlign: "center", opacity: textsOut, display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}>
        {line(ta, aAt, 84)}
        {line(tb, bAt, 84)}
      </div>
      <div style={{ position: "absolute", textAlign: "center", opacity: mo, top: 790 }}>
        <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 52, letterSpacing: 22, color: COLORS.text }}>天元纪元</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 24, letterSpacing: 10, color: COLORS.dim, marginTop: 14 }}>人类究竟是什么？</div>
      </div>
    </AbsoluteFill>
  );
};
