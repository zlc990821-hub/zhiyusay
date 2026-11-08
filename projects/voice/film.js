/* 《隧道里的声音》— 月夜湖面风 · 竖屏 1080×1920 · 配音驱动
 * 世界：紫色夜空 + 满月 + 远山 + 湖面倒影；两个人 = 两团光（暖金 = 你，银蓝 = 对方）
 * 关键词（文案里的 {xx}）以发光金字浮在湖面上方，并在水里有倒影 */
const HZ = 1090;   // 地平线 / 水面
const V = Vibe.create({
  width: 1080, height: 1920, duration: 209.1, watermark: '@zhiyusay', theme: 'dark', seed: 21,
  layout: { subY: 1450, lineGap: 74, subMaxW: 880, label: 292, wm: [64, 196] },
  subStyle: { fam: 'serif', size: 50, weight: 700, color: '#F4F0FA', hi: '#F6D58F', glow: 16, glowColor: 'rgba(5,5,20,.85)', ls: 3 },
  bg: (g, t) => world(g, t),
});
const { E, prog, env, clamp, lerp, rng } = Vibe;
const C = V.C, W = V.W, H = V.H;
V.beatGlow = false; V.dropFlash = false;

const WARM = '255,196,128', COOL = '160,196,255', GOLD = '#F6D58F';

/* ================================================================
 * 世界：天空 / 月亮 / 星 / 远山 / 水
 * ================================================================ */
const STARS = (() => { const r = rng(4); return [...Array(260)].map(() => ({ x: r() * W, y: r() * (HZ - 120), s: Math.pow(r(), 3), ph: r() * 6.3, sp: 0.5 + r() * 1.5 })); })();
const RIDGE = (seed, amp, base, rough) => { const r = rng(seed), ph = [r() * 6, r() * 6, r() * 6]; const pts = [];
  for (let x = -20; x <= W + 20; x += 8) { const u = x / W; pts.push([x, base - amp * (0.55 + 0.25 * Math.sin(u * 5.1 + ph[0]) + 0.15 * Math.sin(u * 13 + ph[1]) + rough * Math.sin(u * 41 + ph[2])) * (0.6 + 0.6 * Math.abs(u - 0.5))]); }
  return pts; };
const RIDGES = [
  { pts: RIDGE(11, 70, HZ, 0.05), col: [60, 50, 100], a: 0.85 },
  { pts: RIDGE(23, 46, HZ + 2, 0.08), col: [34, 28, 64], a: 0.95 },
  { pts: RIDGE(37, 26, HZ + 3, 0.12), col: [16, 14, 36], a: 1 },
];
const mix = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k)));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
/** 天亮程度（结尾） */
const dawn = (t) => prog(t, 195.5, 204.5, E.inOut);
/** 月亮亮度（沉默段会被云遮暗） */
const moonDim = (t) => 1 - 0.45 * env(t, 13.8, 27.3, 2.5, 1.5) - 0.35 * env(t, 111.7, 127.0, 1.5, 1.5) - 0.3 * env(t, 148.0, 156.6, 1.2, 1.2);
const MOON = { x: 540, y: 470, r: 64 };

function world(g, t) {
  const { ctx } = g, d = dawn(t);
  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, HZ);
  const top = mix([7, 8, 26], [40, 44, 92], d), mid = mix([28, 26, 70], [104, 86, 140], d), low = mix([88, 66, 128], [214, 150, 150], d), hz = mix([172, 128, 160], [255, 200, 150], d);
  sky.addColorStop(0, rgb(top)); sky.addColorStop(0.45, rgb(mid)); sky.addColorStop(0.8, rgb(low)); sky.addColorStop(1, rgb(hz));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ + 4);
  // 星
  for (const s of STARS) {
    const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
    const a = (0.15 + 0.85 * s.s) * tw * (1 - d * 0.9) * (1 - s.y / HZ * 0.6);
    if (a < 0.03) continue;
    g.circle(s.x, s.y, 0.7 + s.s * 1.8, `rgba(255,248,235,${a})`);
    if (s.s > 0.6) { g.line(s.x - 7 * s.s, s.y, s.x + 7 * s.s, s.y, { color: `rgba(255,248,235,${a * 0.5})`, lw: 1 }); g.line(s.x, s.y - 7 * s.s, s.x, s.y + 7 * s.s, { color: `rgba(255,248,235,${a * 0.5})`, lw: 1 }); }
  }
  // 流星（偶尔）
  for (const ts of [3.2, 47.0, 98.5, 141.0, 176.4]) { const k = (t - ts) / 0.9; if (k > 0 && k < 1) { const x0 = 760 + k * 220, y0 = 230 + k * 90; g.line(x0, y0, x0 - 140 * (1 - k * 0.5), y0 - 56 * (1 - k * 0.5), { color: `rgba(255,250,235,${0.8 * Math.sin(k * Math.PI)})`, lw: 2 }); } }
  // 月亮
  const md = moonDim(t) * (1 - d * 0.75), mx = MOON.x, my = MOON.y + d * 120;
  g.spot(mx, my, 620, 0.16 * md, '255,236,205');
  g.spot(mx, my, 260, 0.32 * md, '255,240,215');
  const mg = ctx.createRadialGradient(mx - 14, my - 16, 4, mx, my, MOON.r);
  mg.addColorStop(0, `rgba(255,252,240,${md})`); mg.addColorStop(0.75, `rgba(245,234,206,${md})`); mg.addColorStop(1, `rgba(226,210,176,${md})`);
  ctx.save(); ctx.shadowColor = `rgba(255,238,200,${0.9 * md})`; ctx.shadowBlur = 50;
  ctx.beginPath(); ctx.arc(mx, my, MOON.r, 0, 6.3); ctx.fillStyle = mg; ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(mx, my, MOON.r, 0, 6.3); ctx.clip(); ctx.filter = 'blur(8px)';
  for (const [dx, dy, rx, ry] of [[-18, -10, 22, 16], [14, 12, 18, 13], [8, -26, 11, 8], [-24, 22, 12, 9], [26, -8, 9, 7]]) { ctx.beginPath(); ctx.ellipse(mx + dx, my + dy, rx, ry, 0.4, 0, 6.3); ctx.fillStyle = `rgba(178,160,136,${0.2 * md})`; ctx.fill(); }
  ctx.restore();
  // 月亮裂痕（临界点）
  const ck = prog(t, 108.3, 109.3) * (1 - prog(t, 125.8, 127.0));
  if (ck > 0) { const pts = [[mx + 6, my - MOON.r], [mx - 10, my - 30], [mx + 12, my - 8], [mx - 8, my + 16], [mx + 6, my + 38], [mx - 4, my + MOON.r]];
    g.path(pts, ck, { color: 'rgba(60,46,70,.85)', lw: 4 }); g.path(pts.map(([x, y]) => [x + 3, y]), ck, { color: 'rgba(255,250,235,.6)', lw: 1.5 }); }
  // 云带（沉默段遮月）
  const cloud = 1 - moonDim(t);
  if (cloud > 0.02) for (let i = 0; i < 5; i++) { const cx = ((t * 8 + i * 260) % (W + 600)) - 300; g.spot(cx, MOON.y + 20 + Math.sin(i * 2) * 40, 230, 0.35 * cloud, '40,36,74'); }
  // 地平线辉光
  const hg = ctx.createLinearGradient(0, HZ - 220, 0, HZ);
  hg.addColorStop(0, 'rgba(255,190,200,0)'); hg.addColorStop(1, `rgba(${mix([255, 176, 196], [255, 214, 160], d).join(',')},${0.32 + 0.4 * d})`);
  ctx.fillStyle = hg; ctx.fillRect(0, HZ - 220, W, 220);
  // 远山（三层，越远越淡越紫）
  for (const R of RIDGES) {
    ctx.beginPath(); ctx.moveTo(-20, HZ + 6); for (const [x, y] of R.pts) ctx.lineTo(x, y); ctx.lineTo(W + 20, HZ + 6); ctx.closePath();
    ctx.fillStyle = rgb(mix(R.col, [R.col[0] + 70, R.col[1] + 50, R.col[2] + 40], d), R.a); ctx.fill();
  }
  // 水
  const wg = ctx.createLinearGradient(0, HZ, 0, H);
  wg.addColorStop(0, rgb(mix([40, 34, 78], [120, 96, 130], d))); wg.addColorStop(0.35, rgb(mix([20, 18, 46], [62, 54, 96], d))); wg.addColorStop(1, rgb(mix([6, 6, 18], [24, 22, 48], d)));
  ctx.fillStyle = wg; ctx.fillRect(0, HZ, W, H - HZ);
}

/** 倒影：把水面以上的画面（天空、月、山、光、关键词）逐条翻转到水里，加波纹扰动 */
function reflect(g, t) {
  const { ctx } = g, strip = 3;
  if (!reflect.buf) { reflect.buf = document.createElement('canvas'); reflect.buf.width = W; reflect.buf.height = HZ; reflect.bx = reflect.buf.getContext('2d'); }
  const cv = reflect.buf; reflect.bx.clearRect(0, 0, W, HZ); reflect.bx.drawImage(ctx.canvas, 0, 0, W, HZ, 0, 0, W, HZ);
  ctx.save();
  for (let y = HZ + 4; y < H; y += strip) {
    const dd = y - HZ, sy = HZ - dd * 0.92 - 2; if (sy < 0) break;
    const amp = 1.5 + dd * 0.022;
    const dx = Math.sin(dd * 0.045 - t * 1.7) * amp + Math.sin(dd * 0.17 + t * 2.4) * amp * 0.45;
    ctx.globalAlpha = 0.62 * Math.exp(-dd / 430);
    ctx.drawImage(cv, 0, sy - strip * 0.92, W, strip * 0.92, dx - 24, y, W + 48, strip);
  }
  ctx.restore();
  // 月光路：月亮下方闪烁的碎光
  const md = moonDim(t) * (1 - dawn(t) * 0.6), r = rng(77);
  for (let y = HZ + 14; y < HZ + 760; y += 9) {
    const dd = y - HZ, wdt = 40 + dd * 0.35;
    for (let k = 0; k < 3; k++) {
      const off = (r() - 0.5) * wdt * 2, f = 0.5 + 0.5 * Math.sin(t * (1.5 + r() * 2) + r() * 6.3 + dd * 0.05);
      const a = md * f * 0.5 * Math.exp(-dd / 520);
      if (a < 0.03) continue;
      g.line(MOON.x + off - (6 + dd * 0.03), y, MOON.x + off + (6 + dd * 0.03), y, { color: `rgba(255,240,210,${a})`, lw: 1.6 });
    }
  }
  // 水面薄雾
  const fg = ctx.createLinearGradient(0, HZ - 30, 0, HZ + 90);
  fg.addColorStop(0, 'rgba(210,180,220,0)'); fg.addColorStop(0.4, `rgba(210,180,220,${0.16 + 0.1 * dawn(t)})`); fg.addColorStop(1, 'rgba(210,180,220,0)');
  ctx.fillStyle = fg; ctx.fillRect(0, HZ - 30, W, 120);
}
V.overlay(0, 999, (g, lt, s) => reflect(g, s.t));

/** 水面效果（画在倒影之后，不会被倒影盖住） */
const WATER = [];
const water = (a, b, fn) => WATER.push({ a, b, fn });
V.overlay(0, 999, (g, lt, s) => { for (const w of WATER) if (s.t >= w.a && s.t < w.b) { g.ctx.save(); w.fn(g, s.t - w.a, s.t); g.ctx.restore(); } });
/** 涟漪 */
function ripple(g, x, y, k, o = {}) {
  if (k <= 0 || k >= 1) return;
  for (let i = 0; i < (o.n || 3); i++) {
    const q = clamp(k * 1.3 - i * 0.15); if (q <= 0) continue;
    g.ctx.save(); g.ctx.globalAlpha = (1 - q) * (o.alpha ?? 0.7); g.ctx.beginPath(); g.ctx.ellipse(x, y, 20 + q * (o.r || 220), (20 + q * (o.r || 220)) * 0.16, 0, 0, 6.3);
    g.ctx.lineWidth = 2; g.ctx.strokeStyle = `rgba(${o.rgb || '255,236,205'},1)`; g.ctx.stroke(); g.ctx.restore();
  }
}

/* ================================================================
 * 光 = 人
 * ================================================================ */
/** 一团光。o: r 尺寸, a 亮度, flicker */
function orb(g, x, y, rgbc, o = {}) {
  const a = o.a ?? 1, r = o.r ?? 1, f = 1 + 0.06 * Math.sin((o.t || 0) * 3.1 + x);
  if (a <= 0.01) return;
  g.spot(x, y, 190 * r * f, 0.22 * a, rgbc);
  g.spot(x, y, 70 * r * f, 0.55 * a, rgbc);
  g.circle(x, y, 11 * r, `rgba(255,252,244,${a})`, { glow: 26 * r, glowColor: `rgba(${rgbc},${a})` });
}
/** 光点粒子消散 / 聚拢 */
function dust(g, x, y, k, rgbc, seed = 1, n = 40, spread = 200) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const ang = r() * 6.3, dd = k * (30 + r() * spread); g.circle(x + Math.cos(ang) * dd, y + Math.sin(ang) * dd * 0.7 - k * 40 * r(), 1.5 + r() * 2.5, `rgba(${rgbc},${(1 - k) * 0.9})`, { glow: 8, glowColor: `rgba(${rgbc},1)` }); }
}

/* ================================================================
 * 关键词：文案里 {xx} 自动成为湖面上方的发光大字（有倒影）
 * ================================================================ */
const HERO_OFF = [[19.6, 23.4]];
const HERO_Y = HZ - 200, ORB_Y = HZ - 62;   // 这些时段由场景自己出大字
const HEROES = (() => {
  const list = [];
  for (const s of window.SUBS) {
    const m = s.text.match(/\{([^}]+)\}/); if (!m) continue;
    if (HERO_OFF.some(([a, b]) => s.a >= a && s.a < b)) continue;
    list.push({ a: s.a, b: s.b + 0.8, w: m[1] });
  }
  for (let i = 0; i < list.length - 1; i++) list[i].b = Math.min(list[i].b, list[i + 1].a + 0.25);
  return list;
})();
function heroText(g, txt, x, y, k, o = {}) {
  const n = [...txt].length, size = o.size || (n <= 2 ? 150 : n <= 4 ? 118 : n <= 6 ? 96 : 76);
  g.ctx.save(); g.ctx.globalAlpha *= k;
  const sc = lerp(1.06, 1, E.out(clamp(k)));
  g.ctx.translate(x, y); g.ctx.scale(sc, sc);
  g.spot(0, 0, size * n * 0.45 + 120, 0.16 * k, '255,214,150');
  g.text(txt, 0, 0, { size, weight: 900, fam: 'serif', gradient: ['#FFF4D6', '#F2CD86', '#C99A55'], glow: 34, glowColor: 'rgba(255,200,130,.65)', ls: lerp(30, 12, E.out(clamp(k))) });
  g.ctx.restore();
}

/* ================================================================
 * 光线图标：关键词不用文字，用光"描"出来的图案（k = 描绘进度）
 * ================================================================ */
const LC = '#F8DC9C';
const GL = (g, pts, k, o = {}) => g.path(pts, clamp(k), { color: o.c || LC, lw: o.lw || 5, glow: 24, alpha: o.a ?? 1, dash: o.dash });
const arcP = (cx, cy, rx, a0, a1, ry = rx, n = 48) => [...Array(n + 1)].map((_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const heartP = (cx, cy, s, n = 80) => [...Array(n + 1)].map((_, i) => { const u = i / n * Math.PI * 2; return [cx + s * 16 * Math.pow(Math.sin(u), 3) / 16, cy - s * (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) / 16]; });
const zig = (x0, y0, x1, y1, n, a) => [...Array(n + 1)].map((_, i) => [lerp(x0, x1, i / n) + (i % 2 ? a : -a) * (i > 0 && i < n ? 1 : 0) * (y1 !== y0 ? 1 : 0), lerp(y0, y1, i / n) + (i % 2 ? a : -a) * (i > 0 && i < n ? 1 : 0) * (y1 === y0 ? 1 : 0)]);
const dotL = (g, x, y, r, a = 1) => g.circle(x, y, r, '#FFF6E0', { alpha: a, glow: 18, glowColor: 'rgba(255,214,150,1)' });
const bubbleP = (cx, cy, w, h) => [...arcP(cx - w / 2 + h / 2, cy, h / 2, Math.PI / 2, Math.PI * 1.5), ...arcP(cx + w / 2 - h / 2, cy, h / 2, -Math.PI / 2, Math.PI / 2), [cx - w * 0.1, cy + h / 2], [cx - w * 0.28, cy + h / 2 + 30], [cx - w * 0.22, cy + h / 2]];
const ICON = {
  背叛: (g, k, t) => { const sp = 14 * prog(k, 0.6, 1); const h = heartP(0, 6, 70); GL(g, h.slice(0, 41).map(([x, y]) => [x - sp, y]), k * 1.6); GL(g, h.slice(40).map(([x, y]) => [x + sp, y]), k * 1.6); GL(g, zig(0, -50, 0, 70, 6, 12).map(([x, y], i) => [x - sp, y]), (k - 0.4) * 2, { lw: 3 }); GL(g, zig(0, -50, 0, 70, 6, 12).map(([x, y]) => [x + sp, y]), (k - 0.4) * 2, { lw: 3 }); },
  争吵: (g, k, t) => { const j = Math.sin(t * 30) * 3 * prog(k, 0.8, 1); GL(g, [[-70, -60], [-20, -10], [-45, 0], [10, 60]].map(([x, y]) => [x + j, y]), k * 1.3); GL(g, [[70, -60], [20, -10], [45, 0], [-10, 60]].map(([x, y]) => [x - j, y]), k * 1.3 - 0.2); },
  沉默失语: (g, k, t) => { GL(g, bubbleP(0, 0, 200, 110), k * 1.3); [-40, 0, 40].forEach((x, i) => dotL(g, x, 0, 6, prog(k, 0.5 + i * 0.1, 0.7 + i * 0.1) * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))))); GL(g, [[-120, 60], [120, -60]], (k - 0.75) * 4, { lw: 4 }); },
  不够爱: (g, k, t) => { GL(g, heartP(0, 6, 72), k * 1.2, { dash: [10, 12] }); const f = prog(k, 0.6, 1) * 0.35; g.ctx.save(); g.ctx.beginPath(); heartP(0, 6, 72).forEach(([x, y], i) => i ? g.ctx.lineTo(x, y) : g.ctx.moveTo(x, y)); g.ctx.clip(); g.ctx.fillStyle = 'rgba(248,220,156,.5)'; g.ctx.fillRect(-80, 80 - 150 * f, 160, 150 * f); g.ctx.restore(); },
  真实的互动: (g, k, t) => { dotL(g, -90, 0, 14, clamp(k * 3)); dotL(g, 90, 0, 14, clamp(k * 3 - 0.3)); GL(g, arcP(0, 30, 80, -Math.PI * 0.85, -Math.PI * 0.15), k * 1.5 - 0.3); GL(g, arcP(0, -30, 80, Math.PI * 0.15, Math.PI * 0.85), k * 1.5 - 0.5); const q = (t * 0.6) % 1; dotL(g, lerp(-80, 80, q), -Math.sin(q * Math.PI) * 50 - 10, 5, prog(k, 0.8, 1)); dotL(g, lerp(80, -80, q), Math.sin(q * Math.PI) * 50 + 10, 5, prog(k, 0.8, 1)); },
  孤岛: (g, k, t) => { GL(g, arcP(0, 40, 100, Math.PI, Math.PI * 2, 46), k * 1.4); GL(g, [[-140, 40], [140, 40]], k * 1.4 - 0.2, { lw: 3 }); for (let i = 0; i < 2; i++) GL(g, [...Array(13)].map((_, j) => [-130 + j * 21.6, 66 + i * 22 + Math.sin(j * 1.3 + t * 2) * 4]), k * 1.4 - 0.4 - i * 0.1, { lw: 2.5 }); dotL(g, 0, -20, 9, prog(k, 0.6, 0.9)); },
  读心术: (g, k, t) => { GL(g, [...arcP(0, 60, 130, -Math.PI * 0.78, -Math.PI * 0.22), ...arcP(0, -60, 130, Math.PI * 0.22, Math.PI * 0.78)], k * 1.3); GL(g, arcP(0, 0, 32, 0, 6.3), k * 1.3 - 0.3); dotL(g, 0, 0, 10, prog(k, 0.7, 0.9)); GL(g, [[-120, 70], [120, -70]], (k - 0.75) * 4, { lw: 4 }); },
  高墙: (g, k, t) => { for (let r = 0; r < 4; r++) { const y = 60 - r * 40; GL(g, [[-90, y], [90, y]], k * 4 - r * 0.6, { lw: 3.5 }); for (let c = 0; c < 4; c++) { const x = -90 + c * 60 + (r % 2 ? 30 : 0); if (x > 90) continue; GL(g, [[x, y], [x, y - 40]], k * 4 - r * 0.6 - 0.3, { lw: 3 }); } } GL(g, [[-90, -100], [90, -100]], k * 4 - 2.6, { lw: 3.5 }); },
  语言: (g, k, t) => { GL(g, bubbleP(-30, 0, 170, 110), k * 1.3); for (let i = 0; i < 3; i++) GL(g, arcP(70, 0, 40 + i * 28, -0.6, 0.6), prog(k, 0.5 + i * 0.12, 0.75 + i * 0.12), { lw: 4, a: 0.5 + 0.5 * Math.sin(t * 3 - i) }); },
  自我感动: (g, k, t) => { GL(g, arcP(0, 0, 80, -Math.PI * 0.4, Math.PI * 1.45), k * 1.3); GL(g, [[22, -84], [-6, -72], [14, -54]].map(([x, y]) => [x + 14, y + 6]), (k - 0.7) * 4); dotL(g, 0, 0, 12, prog(k, 0.6, 0.9) * (0.6 + 0.4 * Math.sin(t * 2))); },
  独自硬扛: (g, k, t) => { GL(g, arcP(0, 90, 70, Math.PI, Math.PI * 2, 50), k * 1.6); dotL(g, 0, 10, 16, prog(k, 0.3, 0.5)); const y = lerp(-140, -70, E.out(prog(k, 0.5, 0.9))); GL(g, [[-70, y - 60], [70, y - 60], [70, y], [-70, y], [-70, y - 60]], (k - 0.45) * 2, { lw: 5 }); },
  傲慢: (g, k, t) => GL(g, [[-90, 50], [-100, -50], [-45, 0], [0, -70], [45, 0], [100, -50], [90, 50], [-90, 50]], k * 1.2),
  隐忍克制: (g, k, t) => { GL(g, [[-70, -10], [70, -10], [70, 90], [-70, 90], [-70, -10]], k * 1.5); GL(g, arcP(0, -10, 46, Math.PI, Math.PI * 2, 66), k * 1.5 - 0.4); dotL(g, 0, 36, 8, prog(k, 0.7, 0.9)); GL(g, [[0, 44], [0, 66]], (k - 0.8) * 5, { lw: 4 }); },
  临界点: (g, k, t) => { GL(g, arcP(0, 60, 120, Math.PI, Math.PI * 2), k * 1.4); GL(g, arcP(0, 60, 120, Math.PI * 1.78, Math.PI * 2), k * 1.4 - 0.4, { c: '#FF9A7A', lw: 8 }); const a = lerp(Math.PI * 1.1, Math.PI * 1.93, E.out(prog(k, 0.4, 1))) + (k > 0.95 ? Math.sin(t * 40) * 0.03 : 0); GL(g, [[0, 60], [Math.cos(a) * 100, 60 + Math.sin(a) * 100]], (k - 0.3) * 3, { lw: 4 }); dotL(g, 0, 60, 8, prog(k, 0.3, 0.5)); },
  双向困境: (g, k, t) => { const o = 20 + 40 * prog(k, 0.6, 1); GL(g, [[-o, 0], [-o - 90, 0]], k * 1.6); GL(g, [[-o - 70, -18], [-o - 92, 0], [-o - 70, 18]], (k - 0.5) * 3); GL(g, [[o, 0], [o + 90, 0]], k * 1.6 - 0.1); GL(g, [[o + 70, -18], [o + 92, 0], [o + 70, 18]], (k - 0.6) * 3); dotL(g, -o - 110, 0, 8, prog(k, 0.7, 1)); dotL(g, o + 110, 0, 8, prog(k, 0.7, 1)); },
  心有灵犀: (g, k, t) => { GL(g, heartP(-80, 10, 46), k * 1.4); GL(g, heartP(80, 10, 46), k * 1.4 - 0.2); GL(g, [...Array(21)].map((_, i) => [lerp(-34, 34, i / 20), -20 - Math.sin(i / 20 * Math.PI) * 30]), (k - 0.6) * 2.5, { lw: 2.5, dash: [4, 6] }); },
  袒露: (g, k, t) => { GL(g, arcP(-30, 60, 60, Math.PI * 0.55, Math.PI * 1.05), k * 1.5); GL(g, arcP(30, 60, 60, -Math.PI * 0.05, Math.PI * 0.45), k * 1.5); GL(g, heartP(0, -30, 40), k * 1.5 - 0.4); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4; GL(g, [[Math.cos(a) * 70, -40 + Math.sin(a) * 70], [Math.cos(a) * 100, -40 + Math.sin(a) * 100]], (k - 0.7) * 4, { lw: 3, a: 0.6 + 0.4 * Math.sin(t * 3 + i) }); } },
  表达: (g, k, t) => { dotL(g, -80, 0, 12, clamp(k * 3)); for (let i = 0; i < 4; i++) GL(g, arcP(-80, 0, 40 + i * 40, -0.7, 0.7), prog(k, 0.2 + i * 0.15, 0.5 + i * 0.15), { lw: 4, a: 0.4 + 0.6 * ((Math.sin(t * 3 - i) + 1) / 2) }); },
  损耗: (g, k, t) => { GL(g, [[-60, -90], [60, -90], [8, 0], [60, 90], [-60, 90], [-8, 0], [-60, -90]], k * 1.2); const q = (t * 0.5) % 1; for (let i = 0; i < 4; i++) dotL(g, 0, -4 + ((q + i / 4) % 1) * 80, 2.5, prog(k, 0.7, 1)); g.ctx.save(); g.ctx.globalAlpha *= prog(k, 0.6, 1); g.ctx.fillStyle = 'rgba(248,220,156,.45)'; g.ctx.beginPath(); g.ctx.moveTo(-40, 86); g.ctx.lineTo(40, 86); g.ctx.lineTo(0, 50); g.ctx.fill(); g.ctx.restore(); },
  自我保护: (g, k, t) => { GL(g, [[0, -100], [80, -70], [74, 20], [0, 100], [-74, 20], [-80, -70], [0, -100]], k * 1.2); dotL(g, 0, -4, 12, prog(k, 0.7, 0.9) * (0.6 + 0.4 * Math.sin(t * 2))); },
  不用时刻强大: (g, k, t) => { GL(g, [[-70, 90], [-6, -60]], k * 1.6); GL(g, [[70, 90], [6, -60]], k * 1.6 - 0.2); dotL(g, -10, -76, 12, prog(k, 0.6, 0.8)); dotL(g, 10, -76, 12, prog(k, 0.7, 0.9)); GL(g, heartP(0, -130, 22), (k - 0.7) * 3.4, { lw: 3 }); },
  爱需要被听见: (g, k, t) => { GL(g, heartP(0, 6, 56), k * 1.3); for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) GL(g, arcP(0, 0, 90 + i * 30, sd > 0 ? -0.5 : Math.PI - 0.5, sd > 0 ? 0.5 : Math.PI + 0.5), prog(k, 0.5 + i * 0.12, 0.75 + i * 0.12), { lw: 3.5, a: 0.4 + 0.6 * ((Math.sin(t * 3 - i) + 1) / 2) }); },
  我现在很难: (g, k, t) => { GL(g, heartP(0, 6, 66), k * 1.3); GL(g, [[4, -50], [-14, -14], [12, 10], [-6, 46]], (k - 0.6) * 3, { lw: 3.5 }); },
  我有点害怕: (g, k, t) => { const w = Math.sin(t * 9) * 6 * prog(k, 0.6, 1); GL(g, [[0, 70], [-38, 20], [-26, -20], [w, -90], [26, -20], [38, 20], [0, 70]], k * 1.2); dotL(g, w * 0.4, 20, 9, prog(k, 0.6, 0.9)); },
  '你走得太快，我跟不上': (g, k, t) => { const q = prog(k, 0.3, 1); dotL(g, lerp(-40, 120, q), -10, 12, clamp(k * 3)); for (let i = 0; i < 6; i++) dotL(g, lerp(-40, 120, q) - 20 - i * 18, -10, 4 - i * 0.5, clamp(k * 3) * (1 - i / 6)); dotL(g, -110, 20, 12, clamp(k * 3)); GL(g, [[-90, 20], [lerp(-40, 120, q) - 20, -10]], (k - 0.4) * 2, { lw: 2, dash: [5, 10] }); },
  要发出你的声音: (g, k, t) => { dotL(g, 0, 40, 16, clamp(k * 3)); for (let i = 0; i < 5; i++) { const q = ((t * 0.4 + i / 5) % 1); GL(g, arcP(0, 40, 30 + q * 170, -Math.PI * 0.85, -Math.PI * 0.15), 1, { lw: 4, a: (1 - q) * prog(k, 0.2, 0.6) }); } },
};
function heroIcon(g, key, x, y, k, t, born) {
  const fn = ICON[key]; if (!fn) return;
  g.ctx.save(); g.ctx.globalAlpha *= clamp(k * 2); g.ctx.translate(x, y); const sc = 1.15; g.ctx.scale(sc, sc);
  g.spot(0, 0, 260, 0.14 * k, '255,214,150');
  fn(g, clamp((t - born) / 1.1), t);
  g.ctx.restore();
}

V.scene(0, 209.1, (g, lt, s) => {
  for (const h of HEROES) { const k = env(s.t, h.a, h.b, 0.3, 0.5); if (k > 0) heroIcon(g, h.w, W / 2, HERO_Y - 40, k, s.t, h.a); }
}, { z: 5, fin: 0.01, fout: 0.01 });

/* 段落标签 */
const LABELS = [
  [0.6, 19.8, '一段关系，最让人崩溃的瞬间'], [19.8, 27.3, '俄耳甫斯 · 漆黑的隧道'], [27.3, 39.85, '爱，与关系'],
  [39.85, 65.9, '每个人都是一座孤岛'], [65.9, 93.8, '自我感动 · 独自硬扛'], [93.8, 111.7, '自我感动 · 隐忍克制'],
  [111.7, 126.9, '拧巴的双向困境'], [126.9, 148.05, '心有灵犀，是搭建出来的'], [148.05, 156.55, '沉默的水面之下'],
  [156.55, 177.75, '允许彼此，不用时刻强大'], [177.75, 191.8, '爱，需要被听见'], [191.8, 205.1, '要发出你的声音'],
];
// 顶部章节标签不再显示（尽量用图案、少用文字）
for (const s of window.SUBS) V.sub(s.a, s.b, s.text);

/* ================================================================
 * 场景（样帧：钩子 / 心有灵犀 / 结尾）
 * ================================================================ */
// 钩子 0–19.8：两团光；争吵时闪烁抖动；沉默时变暗、漂远
V.scene(0, 20.2, (g, lt, s) => {
  const t = s.t, k = prog(t, 0.4, 2.0, E.out);
  const fight = env(t, 5.2, 9.2, 0.3, 0.6), apart = prog(t, 14.0, 19.6, E.inOut), dim = 1 - 0.6 * prog(t, 15.5, 19.6);
  const jit = fight * Math.sin(t * 37) * 6;
  orb(g, lerp(400, 250, apart) + jit, ORB_Y + Math.sin(t * 0.8) * 6, fight > 0.3 ? '255,150,120' : WARM, { a: k * dim, t, r: 1 + fight * 0.3 });
  orb(g, lerp(680, 830, apart) - jit, ORB_Y + 6 + Math.cos(t * 0.7) * 6, COOL, { a: k * dim, t, r: 1 + fight * 0.3 });
}, { z: 2, fin: 0.01 });
water(0, 20.2, (g, lt, t) => { for (const ts of [5.4, 6.4, 7.6, 14.2, 17.0]) ripple(g, ts < 10 ? 540 : 400, HZ + 60, prog(t, ts, ts + 2.6), { r: 260, alpha: 0.5 }); });
V.cue(0.5, 'swell', 0.5).cue(5.3, 'snap', 0.3).cue(6.5, 'snap', 0.3).cue(14.2, 'bubble', 0.25);

// 心有灵犀 126.9–148：两圈光晕幻想重合 → 弹开 → 星星一颗颗连成桥（星座）
const BRIDGE = (() => { const r = rng(9), n = 11, out = []; for (let i = 0; i < n; i++) { const u = i / (n - 1); out.push([lerp(330, 750, u) + (r() - 0.5) * 30, 930 - Math.sin(u * Math.PI) * 120 + (r() - 0.5) * 36]); } return out; })();
V.scene(126.9, 148.4, (g, lt, s) => {
  const t = s.t, k = prog(t, 127.0, 128.2, E.out);
  const fantasy = prog(t, 127.6, 129.4, E.inOut) * (1 - prog(t, 131.9, 133.0, E.outBack));
  const sep = lerp(0, 60, prog(t, 136.3, 137.6)) * (1 - prog(t, 142.0, 146.0));
  const ax = lerp(330, 470, fantasy) - sep, bx = lerp(750, 610, fantasy) + sep, y = ORB_Y - 40;
  for (const [x, c] of [[ax, WARM], [bx, COOL]]) {
    g.circle(x, y, 150, `rgba(${c},.05)`, { stroke: `rgba(${c},.55)`, lw: 2, alpha: k });
    orb(g, x, y, c, { a: k, t });
  }
  // 星桥
  const kb = prog(t, 141.8, 147.0);
  if (kb > 0) {
    BRIDGE.forEach((p, i) => {
      const ki = prog(t, 141.8 + i * 0.42, 142.3 + i * 0.42, E.outBack); if (ki <= 0) return;
      if (i > 0 && ki > 0.3) g.line(BRIDGE[i - 1][0], BRIDGE[i - 1][1], p[0], p[1], { color: 'rgba(255,240,210,.55)', lw: 1.5, k: clamp((ki - 0.3) / 0.7) });
      g.circle(p[0], p[1], 3.5 * clamp(ki), '#FFF6E0', { glow: 16, glowColor: 'rgba(255,230,180,1)' });
      g.spot(p[0], p[1], 40, 0.25 * clamp(ki), '255,230,180');
    });
  }
}, { z: 2, fin: 0.6 });
for (let i = 0; i < 11; i++) V.cue(141.8 + i * 0.42, 'ding', 0.18, -0.6 + i * 0.12);
V.cue(127.6, 'swell', 0.35).cue(131.9, 'boom', 0.2).cue(146.4, 'sparkle', 0.4);

// 结尾 191.8–209：天亮；你的光向湖面发出声波，对方的光被点亮
V.scene(191.8, 209.1, (g, lt, s) => {
  const t = s.t, k = prog(t, 192.0, 193.4, E.out), lit = prog(t, 200.2, 203.0, E.inOut);
  orb(g, 380, ORB_Y, WARM, { a: k, t, r: 1 + 0.4 * lit });
  orb(g, 720, ORB_Y + 4, COOL, { a: k * (0.35 + 0.65 * lit), t, r: 0.8 + 0.4 * lit });
  // 片尾卡
  const ke = prog(t, 205.6, 206.8, E.out);
  if (ke > 0) {
    g.text('隧道里的声音', W / 2, 700, { size: 96, weight: 900, fam: 'serif', gradient: ['#FFF4D6', '#F2CD86', '#C99A55'], glow: 30, glowColor: 'rgba(255,200,130,.6)', alpha: ke, ls: 10 });
    g.text('爱，需要被听见', W / 2, 800, { size: 40, weight: 500, fam: 'serif', color: '#FFF0DA', alpha: prog(t, 206.4, 207.4), ls: 6 });
  }
}, { z: 2, fin: 0.6, fout: 0.01 });
water(191.8, 209.1, (g, lt, t) => { for (let i = 0; i < 6; i++) { const ts = 200.2 + i * 0.9; ripple(g, 380, HZ + 70, prog(t, ts, ts + 3.2), { r: 520, alpha: 0.6, rgb: '255,214,160' }); } });
V.cue(196.0, 'swell', 0.4).cue(200.2, 'rise', 0.35).cue(203.0, 'chime', 0.5).cue(204.6, 'sparkle', 0.5);

/* ---------------- 其余段落 ---------------- */
/** 光之花：k 生长 0..1，wilt 凋落 0..1 */
function lightFlower(g, x, base, k, wilt, t) {
  if (k <= 0) return;
  const h = 170 * E.out(clamp(k * 1.4)), tipX = x + Math.sin(t * 0.9) * 6 + wilt * 40, tipY = base - h + wilt * 60;
  g.ctx.save(); g.ctx.globalAlpha *= 1 - wilt * 0.5;
  g.ctx.beginPath(); g.ctx.moveTo(x, base); g.ctx.quadraticCurveTo(x - 10, base - h * 0.5, tipX, tipY);
  g.ctx.lineWidth = 2.5; g.ctx.strokeStyle = 'rgba(255,236,200,.8)'; g.ctx.shadowColor = 'rgba(255,220,170,1)'; g.ctx.shadowBlur = 12; g.ctx.stroke(); g.ctx.restore();
  const open = clamp((k - 0.5) * 2) * (1 - wilt * 0.7);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * 6.28 + t * 0.15, fall = wilt * (i % 2 ? 1 : 0.6);
    const px = tipX + Math.cos(a) * 4 + fall * (i - 3) * 30, py = tipY + Math.sin(a) * 4 + fall * 160;
    g.ctx.save(); g.ctx.translate(px, py); g.ctx.rotate(a + fall * 2); g.ctx.globalAlpha *= open * (1 - fall * 0.8);
    g.ctx.beginPath(); g.ctx.ellipse(18 * open, 0, 20 * open, 8 * open, 0, 0, 6.3); g.ctx.fillStyle = 'rgba(255,214,190,.55)'; g.ctx.shadowColor = 'rgba(255,190,170,1)'; g.ctx.shadowBlur = 18; g.ctx.fill(); g.ctx.restore();
  }
  g.spot(tipX, tipY, 90, 0.4 * open, '255,220,190');
}

// 俄耳甫斯 19.8–27.6：片名；云遮月，前面的光走向远处，回头的一瞬后面的光散成光尘
V.scene(19.8, 27.6, (g, lt, s) => {
  const t = s.t, k = prog(t, 19.9, 20.8, E.out);
  const kt = env(t, 19.9, 23.4, 0.6, 0.6);
  heroText(g, '隧道里的声音', W / 2, HERO_Y - 40, kt, { size: 104 });
  g.text('关系里的沉默，与表达', W / 2, HERO_Y + 50, { size: 34, weight: 500, fam: 'serif', color: '#EADCF2', alpha: kt * 0.9, ls: 8 });
  const go = prog(t, 20.4, 25.8, E.inOut), lost = prog(t, 26.0, 27.4);
  const ax = lerp(560, 640, go), ay = ORB_Y - go * 30;
  orb(g, ax, ay, WARM, { a: k, t, r: 1 - go * 0.25 });
  if (lost < 1) orb(g, lerp(440, 560, go), ORB_Y + 10 - go * 18, COOL, { a: k * (1 - lost), t, r: 0.95 - go * 0.2 });
  if (lost > 0) dust(g, lerp(440, 560, go), ORB_Y - 8, lost, COOL, 8, 50, 160);
}, { z: 2, fin: 0.5 });
V.cue(19.9, 'chime', 0.4).cue(24.2, 'swell', 0.35).cue(26.0, 'sparkle', 0.4);

// 爱与关系 27.3–39.9：两团光之间往返的光点（互动）→ 光之花长出又凋零（关系不会自动存活）
V.scene(27.3, 40.2, (g, lt, s) => {
  const t = s.t, k = prog(t, 27.4, 28.4, E.out);
  const two = prog(t, 34.0, 35.0);
  orb(g, 360, ORB_Y, WARM, { a: k, t });
  orb(g, 720, ORB_Y + 4, COOL, { a: k * (0.3 + 0.7 * two), t });
  const ki = prog(t, 35.0, 35.8) * (1 - prog(t, 37.4, 38.4));
  for (let i = 0; i < 8; i++) {
    const q = (t * 0.45 + i / 8) % 1, dir = i % 2, x = lerp(dir ? 380 : 700, dir ? 700 : 380, q), y = ORB_Y - 20 - Math.sin(q * Math.PI) * 110;
    g.circle(x, y, 4, '#FFF6E0', { alpha: ki * Math.sin(q * Math.PI), glow: 14, glowColor: `rgba(${dir ? WARM : COOL},1)` });
  }
  lightFlower(g, 540, ORB_Y + 40, prog(t, 37.4, 38.6), prog(t, 38.6, 40.0, E.in), t);
}, { z: 2, fin: 0.5 });
water(27.3, 40.2, (g, lt, t) => ripple(g, 540, HZ + 50, prog(t, 37.4, 40.0), { r: 200, alpha: 0.4 }));
V.cue(35.0, 'bubble', 0.3).cue(37.4, 'sparkle', 0.35).cue(38.8, 'swell', 0.25);

// 孤岛 39.9–58.8：两座小岛；你被困在光罩里；信号半路熄灭；一道雾墙从水里升起
function isle(g, x, w) { g.ctx.beginPath(); g.ctx.moveTo(x - w / 2, HZ + 6); g.ctx.bezierCurveTo(x - w / 3, HZ - 46, x + w / 3, HZ - 46, x + w / 2, HZ + 6); g.ctx.closePath(); g.ctx.fillStyle = '#120f26'; g.ctx.fill(); }
V.scene(39.85, 59.2, (g, lt, s) => {
  const t = s.t, k = prog(t, 39.9, 41.0, E.out);
  g.ctx.save(); g.ctx.globalAlpha *= k; isle(g, 300, 300); isle(g, 780, 300); g.ctx.restore();
  orb(g, 300, HZ - 70, WARM, { a: k, t });
  orb(g, 780, HZ - 66, COOL, { a: k, t });
  const kd = prog(t, 44.0, 45.0) * (1 - prog(t, 58.0, 59.0));
  if (kd > 0) { g.circle(300, HZ - 70, 120, 'rgba(255,220,180,.06)', { stroke: 'rgba(255,230,200,.45)', lw: 1.5, alpha: kd }); g.circle(300, HZ - 70, 128, null, { stroke: 'rgba(255,230,200,.15)', lw: 6, alpha: kd }); }
  // 信号
  const ks = env(t, 48.6, 53.8, 0.3, 0.6), q = prog(t, 48.6, 50.6);
  for (let i = 0; i < 9; i++) { const u = i / 14; if (u > q * 0.6) break; const x = lerp(430, 650, u / 0.6 * 0.6 + 0), y = HZ - 130 - Math.sin(u * Math.PI * 1.4) * 70;
    g.circle(lerp(420, 780, u), HZ - 110 - Math.sin(u * Math.PI) * 120, 3, '#FFF0D8', { alpha: ks * (1 - u * 1.1), glow: 10, glowColor: `rgba(${WARM},1)` }); }
  // 雾墙
  const kw = prog(t, 53.9, 57.6, E.inOut) * 0.75 * (1 - prog(t, 63.0, 65.0));
  if (kw > 0) {
    const gw = g.ctx.createLinearGradient(0, HZ, 0, HZ - 520 * kw);
    gw.addColorStop(0, 'rgba(14,12,34,.92)'); gw.addColorStop(0.7, 'rgba(30,26,60,.55)'); gw.addColorStop(1, 'rgba(30,26,60,0)');
    g.ctx.fillStyle = gw; g.ctx.fillRect(W / 2 - 60, HZ - 520 * kw, 120, 520 * kw);
    g.spot(W / 2, HZ - 200, 240, 0.25 * kw, '10,8,30');
  }
}, { z: 2, fin: 0.5 });
V.cue(44.0, 'swell', 0.3).cue(48.6, 'ding', 0.2).cue(50.6, 'wrong', 0.15).cue(53.9, 'reverse', { dur: 3.4, gain: 0.3 });

// 语言 58.8–65.9：雾墙散去，一串发光的字越过水面
V.scene(58.6, 66.3, (g, lt, s) => {
  const t = s.t, k = prog(t, 58.8, 59.4, E.out);
  const wall = 1 - prog(t, 63.4, 65.2);
  if (wall > 0) { const gw = g.ctx.createLinearGradient(0, HZ, 0, HZ - 390); gw.addColorStop(0, `rgba(14,12,34,${0.92 * wall})`); gw.addColorStop(1, 'rgba(30,26,60,0)'); g.ctx.fillStyle = gw; g.ctx.fillRect(W / 2 - 60, HZ - 390, 120, 390); }
  const said = prog(t, 63.7, 65.8, E.inOut);
  orb(g, 300, HZ - 70, WARM, { a: k, t });
  orb(g, 780, HZ - 66, COOL, { a: k * (0.55 + 0.45 * said), t, r: 1 + 0.25 * said });
  for (let i = 0; i < 14; i++) { const q = clamp(said * 1.6 - i * 0.045); if (q <= 0 || q >= 1) continue;
    dotL(g, lerp(340, 740, q), HZ - 120 - Math.sin(q * Math.PI) * 200 + Math.sin(q * 18 + i) * 8, 5 - i * 0.2, Math.sin(q * Math.PI)); }
}, { z: 2, fin: 0.4 });
V.cue(63.7, 'rise', 0.3).cue(65.4, 'chime', 0.45);

// 两种自我感动 65.9–70.7
V.scene(65.9, 71.0, (g, lt, s) => { const t = s.t; orb(g, 380, ORB_Y, WARM, { a: 1, t }); orb(g, 700, ORB_Y + 4, COOL, { a: 1, t }); }, { z: 2, fin: 0.4 });

// 独自硬扛 70.7–93.8：你的光被一层暗壳合上（心门），门外的光越来越冷，轻轻叩门
V.scene(70.7, 94.1, (g, lt, s) => {
  const t = s.t, k = prog(t, 70.8, 71.6, E.out);
  const close = prog(t, 73.4, 75.0, E.inOut), cold = prog(t, 87.8, 90.0);
  const ax = 400, bx = 700;
  orb(g, ax, ORB_Y, WARM, { a: k, t, r: 1 + 0.15 * prog(t, 77.9, 80.8) });
  // 壳：上下两片弧逐渐合拢
  if (close > 0) for (const sgn of [-1, 1]) {
    g.ctx.save(); g.ctx.beginPath(); g.ctx.arc(ax, ORB_Y, 110, sgn < 0 ? Math.PI + (1 - close) * 1.4 : (1 - close) * 1.4, sgn < 0 ? 2 * Math.PI - (1 - close) * 1.4 : Math.PI - (1 - close) * 1.4);
    g.ctx.lineWidth = 16; g.ctx.strokeStyle = `rgba(40,32,78,${0.75 * close})`; g.ctx.shadowColor = 'rgba(10,8,30,.9)'; g.ctx.shadowBlur = 24; g.ctx.stroke(); g.ctx.shadowBlur = 0; g.ctx.lineWidth = 1.2; g.ctx.strokeStyle = `rgba(246,213,143,${0.55 * close})`; g.ctx.stroke(); g.ctx.restore();
  }
  orb(g, bx, ORB_Y + 4, cold > 0 ? '170,190,230' : COOL, { a: k * (1 - 0.45 * cold), t, r: 1 - 0.2 * cold });
}, { z: 2, fin: 0.5 });
water(70.7, 94.1, (g, lt, t) => { for (const ts of [89.0, 90.3, 91.6]) ripple(g, 700, HZ + 40, prog(t, ts, ts + 2.0), { r: 140, alpha: 0.45, rgb: COOL }); });
V.cue(73.4, 'reverse', { dur: 1.6, gain: 0.25 }).cue(75.0, 'thud', 0.3).cue(89.0, 'drop', 0.3).cue(90.3, 'drop', 0.3).cue(91.6, 'drop', 0.3);

// 隐忍克制 93.8–111.7：一滴滴光落进水里，水面的光越积越多 → 临界点，月亮裂开，冲击波扫过湖面
const DRIPS = [96.7, 98.0, 99.6, 100.7, 103.0, 105.2, 106.7, 107.6];
V.scene(93.8, 112.0, (g, lt, s) => {
  const t = s.t, k = prog(t, 93.9, 94.8, E.out);
  const filled = DRIPS.filter((d) => t > d + 0.7).length / DRIPS.length, burst = prog(t, 109.3, 110.8, E.out);
  orb(g, 420, ORB_Y, WARM, { a: k * (1 - 0.3 * filled), t });
  orb(g, 700, ORB_Y + 4, COOL, { a: k, t });
  DRIPS.forEach((d, i) => { const q = prog(t, d, d + 0.7, E.in); if (q <= 0 || q >= 1) return; g.circle(560 + (i % 3 - 1) * 50, lerp(620, HZ + 50, q), 4, '#E8EEFF', { glow: 12, glowColor: `rgba(${COOL},1)` }); });
  const fl = prog(t, 109.3, 109.9); if (fl > 0 && fl < 1) g.spot(540, HZ - 200, 900, 0.35 * Math.exp(-fl * 4), '255,236,205');
}, { z: 2, fin: 0.5 });
water(93.8, 112.0, (g, lt, t) => {
  DRIPS.forEach((d, i) => ripple(g, 560 + (i % 3 - 1) * 50, HZ + 50, prog(t, d + 0.7, d + 3.2), { r: 180, alpha: 0.5, rgb: COOL }));
  const filled = DRIPS.filter((d) => t > d + 0.7).length / DRIPS.length * (1 - prog(t, 109.3, 111.0));
  g.spot(560, HZ + 80, 360, 0.18 * filled, COOL);
  ripple(g, 540, HZ + 60, prog(t, 109.3, 111.4), { r: 900, alpha: 0.8, n: 4 });
});
DRIPS.forEach((d, i) => V.cue(d + 0.7, 'drop', 0.35, (i % 3 - 1) * 0.4));
V.cue(108.3, 'pen', { dur: 1.0, gain: 0.35 }).cue(109.3, 'impact', 0.4).cue(109.3, 'boom', 0.25);

// 双向困境 111.7–127：两团光被拉到湖的两头，中间是漫长的黑；各自的光在自己世界里亮着
V.scene(111.7, 127.3, (g, lt, s) => {
  const t = s.t, k = prog(t, 111.8, 112.8, E.out), far = prog(t, 112.0, 114.6, E.inOut);
  const ax = lerp(420, 150, far), bx = lerp(700, 930, far);
  orb(g, ax, ORB_Y, WARM, { a: k, t, r: 1 + 0.2 * env(t, 114.6, 118.0, 0.5, 0.5) });
  const flick = t > 118 && t < 123 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 7)) : 1;
  orb(g, bx, ORB_Y + 4, COOL, { a: k * flick * (1 - 0.3 * prog(t, 119.9, 121.0)), t });
  const gap = env(t, 122.8, 127.3, 1.2, 0.5);
  if (gap > 0) { const gr = g.ctx.createRadialGradient(W / 2, ORB_Y, 10, W / 2, ORB_Y, 380); gr.addColorStop(0, `rgba(8,7,22,${0.75 * gap})`); gr.addColorStop(1, 'rgba(8,7,22,0)'); g.ctx.fillStyle = gr; g.ctx.fillRect(W / 2 - 400, ORB_Y - 400, 800, 800); }
}, { z: 2, fin: 0.5 });
V.cue(112.0, 'swell', 0.3).cue(118.2, 'wrong', 0.15).cue(122.8, 'reverse', { dur: 2.0, gain: 0.25 });

// 沉默的水面之下 148–156.6：水面平静；水下，没说出口的话一点点沉下去，月光路被啃碎
const UNSAID = ['没事', '算了', '不想麻烦你', '我自己可以'];
V.scene(148.05, 156.9, (g, lt, s) => { const t = s.t, k = prog(t, 148.1, 149.0, E.out); orb(g, 470, ORB_Y, WARM, { a: k * 0.8, t }); orb(g, 610, ORB_Y + 4, COOL, { a: k * 0.8, t }); }, { z: 2, fin: 0.5 });
water(148.05, 156.9, (g, lt, t) => {
  UNSAID.forEach((w, i) => { const q = prog(t, 150.2 + i * 1.0, 156.8, E.inOut); if (q <= 0) return;
    for (let j = 0; j < 5; j++) g.circle([250, 420, 650, 830][i] + (j - 2) * 14, HZ + 70 + q * 160 + (i % 2) * 40 + Math.sin(j + t) * 6, 3.5, '#B8B4D8', { alpha: Math.min(1, q * 4) * (1 - q) * 0.7, glow: 8, glowColor: 'rgba(170,170,220,1)' }); });
  const eat = prog(t, 152.2, 156.4);
  if (eat > 0) { const gr = g.ctx.createRadialGradient(MOON.x, HZ + 260, 20, MOON.x, HZ + 260, 420); gr.addColorStop(0, `rgba(8,8,24,${0.6 * eat})`); gr.addColorStop(1, 'rgba(8,8,24,0)'); g.ctx.fillStyle = gr; g.ctx.fillRect(MOON.x - 420, HZ, 840, 700); }
});
V.cue(150.2, 'bubble', 0.2).cue(152.2, 'bubble', 0.2).cue(154.9, 'heartbeat', 0.3);

// 自我保护 156.6–170.3：你的光蜷起来，被一层层细光线缠成茧；周围是担心的薄雾
V.scene(156.55, 170.6, (g, lt, s) => {
  const t = s.t, k = prog(t, 156.6, 157.6, E.out), c = prog(t, 161.5, 163.4, E.inOut);
  orb(g, 540, ORB_Y - 20, WARM, { a: k * (1 - 0.35 * c), t, r: 1 - 0.25 * c });
  for (let i = 0; i < 7; i++) { g.ctx.save(); g.ctx.globalAlpha *= c * 0.55; g.ctx.beginPath(); g.ctx.ellipse(540, ORB_Y - 20, 70 + i * 6, 44 + i * 5, t * (0.3 + i * 0.05) + i, 0, 6.3 * c); g.ctx.lineWidth = 1.2; g.ctx.strokeStyle = 'rgba(255,226,180,.8)'; g.ctx.stroke(); g.ctx.restore(); }
  const fog = prog(t, 163.4, 168.6);
  for (let i = 0; i < 3; i++) g.spot(540 + [-260, 260, 0][i] + Math.sin(t * 0.4 + i) * 30, ORB_Y - [100, 60, 230][i], 200, 0.28 * fog * prog(t, [163.4, 166.3, 168.4][i], [164.4, 167.3, 169.4][i]), '120,110,160');
}, { z: 2, fin: 0.5 });
V.cue(161.5, 'swell', 0.3).cue(163.4, 'bubble', 0.2).cue(166.3, 'bubble', 0.2).cue(168.4, 'bubble', 0.2);

// 不用时刻强大 170.3–177.7：两团光慢慢靠近，光晕融在一起，湖面开出一朵光之花
V.scene(170.25, 178.1, (g, lt, s) => {
  const t = s.t, k = prog(t, 170.3, 171.2, E.out), j = prog(t, 172.2, 176.0, E.inOut);
  orb(g, lerp(300, 505, j), ORB_Y, WARM, { a: k, t });
  orb(g, lerp(780, 575, j), ORB_Y + 4, COOL, { a: k, t });
  g.spot(540, ORB_Y, 300, 0.25 * j, '255,214,190');
  lightFlower(g, 540, ORB_Y + 52, prog(t, 175.4, 177.6), 0, t);
}, { z: 2, fin: 0.5 });
V.cue(172.2, 'swell', 0.3).cue(175.4, 'sparkle', 0.4).cue(176.6, 'chime', 0.4);

// 爱需要被听见 177.8–191.8：你的光向湖面发出一圈圈声波，对方的光被一点点点亮
V.scene(177.75, 192.2, (g, lt, s) => {
  const t = s.t, k = prog(t, 177.8, 178.6, E.out), heard = prog(t, 180.0, 190.0);
  orb(g, 360, ORB_Y, WARM, { a: k, t, r: 1.1 });
  orb(g, 720, ORB_Y + 4, COOL, { a: k * (0.4 + 0.6 * heard), t, r: 0.85 + 0.3 * heard });
}, { z: 2, fin: 0.5 });
water(177.75, 192.2, (g, lt, t) => { for (let i = 0; i < 12; i++) { const ts = 180.0 + i * 0.95; ripple(g, 360, HZ + 60, prog(t, ts, ts + 3.4), { r: 520, alpha: 0.5, rgb: '255,214,160', n: 1 }); } });
V.cue(180.0, 'chime', 0.35).cue(186.3, 'ding', 0.25).cue(187.5, 'ding', 0.25).cue(189.8, 'ding', 0.25);

// 段落切换：极轻的气流声
for (const sc of V.scenes) if (sc.a > 1 && sc.b - sc.a < 100) V.cue(sc.a + 0.05, 'whoosh', 0.16);
V.mount();
