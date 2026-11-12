/* 《明天的太阳》— 黎明前的地平线 · 竖屏 1080×1920 · 配音驱动
 * 世界：深蓝的黎明前天空 + 远山 + 一条通向地平线的路；"你" = 路上的一团暖光
 * 关键词不用文字，用光线"描"出来的图标；全片天色由夜到黎明，签字那一刻太阳升起 */
const HZ = 1180;            // 地平线
const CY = 700;             // 天空主视觉中心
const V = Vibe.create({
  width: 1080, height: 1920, duration: 137.2, watermark: '@zhiyusay', theme: 'dark', seed: 31,
  layout: { subY: 1500, lineGap: 74, subMaxW: 900, label: 292, wm: [64, 196] },
  subStyle: { fam: 'serif', size: 50, weight: 700, color: '#F2F2FA', hi: '#F6D58F', glow: 18, glowColor: 'rgba(3,5,16,.95)', ls: 3 },
  bg: (g, t) => world(g, t),
});
const { E, prog, env, clamp, lerp, rng } = Vibe;
const W = V.W, H = V.H;
V.beatGlow = false; V.dropFlash = false;

const WARM = '255,204,140', COOL = '170,196,255';
const LC = '#FBE0A8', CC = '#B9CCFF', RC = '#FF8F78';
const mix = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k)));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const TAU = Math.PI * 2;

/* ================================================================
 * 时间线上的状态
 * ================================================================ */
/** 天亮程度：签字前后从夜到黎明；"日子往前走"时天色快速明暗交替 */
const lapse = (t) => { const k = env(t, 103.7, 108.4, 0.4, 0.8); return k > 0 ? k * 0.38 * Math.max(0, Math.sin((t - 103.7) * TAU / 1.5)) : 0; };
const dawn = (t) => clamp(0.12 * prog(t, 22.4, 24.6) * (1 - prog(t, 26.5, 28.5)) + prog(t, 121.0, 135.0, E.inOut) + lapse(t));
/** 太阳升起 */
const sunRise = (t) => prog(t, 128.0, 135.5, E.inOut);
/** 走路距离（驱动路面虚线流动） */
const walk = (t) => 0.5 * prog(t, 17.4, 17.9) - 0.5 * prog(t, 17.9, 18.6) + 2.2 * prog(t, 113.8, 116.2) + 9 * prog(t, 129.8, 137.2, E.in);
/** 你的位置（走远一点会略微变小、上移） */
const orbY = (t) => 1312 - 10 * env(t, 17.4, 18.6, 0.5, 0.7) - 14 * prog(t, 113.8, 116.2) - 60 * prog(t, 129.8, 137.2, E.in);
/** 黑暗（没有习惯的时候） */
const dark = (t) => env(t, 67.0, 76.0, 1.4, 1.6);

/* ================================================================
 * 世界：天空 / 星 / 太阳 / 远山 / 大地 / 路
 * ================================================================ */
const STARS = (() => { const r = rng(5); return [...Array(240)].map(() => ({ x: r() * W, y: r() * (HZ - 160), s: Math.pow(r(), 3), ph: r() * 6.3, sp: 0.4 + r() * 1.4 })); })();
const RIDGE = (seed, amp, base, rough) => { const r = rng(seed), ph = [r() * 6, r() * 6, r() * 6]; const pts = [];
  for (let x = -20; x <= W + 20; x += 8) { const u = x / W; pts.push([x, base - amp * (0.5 + 0.28 * Math.sin(u * 4.3 + ph[0]) + 0.14 * Math.sin(u * 11 + ph[1]) + rough * Math.sin(u * 37 + ph[2])) * (0.5 + 0.8 * Math.abs(u - 0.5))]); }
  return pts; };
const RIDGES = [
  { pts: RIDGE(14, 64, HZ, 0.05), col: [44, 52, 98], a: 0.8 },
  { pts: RIDGE(29, 38, HZ + 2, 0.08), col: [22, 28, 60], a: 0.95 },
];
/** 地面透视：深度 z（1 = 画面底边）→ 屏幕 y；路的半宽 */
const zY = (z) => HZ + (H - HZ) / z;
const roadW = (z) => 640 / z;

function world(g, t) {
  const { ctx } = g, d = dawn(t);
  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, rgb(mix([5, 8, 24], [44, 70, 128], d)));
  sky.addColorStop(0.5, rgb(mix([14, 22, 58], [112, 130, 176], d)));
  sky.addColorStop(0.84, rgb(mix([36, 44, 92], [236, 172, 146], d)));
  sky.addColorStop(1, rgb(mix([84, 70, 112], [255, 212, 158], d)));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ + 4);
  // 星
  for (const s of STARS) {
    const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
    const a = (0.12 + 0.88 * s.s) * tw * (1 - d * 0.95) * (1 - s.y / HZ * 0.55);
    if (a < 0.03) continue;
    g.circle(s.x, s.y, 0.7 + s.s * 1.7, `rgba(240,244,255,${a})`);
    if (s.s > 0.62) { g.line(s.x - 7 * s.s, s.y, s.x + 7 * s.s, s.y, { color: `rgba(240,244,255,${a * 0.45})`, lw: 1 }); g.line(s.x, s.y - 7 * s.s, s.x, s.y + 7 * s.s, { color: `rgba(240,244,255,${a * 0.45})`, lw: 1 }); }
  }
  // 流星
  for (const ts of [4.6, 52.0, 88.9, 124.0]) { const k = (t - ts) / 0.9; if (k > 0 && k < 1) { const x0 = 760 + k * 220, y0 = 260 + k * 90; g.line(x0, y0, x0 - 140 * (1 - k * 0.5), y0 - 56 * (1 - k * 0.5), { color: `rgba(250,250,255,${0.8 * Math.sin(k * Math.PI)})`, lw: 2 }); } }
  // 太阳（在远山后面升起）
  const sr = sunRise(t);
  if (sr > 0) {
    const sy = HZ + 70 - sr * 330, sx = 540;
    g.spot(sx, sy, 900, 0.32 * sr, '255,200,140');
    g.spot(sx, sy, 330, 0.55 * sr, '255,224,170');
    ctx.save(); ctx.shadowColor = `rgba(255,214,150,${sr})`; ctx.shadowBlur = 80;
    const sg = ctx.createRadialGradient(sx, sy - 20, 10, sx, sy, 92);
    sg.addColorStop(0, '#FFFBEE'); sg.addColorStop(0.7, '#FFE7B4'); sg.addColorStop(1, '#FFC98A');
    ctx.beginPath(); ctx.arc(sx, sy, 92, 0, TAU); ctx.fillStyle = sg; ctx.fill(); ctx.restore();
  }
  // 地平线辉光
  const hg = ctx.createLinearGradient(0, HZ - 260, 0, HZ);
  hg.addColorStop(0, 'rgba(255,180,150,0)'); hg.addColorStop(1, `rgba(${mix([240, 160, 150], [255, 210, 160], d).join(',')},${0.22 + 0.45 * d})`);
  ctx.fillStyle = hg; ctx.fillRect(0, HZ - 260, W, 260);
  // 远山
  for (const R of RIDGES) {
    ctx.beginPath(); ctx.moveTo(-20, HZ + 6); for (const [x, y] of R.pts) ctx.lineTo(x, y); ctx.lineTo(W + 20, HZ + 6); ctx.closePath();
    ctx.fillStyle = rgb(mix(R.col, [R.col[0] + 80, R.col[1] + 60, R.col[2] + 40], d), R.a); ctx.fill();
  }
  // 大地
  const gg = ctx.createLinearGradient(0, HZ, 0, H);
  gg.addColorStop(0, rgb(mix([20, 24, 52], [92, 78, 96], d))); gg.addColorStop(0.3, rgb(mix([9, 11, 28], [40, 36, 58], d))); gg.addColorStop(1, rgb(mix([3, 4, 10], [14, 13, 24], d)));
  ctx.fillStyle = gg; ctx.fillRect(0, HZ, W, H - HZ);
  // 路：两条边线 + 中线虚线（随 walk 流动）
  const edgeA = 0.22 + 0.25 * d;
  for (const sg of [-1, 1]) {
    ctx.save(); const lg = ctx.createLinearGradient(0, HZ, 0, H);
    lg.addColorStop(0, `rgba(255,226,180,0)`); lg.addColorStop(0.15, `rgba(255,226,180,${edgeA})`); lg.addColorStop(1, `rgba(255,226,180,${edgeA * 0.4})`);
    ctx.strokeStyle = lg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(540 + sg * 4, HZ + 2); ctx.lineTo(540 + sg * roadW(1), H); ctx.stroke(); ctx.restore();
  }
  const ph = walk(t) % 2;
  for (let z0 = 1; z0 < 40; z0 += 2) {
    const z = z0 + 2 - ph; if (z < 1) continue;
    const y1 = zY(z), y2 = zY(z + 0.9); const a = (0.18 + 0.3 * d) * clamp((y1 - HZ) / 60);
    g.line(540, y1, 540, y2, { color: `rgba(255,232,190,${a})`, lw: Math.max(1, 7 / z) });
  }
  // 地面薄雾
  const fg = ctx.createLinearGradient(0, HZ - 40, 0, HZ + 120);
  fg.addColorStop(0, 'rgba(190,190,230,0)'); fg.addColorStop(0.35, `rgba(${mix([150, 160, 220], [255, 214, 180], d).join(',')},${0.12 + 0.14 * d})`); fg.addColorStop(1, 'rgba(190,190,230,0)');
  ctx.fillStyle = fg; ctx.fillRect(0, HZ - 40, W, 160);
}

/* ================================================================
 * 光线图标工具
 * ================================================================ */
const GL = (g, pts, k, o = {}) => { if (k <= 0) return; return g.path(pts, clamp(k), { color: o.c || LC, lw: o.lw || 5, glow: o.glow ?? 22, alpha: o.a ?? 1, dash: o.dash }); };
const arcP = (cx, cy, rx, a0, a1, ry = rx, n = 48) => [...Array(n + 1)].map((_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const circP = (cx, cy, r, n = 64) => arcP(cx, cy, r, -Math.PI / 2, Math.PI * 1.5, r, n);
const rectP = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
const rrP = (x, y, w, h, r) => [...arcP(x + r, y + r, r, Math.PI, Math.PI * 1.5, r, 8), ...arcP(x + w - r, y + r, r, -Math.PI / 2, 0, r, 8), ...arcP(x + w - r, y + h - r, r, 0, Math.PI / 2, r, 8), ...arcP(x + r, y + h - r, r, Math.PI / 2, Math.PI, r, 8), [x, y + r]];
const checkP = (cx, cy, s) => [[cx - s * 0.5, cy], [cx - s * 0.12, cy + s * 0.38], [cx + s * 0.55, cy - s * 0.45]];
const squig = (x0, x1, y, seed, amp = 9) => { const r = rng(seed); return [...Array(Math.round((x1 - x0) / 7) + 1)].map((_, i) => { const x = x0 + i * 7; return [x, y + Math.sin(i * 0.9 + r() * 1.2) * amp * (0.5 + r() * 0.6)]; }); };
const dotL = (g, x, y, r, a = 1, c = '255,224,170') => { if (a > 0.01) g.circle(x, y, r, '#FFF7E6', { alpha: a, glow: 16, glowColor: `rgba(${c},1)` }); };
const cross = (g, cx, cy, s, k, c = RC) => { GL(g, [[cx - s, cy - s], [cx + s, cy + s]], k * 2, { c, lw: 6 }); GL(g, [[cx + s, cy - s], [cx - s, cy + s]], k * 2 - 1, { c, lw: 6 }); };
/** 平移缩放后画 */
const at = (g, x, y, s, fn, a = 1) => { if (a <= 0.005) return; g.ctx.save(); g.ctx.globalAlpha *= a; g.ctx.translate(x, y); g.ctx.scale(s, s); fn(); g.ctx.restore(); };
/** 小太阳（半圆 + 地平线短线） */
const miniSun = (g, x, y, r, k, o = {}) => { GL(g, [[x - r * 1.8, y], [x + r * 1.8, y]], k * 2, { lw: o.lw || 3, c: o.c, glow: 10, a: o.a }); if (k > 0.3) g.ctx.save(), g.ctx.globalAlpha *= clamp((k - 0.3) * 2) * (o.a ?? 1), g.ctx.beginPath(), g.ctx.arc(x, y - (o.up ?? 0), r, Math.PI, TAU), g.ctx.closePath(), g.ctx.fillStyle = o.fill || 'rgba(255,222,160,.9)', g.ctx.shadowColor = 'rgba(255,210,140,1)', g.ctx.shadowBlur = 14, g.ctx.fill(), g.ctx.restore(); };
/** 粒子消散 */
function dust(g, x, y, k, c, seed = 1, n = 40, spread = 200) {
  if (k <= 0 || k >= 1) return; const r = rng(seed);
  for (let i = 0; i < n; i++) { const ang = r() * TAU, dd = k * (30 + r() * spread); g.circle(x + Math.cos(ang) * dd, y + Math.sin(ang) * dd * 0.8 - k * 50 * r(), 1.5 + r() * 2.5, `rgba(${c},${(1 - k) * 0.9})`, { glow: 8, glowColor: `rgba(${c},1)` }); }
}
/** 一团光（人） */
function orb(g, x, y, c, o = {}) {
  const a = o.a ?? 1, r = o.r ?? 1, f = 1 + 0.06 * Math.sin((o.t || 0) * 3.1 + x);
  if (a <= 0.01) return;
  g.spot(x, y, 200 * r * f, 0.22 * a, c);
  g.spot(x, y, 72 * r * f, 0.55 * a, c);
  g.circle(x, y, 12 * r, `rgba(255,252,244,${a})`, { glow: 28 * r, glowColor: `rgba(${c},${a})` });
}

/* ================================================================
 * 字幕
 * ================================================================ */
for (const s of window.SUBS) V.sub(s.a, s.b, s.text);

/* ================================================================
 * 常驻层："你"（路上的一团暖光）+ 脚下光斑 + 黑暗
 * ================================================================ */
// 黑暗（没有习惯）：除了你身边一小圈，全都暗下去
V.scene(0, 137.2, (g, lt, s) => {
  const k = dark(s.t); if (k <= 0) return;
  const oy = orbY(s.t), R = lerp(1400, 300, k);
  const gr = g.ctx.createRadialGradient(540, oy, R * 0.25, 540, oy, R);
  gr.addColorStop(0, 'rgba(2,3,10,0)'); gr.addColorStop(1, `rgba(2,3,10,${0.86 * k})`);
  g.ctx.fillStyle = gr; g.ctx.fillRect(0, 0, W, H);
}, { z: 6, fin: 0.01, fout: 0.01 });

V.scene(0, 137.2, (g, lt, s) => {
  const t = s.t, k = prog(t, 0.3, 1.8, E.out), oy = orbY(t);
  const sc = 1 - 0.18 * prog(t, 129.8, 137.2, E.in);
  const bob = Math.sin(walk(t) * Math.PI * 2) * 4;
  // 脚下那点确定：一圈暖光（习惯给的）
  const pool = env(t, 75.0, 80.0, 1.0, 1.6);
  if (pool > 0) { g.ctx.save(); g.ctx.globalAlpha *= pool; g.ctx.beginPath(); g.ctx.ellipse(540, oy + 40, 170, 30, 0, 0, TAU);
    const pg = g.ctx.createRadialGradient(540, oy + 40, 0, 540, oy + 40, 170); pg.addColorStop(0, 'rgba(255,214,150,.55)'); pg.addColorStop(1, 'rgba(255,214,150,0)'); g.ctx.fillStyle = pg; g.ctx.fill(); g.ctx.restore(); }
  orb(g, 540, oy + bob, WARM, { a: k * (1 - 0.35 * dark(t) + 0.0), t, r: sc * (1 + 0.25 * prog(t, 129.4, 130.6)) });
}, { z: 7, fin: 0.01, fout: 0.01 });
V.cue(0.3, 'swell', 0.45);

/* ================================================================
 * ① 钩子 0–18.6：没有百分之百的把握
 * ================================================================ */
V.scene(0, 18.9, (g, lt, s) => {
  const t = s.t;
  // A 进度环停在九成 → 先放一放（缩到右上角）→ 沙漏：等想清楚了再说
  const kA = env(t, 0.5, 7.3, 0.4, 0.7);
  if (kA > 0) {
    const sh = prog(t, 4.3, 5.2, E.inOut), cx = lerp(540, 830, sh), cy = lerp(CY, 430, sh), sc = lerp(1, 0.42, sh);
    at(g, cx, cy, sc, () => {
      GL(g, circP(0, 0, 170), 1, { c: 'rgba(255,240,210,.18)', lw: 3, glow: 0, dash: [6, 10] });
      const fill = 0.9 * prog(t, 0.8, 3.0, E.out);
      GL(g, arcP(0, 0, 170, -Math.PI / 2, -Math.PI / 2 + fill * TAU), 1, { lw: 9 });
      // 缺口那一点：一直在闪，够不到
      if (t > 2.6) { const a = -Math.PI / 2 + 0.9 * TAU, b = 1.5 * Math.PI; const pts = arcP(0, 0, 170, a, b, 170, 12);
        GL(g, pts, 1, { c: `rgba(255,143,120,${0.35 + 0.35 * Math.sin(t * 7)})`, lw: 9, glow: 14 }); }
      // 顶端"100%"刻度
      GL(g, [[0, -200], [0, -150]], prog(t, 1.4, 1.9), { lw: 3, a: 0.7 });
      dotL(g, 0, 0, 10, prog(t, 1.0, 1.6) * (0.6 + 0.4 * Math.sin(t * 2)));
    }, kA * lerp(1, 0.55, sh));
    // 沙漏
    const kh = env(t, 5.3, 7.3, 0.3, 0.6);
    if (kh > 0) {
      const flip = prog(t, 6.0, 6.5, E.outBack) * Math.PI;
      at(g, 540, CY + 20, 1, () => {
        g.ctx.rotate(flip);
        const hp = [[-70, -110], [70, -110], [8, -6], [70, 110], [-70, 110], [-8, -6], [-70, -110]];
        GL(g, hp, prog(t, 5.3, 5.9) * 1.0);
        GL(g, [[-90, -110], [90, -110]], prog(t, 5.5, 5.9), { lw: 4 }); GL(g, [[-90, 110], [90, 110]], prog(t, 5.5, 5.9), { lw: 4 });
        for (let i = 0; i < 5; i++) { const q = ((t * 1.2 + i / 5) % 1); dotL(g, 0, lerp(-4, 96, q), 2.5, prog(t, 6.5, 6.8)); }
      }, kh);
    }
  }
  // B 招聘软件：手机亮起 → 列表滚动 → 三个月（三轮月亮）→ 关掉
  const kB = env(t, 7.0, 10.4, 0.3, 0.6);
  if (kB > 0) at(g, 540, CY + 30, 1, () => {
    GL(g, rrP(-115, -200, 230, 400, 30), prog(t, 7.0, 7.6));
    GL(g, [[-24, -180], [24, -180]], prog(t, 7.5, 7.7), { lw: 4 });
    const on = prog(t, 7.6, 7.9) * (1 - prog(t, 9.3, 9.45));
    if (on > 0) {
      g.fillRR(-98, -160, 196, 320, 10, `rgba(255,236,200,${0.08 * on})`);
      g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(-98, -160, 196, 320); g.ctx.clip();
      const sc = (t - 7.6) * 120;
      for (let i = 0; i < 14; i++) { const y = -140 + i * 54 - (sc % 54) - Math.floor(sc / 54) * 0; const yy = ((y + 160) % (14 * 54)) - 160;
        g.circle(-66, yy + 14, 12, null, { stroke: `rgba(251,224,168,${0.6 * on})`, lw: 2 });
        g.line(-40, yy + 6, 70, yy + 6, { color: `rgba(251,224,168,${0.7 * on})`, lw: 4 }); g.line(-40, yy + 22, 30, yy + 22, { color: `rgba(251,224,168,${0.35 * on})`, lw: 3 }); }
      g.ctx.restore();
    }
    [8.45, 8.7, 8.95].forEach((ts, i) => { const k = prog(t, ts, ts + 0.3, E.outBack); if (k <= 0) return;
      const x = -90 + i * 90, y = -270; g.circle(x, y, 22 * k, 'rgba(255,240,205,.95)', { glow: 18, glowColor: 'rgba(255,220,160,1)' });
      g.circle(x + 9 - 18 * clamp((t - ts) / 0.8), y - 4, 19 * k, `rgba(10,14,36,${0.95 * (1 - clamp((t - ts - 0.2) / 0.6))})`); });
  }, kB);
  // C 利弊两栏：天平，左三条右三条，始终持平
  const kC = env(t, 10.2, 14.6, 0.3, 0.6);
  if (kC > 0) {
    const L = [12.0, 12.25, 12.5], R = [13.0, 13.25, 13.5];
    const wob = [...L, ...R].reduce((s_, ts, i) => s_ + (t > ts ? Math.sin((t - ts) * 14) * Math.exp(-(t - ts) * 3.5) * 0.05 * (i < 3 ? -1 : 1) : 0), 0);
    at(g, 540, CY - 40, 1, () => {
      GL(g, [[0, -40], [0, 300]], prog(t, 10.2, 10.6));
      GL(g, [[-90, 300], [90, 300]], prog(t, 10.5, 10.8));
      dotL(g, 0, -40, 9, prog(t, 10.5, 10.7));
      g.ctx.save(); g.ctx.translate(0, -40); g.ctx.rotate(wob);
      GL(g, [[-260, 0], [260, 0]], prog(t, 10.5, 11.0));
      for (const [sx, list] of [[-1, L], [1, R]]) {
        const px = sx * 240;
        g.ctx.save(); g.ctx.translate(px, 0); g.ctx.rotate(-wob);
        GL(g, [[0, 0], [-70, 120]], prog(t, 10.8, 11.1), { lw: 3 }); GL(g, [[0, 0], [70, 120]], prog(t, 10.8, 11.1), { lw: 3 });
        GL(g, arcP(0, 120, 90, 0, Math.PI, 28), prog(t, 11.0, 11.4));
        list.forEach((ts, i) => { const k = prog(t, ts, ts + 0.35, E.out); if (k <= 0) return;
          const y = lerp(-180, 112 - i * 16, k); g.line(-50, y, 50, y, { color: sx < 0 ? 'rgba(251,224,168,.95)' : 'rgba(185,204,255,.95)', lw: 8 }); });
        g.ctx.restore();
      }
      g.ctx.restore();
    }, kC);
  }
  // D 心里彻底踏实：一个虚线的对勾，慢慢充满，却总差一点
  const kD = env(t, 14.3, 18.9, 0.4, 0.6);
  if (kD > 0) at(g, 540, CY, 1, () => {
    const p = checkP(0, 0, 300);
    GL(g, p, prog(t, 14.4, 15.2), { c: 'rgba(255,240,210,.5)', lw: 4, dash: [10, 12], glow: 6 });
    GL(g, p, 0.86 * prog(t, 15.6, 17.2, E.out), { lw: 12 });
    if (t > 17.2) dotL(g, ...p[2].map((v, i) => lerp(p[1][i], p[2][i], 0.86 + 0.03 * Math.sin(t * 6))), 6, 0.6 + 0.4 * Math.sin(t * 7));
  }, kD);
}, { z: 2, fin: 0.01 });
V.cue(0.8, 'pen', { dur: 2.2, gain: 0.35 }).cue(2.8, 'tick', 0.3).cue(4.3, 'slide', 0.45)
  .cue(5.3, 'pen', { dur: 0.6, gain: 0.35 }).cue(6.0, 'flip', 0.35)
  .cue(7.0, 'pen', { dur: 0.6, gain: 0.3 }).cue(7.6, 'click', 0.45).cue(7.8, 'slide', 0.25)
  .cue(8.45, 'tick', 0.4, -0.3).cue(8.7, 'tick', 0.4, 0).cue(8.95, 'tick', 0.4, 0.3).cue(9.3, 'snap', 0.45)
  .cue(10.2, 'pen', { dur: 1.0, gain: 0.35 });
[12.0, 12.25, 12.5].forEach((ts, i) => V.cue(ts + 0.3, 'drop', 0.25, -0.6 + i * 0.1));
[13.0, 13.25, 13.5].forEach((ts, i) => V.cue(ts + 0.3, 'drop', 0.25, 0.4 + i * 0.1));
V.cue(14.4, 'pen', { dur: 0.8, gain: 0.25 }).cue(15.6, 'rise', 0.25).cue(17.4, 'thud', 0.3);

/* ================================================================
 * ② 休谟的问题 18.4–27：书 → 太阳会不会升起 → 片名
 * ================================================================ */
V.scene(18.3, 27.6, (g, lt, s) => {
  const t = s.t;
  const kb = env(t, 18.4, 22.6, 0.4, 0.6);
  if (kb > 0) at(g, 540, CY + 40, 1.15, () => {
    const pageL = [[0, 70], [-60, 50], [-210, 60], [-210, -110], [-60, -120], [0, -100]];
    GL(g, pageL, prog(t, 18.5, 19.3)); GL(g, pageL.map(([x, y]) => [-x, y]), prog(t, 18.5, 19.3));
    GL(g, [[0, -100], [0, 70]], prog(t, 18.9, 19.2), { lw: 3 });
    for (let i = 0; i < 4; i++) { GL(g, [[-180, -70 + i * 30], [-40, -76 + i * 30]], prog(t, 19.2 + i * 0.1, 19.5 + i * 0.1), { lw: 2.5, a: 0.5 }); GL(g, [[40, -76 + i * 30], [180, -70 + i * 30]], prog(t, 19.3 + i * 0.1, 19.6 + i * 0.1), { lw: 2.5, a: 0.5 }); }
    // 翻页
    const fl = prog(t, 20.6, 21.3, E.inOut);
    if (fl > 0 && fl < 1) { const a = lerp(0, Math.PI, fl); GL(g, [[0, 70], [Math.cos(a) * 200 * (1 - 0.15 * Math.sin(a)), 60 - Math.sin(a) * 60], [Math.cos(a) * 200, -110 - Math.sin(a) * 60], [0, -100]], 1, { lw: 3.5 }); }
    // 书里升起一个小小的问号状光点
    const q = prog(t, 21.4, 22.4, E.out); if (q > 0) { dotL(g, 0, -130 - q * 120, 7, q); GL(g, arcP(0, -230 - q * 40, 36, Math.PI, Math.PI * 2.4), q, { lw: 4 }); }
  }, kb);
  // 太阳的轨迹（虚线大弧）+ 地平线下的虚线太阳
  const ks = env(t, 22.4, 27.6, 0.4, 0.8);
  if (ks > 0) {
    g.ctx.save(); g.ctx.globalAlpha *= ks;
    GL(g, arcP(540, HZ, 440, Math.PI, Math.PI * 2, 560, 80), prog(t, 22.5, 24.0), { lw: 3, dash: [3, 14], glow: 12 });
    const k2 = prog(t, 23.9, 24.6, E.out);
    GL(g, arcP(540, HZ, 92, Math.PI, Math.PI * 2), k2, { lw: 4, dash: [10, 10] });
    g.spot(540, HZ, 260, 0.18 * k2, '255,214,150');
    const p = prog(t, 24.0, 24.9, E.inOut); if (p > 0) dotL(g, ...arcP(540, HZ, 440, Math.PI, Math.PI * 2, 560, 80)[Math.round(p * 40)], 9, 1 - prog(t, 25.6, 26.4));
    g.ctx.restore();
    // 片名
    const kt = env(t, 23.9, 27.4, 0.6, 0.8);
    if (kt > 0) {
      const sc = lerp(1.08, 1, E.out(prog(t, 23.9, 25.0)));
      g.ctx.save(); g.ctx.translate(540, 420); g.ctx.scale(sc, sc);
      g.spot(0, 0, 420, 0.12 * kt, '255,214,150');
      g.text('明天的太阳', 0, 0, { size: 112, weight: 900, fam: 'serif', gradient: ['#FFF4D6', '#F2CD86', '#C99A55'], glow: 30, glowColor: 'rgba(255,200,130,.6)', alpha: kt, ls: lerp(36, 14, E.out(prog(t, 23.9, 25.2))) });
      g.ctx.restore();
      g.text('没有把握的时候，怎么行动', 540, 525, { size: 36, weight: 500, fam: 'serif', color: '#E8E2F4', alpha: kt * prog(t, 24.6, 25.4), ls: 8 });
    }
  }
}, { z: 2, fin: 0.3 });
V.cue(18.5, 'paper', 0.5).cue(18.6, 'pen', { dur: 0.8, gain: 0.3 }).cue(20.6, 'flip', 0.4).cue(21.4, 'bubble', 0.3)
  .cue(22.5, 'pen', { dur: 1.5, gain: 0.3 }).cue(23.9, 'thud', 0.5).cue(23.95, 'chime', 0.4);

/* ================================================================
 * ③ 两类知识 25.6–47.2
 * ================================================================ */
const LX = 280, RX = 800;
V.scene(25.5, 47.4, (g, lt, s) => {
  const t = s.t;
  const kP = env(t, 25.7, 38.4, 0.5, 0.7);     // 左右两栏
  if (kP > 0) {
    g.ctx.save(); g.ctx.globalAlpha *= kP;
    GL(g, [[540, 380], [540, 1060]], prog(t, 25.9, 26.8), { lw: 2, c: 'rgba(255,240,210,.45)', glow: 6 });
    // 左：3×5 = 30 的一半 —— 用点阵"算"出来
    const g1 = prog(t, 28.4, 29.0);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const i = r * 5 + c; const k = clamp(g1 * 15 - i); dotL(g, LX - 76 + c * 38, 470 + r * 38, 8 * E.outBack(k), k); }
    const eq = prog(t, 29.1, 29.4); GL(g, [[LX - 40, 600], [LX + 40, 600]], eq, { lw: 5 }); GL(g, [[LX - 40, 622], [LX + 40, 622]], eq, { lw: 5 });
    const g2 = prog(t, 29.4, 29.9), half = prog(t, 29.95, 30.4, E.inOut);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) { const i = r * 5 + c; const k = clamp(g2 * 30 - i); const gone = r >= 3 ? half : 0;
      dotL(g, LX - 76 + c * 38 + gone * 160, 690 + r * 38 + gone * 20, 8 * E.outBack(k), k * (1 - gone), r >= 3 ? '185,204,255' : '255,224,170'); }
    if (half > 0) GL(g, [[LX - 110, 805], [LX + 110, 805]], half * 1.4, { lw: 2.5, dash: [8, 8], c: CC });
    GL(g, checkP(LX, 975, 110), prog(t, 30.6, 31.2), { lw: 8 });
    // 右：事实 —— 太阳升没升起，要看外面的世界
    const kr = prog(t, 32.2, 32.9, E.out);
    GL(g, [[RX - 190, 760], [RX + 190, 760]], kr * 1.2, { lw: 3 });
    const up = prog(t, 33.9, 35.0, E.inOut);
    if (kr > 0) { g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(RX - 200, 500, 400, 258); g.ctx.clip();
      g.circle(RX, 760 + 80 - up * 150, 64, 'rgba(255,222,160,.92)', { glow: 26, glowColor: 'rgba(255,200,130,1)', alpha: kr }); g.ctx.restore(); }
    // 反面：水平线下一个虚线太阳，同样清楚
    const kv = prog(t, 36.0, 36.8, E.out);
    GL(g, arcP(RX, 760, 64, 0, Math.PI), kv, { c: CC, lw: 4, dash: [9, 9] });
    if (kv > 0) g.spot(RX, 800, 140, 0.18 * kv, COOL);
    g.ctx.restore();
  }
  // 两种明天并排：B 不升起（星空），A 升起 → 一样清楚 → 都没有矛盾
  const kAB = env(t, 37.9, 47.4, 0.5, 0.6);
  if (kAB > 0) {
    g.ctx.save(); g.ctx.globalAlpha *= kAB;
    const pos = [[300, 640], [780, 640]];
    const kB = prog(t, 38.0, 38.6, E.outBack), kA = prog(t, 39.7, 40.3, E.outBack);
    const proved = prog(t, 46.3, 47.0);
    for (const [i, [x, y]] of pos.entries()) {
      const k = i === 0 ? kA : kB; if (k <= 0) continue;
      at(g, x, y, k, () => {
        GL(g, rrP(-180, -170, 360, 300, 26), 1, { lw: 3, c: i === 1 ? CC : LC, a: 0.75 });
        GL(g, [[-150, 60], [150, 60]], 1, { lw: 3, c: i === 1 ? CC : LC });
        if (i === 0) { g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(-170, -160, 340, 218); g.ctx.clip(); g.circle(0, 60 - 70, 58, 'rgba(255,222,160,.95)', { glow: 30, glowColor: 'rgba(255,200,130,1)' }); g.ctx.restore();
          for (let j = 0; j < 8; j++) { const a = Math.PI + (j + 0.5) / 8 * Math.PI; GL(g, [[Math.cos(a) * 82, -10 + Math.sin(a) * 82], [Math.cos(a) * 108, -10 + Math.sin(a) * 108]], 1, { lw: 3, a: 0.6 + 0.4 * Math.sin(t * 3 + j) }); } }
        else { GL(g, arcP(0, 60, 58, 0, Math.PI), 1, { c: CC, lw: 4, dash: [9, 9] });
          const r = rng(3); for (let j = 0; j < 12; j++) dotL(g, -150 + r() * 300, -150 + r() * 190, 1.5 + r() * 2.5, (0.5 + 0.5 * Math.sin(t * 2 + j)) * (0.6 + 0.6 * proved), COOL); }
      });
      // 都没有矛盾：各打一个勾
      GL(g, checkP(x, y + 200, 70), prog(t, 41.3 + i * 0.15, 41.7 + i * 0.15), { lw: 6, c: i === 1 ? CC : LC });
    }
    // 一样清楚：中间的等号
    const ke = prog(t, 40.5, 40.9); GL(g, [[515, 625], [565, 625]], ke, { lw: 5 }); GL(g, [[515, 655], [565, 655]], ke, { lw: 5 });
    // 不是在比哪种可能更大：两根概率柱长出来，又被抹掉
    const kpb = env(t, 42.2, 44.4, 0.5, 0.6);
    if (kpb > 0) { for (const [i, h] of [[0, 120], [1, 18]]) { const x = pos[i][0], hh = h * prog(t, 42.3, 43.2, E.out);
        g.fillRR(x - 24, 1040 - hh, 48, hh, 6, i ? 'rgba(185,204,255,.55)' : 'rgba(251,224,168,.6)', { alpha: kpb }); }
      g.line(180, 1040, 900, 1040, { color: 'rgba(255,240,210,.5)', lw: 2, alpha: kpb });
      GL(g, [[200, 1000], [880, 960]], prog(t, 43.5, 43.9) * kpb, { c: RC, lw: 5 }); }
    // 推演证不成假：一个红叉砸向 B，被弹开、碎掉
    const fly = prog(t, 45.8, 46.25, E.in), brk = prog(t, 46.25, 47.1, E.out);
    if (fly > 0 && brk < 1) {
      if (brk <= 0) cross(g, lerp(1000, 780, fly), lerp(380, 600, fly), 46, 1);
      else for (let j = 0; j < 4; j++) { const a = -2.4 + j * 0.9; GL(g, [[780 + Math.cos(a) * brk * 160, 600 + Math.sin(a) * brk * 160], [780 + Math.cos(a) * (brk * 160 + 30), 600 + Math.sin(a) * (brk * 160 + 30)]], 1, { c: RC, lw: 5, a: 1 - brk }); }
    }
    if (proved > 0) g.spot(780, 640, 260, 0.2 * proved * (1 - prog(t, 47.0, 47.4)), COOL);
    g.ctx.restore();
  }
}, { z: 2, fin: 0.3 });
V.cue(25.9, 'pen', { dur: 0.9, gain: 0.3 }).cue(28.4, 'counter', { dur: 0.6, gain: 0.3 }).cue(29.1, 'tick', 0.4).cue(29.4, 'counter', { dur: 0.5, gain: 0.3 })
  .cue(29.95, 'slide', 0.4, -0.3).cue(30.6, 'correct', 0.45, -0.4)
  .cue(32.2, 'pen', { dur: 0.6, gain: 0.3 }).cue(33.9, 'rise', 0.3, 0.4).cue(36.0, 'bubble', 0.3, 0.4)
  .cue(37.9, 'whoosh', 0.35).cue(38.0, 'pop', 0.5, 0.4).cue(39.7, 'pop', 0.5, -0.4).cue(40.5, 'ding', 0.35)
  .cue(41.3, 'correct', 0.4, -0.3).cue(41.45, 'correct', 0.35, 0.3)
  .cue(42.3, 'counter', { dur: 0.8, gain: 0.25 }).cue(43.5, 'snap', 0.45)
  .cue(45.8, 'whoosh', 0.3, 0.5).cue(46.25, 'wrong', 0.45, 0.4).cue(46.3, 'sparkle', 0.35, 0.4);

/* ================================================================
 * ④ 往下推一层 47.2–61：过去每天的太阳 ⇏ 明天；桥下的柱子是虚的
 * ================================================================ */
const SUNS = (() => { const out = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) out.push({ x: 110 + c * 74 + (r % 2) * 18, y: 560 + r * 90, i: r * 8 + c }); return out; })();
V.scene(47.1, 61.4, (g, lt, s) => {
  const t = s.t;
  // 往下推一层：向下的箭头
  const kd = env(t, 47.2, 49.6, 0.3, 0.5);
  if (kd > 0) for (let i = 0; i < 3; i++) GL(g, [[470, 560 + i * 70], [540, 610 + i * 70], [610, 560 + i * 70]], prog(t, 47.5 + i * 0.25, 47.9 + i * 0.25), { lw: 6, a: kd * (0.4 + 0.2 * i) });
  const kM = env(t, 49.3, 61.4, 0.3, 0.6);
  if (kM <= 0) return;
  g.ctx.save(); g.ctx.globalAlpha *= kM;
  // 过去：一排排升起的小太阳
  const ps = prog(t, 49.4, 51.0, E.linear);
  for (const p of SUNS) { const k = clamp(ps * SUNS.length - p.i); if (k <= 0) continue; miniSun(g, p.x, p.y, 15, Math.min(1, k * 1.5), { up: 0 }); }
  // 明天：虚线的太阳，带一圈闪烁
  const kt = prog(t, 51.3, 51.8, E.out), tx = 930, ty = 650;
  GL(g, arcP(tx, ty, 60, Math.PI, TAU), kt, { lw: 4, dash: [9, 9] }); GL(g, [[tx - 100, ty], [tx + 100, ty]], kt, { lw: 3 });
  if (kt > 0) g.spot(tx, ty - 20, 140, 0.12 * kt * (0.6 + 0.4 * Math.sin(t * 4)), '255,214,150');
  // 推论之箭：从过去指向明天，断开
  const ka = prog(t, 51.5, 52.1), brk = prog(t, 52.2, 52.6, E.out);
  if (ka > 0 && t < 53.0) { GL(g, [[700, 650], [lerp(700, 820, 0.5) - brk * 20, 650]], ka * 2, { lw: 5 }); GL(g, [[lerp(700, 820, 0.5) + brk * 20, 650], [820, 650]], ka * 2 - 1, { lw: 5, a: 1 - brk * 0.6 });
    GL(g, [[800, 634], [822, 650], [800, 666]], ka * 2 - 1.4, { lw: 5, a: 1 - brk * 0.6 }); }
  // 经验推断 = 一座桥；桥下的柱子 = "未来会像过去"，是虚线
  const kbr = prog(t, 53.0, 53.9);
  GL(g, arcP(765, 700, 95, Math.PI, TAU, 70), kbr, { lw: 5 });
  const kpi = prog(t, 55.4, 56.2, E.out), flick = t > 59.4 ? 0.55 + 0.45 * Math.abs(Math.sin(t * 9)) * (Math.sin(t * 2.3) > -0.3 ? 1 : 0.2) : 1;
  if (kpi > 0) {
    GL(g, rectP(715, 640, 100, 400 * kpi), 1, { c: CC, lw: 3.5, dash: [10, 10], a: flick });
    const ka2 = prog(t, 56.4, 56.9) * flick;
    for (const dy of [0, 26]) GL(g, [...Array(13)].map((_, i) => [735 + i * 5, 820 + dy + Math.sin(i * 0.9) * 7]), ka2, { c: CC, lw: 4, glow: 14 });
    // 扫光
    const sw = prog(t, 55.4, 56.4); if (sw > 0 && sw < 1) g.spot(765, lerp(640, 1040, sw), 120, 0.25, COOL);
  }
  // 经验一直好用：光点一颗颗从过去走到明天
  const kf = env(t, 58.0, 61.4, 0.3, 0.6);
  if (kf > 0) for (let i = 0; i < 5; i++) { const q = ((t - 58.0) * 0.7 + i / 5) % 1; const x = lerp(690, 870, q), y = 700 - Math.sin(q * Math.PI) * 70;
    dotL(g, x, y, 5, kf * Math.sin(q * Math.PI)); }
  g.ctx.restore();
}, { z: 2, fin: 0.3 });
V.cue(47.4, 'whoosh', 0.4).cue(47.5, 'tick', 0.25).cue(47.75, 'tick', 0.25).cue(48.0, 'tick', 0.25)
  .cue(49.4, 'counter', { dur: 1.6, gain: 0.3 }).cue(51.3, 'bubble', 0.3, 0.6).cue(51.5, 'slide', 0.3, 0.3).cue(52.2, 'snap', 0.5, 0.3)
  .cue(53.0, 'pen', { dur: 0.9, gain: 0.3 }).cue(55.4, 'zoom', 0.3).cue(56.4, 'ding', 0.3, 0.3)
  .cue(58.0, 'tick', 0.2, -0.2).cue(58.7, 'tick', 0.2, 0).cue(59.4, 'heartbeat', 0.35);

/* ================================================================
 * ⑤ 习惯是向导 61–78.5
 * ================================================================ */
const STEPS = [6.6, 7.5, 8.5, 9.7, 11.1, 12.8, 14.8, 17.4, 20.6];
V.scene(60.9, 78.8, (g, lt, s) => {
  const t = s.t;
  // 没劝人什么都别做：一个"停止"标志出现，又散成光尘
  const kst = prog(t, 61.2, 61.7, E.outBack), dis = prog(t, 62.2, 63.3);
  if (kst > 0 && dis < 1) at(g, 540, CY, 1, () => { GL(g, circP(0, 0, 110), 1, { c: RC, lw: 7 }); GL(g, [[-78, 78], [78, -78]], 1, { c: RC, lw: 7 }); }, kst * (1 - dis));
  dust(g, 540, CY, dis, '255,160,140', 12, 40, 200);
  // 向导：一盏灯
  const kl = env(t, 63.3, 67.6, 0.4, 0.5);
  if (kl > 0) at(g, 540, CY - 20, 1.1, () => {
    GL(g, arcP(0, -150, 26, Math.PI, TAU), prog(t, 63.3, 63.6), { lw: 4 });
    GL(g, [[0, -150], [0, -120]], prog(t, 63.5, 63.7), { lw: 3 });
    GL(g, rrP(-70, -120, 140, 200, 30), prog(t, 63.6, 64.3));
    GL(g, [[-90, 80], [90, 80]], prog(t, 64.0, 64.3), { lw: 5 });
    const fl = prog(t, 64.8, 65.3) * (0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7)) * (1 - prog(t, 66.95, 67.3));
    if (fl > 0) { g.spot(0, -20, 220, 0.3 * fl, '255,210,140'); g.ctx.save(); g.ctx.globalAlpha *= fl; g.ctx.beginPath(); g.ctx.moveTo(0, -70); g.ctx.quadraticCurveTo(26, -10, 0, 20); g.ctx.quadraticCurveTo(-26, -10, 0, -70); g.ctx.fillStyle = '#FFE9B8'; g.ctx.shadowColor = 'rgba(255,200,120,1)'; g.ctx.shadowBlur = 30; g.ctx.fill(); g.ctx.restore(); }
  }, kl);
  // 习惯 = 一串走过很多遍的脚印，一直通向地平线
  const fade = prog(t, 66.9, 67.6) * (1 - prog(t, 76.2, 77.0));
  STEPS.forEach((z, i) => {
    const k = prog(t, 64.8 + i * 0.16, 65.1 + i * 0.16) * (1 - fade * (i > 2 ? 1 : 0.85));
    if (k <= 0) return; const y = zY(z), x = 540 + (i % 2 ? 1 : -1) * roadW(z) * 0.32, sc = 5.2 / z;
    g.ctx.save(); g.ctx.globalAlpha *= k * 0.9; g.ctx.beginPath(); g.ctx.ellipse(x, y, 13 * sc, 5 * sc, 0, 0, TAU); g.ctx.fillStyle = '#FFE6B6'; g.ctx.shadowColor = 'rgba(255,210,140,1)'; g.ctx.shadowBlur = 14; g.ctx.fill(); g.ctx.restore();
  });
  // 手段配不上目的：钥匙找不到锁
  const kk = env(t, 70.0, 74.9, 0.4, 0.8), frz = prog(t, 73.2, 73.6);
  if (kk > 0) {
    const mv = prog(t, 70.6, 71.7, E.inOut), y = CY + 40 - Math.sin(mv * Math.PI) * 120 * (1 - frz);
    at(g, lerp(320, 760, mv), y, 1, () => { GL(g, circP(-40, 0, 24), 1, { c: CC, lw: 4 }); GL(g, [[-16, 0], [60, 0]], 1, { c: CC, lw: 4 }); GL(g, [[40, 0], [40, 16]], 1, { c: CC, lw: 4 }); GL(g, [[56, 0], [56, 14]], 1, { c: CC, lw: 4 }); }, kk * (1 - 0.5 * frz));
    at(g, 660, CY + 200, 1, () => { GL(g, arcP(0, -36, 30, Math.PI, TAU), 1, { c: CC, lw: 4 }); GL(g, rrP(-46, -36, 92, 80, 10), 1, { c: CC, lw: 4 }); dotL(g, 0, 0, 5, 0.8, COOL); }, kk * (1 - 0.5 * frz));
    // 一切行动都会停：暂停
    const kp = prog(t, 73.4, 73.8, E.outBack);
    if (kp > 0) at(g, 540, CY - 160, kp, () => { g.fillRR(-44, -60, 30, 120, 8, 'rgba(185,204,255,.85)'); g.fillRR(14, -60, 30, 120, 8, 'rgba(185,204,255,.85)'); }, kk);
  }
  // 不是保证给的：一枚"保证"的盾牌，只是个虚影，散掉
  const ksh = prog(t, 77.2, 77.6, E.out), sd = prog(t, 77.9, 78.8);
  if (ksh > 0 && sd < 1) at(g, 540, CY, 1, () => { GL(g, [[0, -120], [100, -84], [92, 30], [0, 120], [-92, 30], [-100, -84], [0, -120]], 1, { c: CC, lw: 4, dash: [10, 10] }); GL(g, checkP(0, 0, 90), 1, { c: CC, lw: 5, dash: [8, 8] }); }, ksh * (1 - sd));
  dust(g, 540, CY, sd, COOL, 21, 36, 180);
}, { z: 8, fin: 0.3 });
V.cue(61.2, 'pop', 0.4).cue(62.2, 'sparkle', 0.3)
  .cue(63.3, 'pen', { dur: 1.0, gain: 0.3 }).cue(64.8, 'chime', 0.3);
STEPS.forEach((_, i) => V.cue(64.8 + i * 0.16, 'tick', 0.22, (i % 2 ? 0.25 : -0.25)));
V.cue(67.6, 'reverse', { dur: 1.0, gain: 0.3, align: 'end' }).cue(67.0, 'snap', 0.3)
  .cue(70.0, 'pop', 0.3, -0.4).cue(70.6, 'slide', 0.35).cue(71.7, 'wrong', 0.4, 0.4)
  .cue(73.4, 'thud', 0.4).cue(75.0, 'swell', 0.3).cue(76.2, 'tick', 0.25, -0.2).cue(76.4, 'tick', 0.25, 0.2)
  .cue(77.2, 'bubble', 0.3).cue(77.9, 'sparkle', 0.25);

/* ================================================================
 * ⑥ 生活里的两类不确定 78.5–103.9
 * ================================================================ */
const cloudP = (cx, cy, s) => { const pts = []; for (const [x, y, r, a0, a1] of [[-110, 20, 50, 0.5, 1.5], [-55, -25, 62, 1.0, 1.85], [25, -45, 72, 1.15, 1.95], [100, 0, 56, 1.4, 2.4]]) pts.push(...arcP(cx + x * s, cy + y * s, r * s, a0 * Math.PI, a1 * Math.PI, r * s, 16)); pts.push([cx - 150 * s, cy + 52 * s]); pts.splice(0, 0, [cx - 150 * s, cy + 52 * s]); pts.push([cx + 150 * s, cy + 52 * s]); return pts; };
V.scene(78.4, 104.2, (g, lt, s) => {
  const t = s.t;
  const merge = prog(t, 98.6, 99.6, E.inOut);
  const kall = 1 - prog(t, 99.6, 100.6);
  // 两朵云
  const kc1 = prog(t, 79.0, 79.6, E.out) * (1 - prog(t, 88.0, 89.0)) + merge * 0, kc2 = prog(t, 80.6, 81.2, E.out);
  const lx = lerp(LX, 540, merge), rx = lerp(RX, 540, merge);
  if (kc1 > 0) GL(g, cloudP(lx, 520, 1.15), kc1 * 1.2, { lw: 4, a: kall });
  if (kc2 > 0) { g.spot(rx, 520, 260, 0.22 * kc2 * kall, '60,70,120'); GL(g, cloudP(rx, 520, 1.15), kc2 * 1.2, { lw: 4, c: CC, a: kall }); }
  // 水落石出：左边的云化成雨落下，一个勾
  const rain = prog(t, 88.0, 89.4);
  if (rain > 0 && rain < 1) for (let i = 0; i < 14; i++) { const x = LX - 150 + i * 22, y = 560 + ((rain * 400 + i * 37) % 160); g.line(x, y, x - 4, y + 18, { color: 'rgba(255,236,200,.7)', lw: 2, alpha: 1 - rain }); }
  GL(g, checkP(LX, 520, 110), prog(t, 88.7, 89.2) * (1 - merge), { lw: 8 });
  // 左栏：还能查 —— 放大镜扫过，雾散开
  const mg = env(t, 81.9, 89.6, 0.3, 0.5);
  const items = [[83.1, 690], [84.3, 830], [86.3, 970]];
  const reveal = (ts) => prog(t, ts, ts + 0.5);
  for (const [i, [ts, y]] of items.entries()) {
    const k = prog(t, 81.9, 82.4) * kall, rv = reveal(ts);
    if (k <= 0) continue;
    at(g, LX, y, 1, () => {
      const c = rv > 0.5 ? LC : CC, a = 0.3 + 0.7 * rv;
      if (i === 0) { GL(g, rectP(-60, -55, 120, 110), 1, { c, a, lw: 3 }); for (let j = 0; j < 3; j++) GL(g, [[-40, -30 + j * 20], [40, -30 + j * 20]], 1, { c, a: a * 0.7, lw: 3 }); GL(g, squig(-10, 40, 34, 4, 5), rv, { lw: 3 }); }
      if (i === 1) { GL(g, [[-70, 50], [70, 50]], 1, { c, a, lw: 3 }); [40, 70, 55, 95].forEach((h, j) => g.fillRR(-58 + j * 32, 50 - h * (0.3 + 0.7 * rv), 22, h * (0.3 + 0.7 * rv), 4, rv > 0.5 ? 'rgba(251,224,168,.85)' : 'rgba(185,204,255,.4)', { alpha: a })); }
      if (i === 2) { GL(g, [[-80, 0], [80, 0]], 1, { c, a, lw: 3 }); [-60, -20, 20].forEach((x, j) => dotL(g, x, 0, 7, a * (0.5 + 0.5 * rv))); orb(g, 62, 0, WARM, { a: 0.8 * a, r: 0.55, t }); }
      if (rv < 1) g.spot(0, 0, 110, 0.35 * (1 - rv) * (rv > 0 ? 1 : 0.8), '70,80,130');
    });
  }
  if (mg > 0) { let my = 640, mx = LX + 90;
    for (const [ts, y] of items) my = lerp(my, y, prog(t, ts - 0.5, ts, E.inOut));
    my = lerp(my, 520, prog(t, 87.6, 88.0));
    mx += Math.sin(t * 4) * 20;
    at(g, mx, my, 1, () => { GL(g, circP(0, 0, 44), 1, { lw: 5 }); GL(g, [[31, 31], [74, 74]], 1, { lw: 8 }); g.spot(0, 0, 50, 0.2, '255,236,200'); }, mg);
  }
  // 右栏：查不出来 —— 城市 / 三年 / 一个人，一直在雾里
  const kR = prog(t, 89.9, 90.4) * kall;
  if (kR > 0) {
    const show = [91.1, 93.0, 94.8].map((ts) => prog(t, ts, ts + 0.5, E.out));
    const fogA = 0.4 + 0.08 * Math.sin(t * 1.6);
    at(g, RX, 690, 1, () => { const sk = [[-80, 50], [-80, -10], [-50, -10], [-50, -50], [-20, -50], [-20, 0], [10, 0], [10, -70], [40, -70], [40, -20], [80, -20], [80, 50]]; GL(g, sk, show[0] * 1.2, { c: CC, lw: 3.5, dash: [8, 7], a: 0.8 }); }, kR);
    at(g, RX, 830, 1, () => { GL(g, [[-44, -60], [44, -60], [5, -2], [44, 56], [-44, 56], [-5, -2], [-44, -60]], show[1] * 1.2, { c: CC, lw: 3.5, dash: [8, 7], a: 0.8 }); [-1, 0, 1].forEach((j) => dotL(g, 70 + j * 0, -40 + (j + 1) * 30, 4, show[1] * 0.8, COOL)); }, kR);
    at(g, RX, 970, 1, () => { const sh = 0.5 + 0.5 * Math.sin(t * 1.7); orb(g, 0, 0, `${Math.round(lerp(255, 170, sh))},${Math.round(lerp(204, 196, sh))},${Math.round(lerp(140, 255, sh))}`, { a: show[2] * 0.75, r: 0.7, t }); GL(g, arcP(0, 0, 54, 0, TAU), show[2], { c: CC, lw: 2.5, dash: [5, 9], a: 0.6 }); }, kR);
    g.spot(RX, 830, 280, fogA * kR, '40,48,96');
    // 你查一百遍：放大镜来回扫，一百个小点被填满，雾还在
    const kq = env(t, 96.2, 98.8, 0.3, 0.5);
    if (kq > 0) {
      const sweep = Math.sin((t - 96.2) * 11), mx = RX + sweep * 120, my = 830 + Math.cos((t - 96.2) * 7) * 140;
      at(g, mx, my, 1, () => { GL(g, circP(0, 0, 44), 1, { lw: 5 }); GL(g, [[31, 31], [74, 74]], 1, { lw: 8 }); }, kq);
      const n = Math.floor(100 * prog(t, 96.3, 97.3, E.linear));
      for (let i = 0; i < n; i++) g.circle(RX - 90 + (i % 20) * 9.5, 380 + Math.floor(i / 20) * 11, 2.6, '#DDE6FF', { alpha: 0.9 * kq });
    }
  }
  // 混在一起：两团雾合成一堵墙，落在你前面的路上
  const fw = prog(t, 99.6, 101.4, E.inOut);
  if (fw > 0) {
    const y = lerp(560, HZ - 40, fw), wdt = lerp(300, 460, fw);
    g.spot(540, y, wdt, 0.5 * fw, '24,28,62');
    GL(g, cloudP(540, y - 40 * (1 - fw), lerp(1.3, 1.6, fw)), 1, { c: CC, lw: 4, a: fw * 0.8 * (1 - prog(t, 103.6, 104.2)) });
  }
}, { z: 2, fin: 0.3 });
V.cue(79.0, 'whoosh', 0.3, -0.4).cue(80.6, 'whoosh', 0.3, 0.4)
  .cue(81.9, 'pop', 0.35, -0.5).cue(83.1, 'paper', 0.4, -0.5).cue(84.3, 'counter', { dur: 0.5, gain: 0.25, pan: -0.5 }).cue(86.3, 'pop', 0.35, -0.5)
  .cue(88.0, 'swell', 0.3, -0.3).cue(88.7, 'correct', 0.45, -0.4)
  .cue(89.9, 'pop', 0.3, 0.5).cue(91.1, 'pen', { dur: 0.6, gain: 0.25, pan: 0.5 }).cue(93.0, 'flip', 0.3, 0.5).cue(94.8, 'bubble', 0.3, 0.5)
  .cue(96.3, 'counter', { dur: 1.0, gain: 0.3, pan: 0.5 }).cue(96.3, 'slide', 0.25, 0.5).cue(96.9, 'slide', 0.25, 0.3).cue(97.6, 'wrong', 0.35, 0.4)
  .cue(98.6, 'whoosh', 0.45).cue(99.6, 'swell', 0.35);

// 不该动：一道路障横在路上（一直到"能回头的"才抬起）
V.scene(101.8, 117.0, (g, lt, s) => {
  const t = s.t, k = prog(t, 102.0, 102.5, E.outBack), up = prog(t, 113.6, 114.6, E.inOut), y = 1206 - up * 50;
  if (k <= 0) return;
  g.ctx.save(); g.ctx.globalAlpha *= (1 - up); const hw = 150 * k;
  GL(g, [[540 - hw, y], [540 + hw, y]], 1, { lw: 5 }); GL(g, [[540 - hw, y + 26], [540 + hw, y + 26]], 1, { lw: 5 });
  for (let i = 0; i < 6; i++) { const x = 540 - hw + 14 + i * 50 * k; GL(g, [[x, y], [x + 20, y + 26]], 1, { c: RC, lw: 5 }); }
  GL(g, [[540 - hw + 14, y + 26], [540 - hw + 14, y + 52]], 1, { lw: 3.5 }); GL(g, [[540 + hw - 14, y + 26], [540 + hw - 14, y + 52]], 1, { lw: 3.5 });
  g.ctx.restore();
}, { z: 5, fin: 0.01, fout: 0.01 });
V.cue(102.0, 'stamp', 0.4);

/* ================================================================
 * ⑦ 日子往前走 103.8–108.2：太阳一圈圈划过，你还在原地，等那个勾
 * ================================================================ */
V.scene(103.7, 108.6, (g, lt, s) => {
  const t = s.t;
  for (let i = 0; i < 3; i++) { const q = prog(t, 103.9 + i * 1.5, 105.3 + i * 1.5, E.linear); if (q <= 0 || q >= 1) continue;
    const a = Math.PI + q * Math.PI, x = 540 + Math.cos(a) * 520, y = HZ + Math.sin(a) * 680;
    g.circle(x, y, 26, 'rgba(255,226,170,.9)', { glow: 30, glowColor: 'rgba(255,200,130,1)' });
    for (let j = 1; j < 10; j++) { const a2 = a - j * 0.04; dotL(g, 540 + Math.cos(a2) * 520, HZ + Math.sin(a2) * 680, 4 - j * 0.35, 0.5 * (1 - j / 10)); } }
  const kc = env(t, 106.1, 108.6, 0.4, 0.6);
  if (kc > 0) at(g, 540, CY, 1, () => GL(g, checkP(0, 0, 260), 1, { c: 'rgba(255,240,210,.55)', lw: 4, dash: [10, 12], glow: 6 }), kc * (0.6 + 0.4 * Math.sin(t * 3)));
}, { z: 2, fin: 0.3 });
V.cue(103.9, 'whoosh', 0.25, -0.5).cue(105.4, 'whoosh', 0.25, 0).cue(106.9, 'whoosh', 0.25, 0.5).cue(106.2, 'tick', 0.3).cue(106.8, 'tick', 0.3).cue(107.4, 'tick', 0.3);

/* ================================================================
 * ⑧ 不是随便下注 108.1–119.2
 * ================================================================ */
V.scene(108.0, 119.4, (g, lt, s) => {
  const t = s.t;
  // 骰子：滚落 → 打叉
  const kd = env(t, 108.4, 111.2, 0.2, 0.5);
  if (kd > 0) {
    const fall = prog(t, 108.6, 109.4, E.in), roll = prog(t, 109.4, 110.1, E.out);
    const x = 540 + roll * 40, y = lerp(380, CY, fall) - Math.sin(roll * Math.PI) * 60, rot = fall * 2.4 + roll * Math.PI / 2;
    at(g, x, y, 1, () => { g.ctx.rotate(rot); GL(g, rrP(-80, -80, 160, 160, 22), 1, { lw: 5 }); for (const [dx, dy] of [[-40, -40], [40, 40], [0, 0], [40, -40], [-40, 40]]) dotL(g, dx, dy, 9, 1); }, kd);
    const kx = prog(t, 110.3, 110.7); if (kx > 0) cross(g, 540 + 40, CY, 120, kx);
  }
  // 能避免的盲目：一只眼睛睁开
  const ke = env(t, 111.1, 113.8, 0.3, 0.5);
  if (ke > 0) at(g, 540, CY, 1, () => {
    const op = prog(t, 112.2, 112.8, E.out);
    GL(g, arcP(0, -60 + 60 * (1 - op), 170, Math.PI * 0.2, Math.PI * 0.8, 120 * op + 1), 1, { lw: 5 });
    GL(g, arcP(0, 60, 170, -Math.PI * 0.2, -Math.PI * 0.8, 120), 1, { lw: 5 });
    if (op > 0) { GL(g, circP(0, 0, 48 * op), 1, { lw: 5 }); dotL(g, 0, 0, 16 * op, op); }
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.35; GL(g, [[Math.cos(a) * 150, Math.sin(a) * 150 - 10], [Math.cos(a) * 190, Math.sin(a) * 190 - 10]], (op - 0.4) * 2, { lw: 3.5 }); }
  }, ke);
  // 能回头的：路上一个可以掉头的环形箭头，你往前走
  const ku = env(t, 113.6, 116.6, 0.3, 0.5);
  if (ku > 0) at(g, 540, CY, 1, () => {
    const p = [[-150, 120], [-150, -40], ...arcP(-40, -40, 110, Math.PI, TAU, 110, 24), [70, 60]];
    GL(g, p, prog(t, 113.7, 114.6), { lw: 8 });
    GL(g, [[40, 30], [70, 66], [100, 30]], prog(t, 114.5, 114.8), { lw: 8 });
    GL(g, [[-150, 120], [-150, 200]], prog(t, 114.6, 114.9), { lw: 8, dash: [12, 12], a: 0.6 });
  }, ku);
  // 回不了头的：单行的箭头 + 身后的路断开；审慎加倍 = 你身边两圈
  const kn = env(t, 116.4, 119.4, 0.3, 0.6);
  if (kn > 0) at(g, 540, CY, 1, () => {
    GL(g, [[0, 200], [0, -150]], prog(t, 116.5, 117.1), { lw: 8 });
    GL(g, [[-50, -100], [0, -152], [50, -100]], prog(t, 117.0, 117.3), { lw: 8 });
    const gap = prog(t, 117.2, 117.7, E.out);
    if (gap > 0) { g.ctx.save(); g.ctx.globalAlpha *= gap; GL(g, [[-60, 230 + gap * 10], [60, 210 + gap * 10]], 1, { c: RC, lw: 5 }); g.ctx.restore(); }
  }, kn);
  const ring = (ts, r) => { const k = prog(t, ts, ts + 0.5, E.outBack); if (k > 0) { const oy = orbY(t); g.ctx.save(); g.ctx.globalAlpha *= kn; g.ctx.beginPath(); g.ctx.ellipse(540, oy, r * k, r * 0.62 * k, 0, 0, TAU); g.ctx.lineWidth = 3; g.ctx.strokeStyle = 'rgba(251,224,168,.85)'; g.ctx.shadowColor = 'rgba(255,214,150,1)'; g.ctx.shadowBlur = 16; g.ctx.stroke(); g.ctx.restore(); } };
  ring(117.7, 90); ring(118.2, 130);
}, { z: 2, fin: 0.3 });
V.cue(108.6, 'whoosh', 0.25).cue(109.4, 'drop', 0.5).cue(109.75, 'drop', 0.35).cue(110.3, 'snap', 0.4).cue(110.35, 'wrong', 0.3)
  .cue(111.2, 'pop', 0.3).cue(112.2, 'sparkle', 0.4)
  .cue(113.7, 'pen', { dur: 1.0, gain: 0.35 }).cue(113.8, 'slide', 0.35).cue(114.5, 'correct', 0.4)
  .cue(116.5, 'pen', { dur: 0.7, gain: 0.35 }).cue(117.2, 'snap', 0.4).cue(117.7, 'ding', 0.35, -0.2).cue(118.2, 'ding', 0.35, 0.2);

/* ================================================================
 * ⑨ 一张纸，两行字，一个签名 119.2–129.6
 * ================================================================ */
const PX = 540, PY = 700;
V.scene(119.1, 131.2, (g, lt, s) => {
  const t = s.t;
  // 彻底踏实的那个虚线勾，这次直接散掉
  const kc = prog(t, 119.3, 119.7), dc = prog(t, 120.1, 121.0);
  if (kc > 0 && dc < 1) at(g, 540, CY, 1, () => GL(g, checkP(0, 0, 260), 1, { c: 'rgba(255,240,210,.55)', lw: 4, dash: [10, 12], glow: 6 }), kc * (1 - dc));
  dust(g, 540, CY, dc, '255,236,200', 33, 40, 220);
  // 纸
  const kp = prog(t, 121.2, 121.9, E.out), fly = prog(t, 129.3, 130.6, E.inOut), oy = orbY(t);
  if (kp <= 0) return;
  const [fx, fy] = g.float(t, 3, 3);
  const cx = lerp(PX + fx, 540, fly), cy = lerp(PY + fy, oy, fly), sc = lerp(1, 0.04, fly);
  at(g, cx, cy, sc, () => {
    g.ctx.rotate(-0.025 * (1 - fly));
    g.fillRR(-230, -290, 460, 580, 14, 'rgba(255,240,214,.07)');
    GL(g, rrP(-230, -290, 460, 580, 14), kp * 1.05, { lw: 4 });
    // 第一行：指南针（为什么选它）
    const k1 = prog(t, 123.0, 123.4, E.outBack);
    if (k1 > 0) { GL(g, circP(-160, -150, 26), 1, { lw: 3.5, a: k1 }); GL(g, [[-170, -138], [-150, -162]], 1, { lw: 4, a: k1 }); dotL(g, -150, -162, 4, k1); }
    GL(g, squig(-110, 180, -150, 7, 10), prog(t, 123.5, 124.8, E.linear), { lw: 4.5 });
    // 第二行：分岔（什么情况出现，我改）
    const k2 = prog(t, 125.0, 125.4, E.outBack);
    if (k2 > 0) { GL(g, [[-185, -20], [-160, -20], [-140, -40]], 1, { lw: 3.5, a: k2 }); GL(g, [[-160, -20], [-140, 0]], 1, { lw: 3.5, a: k2, dash: [4, 5] }); }
    GL(g, squig(-110, 160, -20, 13, 10), prog(t, 125.7, 127.0, E.linear), { lw: 4.5 });
    // 签名
    const sg = [...Array(60)].map((_, i) => { const u = i / 59; return [-60 + u * 220 + Math.sin(u * 18) * 18 * (1 - u * 0.6), 160 + Math.sin(u * 9) * 26 * (1 - u) - Math.cos(u * 18) * 10]; });
    GL(g, [[-140, 200], [170, 200]], prog(t, 127.4, 127.8), { lw: 2.5, a: 0.5 });
    GL(g, sg, prog(t, 128.0, 128.8, E.inOut), { lw: 5, glow: 26 });
    const ks = prog(t, 128.9, 129.2, E.outBack);
    if (ks > 0) { g.circle(150, 120, 30 * ks, 'rgba(255,214,150,.25)', { stroke: 'rgba(255,224,170,1)', lw: 3, glow: 20, glowColor: 'rgba(255,210,140,1)' }); dotL(g, 150, 120, 8 * ks, ks); }
  }, 1 - prog(t, 130.4, 130.7));
}, { z: 4, fin: 0.3, fout: 0.01 });
V.cue(119.3, 'pop', 0.25).cue(120.1, 'sparkle', 0.3)
  .cue(121.2, 'paper', 0.55).cue(121.2, 'pen', { dur: 0.7, gain: 0.3 })
  .cue(123.0, 'pop', 0.35, -0.3).cue(123.5, 'pen', { dur: 1.3, gain: 0.45 })
  .cue(125.0, 'pop', 0.35, -0.3).cue(125.7, 'pen', { dur: 1.3, gain: 0.45 })
  .cue(128.0, 'pen', { dur: 0.8, gain: 0.55 }).cue(128.9, 'stamp', 0.45)
  .cue(129.3, 'rise', { gain: 0.35 }).cue(129.3, 'whoosh', 0.3).cue(130.5, 'chime', 0.5).cue(130.6, 'sparkle', 0.4);

/* ================================================================
 * ⑩ 日出，你上路 129.2–137.2
 * ================================================================ */
V.scene(129.0, 137.2, (g, lt, s) => {
  const t = s.t;
  // 留好哪一步要改：前方路上，一条虚线的岔路
  const kb = prog(t, 132.0, 133.0, E.out);
  if (kb > 0) {
    const z0 = 7.5, base = [540, zY(z0)];
    const pts = [...Array(21)].map((_, i) => { const u = i / 20, z = z0 + u * 30; return [540 + roadW(z) * 0.0 + 150 * Math.pow(u, 0.7) * (7.5 / z) * 3.2, zY(z)]; });
    GL(g, pts, kb, { lw: 3, dash: [8, 8], a: 0.85 * (1 - prog(t, 135.5, 136.5)) });
    dotL(g, base[0], base[1], 5, kb * (1 - prog(t, 135.5, 136.5)));
  }
  // 片尾卡
  const ke = env(t, 133.7, 137.4, 0.8, 0.3);
  if (ke > 0) {
    g.text('明天的太阳', 540, 470, { size: 104, weight: 900, fam: 'serif', gradient: ['#FFF8E4', '#F6D58F', '#D9A35E'], glow: 34, glowColor: 'rgba(255,200,130,.7)', alpha: ke, ls: 14 });
    g.text('没有把握的时候，怎么行动', 540, 570, { size: 38, weight: 700, fam: 'serif', color: '#2A2C52', alpha: ke * prog(t, 134.2, 135.0), ls: 8 });
    g.text('参考：David Hume, An Enquiry Concerning Human Understanding (1748), §IV–V', 540, 640, { size: 26, weight: 500, fam: 'en', italic: true, color: '#2A2C52', alpha: 0.85 * ke * prog(t, 134.6, 135.4) });
  }
}, { z: 3, fin: 0.3, fout: 0.01 });
V.cue(130.3, 'swell', 0.3).cue(132.0, 'pen', { dur: 1.0, gain: 0.3 }).cue(133.7, 'thud', 0.12).cue(133.75, 'chime', 0.14);

V.mount();
