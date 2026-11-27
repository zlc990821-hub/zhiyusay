// 第 02 期：我问我妈：你怎么确定，请来的是佛祖？（2:3 竖版 1080×1620，约 4 分 25 秒）
// 时间全部来自配音时间轴 timeline.json（tools/ep02_tts.py 生成）；换成用户自己的录音时，重新生成时间轴即可，画面跟着走。
import { AbsoluteFill } from "remotion";
import { useCallback } from "react";
import TL from "./timeline.json";
import { Canvas, Clip, clamp, glow, rand, smooth, useFonts, useT, DISPLAY, SERIF, SANS, GOLD } from "../ep01/common";

export const W = 1080, H = 1620;
type Line = { start: number; end: number; text: string };
const LINES = (TL.items as any[]).filter((i) => i.type === "line") as Line[];
// 按序号取句子，并核对开头几个字，防止时间轴重新生成后对错句子
const L = (i: number, head: string): Line => {
  const l = LINES[i];
  if (!l || !l.text.startsWith(head)) throw new Error(`timeline 第 ${i} 句不是「${head}」，而是「${l?.text}」`);
  return l;
};
// 句子里某几个字出现的时刻（按字数比例估算）
const atWord = (l: Line, word: string) => {
  const k = l.text.indexOf(word);
  return l.start + ((l.end - l.start) * Math.max(0, k)) / l.text.length;
};
export const EP02_END = TL.duration + 3.2;
export const EP02_FRAMES = Math.round(EP02_END * 30);

const fin = (t: number, a: number, d = 0.4) => smooth((t - a) / d);
const win = (t: number, a: number, b: number, f = 0.4) => fin(t, a, f) * (1 - fin(t, b - f, f));

// ---------- 句子编号（核对文字） ----------
const S = {
  ask: L(0, "我问我妈"), crazy: L(1, "她看了我一眼"), next: L(2, "下个月"), better: L(3, "我妈说"),
  superstition: L(4, "你一定觉得"), three: L(5, "可这件事"), xuan: L(6, "而且"),
  look: L(7, "先看这个场面"), table: L(8, "一桌供品"), notworship: L(9, "这哪里像拜神"), guest: L(10, "这分明是在请客"),
  steps: L(11, "先请"), likeus: L(12, "跟我们求人"), durk: L(13, "一百多年前"), asked: L(14, "他问了一句话"), quote1: L(15, "神和社会"),
  family: L(16, "一个家族"), isgod: L(17, "那就是神"), guestgod: L(18, "所以中国人拜神"), renqing: L(19, "因为在中国人心里"),
  canbiz: L(20, "可是，请客"), harvard: L(21, "哈佛商学院"), ritual: L(22, "让人上台"), groupA: L(23, "她告诉一组人"), groupB: L(24, "告诉另一组人"),
  same: L(25, "动作，一模一样"), result: L(26, "结果"), believe: L(27, "同样的动作"), lab: L(28, "「信则灵」"),
  malin: L(29, "难怪人类学家"), control: L(30, "越是控制不了"), biz: L(31, "做生意"),
  psych: L(32, "可是，「心理作用」"), jung: L(33, "1959"), q: L(34, "记者问他"), a1: L(35, "他停了一下"), a2: L(36, "我知道"),
  why: L(37, "一个研究了一辈子"), cu: L(38, "荣格认为"), dwell: L(39, "神，就住在那里"),
  step: L(40, "那如果"), centuries: L(41, "几百年来"), msg: L(42, "每一次"), more: L(43, "发的人越多"), song: L(44, "那唱词"), door: L(45, "而信"),
  who: L(46, "所以，生意到底"), mutual: L(47, "也许答案是"), feedB: L(48, "人用香火"), feedP: L(49, "菩萨用一颗"),
  fewer: L(50, "可是，会唱鼓词"), stop: L(51, "如果有一天"), still: L(52, "那些被唱了"), yours: L(53, "你家"),
};
const GAP_DRUM = (TL.items as any[]).find((i) => i.type === "gap" && String(i.hint).includes("原声")).at as number;
const GAP_ECHO = (TL.items as any[]).find((i) => i.type === "gap" && String(i.hint).includes("余音")).at as number;

// ---------- 打底素材（2:3，已调色） ----------
type Bg = { src: string; a: number; b: number; dim?: number; start?: number; rate?: number; gray?: boolean; zoom?: [number, number] };
const C = (n: string) => `ep02/clips/${n}.mp4`;
const BEDS: Bg[] = [
  { src: C("guci_temple"), a: S.next.start - 0.3, b: GAP_DRUM + 0.2, dim: 0.5 },
  { src: C("guci_drum"), a: GAP_DRUM, b: S.xuan.end + 0.6, dim: 0.95 },
  { src: C("guci_temple"), a: S.look.start - 0.6, b: S.steps.start, dim: 0.62 },
  { src: C("incense_door"), a: S.steps.start - 0.3, b: S.durk.start, dim: 0.55 },
  { src: "ep01/clips/b_oldlib.mp4", a: S.durk.start - 0.3, b: S.family.start, dim: 0.32 },
  { src: C("incense_pot"), a: S.family.start - 0.3, b: S.guestgod.start, dim: 0.42 },
  { src: C("beads"), a: S.guestgod.start - 0.3, b: S.canbiz.start - 0.2, dim: 0.6 },
  { src: C("singer"), a: S.canbiz.start - 0.5, b: S.result.start, dim: 0.42 },
  { src: C("heart"), a: S.result.start - 0.3, b: S.malin.start, dim: 0.5 },
  { src: C("storm"), a: S.control.start - 0.3, b: S.biz.start, dim: 0.6 },
  { src: C("market"), a: S.biz.start - 0.3, b: S.psych.start, dim: 0.62 },
  { src: C("taperec"), a: S.psych.start - 0.5, b: S.why.start, dim: 0.5, gray: true },
  { src: "ep01/clips/b_milky.mp4", a: S.why.start - 0.3, b: S.step.start, dim: 0.7 },
  { src: C("city_night"), a: S.step.start - 0.3, b: S.msg.start, dim: 0.6 },
  { src: C("lantern_launch"), a: S.msg.start - 0.3, b: S.song.start, dim: 0.62 },
  { src: C("guci_drum"), a: S.song.start - 0.3, b: S.door.start, dim: 0.5, start: 12 },
  { src: C("buddha"), a: S.door.start - 0.3, b: S.who.start, dim: 0.55 },
  { src: C("guci_temple"), a: S.who.start - 0.3, b: GAP_ECHO, dim: 0.5, start: 1 },
  { src: C("guci_drum"), a: GAP_ECHO - 0.2, b: S.still.end + 0.3, dim: 0.85, start: 8, rate: 0.55 },
];
const Beds: React.FC<{ t: number }> = ({ t }) => (
  <>
    {BEDS.map((c, i) => {
      // 结尾那面鼓：慢慢暗下去，「最后一面鼓也停了」时几乎全黑
      const fade = c.src.endsWith("guci_drum.mp4") && c.rate ? 1 - 0.92 * smooth((t - S.stop.start) / (S.still.start - S.stop.start)) : 1;
      return (
        <Clip key={i} src={c.src} from={0} a={c.a} b={c.b} start={c.start ?? 0} rate={c.rate ?? 1} zoom={c.zoom ?? [1.0, 1.06]} fi={0.5} fo={0.5}
          style={{ filter: `brightness(${(c.dim ?? 0.6) * fade}) saturate(${c.gray ? 0 : 0.9})${c.gray ? " contrast(1.1)" : ""}` }} />
      );
    })}
  </>
);

// 内湖 / 外海：上下分屏
const SeaSplit: React.FC<{ t: number }> = ({ t }) => {
  const l = S.malin, a = l.start - 0.3, b = S.control.start + 0.2;
  if (t < a - 0.1 || t > b + 0.1) return null;
  const tIn = atWord(l, "内湖"), tOut = atWord(l, "外海");
  const lab = (text: string, sub: string, y: number, on: number, hot: boolean) => (
    <div style={{ position: "absolute", left: 60, top: y, opacity: on, transform: `translateY(${(1 - on) * 14}px)` }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 74, color: hot ? "#ffd29a" : GOLD, textShadow: "0 2px 18px rgba(0,0,0,0.9)" }}>{text}</div>
      <div style={{ fontFamily: SERIF, fontSize: 46, color: "#f3e6d0", marginTop: 6, textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>{sub}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: win(t, a, b, 0.4) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H / 2, overflow: "hidden" }}>
        <Clip src={C("calm_boats")} from={0} a={a} b={b} zoom={[1.0, 1.05]} style={{ filter: "brightness(0.7)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: H / 2, width: W, height: H / 2, overflow: "hidden" }}>
        <Clip src={C("trawler")} from={0} a={a} b={b} zoom={[1.05, 1.12]} style={{ filter: "brightness(0.62)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: H / 2 - 2, width: W, height: 4, background: "rgba(243,230,208,0.6)" }} />
      {lab("内湖", "风平浪静，从不做法", 330, fin(t, tIn), false)}
      {lab("外海", "风浪难测，一整套仪式", H / 2 + 60, fin(t, tOut), true)}
    </AbsoluteFill>
  );
};

// ---------- 版式：顶部问题、段落标签、字幕 ----------
const TitleBar: React.FC<{ t: number }> = ({ t }) => {
  const o = fin(t, 0.6, 0.8) * (1 - fin(t, S.yours.start - 0.4, 0.5));
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 420, background: "linear-gradient(rgba(0,0,0,0.78), rgba(0,0,0,0))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", opacity: o }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 56, color: "#f3e6d0", letterSpacing: 4, textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>我问我妈：</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 70, color: "#ffd29a", letterSpacing: 4, marginTop: 6, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>你怎么确定请来的是佛祖？</div>
      </div>
    </>
  );
};

const SECTIONS: { at: number; no: string; title: string; end: number }[] = [
  { at: S.look.start - 0.6, no: "第一层", title: "神，就是我们自己", end: S.canbiz.start - 0.3 },
  { at: S.canbiz.start - 0.5, no: "第二层", title: "信了，就真的灵", end: S.psych.start - 0.4 },
  { at: S.psych.start - 0.6, no: "第三层", title: "如果信，真的能聚成什么", end: S.who.start - 0.4 },
  { at: S.who.start - 0.6, no: "最后", title: "到底是谁帮的", end: GAP_ECHO },
];
const Section: React.FC<{ t: number }> = ({ t }) => (
  <>
    {SECTIONS.map((s, i) => {
      if (t < s.at - 0.1 || t > s.end + 0.2) return null;
      const big = fin(t, s.at, 0.35) * (1 - fin(t, s.at + 1.7, 0.4));
      const pin = fin(t, s.at + 1.9, 0.4) * (1 - fin(t, s.end - 0.3, 0.3));
      return (
        <div key={i}>
          {big > 0.01 ? (
            <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: `rgba(0,0,0,${0.45 * big})` }}>
              <div style={{ textAlign: "center", opacity: big, transform: `scale(${0.94 + 0.06 * big})` }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 96, color: "#ffd29a", letterSpacing: 18, textShadow: "0 0 40px rgba(255,170,90,0.5)" }}>{s.no}</div>
                <div style={{ width: 420, height: 3, margin: "18px auto 24px", background: "linear-gradient(90deg, transparent, rgba(255,210,154,0.9), transparent)" }} />
                <div style={{ fontFamily: DISPLAY, fontSize: 72, color: GOLD, letterSpacing: 6, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>{s.title}</div>
              </div>
            </AbsoluteFill>
          ) : null}
          {pin > 0.01 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 262, textAlign: "center", opacity: pin }}>
              <span style={{ display: "inline-block", padding: "6px 26px 8px", borderRadius: 30, background: "rgba(12,9,6,0.6)", border: "1.5px solid rgba(255,210,154,0.5)",
                fontFamily: SERIF, fontSize: 40, color: "#ffd29a", letterSpacing: 2 }}>{s.no}｜{s.title}</span>
            </div>
          ) : null}
        </div>
      );
    })}
  </>
);

// 字幕：一屏一句短句（≤15 字），长句在逗号处拆开，时间按字数分
type Chunk = { a: number; b: number; text: string };
const MAXC = 15;
const chunksOf = (l: Line): Chunk[] => {
  const parts = l.text.replace(/[。！]$/, "").split(/(?<=[，；：、])/).map((s) => s.trim()).filter(Boolean);
  const merged: string[] = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (last !== undefined && (last + p).replace(/[，；：、]$/, "").length <= MAXC) merged[merged.length - 1] = last + p;
    else merged.push(p);
  }
  const out: string[] = [];
  for (const m of merged) {
    if (m.replace(/[，；：、]$/, "").length <= MAXC) { out.push(m); continue; }
    const half = Math.ceil(m.length / 2); out.push(m.slice(0, half), m.slice(half));
  }
  const total = out.reduce((n, s) => n + s.length, 0);
  let acc = 0;
  return out.map((s) => {
    const a = l.start + ((l.end - l.start) * acc) / total; acc += s.length;
    const b = l.start + ((l.end - l.start) * acc) / total;
    return { a, b, text: s.replace(/[，；：、]$/, "") };
  });
};
// 画面上已经有大字的句子，不再出字幕
const NO_SUB = new Set([S.ask, S.crazy, S.quote1, S.a1, S.a2, S.mutual, S.still, S.yours]);
const CHUNKS: Chunk[] = LINES.filter((l) => !NO_SUB.has(l)).flatMap(chunksOf);
const Subs: React.FC<{ t: number }> = ({ t }) => {
  const c = CHUNKS.find((x) => t >= x.a - 0.05 && t < x.b + 0.12);
  return (
    <>
      <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 420, background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.72))" }} />
      {c ? (
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 150, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 58, color: "#fff", whiteSpace: "nowrap",
          letterSpacing: 2, textShadow: "0 0 3px #000, 0 2px 8px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.7)" }}>{c.text}</div>
      ) : null}
    </>
  );
};

// ---------- 通用：大字、人物档案卡、聊天气泡 ----------
const Big: React.FC<{ t: number; a: number; b: number; text: string; size?: number; y?: number; color?: string; font?: string; stamp?: boolean }> =
  ({ t, a, b, text, size = 100, y = 0, color = "#ffd29a", font = DISPLAY, stamp }) => {
  const o = win(t, a, b, 0.35);
  if (o <= 0.01) return null;
  const s = stamp ? 1.25 - 0.25 * smooth((t - a) / 0.25) : 0.97 + 0.03 * o;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `translateY(${y}px) scale(${s})`, opacity: o, textAlign: "center", padding: "0 60px", fontFamily: font, fontSize: size, lineHeight: 1.3, color,
        letterSpacing: 4, textShadow: "0 0 30px rgba(0,0,0,0.85), 0 2px 10px rgba(0,0,0,0.9)", whiteSpace: "pre-line" }}>{text}</div>
    </AbsoluteFill>
  );
};

const Dossier: React.FC<{ t: number; a: number; b: number; name: string; years: string; role: string; y?: number }> = ({ t, a, b, name, years, role, y = 520 }) => {
  const o = win(t, a, b, 0.45);
  if (o <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: y, opacity: o, transform: `translateY(${(1 - o) * 24}px)`, padding: "34px 40px",
      background: "rgba(14,11,8,0.78)", border: "1.5px solid rgba(255,210,154,0.45)", borderRadius: 18, display: "flex", alignItems: "center", gap: 34 }}>
      <svg width="170" height="200" viewBox="0 0 170 200">
        <defs><radialGradient id="pg" cx="50%" cy="38%" r="60%"><stop offset="0" stopColor="#ffd29a" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd29a" stopOpacity="0" /></radialGradient></defs>
        <rect x="2" y="2" width="166" height="196" rx="10" fill="rgba(255,210,154,0.06)" stroke="rgba(255,210,154,0.5)" />
        <circle cx="85" cy="78" r="70" fill="url(#pg)" />
        <circle cx="85" cy="72" r="34" fill="#1a1410" stroke="rgba(255,210,154,0.7)" strokeWidth="2" />
        <path d="M25 196 Q30 128 85 120 Q140 128 145 196 Z" fill="#1a1410" stroke="rgba(255,210,154,0.7)" strokeWidth="2" />
      </svg>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 68, color: "#ffd29a", letterSpacing: 4 }}>{name}</div>
        <div style={{ fontFamily: SERIF, fontSize: 40, color: GOLD, marginTop: 10 }}>{years}</div>
        <div style={{ fontFamily: SERIF, fontSize: 40, color: "rgba(243,230,208,0.8)", marginTop: 6 }}>{role}</div>
      </div>
    </div>
  );
};

const Bubble: React.FC<{ t: number; a: number; b: number; who: string; text: string; side: "l" | "r"; y: number }> = ({ t, a, b, who, text, side, y }) => {
  const o = win(t, a, b, 0.3);
  if (o <= 0.01) return null;
  const pop = 0.85 + 0.15 * smooth((t - a) / 0.22);
  return (
    <div style={{ position: "absolute", top: y, [side === "l" ? "left" : "right"]: 70, maxWidth: 960, opacity: o, transform: `scale(${pop})`,
      transformOrigin: side === "l" ? "left center" : "right center" } as React.CSSProperties}>
      <div style={{ fontFamily: SANS, fontSize: 40, color: "rgba(243,230,208,0.8)", marginBottom: 10, textAlign: side === "l" ? "left" : "right" }}>{who}</div>
      <div style={{ padding: "26px 36px", borderRadius: 26, fontFamily: SANS, fontWeight: 700, fontSize: 58, lineHeight: 1.35,
        background: side === "l" ? "#f3e6d0" : "#3b7d4f", color: side === "l" ? "#1a140e" : "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{text}</div>
    </div>
  );
};

// ---------- 代码叠画 ----------
// 开场：生意变好的小曲线
const drawBiz = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = win(t, atWord(S.better, "生意"), GAP_DRUM + 0.1, 0.4);
  if (a <= 0) return;
  const p = clamp((t - atWord(S.better, "生意")) / 1.6);
  const x0 = 240, y0 = 1060, w = 600, h = 300;
  ctx.save(); ctx.globalAlpha = a;
  ctx.strokeStyle = "rgba(243,230,208,0.35)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, y0 - h); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.stroke();
  ctx.strokeStyle = "#ffd29a"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  const pts = [[0, 0.15], [0.2, 0.1], [0.4, 0.05], [0.5, 0.18], [0.65, 0.45], [0.8, 0.7], [1, 0.95]];
  pts.forEach(([u, v], i) => { if (u > p) return; const X = x0 + u * w, Y = y0 - v * h; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
  ctx.font = `48px ${SERIF}`; ctx.fillStyle = "#f3e6d0"; ctx.fillText("生意", x0 + 10, y0 - h - 16);
  ctx.restore();
};
// 请 → 供 → 唱 → 求
const drawSteps = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = win(t, S.steps.start - 0.2, S.durk.start - 0.2, 0.4);
  if (a <= 0) return;
  const words = ["请", "供", "唱", "求"], cx = [190, 423, 657, 890], y = 760;
  words.forEach((w, i) => {
    const at = atWord(S.steps, i < 3 ? `先${w}` : "求事"), on = fin(t, at - 0.05, 0.25);
    if (on <= 0) return;
    ctx.save(); ctx.globalAlpha = a * on;
    glow(ctx, cx[i], y, 120, 0.35 * on);
    ctx.fillStyle = "rgba(14,11,8,0.82)"; ctx.strokeStyle = "rgba(255,210,154,0.9)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx[i], y, 88, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffd29a"; ctx.font = `96px ${DISPLAY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(w, cx[i], y + 4);
    if (i > 0) { ctx.strokeStyle = "rgba(255,210,154,0.8)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx[i - 1] + 96, y); ctx.lineTo(cx[i] - 96, y); ctx.stroke(); }
    ctx.restore();
  });
  const us = fin(t, S.likeus.start, 0.4) * a;
  if (us > 0) { ctx.save(); ctx.globalAlpha = us; ctx.fillStyle = "#f3e6d0"; ctx.font = `56px ${SERIF}`; ctx.textAlign = "center"; ctx.fillText("＝ 求人办事", 540, 960); ctx.restore(); }
};
// 一个家族、一个村子：规矩、人情、盼头汇成一个看不见的存在
const drawGather = (ctx: CanvasRenderingContext2D, t: number) => {
  const l = S.family, a = win(t, l.start - 0.2, S.guestgod.start, 0.5);
  if (a <= 0) return;
  const p = smooth((t - atWord(l, "加在一起")) / 4.5), god = smooth((t - S.isgod.start) / 0.8);
  const cx = 540, cy = 640;
  for (let i = 0; i < 140; i++) {
    const sx = 80 + rand(i, 1) * 920, sy = 900 + rand(i, 2) * 380;
    const k = smooth(clamp(p * 1.4 - rand(i, 3) * 0.4));
    const x = sx + (cx + (rand(i, 4) - 0.5) * 60 - sx) * k, y = sy + (cy + (rand(i, 5) - 0.5) * 60 - sy) * k;
    glow(ctx, x, y, 14, a * (0.55 + 0.45 * Math.sin(t * 3 + i)) * (1 - 0.6 * k));
  }
  ["规矩", "人情", "盼头"].forEach((w, i) => {
    const on = fin(t, atWord(l, w), 0.3) * (1 - smooth(p * 1.3));
    if (on <= 0) return;
    ctx.save(); ctx.globalAlpha = a * on; ctx.font = `64px ${DISPLAY}`; ctx.fillStyle = "#ffd29a"; ctx.textAlign = "center";
    ctx.fillText(w, 220 + i * 320, 1050 - i * 40); ctx.restore();
  });
  glow(ctx, cx, cy, 90 + 220 * p + 80 * god, a * (0.35 * p + 0.5 * god));
  if (god > 0) {
    ctx.save(); ctx.globalAlpha = a * god * 0.7; ctx.strokeStyle = "rgba(255,225,180,0.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy - 120, 60, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 150, cy + 220); ctx.quadraticCurveTo(cx - 140, cy - 40, cx, cy - 50); ctx.quadraticCurveTo(cx + 140, cy - 40, cx + 150, cy + 220); ctx.stroke();
    ctx.restore();
  }
};
// 五个怪动作，以及两组人
const RITUAL: [string, string][] = [["✎", "画下心情"], ["∴", "撒点盐"], ["5", "数到五"], ["◍", "揉成一团"], ["↘", "扔掉"]];
const drawRitual = (ctx: CanvasRenderingContext2D, t: number) => {
  const l = S.ritual, a = win(t, l.start, S.result.start - 0.1, 0.4);
  if (a <= 0) return;
  const keys = ["画下", "撒点盐", "数到五", "揉成", "扔掉"];
  const split = smooth((t - S.groupA.start) / 0.7);
  const drawCol = (x0: number, alpha: number, gold: boolean, onAll: boolean) => {
    RITUAL.forEach(([ic, w], i) => {
      const on = onAll ? 1 : fin(t, atWord(l, keys[i]) - 0.05, 0.3);
      if (on <= 0) return;
      const y = 560 + i * 150;
      ctx.save(); ctx.globalAlpha = a * alpha * on;
      ctx.fillStyle = "rgba(14,11,8,0.8)"; ctx.strokeStyle = gold ? "rgba(255,210,154,0.85)" : "rgba(200,200,200,0.6)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(x0, y - 56, split > 0 ? 400 : 640, 112, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = gold ? "#ffd29a" : "#cfcfcf"; ctx.font = `64px ${DISPLAY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(ic, x0 + 66, y + 2);
      ctx.textAlign = "left"; ctx.font = `52px ${SERIF}`; ctx.fillStyle = gold ? "#f3e6d0" : "#d6d6d6"; ctx.fillText(w, x0 + 130, y + 2);
      ctx.restore();
    });
  };
  if (split <= 0) drawCol(220, 1, true, false);
  else {
    drawCol(80 - 140 * (1 - split), 1, true, true);
    const bOn = fin(t, S.groupB.start, 0.4);
    drawCol(600, bOn, false, true);
    const lab = (x: number, text: string, on: number, gold: boolean) => {
      if (on <= 0) return; ctx.save(); ctx.globalAlpha = a * on; ctx.font = `60px ${DISPLAY}`; ctx.textAlign = "center"; ctx.fillStyle = gold ? "#ffd29a" : "#d6d6d6"; ctx.fillText(text, x, 450); ctx.restore();
    };
    lab(280, "「这是仪式」", split, true); lab(800, "「随便做做」", bOn, false);
    const eq = fin(t, S.same.start, 0.3);
    if (eq > 0) { ctx.save(); ctx.globalAlpha = a * eq; ctx.font = `120px ${DISPLAY}`; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("＝", 540, 860); ctx.restore(); }
  }
};
// 心跳：信的那组平稳下来，另一组依旧乱跳
const drawHeart = (ctx: CanvasRenderingContext2D, t: number) => {
  const l = S.result, a = win(t, l.start, S.believe.start + 0.3, 0.4);
  if (a <= 0) return;
  const calm = smooth((t - atWord(l, "心跳")) / 2.0);
  const row = (y: number, label: string, gold: boolean, settle: number) => {
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `52px ${DISPLAY}`; ctx.fillStyle = gold ? "#ffd29a" : "#d6d6d6"; ctx.fillText(label, 80, y - 200);
    ctx.strokeStyle = gold ? "#ffd29a" : "rgba(220,220,220,0.85)"; ctx.lineWidth = 6; ctx.beginPath();
    for (let x = 0; x <= 920; x += 6) {
      const ph = x * 0.05 - t * 6;
      const spike = Math.max(0, Math.sin(ph)) ** 18 * 160;
      const jitter = (Math.sin(x * 0.31 + t * 9) + Math.sin(x * 0.17 - t * 5)) * 22;
      const amp = 1 - 0.7 * settle;
      const Y = y - (spike * amp + jitter * amp * 0.6) * (gold ? 1 : 1.15);
      x ? ctx.lineTo(80 + x, Y) : ctx.moveTo(80, Y);
    }
    ctx.stroke(); ctx.restore();
  };
  row(700, "相信是仪式的那组", true, calm);
  row(1080, "「随便做做」的那组", false, 0);
  const good = fin(t, atWord(l, "唱得"), 0.4);
  if (good > 0) { ctx.save(); ctx.globalAlpha = a * good; ctx.font = `56px ${SERIF}`; ctx.fillStyle = "#ffd29a"; ctx.textAlign = "center"; ctx.fillText("心跳降下来，唱得更好", 540, 1240); ctx.restore(); }
};
// 集体无意识：每个人头顶向下连到同一片光海
const drawUnconscious = (ctx: CanvasRenderingContext2D, t: number) => {
  const l = S.cu, a = win(t, S.why.start + 0.3, S.step.start, 0.6);
  if (a <= 0) return;
  const share = smooth((t - atWord(l, "所有人共享")) / 1.5), god = smooth((t - S.dwell.start) / 1.0);
  const sea = 1080;
  for (let i = 0; i < 9; i++) {
    const x = 110 + i * 107, y = 560 + Math.sin(i * 1.7) * 30;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(20,16,12,0.9)"; ctx.strokeStyle = "rgba(255,210,154,0.75)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 40, y + 90); ctx.quadraticCurveTo(x, y + 20, x + 40, y + 90); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (share > 0) {
      const k = clamp(share * 1.2 - i * 0.02);
      ctx.strokeStyle = `rgba(255,210,154,${0.55 * k})`; ctx.setLineDash([6, 10]);
      ctx.beginPath(); ctx.moveTo(x, y + 95); ctx.lineTo(x + (540 - x) * 0.25 * k, y + 95 + (sea - y - 95) * k); ctx.stroke();
    }
    ctx.restore();
  }
  const g = ctx.createLinearGradient(0, sea - 80, 0, sea + 160);
  g.addColorStop(0, "rgba(255,200,130,0)"); g.addColorStop(0.5, `rgba(255,200,130,${0.45 * share * a})`); g.addColorStop(1, "rgba(255,200,130,0)");
  ctx.fillStyle = g; ctx.fillRect(0, sea - 80, W, 240);
  if (share > 0) { ctx.save(); ctx.globalAlpha = a * share; ctx.font = `60px ${DISPLAY}`; ctx.fillStyle = "#ffd29a"; ctx.textAlign = "center"; ctx.fillText("集体无意识", 540, sea + 150); ctx.restore(); }
  if (god > 0) glow(ctx, 540, sea + 10, 80 + 160 * god, a * god * 0.9);
};
// 光点：从各家各户升起，汇成一团光
const drawPrayers = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = win(t, S.centuries.start - 0.3, S.song.start + 0.3, 0.5);
  if (a <= 0) return;
  const t0 = S.centuries.start, cx = 540, cy = 520;
  const more = smooth((t - S.more.start) / 3.5);
  const N = 520;
  let arrived = 0;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < N; i++) {
    const birth = t0 + rand(i, 1) * 12 * (1 - 0.5 * more);
    const life = 3.2 + rand(i, 2) * 2.0;
    const u = (t - birth) / life;
    if (u < 0) continue;
    if (u >= 1) { arrived++; continue; }
    const k = smooth(u);
    const sx = 60 + rand(i, 3) * 960, sy = 1250 + rand(i, 4) * 300;
    const x = sx + (cx - sx) * k + Math.sin(u * 7 + i) * 18 * (1 - k), y = sy + (cy - sy) * k;
    ctx.fillStyle = `rgba(255,${200 + Math.round(40 * rand(i, 6))},150,${0.9 * a * (0.4 + 0.6 * k)})`;
    ctx.beginPath(); ctx.arc(x, y, 3 + 2 * rand(i, 5), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  const r = 40 + 200 * (arrived / N) + 40 * more;
  glow(ctx, cx, cy, r, a * (0.3 + 0.6 * (arrived / N) + 0.2 * more));
};
// 唱词：声音一圈一圈往上传
const drawSong = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = win(t, S.song.start - 0.2, S.door.start, 0.3);
  if (a <= 0) return;
  for (let k = 0; k < 6; k++) {
    const ph = ((t - S.song.start) * 0.55 + k / 6) % 1;
    ctx.strokeStyle = `rgba(255,210,154,${0.6 * a * (1 - ph)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(540, 1050 - ph * 700, 120 + ph * 380, 40 + ph * 120, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  }
};
// 门：两扇门向两边打开，门后是光
const drawDoor = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = win(t, S.door.start - 0.2, S.who.start - 0.2, 0.4);
  if (a <= 0) return;
  const open = smooth((t - atWord(S.door, "打开")) / 1.6);
  const x0 = 290, y0 = 420, w = 500, h = 820;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(540, 830, 20, 540, 830, 520);
  g.addColorStop(0, `rgba(255,230,190,${0.95 * open})`); g.addColorStop(1, "rgba(255,190,120,0)");
  ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = "rgba(18,12,8,0.96)"; ctx.strokeStyle = "rgba(255,210,154,0.8)"; ctx.lineWidth = 3;
  const half = w / 2, d = half * open * 0.92;
  ctx.fillRect(x0 - d, y0, half, h); ctx.strokeRect(x0 - d, y0, half, h);
  ctx.fillRect(x0 + half + d, y0, half, h); ctx.strokeRect(x0 + half + d, y0, half, h);
  ctx.strokeStyle = "rgba(255,210,154,0.9)"; ctx.lineWidth = 4; ctx.strokeRect(x0 - 12, y0 - 12, w + 24, h + 12);
  ctx.restore();
};
// 互相：人用香火养菩萨，菩萨用定下来的心养人
const drawMutual = (ctx: CanvasRenderingContext2D, t: number) => {
  const a = win(t, S.mutual.end + 0.4, GAP_ECHO, 0.5);
  if (a <= 0) return;
  const up = smooth((t - S.feedB.start) / 1.2), down = smooth((t - S.feedP.start) / 1.2);
  const cx = 540, cy = 780, R = 300;
  ctx.save(); ctx.globalAlpha = a; ctx.lineWidth = 8; ctx.lineCap = "round";
  ctx.font = `76px ${DISPLAY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffd29a"; ctx.fillText("菩萨", cx, cy - R - 10); ctx.fillText("人", cx, cy + R + 10);
  if (up > 0) {
    ctx.strokeStyle = "rgba(255,210,154,0.95)"; ctx.beginPath(); ctx.arc(cx, cy, R - 60, Math.PI * 0.62, Math.PI * 0.62 + Math.PI * 0.76 * up); ctx.stroke();
    ctx.font = `50px ${SERIF}`; ctx.fillStyle = "#f3e6d0"; ctx.textAlign = "center"; ctx.globalAlpha = a * up; ctx.fillText("香火", cx - 110, cy - 34); ctx.fillText("唱词 ↑", cx - 110, cy + 34); ctx.globalAlpha = a;
  }
  if (down > 0) {
    ctx.strokeStyle = "rgba(255,240,215,0.95)"; ctx.beginPath(); ctx.arc(cx, cy, R - 60, -Math.PI * 0.38, -Math.PI * 0.38 + Math.PI * 0.76 * down); ctx.stroke();
    ctx.font = `50px ${SERIF}`; ctx.fillStyle = "#f3e6d0"; ctx.textAlign = "center"; ctx.globalAlpha = a * down; ctx.fillText("定下来的", cx + 110, cy - 34); ctx.fillText("心 ↓", cx + 110, cy + 34); ctx.globalAlpha = a;
  }
  ctx.restore();
};
// 胶片颗粒与暗角
const drawGrain = (ctx: CanvasRenderingContext2D, t: number) => {
  const v = ctx.createRadialGradient(540, 810, 420, 540, 810, 1150);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const f = Math.round(t * 30); ctx.globalAlpha = 0.05;
  for (let i = 0; i < 1800; i++) { ctx.fillStyle = rand(i + f, 11) > 0.5 ? "#fff" : "#000"; ctx.fillRect(rand(i + f * 977, 3) * W, rand(i + f * 613, 7) * H, 2, 2); }
  ctx.globalAlpha = 1;
};

export const Ep02: React.FC = () => {
  const ready = useFonts([`"Source Han Serif CN for Display"`, `"Noto Serif SC"`, `"Noto Sans SC"`],
    "我问我妈你怎么确定请来的是佛祖她看了一眼神经病吧第一二三层最后神就是们自己信了真灵如果能聚成什么到底谁帮请供唱求人办事规矩情盼头画下心随便做撒点盐数到五揉团扔掉这仪式相组跳降来得更好内湖外海风平浪静从不做法难测一整套集体无意识香火定菩萨生意涂尔干布鲁克斯马林诺夫斯基荣格年社会学之父法国哈佛商院心理家波兰人类瑞士采访你相上帝吗不需要知道还在吗灵过的事离心力所以继续探索｜＝「」：？，0123456789–BCF《》");
  const t = useT(0);
  const draw = useCallback((ctx: CanvasRenderingContext2D, tt: number) => {
    drawBiz(ctx, tt); drawSteps(ctx, tt); drawGather(ctx, tt); drawRitual(ctx, tt); drawHeart(ctx, tt);
    drawUnconscious(ctx, tt); drawPrayers(ctx, tt); drawSong(ctx, tt); drawDoor(ctx, tt); drawMutual(ctx, tt);
  }, []);
  const outro = fin(t, S.yours.end + 0.4, 0.6);
  return (
    <AbsoluteFill style={{ background: "#060505" }}>
      <Beds t={t} />
      <SeaSplit t={t} />
      {ready ? <Canvas t={t} draw={draw} w={W} h={H} /> : null}

      {/* 开场：黑底，问与答 */}
      <Bubble t={t} a={S.ask.start} b={S.next.start + 0.6} who="我" text="你怎么确定，请来的是佛祖？" side="r" y={560} />
      <Bubble t={t} a={S.crazy.start + 1.2} b={S.next.start + 0.6} who="我妈" text="你神经病吧。" side="l" y={860} />
      <Big t={t} a={S.superstition.start + 1.2} b={S.three.start + 0.3} text="迷信？" size={180} stamp />
      <Dossier t={t} a={atWord(S.three, "社会学")} b={S.xuan.end + 0.4} name="社会学之父" years="研究过" role="" y={430} />
      <Dossier t={t} a={atWord(S.three, "哈佛")} b={S.xuan.end + 0.4} name="哈佛心理学家" years="做过实验" role="" y={720} />
      <Dossier t={t} a={atWord(S.three, "最神秘")} b={S.xuan.end + 0.4} name="？？？" years="心理学史上最神秘的人" role="" y={1010} />

      {/* 第一层 */}
      <Big t={t} a={S.guest.start} b={S.steps.start} text="这分明是在请客" size={104} />
      <Dossier t={t} a={S.durk.start + 0.3} b={S.quote1.start - 0.1} name="涂尔干" years="1858 – 1917" role="法国，社会学之父" />
      <Big t={t} a={S.quote1.start - 0.1} b={S.family.start} text={"神和社会\n难道不就是一回事吗？"} size={92} />
      <Big t={t} a={S.isgod.start} b={S.guestgod.start} text="那就是神" size={120} y={-300} />
      <Big t={t} a={atWord(S.renqing, "天上")} b={S.canbiz.start - 0.3} text="天上，也讲人情" size={110} />

      {/* 第二层 */}
      <Dossier t={t} a={S.harvard.start + 0.2} b={S.ritual.start} name="布鲁克斯" years="哈佛商学院" role="2016 年的实验" />
      <Big t={t} a={atWord(S.believe, "你信")} b={S.lab.start} text={"你信，它就灵\n你不信，它就不灵"} size={88} />
      <Big t={t} a={S.lab.start} b={S.malin.start - 0.2} text="信则灵" size={190} stamp />
      <Dossier t={t} a={S.malin.start + 0.2} b={atWord(S.malin, "内湖") - 0.2} name="马林诺夫斯基" years="1884 – 1942" role="波兰裔人类学家" />
      <Big t={t} a={S.control.start} b={S.biz.start} text={"越是控制不了\n越需要信"} size={100} />
      <Big t={t} a={S.biz.start} b={S.psych.start - 0.2} text="做生意，就是出外海" size={92} />

      {/* 第三层 */}
      <Big t={t} a={S.psych.start + 0.2} b={S.jung.start} text="「心理作用」？" size={110} />
      <Dossier t={t} a={S.jung.start} b={S.q.start} name="荣格" years="1875 – 1961" role="瑞士心理学家｜1959 年 BBC 采访" />
      <Bubble t={t} a={S.q.start + 0.6} b={S.a2.end + 0.8} who="记者" text="你相信上帝吗？" side="l" y={520} />
      <Bubble t={t} a={S.a1.start + 1.0} b={S.a2.end + 0.8} who="荣格" text="我不需要相信。" side="r" y={820} />
      <Big t={t} a={S.a2.start} b={S.a2.end + 0.8} text="我知道。" size={150} y={360} />
      <Big t={t} a={S.dwell.start} b={S.step.start} text="神，就住在那里" size={96} y={120} />

      {/* 最后 */}
      <Big t={t} a={S.mutual.start + 0.2} b={S.mutual.end + 0.5} text="互相" size={200} />
      <Big t={t} a={S.still.start} b={S.still.end + 0.8} text={"那些被唱了几百年的菩萨\n还在吗？"} size={74} />
      <Big t={t} a={S.yours.start} b={EP02_END - 2.4} text={"你家\n有没有灵过的事？"} size={110} />

      <TitleBar t={t} />
      <Section t={t} />
      <Subs t={t} />
      {ready ? <Canvas t={t} draw={drawGrain} w={W} h={H} /> : null}

      {/* 片尾：离心力 */}
      {outro > 0.01 ? (
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230, opacity: outro }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 72, color: "#ffd29a", letterSpacing: 24 }}>离心力</div>
          <div style={{ fontFamily: SERIF, fontSize: 40, color: GOLD, letterSpacing: 10, marginTop: 14 }}>不知道，所以继续探索</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
