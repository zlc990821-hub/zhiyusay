/* 《隧道里的声音》— 亲密关系里的沉默与表达 · 竖屏 1080×1920 · 纸感治愈风 · 配音驱动 */
const V = Vibe.create({ width: 1080, height: 1920, duration: 209.1, watermark: '@zhiyusay', theme: 'paper', seed: 21 });
const { E, prog, env, clamp, lerp, rng } = Vibe;
const C = V.C, W = V.W, H = V.H;
V.beatGlow = false; V.dropFlash = false;

const CY = 860;                       // 主视觉中心
const A_COL = C.orange, B_COL = C.blue; // 你（珊瑚） / 对方（雾蓝）

/* ---------------- 字幕：来自 align.py（逐字对齐配音） ---------------- */
for (const s of window.SUBS) V.sub(s.a, s.b, s.text);

/* ================================================================
 * 插画部件（全部墨线 + 柔和色块）
 * ================================================================ */
const INK = C.ink;
/** 小人：y 为脚底。o: s 缩放, flip, lean, bob(走路起伏), curl(抱膝坐), alpha, arm('none'|'reach'|'carry'|'hug'), face(-1/1 朝向) */
function person(g, x, y, col, o = {}) {
  const { ctx } = g, s = o.s ?? 1;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  ctx.translate(x, y + (o.bob || 0)); ctx.scale(s * (o.flip ? -1 : 1), s); ctx.rotate(o.lean || 0);
  // 地面阴影
  ctx.fillStyle = 'rgba(90,60,40,.13)'; ctx.beginPath(); ctx.ellipse(0, 2, 52, 10, 0, 0, 6.3); ctx.fill();
  ctx.lineWidth = 3.2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (o.curl) {
    // 抱膝坐：圆润的团 + 低头
    ctx.beginPath(); ctx.moveTo(-44, 0); ctx.bezierCurveTo(-50, -70, -20, -96, 4, -96); ctx.bezierCurveTo(38, -96, 50, -60, 46, 0); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-6, -118, 27, 0, 6.3); ctx.fillStyle = C.cream; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30, -52); ctx.quadraticCurveTo(10, -40, 40, -58); ctx.stroke(); // 抱着膝盖的手臂
  } else {
    ctx.beginPath(); ctx.moveTo(-36, 0); ctx.bezierCurveTo(-38, -60, -34, -112, 0, -118); ctx.bezierCurveTo(34, -112, 38, -60, 36, 0); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    const fx = (o.face ?? 0) * 6;
    ctx.beginPath(); ctx.arc(fx, -152, 30, 0, 6.3); ctx.fillStyle = C.cream; ctx.fill(); ctx.stroke();
    if (o.arm === 'reach') { ctx.beginPath(); ctx.moveTo(20, -80); ctx.quadraticCurveTo(52, -96, 76, -92); ctx.stroke(); }
    if (o.arm === 'hug') { ctx.beginPath(); ctx.moveTo(-26, -78); ctx.quadraticCurveTo(10, -60, 44, -82); ctx.stroke(); }
    if (o.arm === 'carry') { ctx.beginPath(); ctx.moveTo(-24, -96); ctx.quadraticCurveTo(-46, -130, -20, -150); ctx.stroke(); ctx.beginPath(); ctx.moveTo(24, -96); ctx.quadraticCurveTo(46, -130, 20, -150); ctx.stroke(); }
  }
  ctx.restore();
}
/** 心形：中心 (x,y)，大小 r */
function heart(g, x, y, r, col, o = {}) {
  const { ctx } = g; ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(x, y); ctx.scale(r / 50, r / 50);
  if (o.glow) { ctx.shadowColor = col; ctx.shadowBlur = o.glow; }
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-60, -22, -26, -62, 0, -30); ctx.bezierCurveTo(26, -62, 60, -22, 0, 18); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.shadowBlur = 0;
  if (o.stroke !== false) { ctx.lineWidth = 3 * 50 / r; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
}
/** 对话气泡（手绘感） */
function bubble(g, x, y, w, h, o = {}) {
  const { ctx } = g; ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  g.rrect(x - w / 2, y - h / 2, w, h, Math.min(h / 2, 30));
  ctx.fillStyle = o.fill || C.cream; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke();
  const tx = o.tail ?? -1; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x + tx * w * 0.18, y + h / 2 - 2); ctx.lineTo(x + tx * w * 0.3, y + h / 2 + 26); ctx.lineTo(x + tx * w * 0.05, y + h / 2 - 2);
  ctx.fillStyle = o.fill || C.cream; ctx.fill(); ctx.stroke();
  if (o.text) g.text(o.text, x, y + 2, { size: o.size || 36, weight: 700, fam: 'hand', color: o.color || INK });
  ctx.restore();
}
/** 手写便签卡片（带胶带） */
function note(g, x, y, txt, o = {}) {
  const { ctx } = g, sz = o.size || 40, w = g.measure(txt, { size: sz, weight: 700, fam: 'hand' }) + 70, h = sz + 54;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.scale ?? 1, o.scale ?? 1);
  g.fillRR(-w / 2, -h / 2, w, h, 6, o.fill || C.cream, { shadow: 18 });
  ctx.fillStyle = 'rgba(232,166,160,.55)'; ctx.fillRect(-28, -h / 2 - 12, 56, 22);
  g.text(txt, 0, 2, { size: sz, weight: 700, fam: 'hand', color: o.color || INK });
  ctx.restore();
}
/** 墨线隧道：一组向消失点收缩的拱门；light 0..1 控制尽头暖光 */
function tunnel(g, cx, cy, o = {}) {
  const { ctx } = g, n = 9, light = o.light ?? 0.2, alpha = o.alpha ?? 1;
  ctx.save(); ctx.globalAlpha *= alpha;
  // 内部雾色（偏冷但明亮，不用黑）
  const gr = ctx.createRadialGradient(cx, cy - 40, 10, cx, cy, 520);
  gr.addColorStop(0, `rgba(255,214,150,${0.25 + 0.65 * light})`); gr.addColorStop(0.35, `rgba(150,160,190,${0.35 * (1 - light)})`); gr.addColorStop(1, 'rgba(90,100,128,0)');
  ctx.fillStyle = gr; ctx.fillRect(cx - 600, cy - 600, 1200, 1200);
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), sc = lerp(1, 0.12, Math.pow(k, 0.7));
    const w = 760 * sc, h = 900 * sc, y0 = cy + 420 * sc - 20 * k;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, y0); ctx.lineTo(cx - w / 2, y0 - h + w / 2); ctx.arc(cx, y0 - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(cx + w / 2, y0);
    ctx.strokeStyle = `rgba(46,42,51,${0.75 - 0.5 * k})`; ctx.lineWidth = 3.2 - 2 * k; ctx.stroke();
  }
  // 地面透视线
  for (const s of [-1, 1]) g.line(cx + s * 380, cy + 420, cx + s * 46, cy - 10, { color: 'rgba(46,42,51,.35)', lw: 2 });
  if (light > 0.05) g.spot(cx, cy - 60, 260 + 500 * light, 0.5 * light, '255,210,140');
  ctx.restore();
}
/** 小岛 + 海浪 */
function island(g, x, y, w, col, t) {
  const { ctx } = g;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.bezierCurveTo(x - w / 2 + 30, y - 70, x + w / 2 - 30, y - 70, x + w / 2, y); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  for (let r = 0; r < 2; r++) {
    const pts = []; for (let i = 0; i <= 30; i++) { const xx = x - w * 0.75 + i * w * 1.5 / 30; pts.push([xx, y + 18 + r * 22 + Math.sin(i * 0.9 + t * 1.6 + r) * 5]); }
    g.path(pts, 1, { color: 'rgba(94,127,168,.55)', lw: 2.5 });
  }
  ctx.restore();
}
/** 植物（关系）：droop 0..1 越大越枯萎 */
function plant(g, x, y, droop, t) {
  const { ctx } = g;
  g.fillRR(x - 46, y - 70, 92, 70, 10, '#D9A07A', { stroke: INK, lw: 3 });
  const sway = Math.sin(t * 1.2) * 0.04;
  const tipX = x + droop * 60 + sway * 100, tipY = y - 70 - lerp(190, 110, droop);
  ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = '#4E7A5A'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.quadraticCurveTo(x - 10, y - 160, tipX, tipY); ctx.stroke();
  const leaf = (px, py, ang, s) => { ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(s * 0.6, 0, s * 0.6, s * 0.24, 0, 0, 6.3);
    ctx.fillStyle = lerp(0, 1, droop) > 0.5 ? '#B7A86A' : '#7FAE7E'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); };
  leaf(x - 6, y - 130, -2.4 + droop * 1.3, 56); leaf(x - 4, y - 150, -0.6 + droop * 1.2, 52); leaf(tipX, tipY, -1.2 + droop * 2.2, 48);
  ctx.restore();
}
/** 水波纹（声音） */
function rings(g, x, y, t, o = {}) {
  for (let i = 0; i < (o.n || 4); i++) {
    const k = ((t * (o.speed || 0.6) + i / (o.n || 4)) % 1);
    g.ctx.save(); g.ctx.globalAlpha *= (1 - k) * (o.alpha ?? 0.8);
    g.ctx.beginPath(); g.ctx.arc(x, y, 20 + k * (o.r || 260), o.a0 ?? -0.6, o.a1 ?? 0.6); g.ctx.lineWidth = 4; g.ctx.strokeStyle = o.color || C.goldHi; g.ctx.stroke(); g.ctx.restore();
  }
}
/** 场景内的柔和光晕 */
const glow = (g, x, y, r, a, rgb = '255,210,150') => g.spot(x, y, r, a, rgb);
/** 冷色调蒙层（沉默、隔绝时用；明亮的雾蓝，不发黑） */
const coolWash = (g, a) => { g.ctx.save(); g.ctx.globalAlpha = a; g.ctx.fillStyle = '#B9C3D8'; g.ctx.fillRect(0, 0, W, H); g.ctx.restore(); };

/* 段落标签（顶部，竖屏 y=300） */
const LABELS = [
  [0.6, 19.8, '一段关系，最让人崩溃的瞬间'], [19.8, 27.3, '俄耳甫斯 · 漆黑的隧道'], [27.3, 39.85, '爱，与关系'],
  [39.85, 65.9, '每个人都是一座孤岛'], [65.9, 93.8, '自我感动 ① · 独自硬扛'], [93.8, 111.7, '自我感动 ② · 隐忍克制'],
  [111.7, 126.9, '拧巴的双向困境'], [126.9, 148.05, '心有灵犀，是搭建出来的'], [148.05, 156.55, '沉默的水面之下'],
  [156.55, 177.75, '允许彼此，不用时刻强大'], [177.75, 191.8, '爱，需要被听见'], [191.8, 205.1, '要发出你的声音'],
];
for (const [a, b, t] of LABELS) V.label(a, b, t);

/* ================================================================
 * 1. 钩子 0–13.8 ：问号 → 争吵的闪电 → 被划掉
 * ================================================================ */
V.scene(0, 13.9, (g, lt) => {
  V.push(g, lt, 0.004);
  // 墨笔问号
  const k = prog(lt, 0.6, 2.6, E.inOut), qa = 1 - prog(lt, 4.6, 5.4);
  if (qa > 0) {
    const pts = []; for (let i = 0; i <= 40; i++) { const a = -Math.PI * 0.95 + i / 40 * Math.PI * 1.45; pts.push([W / 2 + Math.cos(a) * 110, CY - 120 + Math.sin(a) * 110]); }
    pts.push([W / 2 + 10, CY + 20], [W / 2, CY + 80]);
    g.path(pts, k, { color: INK, lw: 16, alpha: qa });
    g.circle(W / 2, CY + 160, 14 * prog(lt, 2.5, 2.9, E.outBack), INK, { alpha: qa });
    glow(g, W / 2, CY, 420, 0.25 * qa);
  }
  // 两人 + 争吵闪电（背叛、争吵）
  const kp = prog(lt, 4.6, 5.6, E.out), outP = 1 - prog(lt, 12.8, 13.9);
  if (kp > 0) {
    const shake = lt > 6.2 && lt < 9 ? Math.sin(lt * 40) * 3 : 0;
    person(g, W / 2 - 220 - (1 - kp) * 80 + shake, CY + 260, A_COL, { alpha: kp * outP, s: 1.25, face: 1 });
    person(g, W / 2 + 220 + (1 - kp) * 80 - shake, CY + 260, B_COL, { alpha: kp * outP, s: 1.25, face: -1 });
    const kz = prog(lt, 6.2, 6.8) * (1 - prog(lt, 9.0, 9.6));
    if (kz > 0) {
      for (const dy of [-60, 10]) {
        const pts = []; for (let i = 0; i <= 8; i++) pts.push([W / 2 - 110 + i * 27.5, CY + 40 + dy + (i % 2 ? -24 : 24)]);
        g.path(pts, kz, { color: C.red, lw: 6, alpha: kz });
      }
    }
    // "往往不是歇斯底里的冲突"：一笔划掉
    const kx = prog(lt, 11.8, 12.6);
    if (kx > 0) { g.circle(W / 2, CY + 30, 150, null, { stroke: 'rgba(46,42,51,.5)', lw: 3, alpha: kx * outP }); g.line(W / 2 - 110, CY + 140, W / 2 + 110, CY - 80, { color: INK, lw: 5, k: kx, alpha: outP }); }
  }
}, { fin: 0.01, fout: 0.6 });
V.cue(0.7, 'pen', { dur: 2.0, gain: 0.7 }).cue(2.6, 'pop', 0.4).cue(4.8, 'slide', 0.5).cue(6.2, 'snap', 0.5).cue(6.5, 'snap', 0.4).cue(11.8, 'pen', { dur: 0.8, gain: 0.6 });

/* 2. 沉默消耗 13.8–19.8 ：两人坐得很近，两颗心慢慢变暗变小；中间的空白气泡 */
V.scene(13.5, 20.2, (g, lt) => {
  V.push(g, lt, 0.005);
  const k = prog(lt, 0.3, 1.2, E.out), fade = prog(lt, 2.4, 6.2, E.inOut);
  coolWash(g, 0.18 * fade);
  person(g, W / 2 - 150, CY + 260, A_COL, { s: 1.25, alpha: k, face: -1 });
  person(g, W / 2 + 150, CY + 260, B_COL, { s: 1.25, alpha: k, face: 1 });
  const hr = lerp(46, 22, fade), hc = fade > 0.5 ? '#D8A39A' : C.rose;
  heart(g, W / 2 - 150, CY + 140, hr, hc, { alpha: k, glow: 20 * (1 - fade) });
  heart(g, W / 2 + 150, CY + 140, hr, hc, { alpha: k, glow: 20 * (1 - fade) });
  // 中间：空白的"……"气泡浮起又消散
  const kb = env(lt, 1.6, 6.0, 0.6, 1.2);
  bubble(g, W / 2, CY - 120 - lt * 6, 170, 90, { alpha: kb * 0.9, text: '……', dash: [8, 8], tail: 0 });
}, { fout: 0.4 });
V.cue(14.0, 'bubble', 0.5).cue(16.2, 'heartbeat', 0.35);

/* 3. 俄耳甫斯 19.8–27.3 ：隧道里一前一后，回头的一瞬对方消散 */
V.scene(19.8, 27.6, (g, lt) => {
  V.push(g, lt, 0.006);
  const k = prog(lt, 0, 1.0, E.out);
  tunnel(g, W / 2, CY + 110, { alpha: k, light: 0.35 });
  // 标题卡
  const kt = env(lt, 0.3, 3.0, 0.5, 0.6);
  g.text('隧道里的声音', W / 2, 430 + (1 - kt) * 10, { size: 96, weight: 900, fam: 'serif', color: INK, alpha: kt, ls: 8, stroke: 14, strokeColor: 'rgba(251,246,238,.9)' });
  g.text('关系里的沉默，与表达', W / 2, 520, { size: 34, weight: 700, fam: 'serif', color: C.dim, alpha: kt, ls: 6, stroke: 10, strokeColor: 'rgba(251,246,238,.95)' });
  // 前面的人（你）向光走；后面的人（对方）跟着
  const walk = lt * 0.9, bob = Math.abs(Math.sin(lt * 5)) * -5;
  const turn = prog(lt, 5.6, 6.2), lost = prog(lt, 6.3, 7.6, E.in);
  person(g, W / 2 + 40, CY + 420 - walk * 10, A_COL, { s: 0.95 - walk * 0.02, bob: turn > 0 ? 0 : bob, alpha: k, face: turn > 0.5 ? 1 : 0, flip: turn > 0.5 });
  person(g, W / 2 - 60, CY + 560 - walk * 10, B_COL, { s: 1.15 - walk * 0.02, bob: bob * 0.8, alpha: k * (1 - lost) });
  // 消散的光点
  if (lost > 0) { const r = rng(8); for (let i = 0; i < 40; i++) { const a = r() * 6.3, d = lost * (60 + r() * 140); g.circle(W / 2 - 60 + Math.cos(a) * d, CY + 470 - walk * 10 + Math.sin(a) * d - lost * 60, 3 + r() * 3, C.blue, { alpha: (1 - lost) * 0.8 }); } }
  // 对话够不着：断开的虚线
  const kd = env(lt, 4.3, 6.0, 0.4, 0.4);
  if (kd > 0) { g.path([[W / 2 - 40, CY + 360], [W / 2 + 20, CY + 300]], kd, { color: INK, lw: 3, dash: [6, 10], alpha: kd }); g.text('×', W / 2 - 10, CY + 320, { size: 40, color: C.red, alpha: kd }); }
}, { fin: 0.6 });
V.cue(19.8, 'whoosh', 0.5).cue(20.0, 'chime', 0.5).cue(24.1, 'wrong', 0.3).cue(25.9, 'swell', 0.5).cue(26.2, 'sparkle', 0.4);

/* 4. 爱与关系 27.3–39.9 ：心在一个人里 → 两人之间往返的光点（互动）→ 没人浇水的植物 */
V.scene(27.3, 40.2, (g, lt, s) => {
  V.push(g, lt, 0.003);
  const t = s.t, k = prog(lt, 0, 0.8, E.out);
  // 27.3–31.4 "不够爱"：一个大大的字被轻轻划掉
  const kq = env(t, 27.5, 31.4, 0.5, 0.5);
  if (kq > 0) {
    g.text('不够爱？', W / 2, CY - 40, { size: 120, weight: 900, fam: 'serif', color: INK, alpha: kq });
    g.line(W / 2 - 250, CY - 30, W / 2 + 250, CY - 50, { color: C.orange, lw: 8, k: prog(t, 29.8, 30.8), alpha: kq });
  }
  // 31.4–34.4 爱 = 内心的感受（心在一个人身上发光）
  const kf = env(t, 31.4, 40.2, 0.6, 0.5);
  if (kf > 0) {
    const two = prog(t, 34.2, 35.2, E.inOut);
    const ax = lerp(W / 2, W / 2 - 230, two), bx = W / 2 + 230;
    person(g, ax, CY + 330, A_COL, { s: 1.2, alpha: kf, face: two > 0.5 ? 1 : 0 });
    heart(g, ax, CY + 210, 34, C.rose, { alpha: kf, glow: 18 });
    if (t < 34.4) g.text('感受', ax + 120, CY + 60, { size: 40, weight: 700, fam: 'hand', color: C.orange, alpha: kf * (1 - two) });
    person(g, bx, CY + 330, B_COL, { s: 1.2, alpha: kf * two, face: -1 });
    // 互动：往返的光点
    const ki = prog(t, 35.0, 35.8) * (1 - prog(t, 37.6, 39.0));
    for (let i = 0; i < 6; i++) {
      const q = ((t * 0.5 + i / 6) % 1), dir = i % 2;
      const x = lerp(ax + 60, bx - 60, dir ? q : 1 - q), y = CY + 120 - Math.sin(q * Math.PI) * 90;
      g.circle(x, y, 9, dir ? A_COL : B_COL, { alpha: ki, glow: 12 });
    }
    if (ki > 0) g.text('互动', W / 2, CY - 20, { size: 40, weight: 700, fam: 'hand', color: C.orange, alpha: ki });
    // 37.5– 关系 = 一盆需要照料的植物，没人浇水会枯
    const kp = prog(t, 37.5, 38.3, E.outBack);
    if (kp > 0) plant(g, W / 2, CY + 330, prog(t, 38.4, 39.9, E.inOut), t);
  }
}, { fin: 0.5 });
V.cue(27.5, 'paper', 0.5).cue(29.8, 'pen', { dur: 1.0, gain: 0.6 }).cue(31.5, 'sparkle', 0.4).cue(34.3, 'slide', 0.5).cue(35.0, 'bubble', 0.4).cue(37.5, 'pop', 0.5);

/* 5. 孤岛 39.9–58.8 ：两座岛；玻璃罩里的情绪；信号断在半路；高墙一层层垒起 */
const FEEL = ['疲惫', '恐慌', '难堪'];
V.scene(39.85, 59.2, (g, lt, s) => {
  V.push(g, lt, 0.002);
  const t = s.t, k = prog(t, 39.9, 41.0, E.out);
  const ax = W / 2 - 250, bx = W / 2 + 250, sea = CY + 320;
  island(g, ax, sea, 330, '#E9C9A3', t); island(g, bx, sea, 330, '#E9C9A3', t);
  person(g, ax, sea - 38, A_COL, { s: 0.95, alpha: k, face: 1 });
  person(g, bx, sea - 38, B_COL, { s: 0.95, alpha: k, face: -1 });
  // 情绪困在玻璃罩里（44–51）
  const kd = prog(t, 44.0, 44.8, E.out);
  if (kd > 0) {
    g.ctx.save(); g.ctx.globalAlpha *= kd;
    g.ctx.beginPath(); g.ctx.arc(ax, sea - 170, 190, Math.PI, 0); g.ctx.lineTo(ax + 190, sea - 40); g.ctx.lineTo(ax - 190, sea - 40); g.ctx.closePath();
    g.ctx.fillStyle = 'rgba(220,214,228,.35)'; g.ctx.fill(); g.ctx.lineWidth = 3; g.ctx.strokeStyle = 'rgba(46,42,51,.6)'; g.ctx.stroke(); g.ctx.restore();
    FEEL.forEach((w, i) => {
      const ki = prog(t, 44.3 + i * 0.7, 44.9 + i * 0.7, E.outBack);
      const px = ax + [-95, 0, 95][i] + Math.sin(t * 1.1 + i * 2.1) * 14, py = sea - [250, 300, 250][i] + Math.cos(t * 0.9 + i * 1.7) * 10;
      g.text(w, px, py, { size: 34, weight: 700, fam: 'hand', color: [C.blue, C.red, C.gold][i], alpha: clamp(ki) });
    });
  }
  // 信号断在半路（48.5–53）
  const ks = env(t, 48.5, 53.9, 0.4, 0.5);
  if (ks > 0) {
    const q = prog(t, 48.6, 50.4);
    const pts = []; for (let i = 0; i <= 20; i++) { const x = lerp(ax + 150, bx - 150, i / 20); pts.push([x, sea - 260 - Math.sin(i / 20 * Math.PI) * 80]); }
    const end = g.path(pts.slice(0, 12), q, { color: C.goldHi, lw: 4, dash: [4, 12], alpha: ks });
    if (q >= 1) g.text('×', end[0] + 10, end[1], { size: 48, weight: 700, color: C.red, alpha: ks });
    // 读心术：对方头上的问号
    const kq = prog(t, 52.4, 53.0, E.outBack);
    if (kq > 0) g.text('?', bx + 10, sea - 270 - Math.sin(t * 3) * 6, { size: 70, weight: 900, fam: 'serif', color: B_COL, alpha: clamp(kq) * ks });
  }
  // 高墙（54–58.8）：砖一层层垒起
  const rows = 9;
  for (let r = 0; r < rows; r++) {
    const kr = prog(t, 54.0 + r * 0.32, 54.4 + r * 0.32, E.outBack); if (kr <= 0) continue;
    const y = sea - 20 - r * 46 - (1 - kr) * 30;
    for (let c = 0; c < 2; c++) g.fillRR(W / 2 - 64 + c * 64 + (r % 2 ? -16 : 0), y - 42, 60, 42, 4, '#C9B8A8', { stroke: INK, lw: 2.5, alpha: clamp(kr) });
  }
}, { fin: 0.5 });
V.cue(39.9, 'whoosh', 0.4).cue(44.0, 'shutter', 0.25);
FEEL.forEach((_, i) => V.cue(44.3 + i * 0.7, 'bubble', 0.35, -0.5));
V.cue(48.6, 'pen', { dur: 1.8, gain: 0.5 }).cue(50.4, 'wrong', 0.35).cue(52.4, 'pop', 0.4);
for (let r = 0; r < 9; r++) V.cue(54.0 + r * 0.32, 'drop', 0.45, 0);

/* 6. 语言 58.8–65.9 ：玻璃心藏在身后看不见 → 一串发光的字越过高墙 */
V.scene(58.6, 66.3, (g, lt, s) => {
  V.push(g, lt, 0.004);
  const t = s.t, k = prog(t, 58.8, 59.6, E.out);
  const ax = W / 2 - 250, bx = W / 2 + 250, base = CY + 300;
  person(g, ax, base, A_COL, { s: 1.15, alpha: k, face: 1 });
  person(g, bx, base, B_COL, { s: 1.15, alpha: k, face: -1 });
  // 墙（淡出）
  const wall = 1 - prog(t, 63.6, 65.0);
  g.fillRR(W / 2 - 40, base - 420, 80, 420, 6, '#C9B8A8', { stroke: INK, lw: 2.5, alpha: k * wall });
  // 脆弱：一颗虚线的玻璃心（想象看不见）
  const kh = prog(t, 60.9, 61.6);
  heart(g, ax, base - 190, 34, 'rgba(232,166,160,.25)', { alpha: kh, stroke: true });
  if (kh > 0) g.text('看不见', bx, base - 300, { size: 34, weight: 700, fam: 'hand', color: C.dim, alpha: kh * (1 - prog(t, 63.5, 64.0)) });
  // 语言：一串字沿弧线飞过去
  const kw = prog(t, 63.7, 65.6, E.inOut);
  if (kw > 0) {
    const word = [...'我想告诉你'];
    word.forEach((ch, i) => {
      const q = clamp(kw * 1.4 - i * 0.08); if (q <= 0) return;
      const x = lerp(ax + 70, bx - 70, q), y = base - 240 - Math.sin(q * Math.PI) * 220;
      g.text(ch, x, y, { size: 44, weight: 700, fam: 'hand', color: C.goldHi, alpha: Math.min(1, q * 3), glow: 14 });
    });
    glow(g, bx, base - 120, 260, 0.35 * prog(t, 65.0, 66.0));
    heart(g, ax, base - 190, 34, C.rose, { alpha: kw, glow: 18 });
  }
}, { fin: 0.4 });
V.cue(60.9, 'sparkle', 0.35).cue(63.7, 'rise', 0.4).cue(65.1, 'chime', 0.5);

/* 7. 两种自我感动 65.9–70.7 ：两张便签 */
V.scene(65.9, 71.0, (g, lt) => {
  V.push(g, lt, 0.004);
  const k1 = prog(lt, 0.4, 1.0, E.outBack), k2 = prog(lt, 1.0, 1.6, E.outBack);
  note(g, W / 2 - 10, CY - 120, '① 独自硬扛', { size: 64, rot: -0.04, alpha: clamp(k1), scale: lerp(0.8, 1, clamp(k1)) });
  note(g, W / 2 + 10, CY + 120, '② 隐忍克制', { size: 64, rot: 0.035, alpha: clamp(k2), scale: lerp(0.8, 1, clamp(k2)) });
  g.text('看起来是爱，其实是隔绝', W / 2, CY + 320, { size: 36, weight: 500, fam: 'serif', color: C.dim, alpha: prog(lt, 2.4, 3.2) });
}, { fin: 0.4 });
V.cue(66.3, 'paper', 0.6).cue(66.9, 'paper', 0.6);

/* 8. 独自硬扛 70.7–93.8 ：背着重物 → 关上心门 → 门内的"我对你好" → 门外的人被隔绝 */
const LOGIC = ['我默默努力', '我扛下所有', '就是对你好'];
V.scene(70.7, 94.1, (g, lt, s) => {
  V.push(g, lt, 0.0015);
  const t = s.t, k = prog(t, 70.7, 71.5, E.out);
  const doorX = W / 2 + 70, base = CY + 330;
  const ax = W / 2 - 170, bx = W / 2 + 330;
  // 门（73.3 关上）：门框 + 门板角度
  const close = prog(t, 73.4, 74.6, E.inOut);
  g.ctx.save(); g.ctx.globalAlpha *= k;
  g.fillRR(doorX - 12, base - 430, 24, 430, 4, '#B89478', { stroke: INK, lw: 2.5 });
  const dw = lerp(16, 150, close);
  g.fillRR(doorX + 12, base - 420, dw, 420, 4, '#D6B28E', { stroke: INK, lw: 2.5 });
  if (close > 0.9) g.circle(doorX + 12 + dw - 22, base - 210, 7, INK);
  g.ctx.restore();
  // 门外的对方（随着隔绝变冷）
  const cold = prog(t, 87.8, 90.0);
  if (t > 87.6) coolWash(g, 0.0);
  person(g, bx, base, B_COL, { s: 1.0, alpha: k * (0.4 + 0.6 * prog(t, 72.0, 73.0)), face: -1, arm: t > 89.5 ? 'reach' : 'none', flip: t > 89.5 });
  if (cold > 0) {
    g.ctx.save(); g.ctx.globalAlpha = 0.35 * cold; g.ctx.fillStyle = '#AEBBD6'; g.ctx.fillRect(doorX + 160, 380, W - doorX - 160, 1000); g.ctx.restore();
    ['被隔绝', '被排斥', '被挡在外面'].forEach((w, i) => {
      const ki = prog(t, 89.0 + i * 1.3, 89.6 + i * 1.3, E.outBack);
      g.text(w, bx, base - 330 - i * 70, { size: 34, weight: 700, fam: 'hand', color: B_COL, alpha: clamp(ki) });
    });
  }
  // 背着重担的你（压弯的身体）
  const load = prog(t, 71.0, 72.0, E.outBack);
  person(g, ax, base, A_COL, { s: 1.0, alpha: k, lean: 0.06 * load });
  g.ctx.save(); g.ctx.translate(ax + 10 * load, base - 182 + 4 * load); g.ctx.rotate(0.06 * load);
  g.fillRR(-85, -110 + (1 - load) * -80, 170, 110, 10, '#A79A8C', { stroke: INK, lw: 3, alpha: clamp(load) });
  g.text('压力', 0, -55 + (1 - load) * -80, { size: 36, weight: 700, fam: 'hand', color: C.cream, alpha: clamp(load) });
  g.ctx.restore();
  // 门内的"内心逻辑"（暖色便签，77.9–80.8）
  LOGIC.forEach((w, i) => {
    const ki = env(t, 77.9 + i * 1.05, 86.0, 0.5, 0.6) * prog(t, 77.9 + i * 1.05, 78.5 + i * 1.05, E.outBack);
    if (ki > 0) note(g, ax - 10, base - 420 - i * 110, w, { size: 40, rot: (i - 1) * 0.04, alpha: clamp(ki) });
  });
  // 傲慢（80.8–87.7）：门上贴的标签
  const ka = env(t, 80.9, 88.0, 0.6, 0.5);
  if (ka > 0) note(g, doorX + 85, base - 300, '我的标准', { size: 32, rot: 0.06, alpha: ka, fill: '#F7E3D6' });
}, { fin: 0.5 });
V.cue(71.0, 'thud', 0.4).cue(73.4, 'slide', 0.5).cue(74.5, 'thud', 0.5);
LOGIC.forEach((_, i) => V.cue(77.9 + i * 1.05, 'paper', 0.45, -0.4));
V.cue(80.9, 'paper', 0.4, 0.3).cue(89.0, 'snap', 0.35, 0.5).cue(90.3, 'snap', 0.35, 0.5).cue(91.6, 'snap', 0.35, 0.5);

/* 9. 隐忍克制 93.8–111.7 ：委屈一滴滴落进罐子 → 临界线 → 裂开溢出 */
const DROPS = [[96.7, '委屈'], [98.0, '期待'], [99.6, '麻烦'], [100.7, '矫情'], [105.2, '失望'], [106.7, '隔阂']];
V.scene(93.8, 112.0, (g, lt, s) => {
  V.push(g, lt, 0.002);
  const t = s.t, k = prog(t, 93.9, 94.8, E.out);
  const jx = W / 2 + 60, jy = CY + 330, jw = 300, jh = 420;
  person(g, W / 2 - 280, CY + 330, A_COL, { s: 1.0, alpha: k, face: 1, arm: 'hug' });
  // 罐子
  const crack = prog(t, 109.2, 109.5), burst = prog(t, 109.3, 111.2, E.out);
  const level = clamp(DROPS.filter(([d]) => t > d + 0.6).length / DROPS.length * 0.82 + prog(t, 106.0, 108.2) * 0.15) * (1 - burst * 0.6);
  g.ctx.save(); g.ctx.globalAlpha *= k;
  const shake = t > 107.6 && t < 109.3 ? Math.sin(t * 50) * 2.5 * prog(t, 107.6, 109.2) : 0;
  g.ctx.translate(shake, 0);
  g.ctx.save(); g.rrect(jx - jw / 2, jy - jh, jw, jh, 30); g.ctx.clip();
  g.ctx.fillStyle = 'rgba(94,127,168,.45)'; g.ctx.fillRect(jx - jw / 2, jy - jh * level, jw, jh * level);
  for (let i = 0; i < 18; i++) g.circle(jx - jw / 2 + (i * 53) % jw, jy - jh * level + 8 + Math.sin(t * 2 + i) * 5, 10, 'rgba(255,255,255,.3)');
  g.ctx.restore();
  g.rrect(jx - jw / 2, jy - jh, jw, jh, 30); g.ctx.lineWidth = 3.5; g.ctx.strokeStyle = INK; g.ctx.stroke();
  // 临界线
  const kl = prog(t, 107.9, 108.6);
  if (kl > 0) { g.line(jx - jw / 2 - 30, jy - jh * 0.92, jx + jw / 2 + 30, jy - jh * 0.92, { color: C.red, lw: 3, dash: [12, 10], k: kl }); g.text('临界点', jx + jw / 2 + 40, jy - jh * 0.92 - 36, { size: 32, weight: 700, fam: 'hand', color: C.red, alpha: kl, align: 'right' }); }
  // 裂痕
  if (crack > 0) g.path([[jx - 20, jy - jh], [jx + 10, jy - jh + 60], [jx - 14, jy - jh + 120], [jx + 24, jy - jh + 190]], crack, { color: INK, lw: 4 });
  g.ctx.restore();
  // 落下的水滴（带标签）
  DROPS.forEach(([d, w], i) => {
    const q = prog(t, d, d + 0.6, E.in); if (q <= 0 || q >= 1) return;
    const x = jx + (i % 3 - 1) * 60, y = lerp(420, jy - jh * level, q);
    g.ctx.save(); g.ctx.translate(x, y); g.ctx.beginPath(); g.ctx.moveTo(0, -26); g.ctx.quadraticCurveTo(18, 0, 0, 14); g.ctx.quadraticCurveTo(-18, 0, 0, -26);
    g.ctx.fillStyle = 'rgba(94,127,168,.75)'; g.ctx.fill(); g.ctx.restore();
    g.text(w, x + 60, y - 6, { size: 32, weight: 700, fam: 'hand', color: B_COL, alpha: 1 - q * 0.3 });
  });
  // 积在罐子里的词（淡淡地漂着）
  DROPS.forEach(([d, w], i) => { if (t > d + 0.6 && burst < 1) g.text(w, jx + (i % 3 - 1) * 80, jy - 60 - Math.floor(i / 3) * 70 + Math.sin(t + i) * 6, { size: 28, weight: 700, fam: 'hand', color: C.cream, alpha: 0.85 * (1 - burst) }); });
  // 爆发：飞溅
  if (burst > 0) { const r = rng(31); for (let i = 0; i < 36; i++) { const a = -Math.PI * (0.1 + r() * 0.8), sp = 200 + r() * 360; const x = jx + Math.cos(a) * sp * burst, y = jy - jh + Math.sin(a) * sp * burst + 600 * burst * burst; g.circle(x, y, 6 + r() * 8, 'rgba(94,127,168,.7)', { alpha: 1 - burst }); } }
}, { fin: 0.5 });
DROPS.forEach(([d], i) => V.cue(d + 0.6, 'drop', 0.55, (i % 3 - 1) * 0.4));
V.cue(93.9, 'whoosh', 0.4).cue(107.9, 'pen', { dur: 0.7, gain: 0.5 }).cue(109.2, 'impact', 0.45).cue(109.3, 'shutter', 0.3);

/* 10. 双向困境 111.7–126.9 ：上下分屏（暖：我都是为我们好 / 冷：我是不是不被需要）→ 肩并肩，念头隔在隧道两端 */
V.scene(111.7, 127.2, (g, lt, s) => {
  const t = s.t, k = prog(t, 111.8, 112.6, E.out);
  const merge = prog(t, 122.6, 123.8, E.inOut);
  if (merge < 1) {
    const a = k * (1 - merge);
    // 上半：暖
    g.ctx.save(); g.ctx.globalAlpha *= a;
    g.fillRR(80, 380, W - 160, 440, 30, 'rgba(242,198,168,.45)', { stroke: 'rgba(46,42,51,.35)', lw: 2 });
    person(g, 260, 760, A_COL, { s: 0.9, face: 1 });
    bubble(g, 640, 560, 520, 150, { text: '我都是为我们好', size: 40, tail: -1, alpha: prog(t, 114.6, 115.3) });
    glow(g, 300, 600, 300, 0.25);
    // 下半：冷
    g.fillRR(80, 870, W - 160, 440, 30, 'rgba(185,195,216,.5)', { stroke: 'rgba(46,42,51,.35)', lw: 2 });
    person(g, W - 260, 1250, B_COL, { s: 0.9, face: -1, flip: true });
    bubble(g, 440, 1050, 560, 150, { text: '我是不是不被需要？', size: 40, tail: 1, alpha: prog(t, 119.9, 120.6), fill: '#EEF1F7' });
    // 信号接收不到
    const ks = prog(t, 118.1, 119.0);
    for (let i = 0; i < 3; i++) g.ctx.globalAlpha = a * ks * (0.3 + 0.2 * Math.sin(t * 4 + i)), g.ctx.beginPath(), g.ctx.arc(W - 200, 960, 24 + i * 20, -2.3, -0.8), g.ctx.lineWidth = 4, g.ctx.strokeStyle = INK, g.ctx.stroke();
    g.text('×', W - 160, 940, { size: 40, color: C.red, alpha: a * ks });
    g.ctx.restore();
  }
  if (merge > 0) {
    // 肩并肩，念头被拉到隧道两头
    V.push(g, t - 122.6, 0.004);
    tunnel(g, W / 2, CY + 40, { alpha: merge * 0.55, light: 0.1 });
    person(g, W / 2 - 70, CY + 420, A_COL, { s: 1.1, alpha: merge, face: 1 });
    person(g, W / 2 + 70, CY + 420, B_COL, { s: 1.1, alpha: merge, face: -1 });
    const apart = prog(t, 124.3, 126.4, E.inOut);
    bubble(g, lerp(W / 2 - 60, 230, apart), CY - 60 - apart * 120, 150, 80, { text: '…', alpha: merge, tail: 1 });
    bubble(g, lerp(W / 2 + 60, W - 230, apart), CY - 60 - apart * 120, 150, 80, { text: '…', alpha: merge, tail: -1, fill: '#EEF1F7' });
  }
}, { fin: 0.5 });
V.cue(111.8, 'whoosh', 0.4).cue(114.6, 'bubble', 0.45).cue(118.1, 'wrong', 0.3).cue(119.9, 'bubble', 0.45).cue(122.6, 'slide', 0.5).cue(124.3, 'swell', 0.4);

/* 11. 心有灵犀 126.9–148 ：两个圆幻想完全重合 → 弹回只能部分重叠 → 内部的黑暗与挣扎 → 一块块搭起的桥 */
V.scene(126.9, 148.4, (g, lt, s) => {
  V.push(g, lt, 0.0015);
  const t = s.t, k = prog(t, 127.0, 127.8, E.out);
  const fantasy = prog(t, 127.6, 129.2, E.inOut) * (1 - prog(t, 131.9, 132.8, E.outBack));
  const gap = lerp(170, 0, fantasy);
  const R = 220, ax = W / 2 - gap, bx = W / 2 + gap, cy = CY - 20;
  const build = prog(t, 141.6, 148.0);
  const sep = lerp(0, 120, prog(t, 136.3, 137.4)) * (1 - build * 0.85);
  const AX = ax - sep, BX = bx + sep;
  g.circle(AX, cy, R, 'rgba(224,122,95,.16)', { stroke: A_COL, lw: 4, alpha: k });
  g.circle(BX, cy, R, 'rgba(94,127,168,.16)', { stroke: B_COL, lw: 4, alpha: k });
  if (fantasy > 0.5) g.text('幻想：完全懂我', W / 2, cy - R - 60, { size: 36, weight: 700, fam: 'hand', color: C.dim, alpha: (fantasy - 0.5) * 2 });
  const kr = env(t, 132.6, 136.2, 0.5, 0.4);
  if (kr > 0) g.text('真实：只能部分重叠', W / 2, cy - R - 60, { size: 36, weight: 700, fam: 'hand', color: C.orange, alpha: kr });
  // 内心的黑暗与挣扎：圆里的乱线
  const kd = env(t, 136.6, 142.4, 0.6, 0.8);
  if (kd > 0) for (const [cx, col] of [[AX, A_COL], [BX, B_COL]]) {
    const r = rng(cx | 0); const pts = []; for (let i = 0; i < 40; i++) pts.push([cx + (r() - 0.5) * R * 0.9, cy + (r() - 0.5) * R * 0.9]);
    g.path(pts, prog(t, 136.8, 140.0), { color: 'rgba(46,42,51,.45)', lw: 2, alpha: kd });
  }
  // 桥：一块块木板（袒露 / 表达）
  if (build > 0) {
    const x0 = AX + R * 0.55, x1 = BX - R * 0.55, n = 10;
    for (let i = 0; i < n; i++) {
      const ki = prog(t, 142.6 + i * 0.5, 143.0 + i * 0.5, E.outBack); if (ki <= 0) continue;
      const x = lerp(x0, x1, (i + 0.5) / n), y = cy + 40 - Math.sin((i + 0.5) / n * Math.PI) * 60;
      g.fillRR(x - 22, y - (1 - ki) * 40, 40, 70, 4, '#D6B28E', { stroke: INK, lw: 2.5, alpha: clamp(ki) });
    }
    const kw = prog(t, 144.2, 145.0, E.outBack);
    if (kw > 0) { g.text('袒露', x0 + 30, cy + 180, { size: 40, weight: 700, fam: 'hand', color: C.orange, alpha: clamp(kw) }); g.text('表达', x1 - 30, cy + 180, { size: 40, weight: 700, fam: 'hand', color: C.orange, alpha: clamp(prog(t, 144.9, 145.6, E.outBack)) }); }
    glow(g, W / 2, cy, 400, 0.3 * prog(t, 146.0, 148.0));
  }
}, { fin: 0.5 });
V.cue(127.6, 'slide', 0.5).cue(129.2, 'sparkle', 0.4).cue(131.9, 'boom', 0.25).cue(136.8, 'pen', { dur: 3.0, gain: 0.35 });
for (let i = 0; i < 10; i++) V.cue(142.6 + i * 0.5, 'pop', 0.35, -0.6 + i * 0.13);
V.cue(146.1, 'chime', 0.5);

/* 12. 沉默的水面之下 148–156.5 ：上面风平浪静（小船上两人）；下面没说出口的话在啃噬一颗心 */
V.scene(148.05, 156.9, (g, lt, s) => {
  const t = s.t, k = prog(t, 148.1, 149.0, E.out);
  const sea = CY - 80;
  // 水下（雾蓝，越深越浓）
  const gr = g.ctx.createLinearGradient(0, sea, 0, H);
  gr.addColorStop(0, 'rgba(160,178,210,.32)'); gr.addColorStop(1, 'rgba(120,132,170,.42)');
  g.ctx.save(); g.ctx.globalAlpha *= k; g.ctx.fillStyle = gr; g.ctx.fillRect(0, sea, W, H - sea);
  const pts = []; for (let i = 0; i <= 40; i++) pts.push([i * W / 40, sea + Math.sin(i * 0.6 + t * 1.2) * 4]);
  g.path(pts, 1, { color: INK, lw: 3 });
  g.ctx.restore();
  // 小船 + 两人（风平浪静）
  g.ctx.save(); g.ctx.globalAlpha *= k; g.ctx.translate(W / 2, sea + Math.sin(t * 1.3) * 4);
  g.ctx.beginPath(); g.ctx.moveTo(-200, -10); g.ctx.quadraticCurveTo(0, 70, 200, -10); g.ctx.closePath(); g.ctx.fillStyle = '#D6B28E'; g.ctx.fill(); g.ctx.lineWidth = 3; g.ctx.strokeStyle = INK; g.ctx.stroke();
  g.ctx.restore();
  person(g, W / 2 - 70, sea - 6, A_COL, { s: 0.75, alpha: k });
  person(g, W / 2 + 70, sea - 6, B_COL, { s: 0.75, alpha: k });
  g.text('风平浪静', W / 2, sea - 230, { size: 34, weight: 700, fam: 'hand', color: C.dim, alpha: prog(t, 148.6, 149.4) });
  // 水下：没说出口的心事，围着一颗心啃噬
  const kd = prog(t, 150.0, 150.8, E.out), eat = prog(t, 154.9, 156.5);
  const hx = W / 2, hy = sea + 430;
  heart(g, hx, hy, lerp(70, 40, eat), C.rose, { alpha: kd });
  const words = ['没说的话', '算了', '不想麻烦你', '没事'];
  words.forEach((w, i) => {
    const ki = prog(t, 152.2 + i * 0.5, 152.8 + i * 0.5, E.out); if (ki <= 0) return;
    const a = t * 0.7 + i * Math.PI / 2, rr = lerp(260, 150, eat);
    g.text(w, hx + Math.cos(a) * rr, hy + Math.sin(a) * rr * 0.7, { size: 32, weight: 700, fam: 'hand', color: '#3F4A66', alpha: ki * 0.85 });
  });
  if (kd > 0) g.text('看不见的损耗', W / 2, hy + 260, { size: 34, weight: 700, fam: 'hand', color: C.cream, alpha: prog(t, 150.6, 151.4) });
}, { fin: 0.5 });
V.cue(148.1, 'whoosh', 0.4).cue(150.0, 'swell', 0.35).cue(152.2, 'bubble', 0.3).cue(153.2, 'bubble', 0.3).cue(155.0, 'heartbeat', 0.4);

/* 13. 不是指责 156.6–170.3 ：抱膝的人，被柔软的茧包住（自我保护）；周围的担心小云 */
const FEARS = [[163.4, '得不到接纳'], [166.3, '被轻视'], [168.4, '成为负担']];
V.scene(156.55, 170.6, (g, lt, s) => {
  V.push(g, lt, 0.003);
  const t = s.t, k = prog(t, 156.6, 157.6, E.out);
  glow(g, W / 2, CY + 120, 420, 0.3 * k);
  const cocoon = prog(t, 161.5, 163.0, E.inOut);
  person(g, W / 2, CY + 300, A_COL, { s: 1.4, curl: true, alpha: k });
  if (cocoon > 0) for (let i = 0; i < 5; i++) {
    const r = 210 + i * 16;
    g.ctx.save(); g.ctx.globalAlpha *= cocoon * (0.5 - i * 0.08);
    g.ctx.beginPath(); g.ctx.ellipse(W / 2, CY + 170, r * 0.85, r, Math.sin(t * 0.5 + i) * 0.1, 0, 6.3 * cocoon); g.ctx.lineWidth = 3; g.ctx.strokeStyle = C.gold; g.ctx.stroke(); g.ctx.restore();
  }
  if (cocoon > 0) g.text('自我保护', W / 2, CY - 160, { size: 40, weight: 700, fam: 'hand', color: C.gold, alpha: cocoon * (1 - prog(t, 163.2, 163.8)) });
  FEARS.forEach(([d, w], i) => {
    const ki = prog(t, d, d + 0.7, E.outBack); if (ki <= 0) return;
    const x = [W / 2 - 250, W / 2 + 250, W / 2][i], y = [CY - 80, CY - 40, CY - 220][i] + Math.sin(t * 1.4 + i) * 8;
    g.fillRR(x - 130, y - 44, 260, 88, 44, 'rgba(185,195,216,.65)', { stroke: 'rgba(46,42,51,.4)', lw: 2, alpha: clamp(ki) });
    g.text('害怕' + w, x, y, { size: 30, weight: 700, fam: 'hand', color: '#3F4A66', alpha: clamp(ki) });
  });
}, { fin: 0.5 });
V.cue(156.6, 'whoosh', 0.3).cue(161.5, 'swell', 0.35);
FEARS.forEach(([d], i) => V.cue(d, 'bubble', 0.35, [-0.5, 0.5, 0][i]));

/* 14. 不用时刻强大 170.3–177.7 ：各自独行的两条路 → 靠在一起 */
V.scene(170.25, 178.1, (g, lt, s) => {
  V.push(g, lt, 0.004);
  const t = s.t, k = prog(t, 170.3, 171.0, E.out);
  const join = prog(t, 174.8, 176.2, E.inOut);
  // 两条平行的路（各自独行）
  g.line(W / 2 - 200, CY + 460, W / 2 - 200, CY - 200, { color: 'rgba(46,42,51,.3)', lw: 3, dash: [10, 12], alpha: k * (1 - join) });
  g.line(W / 2 + 200, CY + 460, W / 2 + 200, CY - 200, { color: 'rgba(46,42,51,.3)', lw: 3, dash: [10, 12], alpha: k * (1 - join) });
  const walk = (t - 170.3) * 18 * (1 - join);
  const ax = lerp(W / 2 - 200, W / 2 - 52, join), bx = lerp(W / 2 + 200, W / 2 + 52, join);
  const y = CY + 340 - walk * (1 - join);
  person(g, ax, y, A_COL, { s: 1.2, alpha: k, lean: 0.1 * join, face: join > 0.5 ? 1 : 0, arm: join > 0.6 ? 'hug' : 'none' });
  person(g, bx, y, B_COL, { s: 1.2, alpha: k, lean: -0.1 * join, face: join > 0.5 ? -1 : 0 });
  if (join > 0) { glow(g, W / 2, y - 140, 380, 0.45 * join); heart(g, W / 2, y - 330, 36 * join, C.rose, { glow: 20 }); }
  if (t < 174.8) g.text('各自独行', W / 2, CY - 260, { size: 36, weight: 700, fam: 'hand', color: C.dim, alpha: prog(t, 172.0, 172.6) * (1 - prog(t, 174.4, 174.8)) });
}, { fin: 0.5 });
V.cue(172.0, 'paper', 0.3).cue(174.8, 'slide', 0.4).cue(176.0, 'chime', 0.5).cue(176.2, 'sparkle', 0.35);

/* 15. 爱需要被听见 177.8–191.8 ：声波 → 三张便签（我现在很难 / 我有点害怕 / 你走得太快，我跟不上） */
V.scene(177.75, 192.2, (g, lt, s) => {
  V.push(g, lt, 0.002);
  const t = s.t, k = prog(t, 177.8, 178.6, E.out);
  const ax = W / 2 - 260, bx = W / 2 + 260, base = CY + 380;
  person(g, ax, base, A_COL, { s: 1.05, alpha: k, face: 1 });
  person(g, bx, base, B_COL, { s: 1.05, alpha: k, face: -1 });
  // 牺牲（无声）→ 被听见（声波）
  const heard = prog(t, 180.0, 180.8);
  heart(g, ax, base - 160, 26, C.rose, { alpha: k * (0.5 + 0.5 * heard), glow: 14 * heard });
  if (heard > 0) rings(g, ax + 60, base - 170, t, { n: 4, r: 300, alpha: heard * 0.8, color: C.goldHi });
  // 去掉华丽的言辞（181.7–185.2）：一张花哨卡片被揉掉
  const kf = env(t, 181.7, 185.0, 0.4, 0.6);
  if (kf > 0) note(g, W / 2, CY - 120, '华丽的言辞 ✗', { size: 36, rot: -0.05, alpha: kf * (1 - prog(t, 183.2, 184.0)), fill: '#F3EEE6', color: C.dim });
  if (kf > 0) note(g, W / 2, CY + 40, '情绪稳定 ✗', { size: 36, rot: 0.05, alpha: kf * (1 - prog(t, 184.4, 185.0)), fill: '#F3EEE6', color: C.dim });
  // 直白的话（你说）
  const n1 = prog(t, 186.3, 186.9, E.outBack), n2 = prog(t, 187.5, 188.1, E.outBack), n3 = prog(t, 189.8, 190.4, E.outBack);
  if (n1 > 0) note(g, W / 2 - 120, CY - 180, '我现在很难', { size: 46, rot: -0.04, alpha: clamp(n1), scale: lerp(0.85, 1, clamp(n1)) });
  if (n2 > 0) note(g, W / 2 - 80, CY - 40, '我有点害怕', { size: 46, rot: 0.03, alpha: clamp(n2), scale: lerp(0.85, 1, clamp(n2)) });
  if (n3 > 0) note(g, W / 2 + 40, CY + 100, '你走得太快，我跟不上', { size: 42, rot: -0.02, alpha: clamp(n3), scale: lerp(0.85, 1, clamp(n3)), fill: '#EEF1F7' });
}, { fin: 0.5 });
V.cue(177.9, 'whoosh', 0.3).cue(180.0, 'chime', 0.4).cue(181.7, 'paper', 0.4).cue(183.2, 'paper', 0.4).cue(184.4, 'paper', 0.4)
  .cue(186.3, 'pop', 0.5).cue(187.5, 'pop', 0.5).cue(189.8, 'pop', 0.5);

/* 16. 结尾 191.8–209 ：回到隧道——这次你开口，声音变成光，照亮整条隧道 → 片名 */
V.scene(191.8, 209.1, (g, lt, s) => {
  const t = s.t, k = prog(t, 191.9, 192.8, E.out);
  const light = prog(t, 196.1, 203.0, E.inOut);
  V.push(g, lt, 0.003);
  tunnel(g, W / 2, CY + 20, { alpha: k * (1 - prog(t, 205.2, 206.5)), light: 0.08 + 0.92 * light });
  person(g, W / 2 - 90, CY + 440, A_COL, { s: 1.1, alpha: k, face: 1 });
  person(g, W / 2 + 120, CY + 300, B_COL, { s: 0.85, alpha: k * (0.35 + 0.65 * light), face: -1 });
  // 你的声音：向前扩散的光波
  const kv = prog(t, 200.2, 201.0);
  if (kv > 0) rings(g, W / 2 - 40, CY + 280, t, { n: 5, r: 520, alpha: kv, color: C.goldHi, a0: -1.6, a1: -0.2 });
  glow(g, W / 2, CY + 100, 700, 0.55 * light);
  // 金句
  const kq = prog(t, 202.9, 204.6, E.linear);
  const ke0 = prog(t, 205.4, 206.4);
  if (kq > 0 && ke0 < 1) g.textReveal('要发出你的声音', W / 2, 520, kq, { alpha: 1 - ke0, size: 92, weight: 900, fam: 'serif', color: INK, stroke: 14, strokeColor: 'rgba(251,246,238,.92)', ls: 6 });
  // 片尾
  const ke = prog(t, 205.4, 206.6, E.out);
  if (ke > 0) {
    g.ctx.save(); g.ctx.globalAlpha = ke * 0.92; g.ctx.fillStyle = C.bg2; g.ctx.fillRect(0, 0, W, H); g.ctx.restore();
    g.text('隧道里的声音', W / 2, CY - 40, { size: 88, weight: 900, fam: 'serif', color: INK, alpha: ke, ls: 8 });
    g.text('爱，需要被听见', W / 2, CY + 60, { size: 40, weight: 500, fam: 'serif', color: C.orange, alpha: prog(t, 206.2, 207.2) });
    g.text('@zhiyusay', W / 2, CY + 150, { size: 28, weight: 500, color: C.dim, alpha: prog(t, 206.6, 207.6) });
  }
}, { fin: 0.5, fout: 0.01 });
V.cue(191.9, 'whoosh', 0.3).cue(196.1, 'swell', 0.4).cue(200.2, 'rise', 0.4).cue(202.9, 'sparkle', 0.5).cue(204.6, 'chime', 0.5).cue(205.4, 'paper', 0.3);

V.mount();
