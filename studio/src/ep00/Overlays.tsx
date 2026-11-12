import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, easeOut, easeOutExpo, fade } from "../components/anim";
import { COLORS, FONT_SANS, FONT_SERIF } from "../components/theme";
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
