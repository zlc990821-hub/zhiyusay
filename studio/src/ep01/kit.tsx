// 2026-11-19 改版的共用组件：素材打底、段落标题、线索清单
// 原则：画面永远有真实素材；代码只做叠加（标注、动效、文字）。
import { AbsoluteFill } from "remotion";
import { Clip, clamp, smooth, DISPLAY, SERIF, SANS, GOLD } from "./common";

const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);

// ---------- 素材打底 ----------
// 一串背景素材，按时间排；相邻两段重叠 xf 秒做叠化。dim：亮度（0–1），blur：虚化像素
export type BedClip = { src: string; a: number; b: number; start?: number; rate?: number; dim?: number; blur?: number; zoom?: [number, number]; fit?: "cover" | "contain"; sat?: number };
export const Bed: React.FC<{ from: number; clips: BedClip[]; xf?: number }> = ({ from, clips, xf = 0.5 }) => (
  <>
    {clips.map((c, i) => (
      <Clip key={i} src={c.src} from={from} a={c.a} b={c.b} start={c.start ?? 0} rate={c.rate ?? 1} zoom={c.zoom ?? [1.0, 1.06]} fit={c.fit}
        fi={i === 0 ? 0.6 : xf} fo={i === clips.length - 1 ? 0.6 : xf}
        style={{ filter: `brightness(${c.dim ?? 0.55}) saturate(${c.sat ?? 0.85})${c.blur ? ` blur(${c.blur}px)` : ""}` }} />
    ))}
  </>
);

// 画面中间压暗（放文字、清单时用），不完全遮住素材
export const Veil: React.FC<{ t: number; a: number; b: number; k?: number }> = ({ t, a, b, k = 0.45 }) => {
  const o = fin(t, a, 0.5) * (1 - fin(t, b - 0.5, 0.5));
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(8,6,5,${k}) 0%, rgba(8,6,5,${k * 0.7}) 60%, rgba(0,0,0,${k * 0.9}) 100%)`, opacity: o }} />;
};

// ---------- 段落标题：段首大标题卡 → 缩到左上角常驻 ----------
export const Chapter: React.FC<{ t: number; no: string; title: string; at: number; end: number; hideCorner?: (t: number) => boolean }> = ({ t, no, title, at, end, hideCorner }) => {
  const big = fin(t, at, 0.5) * (1 - fin(t, at + 2.6, 0.45));
  const line = smooth((t - at - 0.2) / 0.9);
  const corner = fin(t, at + 2.8, 0.5) * (1 - fin(t, end - 0.4, 0.4)) * (hideCorner && hideCorner(t) ? 0 : 1);
  return (
    <>
      {big > 0.001 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: `rgba(6,5,4,${0.5 * big})` }}>
          <div style={{ opacity: big, transform: `translateY(${(1 - big) * 16}px)`, textAlign: "center" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 150, color: "#f6cf94", letterSpacing: 16, textShadow: "0 0 40px rgba(255,170,90,0.5)" }}>{no}</div>
            <div style={{ width: 640 * line, height: 3, background: "linear-gradient(90deg, rgba(231,184,115,0), rgba(231,184,115,0.9), rgba(231,184,115,0))", margin: "8px auto 26px" }} />
            <div style={{ fontFamily: DISPLAY, fontSize: 88, color: GOLD, letterSpacing: 10, textShadow: "0 0 26px rgba(0,0,0,0.9)" }}>{title}</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {corner > 0.001 ? (
        <div style={{ position: "absolute", left: 50, top: 38, opacity: corner, display: "flex", alignItems: "center", gap: 16, padding: "8px 24px 10px",
          borderRadius: 32, background: "rgba(10,8,6,0.55)", border: "1.5px solid rgba(231,184,115,0.45)" }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 46, color: "#f6cf94" }}>{no}</span>
          <span style={{ fontFamily: SERIF, fontSize: 46, color: GOLD, letterSpacing: 2 }}>{title}</span>
        </div>
      ) : null}
    </>
  );
};

// ---------- 线索清单：段尾整齐罗列 ----------
// kind：clue 线索 / find 发现（更醒目）/ ask 留下的问题
export type ClueItem = { text: string; at: number; kind?: "clue" | "find" | "ask"; crackAt?: number; dimAt?: number };
export const ClueList: React.FC<{ t: number; a: number; b: number; items: ClueItem[]; title?: string; top?: number }> = ({ t, a, b, items, title = "线索清单", top = 150 }) => {
  const o = fin(t, a, 0.6) * (1 - fin(t, b - 0.6, 0.6));
  if (o <= 0.001) return null;
  const shown = items.filter((it) => t >= it.at - 0.01);
  const newest = shown.length ? Math.max(...shown.map((it) => it.at)) : -1;
  let n = 0;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 420, width: 1080, top, padding: "30px 46px 34px", borderRadius: 20, background: "rgba(14,11,8,0.72)",
        border: "1.5px solid rgba(231,184,115,0.4)", boxShadow: "0 30px 90px rgba(0,0,0,0.6)", transform: `translateY(${(1 - o) * 20}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: "#f6cf94", boxShadow: "0 0 18px rgba(255,190,110,0.9)" }} />
          <div style={{ fontFamily: SERIF, fontSize: 48, color: "#f6cf94", letterSpacing: 6 }}>{title}</div>
        </div>
        {items.map((it, i) => {
          const k = fin(t, it.at, 0.45);
          if (k <= 0) return null;
          const kind = it.kind ?? "clue";
          if (kind === "clue") n += 1;
          const hot = it.at === newest ? 1 : 0;
          const dim = it.dimAt !== undefined ? fin(t, it.dimAt, 0.5) : 0;
          const crack = it.crackAt !== undefined ? fin(t, it.crackAt, 0.4) : 0;
          const find = kind === "find", ask = kind === "ask";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: find ? "12px 18px" : "9px 18px", marginTop: 8, borderRadius: 12, opacity: k * (1 - 0.7 * dim),
              transform: `translateX(${(1 - k) * -30}px)`,
              background: find ? `rgba(242,176,102,${0.16 + 0.1 * hot})` : hot ? "rgba(242,176,102,0.1)" : "transparent",
              border: find ? "1.5px solid rgba(242,176,102,0.6)" : "1.5px solid transparent" }}>
              <div style={{ minWidth: 64, fontFamily: find ? DISPLAY : SANS, fontSize: find ? 44 : 42, color: ask ? "#9fc2ff" : "#f6cf94", textAlign: "center" }}>
                {find ? "★" : ask ? "？" : String(n).padStart(2, "0")}
              </div>
              <div style={{ position: "relative", fontFamily: find ? DISPLAY : SERIF, fontSize: find ? 54 : 50, color: ask ? "#cfe0ff" : "#f3e6d0", letterSpacing: 2,
                textShadow: hot ? "0 0 22px rgba(255,180,100,0.45)" : "none" }}>
                {it.text}
                {crack > 0 ? (
                  <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", overflow: "visible" }} viewBox="0 0 100 10" preserveAspectRatio="none">
                    <polyline points="0,6 18,4 30,7 46,3 60,7 78,4 100,6" fill="none" stroke="#ff9a7a" strokeWidth={0.9} strokeDasharray="200" strokeDashoffset={200 * (1 - crack)} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 4 }} />
                  </svg>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
void clamp;
