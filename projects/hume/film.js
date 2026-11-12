/* 《没有把握，要不要动？》— 杂志风信息图讲解 · 竖屏 1080×1920 · 配音驱动
 * 浅色纸底 + 粗黑标题 + 橙红强调色；黑描边硬阴影卡片、黄色荧光笔划重点
 * 顶部章节进度条，章节之间彩色擦除转场；开头大字钩子，结尾总结卡 + 片尾卡
 * 竖屏安全区：顶部 0–200 / 右侧 x>950（y 950–1560）/ 底部 y>1600 留给抖音 UI */
const DUR = 137.2;
const V = Vibe.create({ width: 1080, height: 1920, duration: DUR, watermark: '', theme: 'paper', seed: 41, bg: (g, t) => paperBg(g, t) });
const { E, prog, env, clamp, lerp, rng } = Vibe;
const W = V.W, H = V.H, TAU = Math.PI * 2;
V.beatGlow = false; V.dropFlash = false;

const P = {
  bg: '#F4EFE6', ink: '#17171E', sub: '#5E5A66', mute: '#A9A39A', line: '#DCD3C4',
  acc: '#FF5A2C', accSoft: '#FFE3D7', blue: '#2C5BFF', blueSoft: '#DEE6FF',
  yel: '#FFD84A', green: '#11A35E', greenSoft: '#D6F2E3', red: '#E3342B', card: '#FFFFFF',
};
const L0 = 120, CW = 820;           // 内容左边界与宽度（右侧给抖音按钮留位）

/* ================================================================ 背景 */
const DOTS = (() => { const out = []; for (let y = 40; y < H; y += 44) for (let x = 22; x < W; x += 44) out.push([x, y]); return out; })();
function paperBg(g, t) {
  const { ctx } = g;
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(23,23,30,.07)';
  const dy = (t * 6) % 44;
  for (const [x, y] of DOTS) { ctx.beginPath(); ctx.arc(x, (y + dy) % H, 1.8, 0, TAU); ctx.fill(); }
  g.spot(W * 0.2 + Math.sin(t * 0.2) * 80, 560, 600, 0.10, '255,170,120');
  g.spot(W * 0.85 + Math.cos(t * 0.17) * 80, 1200, 640, 0.08, '120,150,255');
}

/* ================================================================ 绘图工具 */
const txt = (g, s, x, y, size, o = {}) => g.text(s, x, y, { size, weight: o.w ?? 900, fam: o.fam || 'sans', color: o.c || P.ink, align: o.align || 'center', alpha: o.a ?? 1, ls: o.ls ?? 0, italic: o.italic, base: o.base });
const tw = (g, s, size, o = {}) => g.measure(s, { size, weight: o.w ?? 900, fam: o.fam || 'sans', ls: o.ls ?? 0 });
/** 卡片：白底 + 黑描边 + 硬阴影。x,y 为左上角 */
function box(g, x, y, w, h, o = {}) {
  const ctx = g.ctx, r = o.r ?? 26, sh = o.sh ?? 10;
  ctx.save(); ctx.globalAlpha *= o.a ?? 1;
  if (sh) { g.rrect(x + sh * 0.8, y + sh, w, h, r); ctx.fillStyle = o.shc || P.ink; ctx.fill(); }
  g.rrect(x, y, w, h, r); ctx.fillStyle = o.fill || P.card; ctx.fill();
  if (o.lw !== 0) { ctx.lineWidth = o.lw || 4; ctx.strokeStyle = o.stroke || P.ink; ctx.stroke(); }
  ctx.restore();
}
/** 弹入：在 a 时刻以 outBack 缩放 + 上浮出现；fn 在 (cx,cy) 为原点的坐标系里画 */
function pop(g, t, a, cx, cy, fn, o = {}) {
  const d = o.d ?? 0.38, k = prog(t, a, a + d, E.out); if (k <= 0) return;
  const kb = prog(t, a, a + d, E.outBack), s = lerp(o.s0 ?? 0.72, 1, kb);
  const out = o.out ? 1 - prog(t, o.out, o.out + 0.3, E.in) : 1; if (out <= 0) return;
  const ctx = g.ctx; ctx.save(); ctx.globalAlpha *= k * out; ctx.translate(cx + (1 - k) * (o.dx ?? 0), cy + (1 - k) * (o.dy ?? 26)); ctx.scale(s, s); if (o.rot) ctx.rotate(o.rot); fn(); ctx.restore();
}
/** 荧光笔：从左往右刷出来 */
function hl(g, x, y, w, h, k, c = P.yel, a = 0.9) {
  if (k <= 0) return; const ctx = g.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + w * k, y); ctx.lineTo(x + w * k - 6, y + h); ctx.lineTo(x - 4, y + h + 3); ctx.closePath(); ctx.fill(); ctx.restore();
}
/** 带荧光笔的一行字（居中）：hiFrom..hiTo 为高亮字符区间 */
function hlLine(g, t, s, x, y, size, a, o = {}) {
  const w = tw(g, s, size, o), x0 = x - w / 2;
  if (o.hi) { const [i0, i1] = o.hi; const pre = tw(g, s.slice(0, i0), size, o), mid = tw(g, s.slice(i0, i1), size, o); hl(g, x0 + pre - 8, y - size * 0.18, mid + 16, size * 0.62, prog(t, a + (o.hd ?? 0.25), a + (o.hd ?? 0.25) + 0.35, E.out), o.hc || P.yel); }
  txt(g, s, x, y, size, o);
}
const stroke = (g, pts, k, o = {}) => { if (k <= 0) return; g.path(pts, clamp(k), { color: o.c || P.ink, lw: o.lw || 6, alpha: o.a ?? 1, dash: o.dash }); };
const check = (g, x, y, s, k, c = P.green) => stroke(g, [[x - s * 0.5, y], [x - s * 0.12, y + s * 0.38], [x + s * 0.55, y - s * 0.45]], k, { c, lw: s * 0.16 });
const cross = (g, x, y, s, k, c = P.red, lw) => { stroke(g, [[x - s, y - s], [x + s, y + s]], k * 2, { c, lw: lw || s * 0.28 }); stroke(g, [[x + s, y - s], [x - s, y + s]], k * 2 - 1, { c, lw: lw || s * 0.28 }); };
function arrow(g, x1, y1, x2, y2, k, o = {}) {
  if (k <= 0) return; const c = o.c || P.ink, lw = o.lw || 7;
  const ex = lerp(x1, x2, k), ey = lerp(y1, y2, k); g.line(x1, y1, ex, ey, { color: c, lw, dash: o.dash });
  const a = Math.atan2(y2 - y1, x2 - x1), hs = o.hs || 24;
  if (k > 0.6) { const ctx = g.ctx; ctx.save(); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(a - 0.5) * hs, ey - Math.sin(a - 0.5) * hs); ctx.lineTo(ex - Math.cos(a + 0.5) * hs, ey - Math.sin(a + 0.5) * hs); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
/** 胶囊标签 */
function tag(g, s, x, y, o = {}) {
  const size = o.size || 34, w = tw(g, s, size, { w: o.w ?? 900 }) + size * 1.2, h = size * 1.7, x0 = o.align === 'left' ? x : x - w / 2;
  box(g, x0, y - h / 2, w, h, { r: h / 2, fill: o.fill || P.ink, sh: o.sh ?? 0, lw: o.lw ?? 0, stroke: o.stroke });
  txt(g, s, x0 + w / 2, y + 2, size, { c: o.c || '#fff', w: o.w ?? 900 }); return w;
}
/** 太阳图标：k 升起程度（0 = 在地平线下） */
function sunIcon(g, x, y, r, t, o = {}) {
  const ctx = g.ctx, up = o.up ?? 1, cy = y + r * 1.1 * (1 - up);
  ctx.save(); if (o.clipY != null) { ctx.beginPath(); ctx.rect(x - r * 3, y - r * 3, r * 6, o.clipY - (y - r * 3)); ctx.clip(); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 0.3; g.line(x + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 1.25, x + Math.cos(a) * r * 1.55, cy + Math.sin(a) * r * 1.55, { color: o.ray || P.acc, lw: r * 0.12 }); }
  g.circle(x, cy, r, o.fill || P.acc, { stroke: P.ink, lw: 4 }); ctx.restore();
}
/** 小图标们（以 (0,0) 为中心） */
const ICON = {
  pause: (g, s = 1, c = P.acc) => { g.fillRR(-26 * s, -34 * s, 18 * s, 68 * s, 5 * s, c, { stroke: P.ink, lw: 3 }); g.fillRR(8 * s, -34 * s, 18 * s, 68 * s, 5 * s, c, { stroke: P.ink, lw: 3 }); },
  lock: (g, s = 1, c = P.ink) => { g.ctx.save(); g.ctx.lineWidth = 6 * s; g.ctx.strokeStyle = c; g.ctx.beginPath(); g.ctx.arc(0, -14 * s, 18 * s, Math.PI, TAU); g.ctx.stroke(); g.ctx.restore(); g.fillRR(-26 * s, -14 * s, 52 * s, 40 * s, 6 * s, c); },
  mag: (g, s = 1, c = P.ink) => { g.circle(0, 0, 22 * s, 'rgba(255,255,255,.6)', { stroke: c, lw: 6 * s }); g.line(16 * s, 16 * s, 34 * s, 34 * s, { color: c, lw: 8 * s }); },
  q: (g, s = 1, c = P.acc) => { g.circle(0, 0, 26 * s, c, { stroke: P.ink, lw: 3 }); txt(g, '?', 0, 2 * s, 36 * s, { c: '#fff' }); },
  ok: (g, s = 1) => { g.circle(0, 0, 26 * s, P.green, { stroke: P.ink, lw: 3 }); check(g, 0, 0, 30 * s, 1, '#fff'); },
  eyeOff: (g, s = 1) => { stroke(g, [...Array(21)].map((_, i) => { const u = i / 20; return [lerp(-34, 34, u) * s, Math.sin(u * Math.PI) * 14 * s]; }), 1, { lw: 6 * s }); for (const x of [-20, 0, 20]) g.line(x * s, 12 * s, x * 1.3 * s, 24 * s, { color: P.ink, lw: 4 * s }); },
  key: (g, s = 1) => { g.circle(-20 * s, 0, 14 * s, null, { stroke: P.ink, lw: 6 * s }); g.line(-6 * s, 0, 34 * s, 0, { color: P.ink, lw: 6 * s }); g.line(24 * s, 0, 24 * s, 12 * s, { color: P.ink, lw: 6 * s }); },
  book: (g, s = 1) => { g.fillRR(-46 * s, -60 * s, 92 * s, 120 * s, 8 * s, P.acc, { stroke: P.ink, lw: 4 }); g.fillRR(-46 * s, -60 * s, 16 * s, 120 * s, 4 * s, P.ink); g.line(-14 * s, -30 * s, 30 * s, -30 * s, { color: '#fff', lw: 4 * s }); g.line(-14 * s, -14 * s, 20 * s, -14 * s, { color: '#fff', lw: 4 * s }); },
};

/* ================================================================ 章节 / 顶栏 / 转场 */
const CH = [[0, '引子'], [18.4, '休谟之问'], [25.5, '两类知识'], [47.1, '经验的漏洞'], [61.0, '习惯是向导'], [78.4, '两类不确定'], [108.1, '怎么做决定'], [129.2, '总结']];
const chAt = (t) => { let i = 0; for (let j = 0; j < CH.length; j++) if (t >= CH[j][0]) i = j; return i; };
V.scene(0, DUR, (g, lt, s) => {
  const t = s.t, k = prog(t, 7.0, 7.5, E.out) * (1 - prog(t, 133.4, 133.8)); if (k <= 0) return;
  g.ctx.save(); g.ctx.globalAlpha *= k; g.ctx.translate(0, (1 - k) * -30);
  tag(g, 'VIBE知识大赏', L0, 246, { align: 'left', size: 28 });
  txt(g, '@zhiyusay', L0 + 270, 247, 26, { w: 700, c: P.sub, align: 'left' });
  const i = chAt(t), sw = prog(t, CH[i][0], CH[i][0] + 0.4, E.out), label = i ? `0${i} ${CH[i][1]}` : CH[i][1];
  txt(g, label, L0 + CW, 247 + (1 - sw) * 14, 34, { align: 'right', c: P.acc, a: sw });
  // 进度条：每章一段
  const segs = CH.slice(1), x0 = L0, tot = CW, gap = 8, sw2 = (tot - gap * (segs.length - 1)) / segs.length;
  segs.forEach(([a], j) => { const b = j + 1 < segs.length ? segs[j + 1][0] : DUR, f = prog(t, a, b, E.linear), x = x0 + j * (sw2 + gap);
    g.fillRR(x, 290, sw2, 10, 5, 'rgba(23,23,30,.12)'); if (f > 0) g.fillRR(x, 290, sw2 * f, 10, 5, j + 1 === i ? P.acc : P.ink); });
  g.ctx.restore();
}, { z: 45, fin: 0.01, fout: 0.01 });
// 章节擦除转场（整屏彩色板扫过，中间写着章节名）
const WIPE_C = [P.acc, P.blue, P.ink, P.acc, P.blue, P.ink, P.acc];
CH.slice(1).forEach(([t0, name], j) => {
  V.scene(t0 - 0.32, t0 + 0.34, (g, lt, s) => {
    const q = prog(s.t, t0 - 0.32, t0 + 0.34, E.inOut), x = lerp(-W - 200, W + 200, q);
    const ctx = g.ctx; ctx.save(); ctx.fillStyle = WIPE_C[j]; ctx.beginPath(); ctx.moveTo(x - 140, 0); ctx.lineTo(x + W + 40, 0); ctx.lineTo(x + W - 100, H); ctx.lineTo(x - 280, H); ctx.closePath(); ctx.fill();
    txt(g, `0${j + 1}`, x + W / 2 - 70, H / 2 - 110, 120, { c: 'rgba(255,255,255,.35)' });
    txt(g, name, x + W / 2 - 70, H / 2 + 20, 104, { c: '#fff' }); ctx.restore();
  }, { z: 40, fin: 0.01, fout: 0.01 });
  V.cue(t0 - 0.3, 'whoosh', 0.22);
});

/* ================================================================ 字幕：黑色粗体，关键词荧光笔 */
const runs = (str) => { const out = []; let hi = false, buf = ''; for (const ch of str) { if (ch === '{' || ch === '}') { if (buf) out.push([buf, hi]); buf = ''; hi = ch === '{'; } else buf += ch; } if (buf) out.push([buf, hi]); return out; };
V.scene(0, DUR, (g, lt, s) => {
  const t = s.t;
  for (const sb of window.SUBS) {
    const a = env(t, sb.a, sb.b, 0.15, 0.15); if (a <= 0) continue;
    const o = { size: 50, weight: 700, fam: 'sans' };
    const lines = g.wrap(sb.text, 840, o);
    lines.forEach((ln, li) => {
      const y = 1480 + (li - (lines.length - 1) / 2) * 70 + (1 - a) * 6, rs = runs(ln);
      const total = rs.reduce((w, [x]) => w + g.measure(x, o), 0); let cx = 540 - total / 2;
      for (const [x, hi] of rs) { const w = g.measure(x, o); if (hi) hl(g, cx - 4, y - 14, w + 8, 34, prog(t, sb.a + 0.1, sb.a + 0.4), P.yel, a * 0.95); g.text(x, cx, y, { ...o, align: 'left', color: P.ink, alpha: a }); cx += w; }
    });
  }
}, { z: 50, fin: 0.01, fout: 0.01 });

/* ================================================================
 * 开场 0–7：没有 100% 的把握 → 先放一放？ → 想清楚中 99%
 * ================================================================ */
V.scene(0, 7.3, (g, lt, s) => {
  const t = s.t, up = prog(t, 3.4, 3.9, E.inOut);
  pop(g, t, 0.05, 540, 420, () => { tag(g, 'VIBE知识大赏', 0, 0, { size: 34, fill: P.ink }); txt(g, '哲学 × 决策', 0, 70, 32, { w: 700, c: P.sub }); }, { out: 3.4 });
  g.ctx.save(); g.ctx.translate(540, lerp(0, -170, up)); g.ctx.translate(0, 800); g.ctx.scale(lerp(1, 0.66, up), lerp(1, 0.66, up)); g.ctx.translate(-540, -800);
  pop(g, t, 0.6, 540, 600, () => txt(g, '没有', 0, 0, 130), { s0: 1.5 });
  const n = Math.round(100 * prog(t, 1.7, 2.25, E.out));
  pop(g, t, 1.7, 540, 800, () => { hl(g, -250, 30, 500, 80, prog(t, 2.2, 2.5, E.out)); txt(g, `${n}%`, 0, 0, 260, { c: P.acc }); }, { s0: 1.6, d: 0.3 });
  pop(g, t, 2.4, 540, 1000, () => txt(g, '的把握', 0, 0, 130), { s0: 1.5 });
  g.ctx.restore();
  // 先放一放？
  pop(g, t, 4.3, 540, 1010, () => { const w = tw(g, '先放一放？', 92) + 100; g.ctx.translate(-w / 2 + 34, 0); ICON.pause(g, 1.3); txt(g, '先放一放？', 66, 0, 92, { align: 'left' }); }, { dx: 0 });
  // 想清楚了再说：卡在 99%
  pop(g, t, 5.4, 540, 1200, () => {
    box(g, -400, -90, 800, 180, { r: 40 });
    const f = 0.99 * prog(t, 5.6, 6.5, E.out); g.fillRR(-360, 14, 720, 42, 21, 'rgba(23,23,30,.08)'); g.fillRR(-360, 14, Math.max(42, 720 * f), 42, 21, P.acc);
    txt(g, '想清楚了再说…', -360, -36, 40, { w: 900, align: 'left' });
    txt(g, `${Math.round(f * 100)}%`, 360, -36, 44, { align: 'right', c: P.acc, a: t > 6.5 ? 0.5 + 0.5 * Math.sin(t * 12) : 1 });
  });
}, { z: 2, fin: 0.01, fout: 0.3 });
V.cue(0.05, 'pop', 0.5).cue(0.6, 'thud', 0.45).cue(1.7, 'counter', { dur: 0.55, gain: 0.35 }).cue(1.7, 'impact', 0.35).cue(2.2, 'pen', { dur: 0.3, gain: 0.4 })
  .cue(2.4, 'thud', 0.4).cue(3.4, 'slide', 0.4).cue(4.3, 'pop', 0.5).cue(5.4, 'pop', 0.45).cue(5.6, 'rise', 0.25).cue(6.5, 'wrong', 0.35);

/* ================================================================
 * 7–10.3 招聘软件：看了三个月，又关掉
 * ================================================================ */
V.scene(7.0, 10.4, (g, lt, s) => {
  const t = s.t, away = prog(t, 9.6, 10.3, E.in);
  g.ctx.save(); g.ctx.translate(0, away * 900); g.ctx.rotate(away * 0.15);
  pop(g, t, 7.0, 500, 850, () => {
    box(g, -200, -340, 400, 680, { r: 54, fill: P.ink, sh: 14 });
    const on = 1 - prog(t, 9.25, 9.4);
    g.ctx.save(); g.rrect(-176, -300, 352, 610, 30); g.ctx.clip();
    g.ctx.fillStyle = on > 0.5 ? '#FFFFFF' : '#0E0E14'; g.ctx.fillRect(-176, -300, 352, 610);
    if (on > 0.5) {
      txt(g, '招聘', -146, -260, 36, { align: 'left' }); g.fillRR(40, -282, 106, 40, 20, P.accSoft); txt(g, '筛选', 93, -262, 24, { c: P.acc });
      const sc = (t - 7.4) * 140;
      for (let i = 0; i < 9; i++) { const y = -200 + i * 112 - (sc % 112) - 0; const yy = ((y + 300 + 9 * 112) % (9 * 112)) - 300 + 60;
        g.fillRR(-156, yy - 46, 312, 96, 16, '#F6F3EE');
        g.fillRR(-136, yy - 28, 150 + (i % 3) * 20, 18, 9, '#2A2A33'); g.fillRR(-136, yy + 4, 110, 14, 7, '#C8C2B8');
        g.fillRR(56, yy - 18, 84, 38, 19, P.acc); txt(g, '投递', 98, yy + 1, 22, { c: '#fff' }); }
    } else { cross(g, 0, 0, 40, prog(t, 9.3, 9.6), '#fff', 10); }
    g.ctx.restore();
  }, { d: 0.42 });
  // 月份翻页
  pop(g, t, 8.3, 800, 520, () => {
    box(g, -110, -80, 220, 160, { r: 20 }); g.fillRR(-110, -80, 220, 50, 20, P.acc); g.ctx.fillStyle = P.acc; g.ctx.fillRect(-110, -50, 220, 20);
    const m = t < 8.55 ? 1 : t < 8.8 ? 2 : 3; txt(g, '看了', 0, -55, 26, { c: '#fff' }); txt(g, `${m}个月`, 0, 25, 54);
  });
  g.ctx.restore();
}, { z: 2, fin: 0.25 });
V.cue(7.0, 'pop', 0.5).cue(7.4, 'slide', 0.3).cue(8.3, 'flip', 0.4, 0.4).cue(8.55, 'flip', 0.35, 0.4).cue(8.8, 'flip', 0.35, 0.4).cue(9.25, 'click', 0.6).cue(9.6, 'whoosh', 0.35);

/* ================================================================
 * 10.2–14.3 利弊两栏：3 : 3
 * ================================================================ */
const PROS = ['薪资更高', '成长更快', '换个环境'], CONS = ['不够稳定', '要重新适应', '前景未知'];
V.scene(10.2, 14.4, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 10.3, 540, 820, () => {
    box(g, -410, -300, 820, 600);
    g.fillRR(-406, -296, 406, 110, 22, P.greenSoft); g.fillRR(0, -296, 406, 110, 22, P.accSoft);
    txt(g, '利', -205, -240, 64, { c: P.green }); txt(g, '弊', 205, -240, 64, { c: P.red });
    g.line(0, -296, 0, 296, { color: P.ink, lw: 4 }); g.line(-406, -186, 406, -186, { color: P.ink, lw: 4 });
    PROS.forEach((p, i) => pop(g, t, 12.0 + i * 0.22, -205, -100 + i * 120, () => { g.circle(-130, 0, 14, P.green); txt(g, p, -100, 2, 44, { align: 'left', w: 700 }); }, { d: 0.3, dx: -40, dy: 0 }));
    CONS.forEach((p, i) => pop(g, t, 13.0 + i * 0.22, 205, -100 + i * 120, () => { g.circle(-150, 0, 14, P.red); txt(g, p, -120, 2, 44, { align: 'left', w: 700 }); }, { d: 0.3, dx: 40, dy: 0 }));
  });
  pop(g, t, 13.75, 540, 1180, () => { box(g, -170, -60, 340, 120, { fill: P.yel, r: 60 }); txt(g, '3 : 3 打平', 0, 2, 52); }, { rot: -0.04 });
}, { z: 2, fin: 0.25 });
V.cue(10.3, 'pop', 0.5).cue(10.6, 'pen', { dur: 0.6, gain: 0.3 });
[0, 1, 2].forEach((i) => V.cue(12.0 + i * 0.22, 'pop', 0.4, -0.5)); [0, 1, 2].forEach((i) => V.cue(13.0 + i * 0.22, 'pop', 0.4, 0.5));
V.cue(13.75, 'thud', 0.22);

/* ================================================================
 * 14.2–18.6 心里踏实度 99% → 执行按钮锁住
 * ================================================================ */
function meter(g, t, a, b, o = {}) {
  box(g, -410, -110, 820, 220);
  txt(g, '心里踏实度', -370, -50, 46, { align: 'left' });
  const f = 0.99 * prog(t, a, b, E.out);
  g.fillRR(-370, 10, 740, 56, 28, 'rgba(23,23,30,.08)'); g.fillRR(-370, 10, Math.max(56, 740 * f), 56, 28, P.acc);
  txt(g, `${Math.round(f * 100)}%`, 370, -50, 56, { align: 'right', c: P.acc, a: t > b ? 0.55 + 0.45 * Math.sin(t * 10) : 1 });
}
V.scene(14.2, 18.7, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 14.3, 540, 700, () => meter(g, t, 15.5, 17.0));
  pop(g, t, 17.3, 540, 1060, () => {
    const sh = t > 17.75 ? Math.sin((t - 17.75) * 40) * 10 * Math.exp(-(t - 17.75) * 6) : 0;
    g.ctx.translate(sh, 0);
    box(g, -200, -80, 400, 160, { fill: '#D6D0C6', r: 80 }); txt(g, '执行', 30, 2, 64, { c: '#8C867C' }); g.ctx.save(); g.ctx.translate(-90, 6); ICON.lock(g, 1.1, '#8C867C'); g.ctx.restore();
    // 手指点击
    const tap = prog(t, 17.5, 17.75, E.inOut); g.ctx.save(); g.ctx.translate(lerp(240, 120, tap), lerp(160, 50, tap)); g.circle(0, 0, 26, 'rgba(255,255,255,.9)', { stroke: P.ink, lw: 4 }); g.ctx.restore();
  });
}, { z: 2, fin: 0.25 });
V.cue(14.3, 'pop', 0.45).cue(15.5, 'counter', { dur: 1.5, gain: 0.25 }).cue(17.0, 'tick', 0.4).cue(17.3, 'pop', 0.45).cue(17.75, 'wrong', 0.5);

/* ================================================================
 * 01 休谟之问 18.4–25.5
 * ================================================================ */
V.scene(18.3, 22.6, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 18.55, 540, 600, () => {
    box(g, -410, -150, 820, 300);
    g.circle(-260, 0, 100, P.ink); txt(g, '休谟', -260, 4, 64, { fam: 'serif', c: P.yel });
    txt(g, '大卫·休谟', -120, -60, 70, { align: 'left' });
    txt(g, 'David Hume  1711–1776', -120, 10, 36, { fam: 'en', italic: true, w: 500, align: 'left', c: P.sub });
    tag(g, '苏格兰哲学家', -120, 76, { align: 'left', size: 28, fill: P.blue });
  });
  pop(g, t, 19.15, 540, 960, () => {
    box(g, -410, -130, 820, 260);
    g.ctx.save(); g.ctx.translate(-290, 0); ICON.book(g, 1.4); g.ctx.restore();
    txt(g, '《人类理解研究》', -190, -30, 62, { align: 'left', fam: 'serif' });
    txt(g, '1748 年出版', -190, 52, 38, { align: 'left', w: 700, c: P.sub });
  });
  pop(g, t, 20.6, 640, 1220, () => { box(g, -190, -60, 380, 120, { fill: P.yel, r: 8, sh: 6 }); txt(g, '一个有点傻的问题', 0, 2, 38, { fam: 'hand', w: 700 }); }, { rot: 0.05 });
}, { z: 2, fin: 0.25 });
V.cue(18.55, 'pop', 0.5).cue(19.15, 'paper', 0.5).cue(20.6, 'pop', 0.45, 0.3);

V.scene(22.4, 25.8, (g, lt, s) => {
  const t = s.t;
  const rise = prog(t, 23.9, 25.0, E.out);
  g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(0, 0, W, 1160); g.ctx.clip();
  sunIcon(g, 540, 1160, 200, t, { up: rise * 0.85 }); g.ctx.restore();
  g.line(L0 - 40, 1160, L0 + CW + 40, 1160, { color: P.ink, lw: 6, k: prog(t, 22.5, 23.0) });
  pop(g, t, 22.5, 540, 520, () => txt(g, '我们凭什么相信', 0, 0, 72, { w: 700 }));
  pop(g, t, 23.9, 540, 690, () => hlLine(g, t, '明天太阳', 0, 0, 140, 23.9, { hi: [0, 2] }), { s0: 1.4 });
  pop(g, t, 24.6, 540, 860, () => txt(g, '还会升起来？', 0, 0, 120, { c: P.acc }), { s0: 1.4 });
}, { z: 2, fin: 0.25 });
V.cue(22.5, 'pop', 0.4).cue(23.9, 'impact', 0.4).cue(23.9, 'rise', 0.3).cue(24.6, 'thud', 0.4);

/* ================================================================
 * 02 两类知识 25.5–47.1
 * ================================================================ */
const MATH = [['3', 28.5], ['×', 28.7], ['5', 28.9], ['=', 29.1], ['30', 29.4], ['÷', 29.7], ['2', 29.9]];
V.scene(25.5, 38.0, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 25.9, 540, 420, () => hlLine(g, t, '人的知识，分两类', 0, 0, 76, 25.9, { hi: [6, 8], hd: 1.0 }));
  // 第一类
  pop(g, t, 27.4, 540, 700, () => {
    box(g, -410, -170, 820, 340, { fill: P.blueSoft });
    tag(g, '第一类', -380, -122, { align: 'left', size: 30, fill: P.blue });
    txt(g, '观念之间的关系', -230, -120, 40, { align: 'left', w: 700, c: P.sub });
    const SZ = 92, GAP = 18; let x = -MATH.reduce((w_, [tk]) => w_ + tw(g, tk, SZ) + GAP, -GAP) / 2; for (const [tok, a] of MATH) { const w = tw(g, tok, SZ) + GAP; const k = prog(t, a, a + 0.25, E.outBack);
      if (k > 0) { g.ctx.save(); g.ctx.translate(x + w / 2, 0); g.ctx.scale(lerp(0.5, 1, k), lerp(0.5, 1, k)); txt(g, tok, -GAP / 2, 0, SZ, { c: tok === '=' ? P.blue : P.ink, a: clamp(k * 2) }); g.ctx.restore(); } x += w; }
    pop(g, t, 30.5, 0, 112, () => { g.ctx.save(); g.ctx.translate(-190, 0); ICON.ok(g, 0.9); g.ctx.restore(); txt(g, '在脑子里算清就行', -150, 2, 42, { align: 'left', w: 700, c: P.green }); });
  });
  // 第二类
  pop(g, t, 32.2, 540, 1110, () => {
    box(g, -410, -170, 820, 340, { fill: P.accSoft });
    tag(g, '第二类', -380, -122, { align: 'left', size: 30, fill: P.acc });
    txt(g, '实际发生的事', -230, -120, 40, { align: 'left', w: 700, c: P.sub });
    pop(g, t, 33.6, 0, 6, () => { g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(-400, -100, 300, 140); g.ctx.clip(); sunIcon(g, -280, 40, 46, t, { up: 0.7 + 0.3 * Math.sin(t * 2) }); g.ctx.restore(); g.line(-360, 40, -200, 40, { color: P.ink, lw: 5 });
      txt(g, '明早太阳出不出来？', -170, 6, 54, { align: 'left' }); });
    pop(g, t, 35.8, 160, 96, () => { box(g, -230, -36, 460, 72, { fill: P.yel, r: 36, sh: 5, lw: 3 }); txt(g, '反面也完全说得通', 0, 2, 36, { w: 900 }); }, { rot: -0.03 });
  });
}, { z: 2, fin: 0.3 });
V.cue(25.9, 'pop', 0.45).cue(26.9, 'pen', { dur: 0.35, gain: 0.35 }).cue(27.4, 'pop', 0.45, -0.2);
MATH.forEach(([, a], i) => V.cue(a, 'tick', 0.45, -0.5 + i * 0.15));
V.cue(30.5, 'correct', 0.5).cue(32.2, 'pop', 0.45, 0.2).cue(33.6, 'rise', 0.3).cue(35.8, 'pop', 0.45, 0.3);

V.scene(37.8, 47.3, (g, lt, s) => {
  const t = s.t;
  const mini = (up, label, c) => { box(g, -195, -190, 390, 380, { fill: c });
    g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(-195, -190, 390, 250); g.ctx.clip();
    if (up) sunIcon(g, 0, 40, 64, t, { up: 1 }); else { for (const [x, y] of [[-110, -120], [-40, -60], [90, -130], [130, -40], [20, -150]]) g.circle(x, y, 5, P.blue); g.circle(60, -90, 34, '#fff', { stroke: P.ink, lw: 4 }); g.circle(78, -100, 30, c); }
    g.ctx.restore(); g.line(-170, 60, 170, 60, { color: P.ink, lw: 5 });
    txt(g, label, 0, 128, 42); };
  pop(g, t, 39.7, 315, 700, () => mini(true, '太阳明天升起', P.accSoft));
  pop(g, t, 38.0, 765, 700, () => mini(false, '太阳明天不升起', P.blueSoft));
  pop(g, t, 40.5, 540, 700, () => { g.circle(0, 0, 44, P.yel, { stroke: P.ink, lw: 4 }); txt(g, '=', 0, 2, 64); });
  pop(g, t, 41.3, 315, 950, () => { ICON.ok(g, 1); txt(g, '不矛盾', 40, 2, 40, { align: 'left', c: P.green }); }, { d: 0.3 });
  pop(g, t, 41.45, 765, 950, () => { ICON.ok(g, 1); txt(g, '不矛盾', 40, 2, 40, { align: 'left', c: P.green }); }, { d: 0.3 });
  // 不是在比可能性
  pop(g, t, 42.2, 540, 1180, () => {
    box(g, -410, -120, 820, 240);
    txt(g, '可能性', -370, -70, 34, { align: 'left', w: 700, c: P.sub });
    const f = prog(t, 42.4, 43.1, E.out); g.fillRR(-370, -30, 600 * f, 44, 10, P.acc); g.fillRR(-370, 40, 26 * f, 44, 10, P.blue);
    txt(g, '升起', 250, -8, 32, { align: 'left', w: 700, a: f }); txt(g, '不升起', -330, 62, 32, { align: 'left', w: 700, a: f });
    const kx = prog(t, 43.4, 43.8); if (kx > 0) { g.ctx.save(); g.ctx.globalAlpha *= kx; g.fillRR(-410, -120, 820, 240, 26, 'rgba(244,239,230,.55)'); g.ctx.restore(); }
    cross(g, 0, 0, 70, kx);
    pop(g, t, 43.6, 220, -96, () => { box(g, -150, -34, 300, 68, { fill: P.red, r: 34, sh: 0, lw: 0 }); txt(g, '不是在比概率', 0, 2, 32, { c: '#fff' }); });
  }, { out: 44.0 });
  // 而是：不自相矛盾 → 推理证明不了它是假的
  pop(g, t, 44.15, 540, 1180, () => {
    box(g, -410, -120, 820, 240, { fill: P.ink });
    txt(g, '而是：它不自相矛盾', 0, -40, 56, { c: '#fff' });
    txt(g, '→ 光靠推理，证明不了它是假的', 0, 50, 40, { c: P.yel, w: 700, a: prog(t, 45.9, 46.3) });
  });
}, { z: 2, fin: 0.3 });
V.cue(38.0, 'pop', 0.5, 0.4).cue(39.7, 'pop', 0.5, -0.4).cue(40.5, 'ding', 0.4).cue(41.3, 'correct', 0.45, -0.3).cue(41.45, 'correct', 0.4, 0.3)
  .cue(42.2, 'pop', 0.4).cue(42.4, 'slide', 0.3).cue(43.4, 'wrong', 0.5).cue(44.15, 'flip', 0.45).cue(45.9, 'ding', 0.4);

/* ================================================================
 * 03 经验的漏洞 47.1–61
 * ================================================================ */
V.scene(47.1, 61.2, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 47.3, 540, 420, () => { txt(g, '再往下推一层', -30, 0, 72); arrow(g, 250, -36, 250, 36, prog(t, 47.7, 48.1), { c: P.acc, lw: 9, hs: 30 }); });
  // 过去
  pop(g, t, 49.3, 540, 610, () => {
    box(g, -410, -110, 820, 220);
    tag(g, '过去', -380, -66, { align: 'left', size: 30, fill: P.ink });
    txt(g, '每天，太阳都升起', -250, -64, 40, { align: 'left', w: 700 });
    const ps = prog(t, 49.4, 50.9, E.linear);
    for (let i = 0; i < 9; i++) { const k = clamp(ps * 9 - i); if (k <= 0) continue; const x = -350 + i * 82;
      g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(x - 40, -20, 80, 80); g.ctx.clip(); sunIcon(g, x, 50, 22, t, { up: E.out(k) }); g.ctx.restore(); g.line(x - 34, 50, x + 34, 50, { color: P.ink, lw: 4 }); }
    pop(g, t, 58.0, 300, -66, () => { box(g, -90, -26, 180, 52, { fill: P.green, r: 26, sh: 0, lw: 0 }); txt(g, '一直好用', 0, 2, 28, { c: '#fff' }); });
  });
  // 推论箭头
  const ka = prog(t, 51.3, 51.7), brk = prog(t, 51.8, 52.1, E.out) * (1 - prog(t, 52.9, 53.3, E.out));
  if (ka > 0) {
    g.line(540, 730, 540, lerp(730, 800, ka), { color: P.ink, lw: 8 }); arrow(g, 540, 800 + brk * 30, 540, 870, ka, { lw: 8 });
    if (brk > 0) { cross(g, 540, 800, 34, brk); txt(g, '推不出！', 600, 800, 44, { align: 'left', c: P.red, a: brk }); }
    const fx = prog(t, 52.9, 53.3); if (fx > 0) txt(g, '经验推断', 600, 800, 40, { align: 'left', w: 700, c: P.sub, a: fx });
  }
  // 明天
  pop(g, t, 51.3, 540, 970, () => {
    box(g, -410, -95, 820, 190, { fill: P.accSoft });
    tag(g, '明天', -380, -46, { align: 'left', size: 30, fill: P.acc });
    txt(g, '太阳也会升起？', -250, -44, 40, { align: 'left', w: 700 });
    g.ctx.save(); g.ctx.setLineDash([10, 10]); g.ctx.lineWidth = 5; g.ctx.strokeStyle = P.acc; g.ctx.beginPath(); g.ctx.arc(-40, 60, 46, Math.PI, TAU); g.ctx.stroke(); g.ctx.restore();
    g.line(-120, 60, 40, 60, { color: P.ink, lw: 4 }); txt(g, '?', 70, 30, 70, { c: P.acc });
  });
  // 藏着的前提
  pop(g, t, 55.4, 540, 1210, () => {
    box(g, -410, -80, 820, 160, { fill: P.yel });
    txt(g, '藏着的前提', -380, -34, 32, { align: 'left', w: 900, c: P.sub });
    txt(g, '未来，会像过去一样', -380, 24, 56, { align: 'left' });
    g.stamp(250, 10, '从未被证明', { k: prog(t, 59.6, 59.95), size: 36, color: P.red, rot: -0.12 });
  }, { dx: -300, dy: 0 });
}, { z: 2, fin: 0.3 });
V.cue(47.3, 'pop', 0.45).cue(47.7, 'zoom', 0.3).cue(49.3, 'pop', 0.45).cue(49.4, 'counter', { dur: 1.5, gain: 0.3 })
  .cue(51.3, 'pop', 0.4).cue(51.8, 'snap', 0.5).cue(51.85, 'wrong', 0.4).cue(52.9, 'pen', { dur: 0.4, gain: 0.3 })
  .cue(55.4, 'slide', 0.5, -0.4).cue(58.0, 'correct', 0.4, 0.3).cue(59.6, 'stamp', 0.55);

/* ================================================================
 * 04 习惯是向导 61–78.4
 * ================================================================ */
const NOHABIT = [[67.9, '眼前之外的事，一无所知', 'eyeOff'], [70.1, '手段，配不到目的上', 'key'], [72.4, '一切行动，都会停下', 'pause']];
V.scene(61.0, 75.0, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 61.2, 540, 660, () => { txt(g, '那就……什么都别做？', 0, 0, 72); cross(g, 0, 0, 90, prog(t, 62.3, 62.6)); }, { out: 62.9 });
  pop(g, t, 63.2, 540, 470, () => { g.ctx.save(); g.ctx.translate(-215, 0); ICON.book(g, 0.6); g.ctx.restore(); txt(g, '同一本书里，他说', 30, 0, 44, { w: 700, c: P.sub }); }, { out: 66.6 });
  // 名言卡
  const shrink = prog(t, 66.8, 67.4, E.inOut);
  g.ctx.save(); g.ctx.translate(540, lerp(760, 470, shrink)); g.ctx.scale(lerp(1, 0.62, shrink), lerp(1, 0.62, shrink));
  pop(g, t, 64.7, 0, 0, () => {
    box(g, -410, -210, 820, 420, { fill: P.ink, shc: P.acc });
    txt(g, '“', -340, -130, 160, { fam: 'serif', c: P.acc });
    txt(g, '习惯，是人生', 0, -60, 84, { fam: 'serif', c: '#fff' });
    g.ctx.save(); hl(g, -260, 60, 520, 40, prog(t, 65.6, 66.1, E.out), P.acc, 0.9); g.ctx.restore();
    txt(g, '最重要的向导', 0, 50, 84, { fam: 'serif', c: '#fff' });
    txt(g, '—— 休谟《人类理解研究》', 380, 150, 30, { align: 'right', w: 500, c: '#B9B4AA' });
  }, { s0: 0.85 });
  g.ctx.restore();
  // 没有习惯会怎样
  pop(g, t, 66.9, 540, 680, () => hlLine(g, t, '如果没有习惯：', 0, 0, 58, 66.9, { hi: [2, 6], hc: P.accSoft }));
  NOHABIT.forEach(([a, label, ic], i) => pop(g, t, a, 540, 830 + i * 150, () => {
    box(g, -410, -60, 820, 120, { sh: 6 });
    g.ctx.save(); g.ctx.translate(-340, 0); ICON[ic](g, 1.1); g.ctx.restore();
    txt(g, label, -270, 2, 48, { align: 'left' });
    if (i === 2) { const k = prog(t, 73.8, 74.2); if (k > 0) txt(g, 'STOP', 330, 2, 40, { c: P.red, a: k }); }
  }, { dx: 200, dy: 0 }));
}, { z: 2, fin: 0.3 });
V.cue(61.2, 'pop', 0.45).cue(62.3, 'wrong', 0.45).cue(63.2, 'paper', 0.4).cue(64.7, 'flip', 0.5).cue(65.6, 'pen', { dur: 0.5, gain: 0.35 })
  .cue(66.8, 'slide', 0.4).cue(66.9, 'pop', 0.4);
NOHABIT.forEach(([a], i) => V.cue(a, 'pop', 0.45, 0.4));
V.cue(73.8, 'thud', 0.45);

V.scene(74.8, 78.6, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 75.0, 540, 620, () => { box(g, -410, -90, 820, 180, { fill: P.yel }); txt(g, '脚下那点确定', 0, 2, 76); });
  pop(g, t, 76.2, 540, 830, () => { txt(g, '=', -300, 0, 110, { c: P.green }); txt(g, '习惯给的', 60, 2, 84, { c: P.green }); }, { dx: 160, dy: 0 });
  pop(g, t, 77.2, 540, 1010, () => { txt(g, '≠', -300, 0, 110, { c: P.red }); txt(g, '保证给的', 60, 2, 84, { c: P.mute }); g.line(-110, 6, 230, 6, { color: P.red, lw: 9, k: prog(t, 77.6, 77.9) }); }, { dx: 160, dy: 0 });
}, { z: 2, fin: 0.25 });
V.cue(75.0, 'pop', 0.5).cue(76.2, 'correct', 0.45).cue(77.2, 'pop', 0.4).cue(77.6, 'snap', 0.45);

/* ================================================================
 * 05 两类不确定 78.4–108.1
 * ================================================================ */
const CHECKABLE = [[83.1, '合同怎么写'], [83.95, '这家公司去年的账'], [86.3, '这个人过去怎么做事']];
const UNKNOWN = [[91.1, '换个城市，能不能适应'], [93.0, '三年后，这行还在不在'], [94.8, '一个人，会不会变']];
V.scene(78.4, 100.2, (g, lt, s) => {
  const t = s.t, merge = prog(t, 98.6, 99.6, E.inOut);
  pop(g, t, 78.6, 540, 420, () => hlLine(g, t, '生活里的不确定，也分两类', 0, 0, 62, 80.6, { hi: [10, 12], hd: 0.6 }));
  // 能查的
  g.ctx.save(); g.ctx.globalAlpha *= 1 - merge; g.ctx.translate(0, merge * 220);
  pop(g, t, 81.9, 540, 690, () => {
    box(g, -410, -190, 820, 380, { fill: P.greenSoft });
    tag(g, '能查的', -380, -142, { align: 'left', size: 32, fill: P.green });
    CHECKABLE.forEach(([a, label], i) => pop(g, t, a, -360, -50 + i * 90, () => {
      const found = prog(t, a + 0.45, a + 0.7);
      g.ctx.save(); g.ctx.translate(0, 0); if (found < 1) ICON.mag(g, 0.8); g.ctx.restore(); if (found > 0) { g.ctx.save(); g.ctx.scale(found, found); ICON.ok(g, 0.9); g.ctx.restore(); }
      txt(g, label, 50, 2, 44, { align: 'left', w: 700 });
    }, { d: 0.3, dx: -30, dy: 0 }));
    pop(g, t, 87.9, 220, -142, () => { box(g, -170, -32, 340, 64, { fill: P.ink, r: 32, sh: 0, lw: 0 }); txt(g, '查到水落石出', 0, 2, 32, { c: P.yel }); });
  });
  g.ctx.restore();
  // 查不出的
  g.ctx.save(); g.ctx.globalAlpha *= 1 - merge; g.ctx.translate(0, -merge * 200);
  pop(g, t, 89.8, 540, 1110, () => {
    box(g, -410, -190, 820, 380, { fill: P.accSoft });
    tag(g, '查不出的', -380, -142, { align: 'left', size: 32, fill: P.acc });
    UNKNOWN.forEach(([a, label], i) => pop(g, t, a, -360, -50 + i * 90, () => {
      g.ctx.save(); g.ctx.scale(0.9 + 0.08 * Math.sin(t * 5 + i), 0.9 + 0.08 * Math.sin(t * 5 + i)); ICON.q(g, 1); g.ctx.restore();
      txt(g, label, 50, 2, 44, { align: 'left', w: 700 });
    }, { d: 0.3, dx: -30, dy: 0 }));
    pop(g, t, 96.3, 150, -142, () => { const still = prog(t, 97.4, 97.6); const n = Math.max(1, Math.round(100 * prog(t, 96.4, 97.1, E.linear)));
      box(g, -220, -32, 440, 64, { fill: still > 0.5 ? P.yel : P.ink, r: 32, sh: 0, lw: still > 0.5 ? 3 : 0 }); txt(g, still > 0.5 ? '查了 100 遍，还在原地' : `查了 ${n} 遍`, 0, 2, 32, { c: still > 0.5 ? P.ink : '#fff' }); });
    // 放大镜来回扫
    const kq = env(t, 96.3, 97.6, 0.2, 0.3); if (kq > 0) { g.ctx.save(); g.ctx.globalAlpha *= kq; g.ctx.translate(Math.sin((t - 96.3) * 12) * 260, 40 + Math.cos((t - 96.3) * 8) * 60); ICON.mag(g, 1.6, P.ink); g.ctx.restore(); }
  });
  g.ctx.restore();
}, { z: 2, fin: 0.3 });
V.cue(78.6, 'pop', 0.4).cue(80.6, 'pen', { dur: 0.35, gain: 0.35 }).cue(81.9, 'pop', 0.5, -0.2);
CHECKABLE.forEach(([a]) => { V.cue(a, 'pop', 0.35, -0.4); V.cue(a + 0.45, 'correct', 0.35, -0.4); });
V.cue(87.9, 'ding', 0.45).cue(89.8, 'pop', 0.5, 0.2);
UNKNOWN.forEach(([a]) => V.cue(a, 'bubble', 0.45, 0.3));
V.cue(96.3, 'counter', { dur: 0.8, gain: 0.35 }).cue(96.3, 'slide', 0.3, -0.3).cue(96.8, 'slide', 0.3, 0.3).cue(97.4, 'wrong', 0.4).cue(98.6, 'whoosh', 0.5);

// 混在一起：没有保证 ⇒ 不该动（错的等号）
V.scene(99.8, 104.0, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 100.1, 540, 430, () => txt(g, '代价是——', 0, 0, 64, { c: P.sub }));
  pop(g, t, 101.0, 540, 640, () => { box(g, -300, -90, 600, 180, { fill: P.blueSoft }); txt(g, '没有保证', 0, 2, 84); });
  arrow(g, 540, 760, 540, 920, prog(t, 102.0, 102.5), { lw: 12, hs: 40 });
  pop(g, t, 102.9, 540, 1050, () => { box(g, -300, -90, 600, 180, { fill: P.accSoft }); txt(g, '不该动', 0, 2, 84, { c: P.red }); });
  const kx = prog(t, 103.25, 103.5); if (kx > 0) { cross(g, 540, 840, 70, kx); pop(g, t, 103.3, 760, 840, () => { box(g, -140, -34, 280, 68, { fill: P.red, r: 34, sh: 0, lw: 0 }); txt(g, '错误推理', 0, 2, 34, { c: '#fff' }); }); }
}, { z: 2, fin: 0.25 });
V.cue(100.1, 'pop', 0.35).cue(101.0, 'pop', 0.5).cue(102.0, 'slide', 0.35).cue(102.9, 'thud', 0.45).cue(103.25, 'stamp', 0.45);

// 日子往前走：日历狂翻，你还在原地，等一个不会来的确认
V.scene(103.8, 108.3, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 103.9, 540, 640, () => {
    box(g, -220, -200, 440, 400); g.fillRR(-220, -200, 440, 110, 26, P.acc); g.ctx.fillStyle = P.acc; g.ctx.fillRect(-220, -130, 440, 40);
    const d = Math.max(1, Math.round(365 * prog(t, 104.0, 106.0, E.in))); txt(g, '日子往前走', 0, -148, 36, { c: '#fff' });
    txt(g, `第 ${d} 天`, 0, 60, 96);
    for (let i = 0; i < 3; i++) { const q = ((t - 104) * 4 + i / 3) % 1; if (t < 106) { g.ctx.save(); g.ctx.globalAlpha *= 1 - q; g.ctx.translate(0, -90); g.ctx.rotate(-q * 0.6); g.fillRR(-200 + q * 80, -q * 260, 400, 280, 16, '#fff', { stroke: P.ink, lw: 3 }); g.ctx.restore(); } }
  });
  pop(g, t, 104.9, 540, 980, () => { g.circle(0, -20, 40, P.ink); g.ctx.fillStyle = P.ink; g.ctx.beginPath(); g.ctx.moveTo(-34, 0); g.ctx.lineTo(0, 70); g.ctx.lineTo(34, 0); g.ctx.fill(); g.circle(0, -20, 16, P.bg); txt(g, '你，还在原地', 70, 0, 52, { align: 'left' }); }, { dx: 0 });
  pop(g, t, 106.2, 540, 1200, () => {
    box(g, -320, -60, 640, 120, { r: 60 });
    g.ctx.save(); g.ctx.translate(-250, 0); g.ctx.rotate(t * 5); g.ctx.lineWidth = 8; g.ctx.strokeStyle = P.acc; g.ctx.lineCap = 'round'; g.ctx.beginPath(); g.ctx.arc(0, 0, 28, 0, 4.4); g.ctx.stroke(); g.ctx.restore();
    txt(g, '等待确认……', -190, 2, 48, { align: 'left', w: 700, c: P.sub });
  });
}, { z: 2, fin: 0.25 });
V.cue(103.9, 'pop', 0.4).cue(104.0, 'counter', { dur: 2.0, gain: 0.3 }).cue(104.9, 'thud', 0.35).cue(106.2, 'pop', 0.4).cue(106.6, 'tick', 0.3).cue(107.2, 'tick', 0.3).cue(107.8, 'tick', 0.3);

/* ================================================================
 * 06 怎么做决定 108.1–129.2
 * ================================================================ */
V.scene(108.1, 113.7, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 108.3, 540, 440, () => txt(g, '当然，不是说……', 0, 0, 60, { c: P.sub }));
  pop(g, t, 109.3, 540, 720, () => {
    const roll = prog(t, 109.3, 109.9, E.out); g.ctx.save(); g.ctx.translate(-250, 0); g.ctx.rotate((1 - roll) * 3);
    g.fillRR(-80, -80, 160, 160, 28, '#fff', { stroke: P.ink, lw: 6 }); for (const [dx, dy] of [[-40, -40], [40, 40], [0, 0], [40, -40], [-40, 40]]) g.circle(dx, dy, 12, dx === 0 ? P.acc : P.ink); g.ctx.restore();
    txt(g, '没把握', -110, -40, 56, { align: 'left' }); txt(g, '就随便下注', -110, 40, 56, { align: 'left' });
    cross(g, 0, 0, 150, prog(t, 110.6, 111.0), P.red, 12);
  });
  pop(g, t, 111.1, 540, 1050, () => { box(g, -410, -110, 820, 220, { fill: P.ink }); txt(g, '要减少的是', 0, -46, 44, { c: '#B9B4AA', w: 700 });
    hl(g, -224, 30, 300, 38, prog(t, 112.2, 112.6, E.out), P.acc, 0.95); txt(g, '能避免的盲目', 0, 42, 72, { c: '#fff' }); });
}, { z: 2, fin: 0.25 });
V.cue(108.3, 'pop', 0.35).cue(109.3, 'drop', 0.5).cue(109.6, 'drop', 0.35).cue(110.6, 'wrong', 0.45).cue(111.1, 'flip', 0.45).cue(112.2, 'pen', { dur: 0.4, gain: 0.4 });

V.scene(113.5, 119.4, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 113.6, 540, 520, () => txt(g, '分清楚，再决定', 0, 0, 64, { c: P.sub }));
  const row = (y, a, b, label, lc, res, rc, extra) => pop(g, t, a, 540, y, () => {
    box(g, -410, -130, 820, 260, { fill: lc });
    tag(g, label, -380, -72, { align: 'left', size: 40, fill: rc });
    arrow(g, -370, 40, -230, 40, prog(t, b - 0.3, b), { lw: 8, c: P.ink });
    pop(g, t, b, -200, 40, () => { txt(g, res, 0, 0, 52, { align: 'left' }); if (extra) extra(); }, { dx: -40, dy: 0 });
  });
  row(760, 113.6, 114.8, '能回头的', P.greenSoft, '不必等齐所有答案', P.green, () => {});
  row(1080, 116.4, 117.6, '回不了头的', P.accSoft, '审慎', P.acc, () => { pop(g, t, 118.3, 220, 0, () => { box(g, -80, -50, 160, 100, { fill: P.yel, r: 50, sh: 5, lw: 3 }); txt(g, '×2', 0, 2, 64, { c: P.red }); }, { s0: 1.6, d: 0.3 }); });
}, { z: 2, fin: 0.25 });
V.cue(113.6, 'pop', 0.5, -0.2).cue(114.5, 'slide', 0.3).cue(114.8, 'correct', 0.45).cue(116.4, 'pop', 0.5, 0.2).cue(117.3, 'slide', 0.3).cue(117.6, 'pop', 0.4).cue(118.3, 'impact', 0.35);

// 一张纸，写两行，签字
const LINE1 = '① 我为什么选它？', LINE2 = '② 什么情况出现，我改。';
V.scene(119.1, 129.5, (g, lt, s) => {
  const t = s.t;
  // 回到开头的 99%：不用等了
  pop(g, t, 119.2, 540, 700, () => { meter(g, t, 0, 0.1); const k = prog(t, 120.2, 120.5); g.line(-420, 0, 420, 0, { color: P.red, lw: 12, k }); if (k > 0) pop(g, t, 120.3, 220, -150, () => { box(g, -190, -36, 380, 72, { fill: P.red, r: 36, sh: 0, lw: 0 }); txt(g, '不用等到 100%', 0, 2, 34, { c: '#fff' }); }); }, { out: 121.0 });
  // 决策便签
  pop(g, t, 121.2, 540, 860, () => {
    const [fx, fy] = g.float(t, 2, 2); g.ctx.translate(fx, fy); g.ctx.rotate(-0.015);
    box(g, -380, -400, 760, 800, { r: 10, sh: 12 });
    for (let y = -250; y < 380; y += 92) g.line(-340, y + 46, 340, y + 46, { color: '#DCE3F2', lw: 3 });
    g.line(-300, -390, -300, 390, { color: '#F4A79A', lw: 3 });
    txt(g, '决策便签', 0, -320, 56); g.line(-120, -280, 120, -280, { color: P.acc, lw: 6, k: prog(t, 121.6, 121.9) });
    g.textReveal(LINE1, -280, -150, prog(t, 123.0, 124.4, E.linear), { size: 54, weight: 700, fam: 'hand', color: P.ink, align: 'left' });
    g.textReveal(LINE2, -280, -10, prog(t, 125.0, 127.0, E.linear), { size: 54, weight: 700, fam: 'hand', color: P.ink, align: 'left' });
    txt(g, '签名：', -280, 200, 44, { fam: 'hand', w: 700, align: 'left', c: P.sub, a: prog(t, 127.5, 127.8) });
    const sg = [...Array(60)].map((_, i) => { const u = i / 59; return [-130 + u * 300 + Math.sin(u * 18) * 22 * (1 - u * 0.6), 200 + Math.sin(u * 9) * 30 * (1 - u) - Math.cos(u * 18) * 12]; });
    stroke(g, sg, prog(t, 128.0, 128.6, E.inOut), { lw: 6, c: P.blue });
    g.stamp(230, 300, '就这么定', { k: prog(t, 128.7, 129.0), size: 40, color: P.red, rot: -0.15 });
  }, { s0: 0.85 });
}, { z: 2, fin: 0.25 });
V.cue(119.2, 'pop', 0.35).cue(120.2, 'snap', 0.45).cue(121.2, 'paper', 0.6).cue(121.6, 'pen', { dur: 0.3, gain: 0.35 })
  .cue(123.0, 'pen', { dur: 1.4, gain: 0.5 }).cue(125.0, 'pen', { dur: 2.0, gain: 0.5 }).cue(128.0, 'pen', { dur: 0.6, gain: 0.6 }).cue(128.7, 'stamp', 0.6);

/* ================================================================
 * 07 总结 129.2–133.6 + 片尾 133.6–137.2
 * ================================================================ */
V.scene(129.1, 133.9, (g, lt, s) => {
  const t = s.t;
  pop(g, t, 129.3, 540, 520, () => hlLine(g, t, '成熟的判断', 0, 0, 104, 129.3, { hi: [0, 5], hd: 0.3 }), { s0: 1.4 });
  pop(g, t, 130.3, 540, 790, () => { box(g, -410, -110, 820, 220, { fill: P.greenSoft }); g.circle(-320, 0, 50, P.green, { stroke: P.ink, lw: 4 }); txt(g, '1', -320, 3, 56, { c: '#fff' });
    txt(g, '说得出', -230, -36, 40, { align: 'left', w: 700, c: P.sub }); txt(g, '为什么动', -230, 34, 72, { align: 'left' }); });
  pop(g, t, 132.0, 540, 1080, () => { box(g, -410, -110, 820, 220, { fill: P.accSoft }); g.circle(-320, 0, 50, P.acc, { stroke: P.ink, lw: 4 }); txt(g, '2', -320, 3, 56, { c: '#fff' });
    txt(g, '也留好了', -230, -36, 40, { align: 'left', w: 700, c: P.sub }); txt(g, '哪一步要改', -230, 34, 72, { align: 'left' }); });
}, { z: 2, fin: 0.25, fout: 0.01 });
V.cue(129.3, 'impact', 0.35).cue(130.3, 'pop', 0.5, -0.2).cue(132.0, 'pop', 0.5, 0.2);

// 片尾卡：深色板从下往上推起
V.scene(133.4, DUR, (g, lt, s) => {
  const t = s.t, up = prog(t, 133.45, 133.95, E.inOut), ctx = g.ctx;
  ctx.fillStyle = P.ink; ctx.fillRect(0, H * (1 - up), W, H * up + 2);
  if (up < 1) return;
  pop(g, t, 133.95, 540, 360, () => tag(g, 'VIBE知识大赏', 0, 0, { size: 34, fill: P.acc }));
  pop(g, t, 134.1, 540, 560, () => txt(g, '没有把握，', 0, 0, 110, { c: '#fff' }), { s0: 1.3 });
  pop(g, t, 134.35, 540, 710, () => { hl(g, -270, 20, 540, 60, prog(t, 134.6, 134.9, E.out), P.acc, 1); txt(g, '要不要动？', 0, 0, 110, { c: '#fff' }); }, { s0: 1.3 });
  pop(g, t, 134.8, 540, 900, () => { box(g, -410, -90, 820, 180, { fill: '#26262F', shc: '#000', stroke: '#3A3A46' });
    txt(g, '你最近在等哪件事“想清楚”？', 0, -26, 42, { c: P.yel }); txt(g, '评论区写下你的两行 ↓', 0, 36, 36, { w: 700, c: '#D8D3CA' }); });
  pop(g, t, 135.3, 540, 1110, () => { tag(g, '关注 @zhiyusay · 下期见', 0, 0, { size: 38, fill: '#fff', c: P.ink }); });
  txt(g, '参考：David Hume, An Enquiry Concerning Human Understanding (1748)', 540, 1240, 26, { fam: 'en', italic: true, w: 500, c: '#8E8A82', a: prog(t, 135.6, 136.0) });
}, { z: 60, fin: 0.01, fout: 0.01 });
V.cue(133.45, 'whoosh', 0.28).cue(134.1, 'thud', 0.2).cue(134.35, 'pop', 0.3).cue(134.8, 'pop', 0.25).cue(135.3, 'ding', 0.25);

V.mount();
