// 2026-11-19 改版的共用组件：素材打底、段落标题、线索清单
// 原则：画面永远有真实素材；代码只做叠加（标注、动效、文字）。
import { AbsoluteFill } from "remotion";
import { CLIPDUR } from "./clipdur";
import { Clip, clamp, smooth, DISPLAY, SERIF, SANS, GOLD } from "./common";

const fin = (t: number, a: number, d = 0.5) => smooth((t - a) / d);

// ---------- 素材打底 ----------
// 一串背景素材，按时间排；相邻两段重叠 xf 秒做叠化。dim：亮度（0–1），blur：虚化像素
export type BedClip = { src: string; a: number; b: number; start?: number; rate?: number; dim?: number; blur?: number; zoom?: [number, number]; fit?: "cover" | "contain"; sat?: number; flip?: boolean };
// 虚化提前用 FFmpeg 做好（tools/bake_blur.py）：CSS blur 在软件渲染下慢 6 倍；没有预虚化的文件才退回 CSS
const baked = (src: string, blur?: number) => {
  if (!blur) return null;
  const p = src.replace("ep01/clips/", "ep01/clips/blur/").replace(/\.mp4$/, `_b${blur}.mp4`);
  return CLIPDUR[p] ? p : null;
};
export const Bed: React.FC<{ from: number; clips: BedClip[]; xf?: number }> = ({ from, clips, xf = 0.5 }) => (
  <>
    {clips.map((c, i) => (
      <Clip key={i} src={baked(c.src, c.blur) ?? c.src} from={from} a={c.a} b={c.b} start={c.start ?? 0} rate={c.rate ?? 1} zoom={c.zoom ?? [1.0, 1.06]} fit={c.fit}
        fi={i === 0 ? 0.6 : xf} fo={i === clips.length - 1 ? 0.6 : xf}
        style={{ ...(c.flip ? { transform: "scaleX(-1)" } : {}), filter: `brightness(${c.dim ?? 0.55}) saturate(${c.sat ?? 0.85})${c.blur && !baked(c.src, c.blur) ? ` blur(${c.blur}px)` : ""}` }} />
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
// kind：clue 线索 / find 发现（更醒目）/ sum 小结 / ask 留下的问题
export type ClueItem = { text: string; at: number; kind?: "clue" | "find" | "sum" | "ask"; crackAt?: number; dimAt?: number };
// 清单每行只占一行：字多时略缩小字号（按字宽估算，英文字母算半个字）
const ems = (s: string) => [...s].reduce((n, ch) => n + (/[ -~]/.test(ch) ? 0.55 : 1), 0);
const rowSize = (text: string, find: boolean) => {
  const base = find ? 54 : 50;
  return Math.min(base, Math.floor(1000 / (ems(text) + 0.6)));
};
export const ClueList: React.FC<{ t: number; a: number; b: number; items: ClueItem[]; title?: string; top?: number }> = ({ t, a, b, items, title = "线索清单", top = 150 }) => {
  const o = fin(t, a, 0.6) * (1 - fin(t, b - 0.6, 0.6));
  if (o <= 0.001) return null;
  const shown = items.filter((it) => t >= it.at - 0.01);
  const newest = shown.length ? Math.max(...shown.map((it) => it.at)) : -1;
  let n = 0;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 340, width: 1240, top, padding: "30px 46px 34px", borderRadius: 20, background: "rgba(14,11,8,0.72)",
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
          const find = kind === "find", ask = kind === "ask", sum = kind === "sum";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: find ? "12px 18px" : "9px 18px", marginTop: 8, borderRadius: 12, opacity: k * (1 - 0.7 * dim),
              transform: `translateX(${(1 - k) * -30}px)`,
              background: find ? `rgba(242,176,102,${0.16 + 0.1 * hot})` : hot ? "rgba(242,176,102,0.1)" : "transparent",
              border: find ? "1.5px solid rgba(242,176,102,0.6)" : "1.5px solid transparent" }}>
              <div style={{ minWidth: 64, fontFamily: find ? DISPLAY : SANS, fontSize: find ? 44 : 42, color: ask ? "#9fc2ff" : "#f6cf94", textAlign: "center" }}>
                {find ? "★" : ask ? "？" : sum ? "→" : String(n).padStart(2, "0")}
              </div>
              <div style={{ position: "relative", whiteSpace: "nowrap", fontFamily: find || sum ? DISPLAY : SERIF, fontSize: rowSize(it.text, find), color: ask ? "#cfe0ff" : sum ? "#f6cf94" : "#f3e6d0", letterSpacing: 2,
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

// ---------- 第 01 期的线索（全片统一措辞） ----------
export const CL = {
  common: "常识：我，就是我的记忆",
  piaget: "皮亚杰：清清楚楚的童年，是别人编的",
  loftus: "洛夫特斯：换一个词，就多出一地碎玻璃",
  mall: "商场：没发生过的事，也能被想起来",
  sumIn: "记忆，可以从外面被写进去",
  challenger: "挑战者号：记成了另一个样子，还很确定",
  bartlett: "巴特莱特：每复述一次，就改一次",
  rat: "老鼠：每想起一次，就重写一次",
  sumSelf: "记忆，自己也在变",
  three: "亨利、克莱夫、外婆：记忆没了，人还在",
  find1: "发现一：记忆，更像是一份记录",
  copy: "AI、传送机：记录能被复制，复制的却不是你",
  find2: "发现二：你是正在书写过去的人",
  find3: "发现三：还有一个，看着这一切的",
};
// 所有线索清单都用同一个背景：侦探的案头（放大镜和文件，虚化压暗）
export const DESK = "ep01/clips/b_magnify.mp4";
