/* 《第一位数字》— Vibe知识大赏 · 本福特定律  (130s) */
const V = Vibe.create({ duration: 130, watermark: '@zhiyusay', bpm: 77, seed: 11 });
const { C, E, prog, env, clamp, lerp, rng, W, H } = { ...Vibe, W: V.W, H: V.H };

const BEN = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => Math.log10(1 + 1 / d));
const PCT = BEN.map((p) => (p * 100).toFixed(1) + '%');

V.music({
  prog: ['Am', 'F', 'C', 'G'],
  sections: [[0, 12.4, 'pad'], [12.4, 18.6, 'pad+bell'], [18.6, 52, 'pad+piano'], [52, 90, 'pad+piano+bass+kick+shaker'],
    [90, 104, 'pad+arp+bass+kick'], [104, 116, 'pad+piano+bell'], [116, 140, 'pad']],
  gain: 1.0, sfx_gain: 0.85,
});

/** 9 根柱子的柱状图。vals: 0..1 比例；peak: 最大比例对应的高度 */
function bars(g, cx, base, vals, o = {}) {
  const n = 9, bw = o.bw || 92, gap = o.gap || 34, hmax = o.hmax || 360, vmax = o.vmax || 0.32;
  const total = n * bw + (n - 1) * gap, x0 = cx - total / 2;
  for (let i = 0; i < n; i++) {
    const v = vals[i], h = Math.max(2, (v / vmax) * hmax), x = x0 + i * (bw + gap);
    const hi = o.highlight === i;
    const col = o.colors ? o.colors[i] : hi ? C.gold : 'rgba(234,234,242,.82)';
    g.ctx.save();
    if (hi && o.glow) { g.ctx.shadowColor = C.gold; g.ctx.shadowBlur = o.glow; }
    g.fillRR(x, base - h, bw, h, 6, col, { alpha: o.alpha ?? 1 });
    g.ctx.restore();
    g.text(String(i + 1), x + bw / 2, base + 38, { size: o.digitSize || 40, weight: 700, fam: 'serif', color: hi ? C.goldHi : C.dim, alpha: o.alpha ?? 1 });
    if (o.labels) g.text(o.labels[i], x + bw / 2, base - h - 24, { size: o.labelSize || 26, weight: 600, color: hi ? C.goldHi : C.text, alpha: (o.alpha ?? 1) * (o.labelAlpha ?? 1) });
  }
  g.line(x0 - 30, base, x0 + total + 30, base, { color: C.faint, lw: 2, alpha: o.alpha ?? 1 });
  return { x0, bw, gap, total };
}

/* ================================================================
 * 1. 冷开场钩子 0–12.5
 * ================================================================ */
const HOOK_NUMS = ['1,384', '27.5', '176', '9,021', '3.14', '1,066', '45,000', '128', '2.718', '19.6', '612', '1.2万', '83', '1,750', '0.31', '14', '5,280', '1.9', '360', '11,200', '72', '1.08', '238', '4.6'];
const hookPos = (() => { const r = rng(5); return HOOK_NUMS.map((s, i) => ({ s, x: 260 + (i % 6) * 280 + r() * 120, y: 230 + Math.floor(i / 6) * 120 + r() * 60, d: +s[0] })); })();

V.scene(0, 12.6, (g, lt) => {
  g.spot(W / 2, 470, 700, 0.08);
  const fly = prog(lt, 5.4, 7.0, E.inOut);           // 数字飞入柱子
  const uni = BEN.map(() => 1 / 9);
  const morph = prog(lt, 9.2, 10.6, E.spring);
  const vals = uni.map((u, i) => lerp(u, BEN[i], morph));
  const barsA = prog(lt, 6.3, 7.2, E.out);
  // 散落的数字
  hookPos.forEach((p, i) => {
    const ap = prog(lt, 0.2 + i * 0.08, 1.0 + i * 0.08, E.out);
    if (ap <= 0 || fly >= 1) return;
    const [fx, fy] = g.float(lt, i, 3);
    const tx = W / 2 - 4 * 126 + (p.d - 1) * 126, ty = 640;
    const x = lerp(p.x + fx, tx, fly), y = lerp(p.y + fy, ty, fly);
    const lit = prog(lt, 2.8 + (i % 6) * 0.12, 3.4 + (i % 6) * 0.12);
    const first = p.s[0], rest = p.s.slice(1);
    const size = lerp(54, 30, fly);
    const wF = g.measure(first, { size, weight: 700, fam: 'serif' }), wR = g.measure(rest, { size, weight: 500, fam: 'serif' });
    const x0 = x - (wF + wR) / 2;
    g.text(first, x0 + wF / 2, y, { size, weight: 700, fam: 'serif', color: lit > 0.5 ? C.goldHi : C.text, alpha: ap * (1 - fly * 0.6), glow: lit * 14 });
    g.text(rest, x0 + wF + wR / 2, y, { size, weight: 500, fam: 'serif', color: C.dim, alpha: ap * (1 - lit * 0.55) * (1 - fly) });
  });
  if (barsA > 0) {
    bars(g, W / 2, 660, vals.map((v) => v * barsA), {
      bw: 92, gap: 34, hmax: 380, vmax: 0.32, alpha: 1,
      highlight: morph > 0.3 ? 0 : -1, glow: 30 * morph,
      labels: morph > 0.02 ? PCT : uni.map(() => '11.1%'), labelAlpha: barsA * (morph > 0.02 ? clamp(morph * 1.5) : 1),
    });
    // 均匀参考线
    const ref = 660 - (1 / 9 / 0.32) * 380;
    g.line(W / 2 - 600, ref, W / 2 + 600, ref, { color: C.dim, dash: [8, 10], alpha: barsA * 0.5 * (1 - morph * 0.4), lw: 1.5 });
  }
}, { fin: 0.01, fout: 0.6 });
V.subs_seq(0.6, [
  [2.8, '随手翻开一本账，数字的第一位是几？', 'Open any ledger. What is the first digit?'],
  [2.5, '1 到 9，直觉告诉你：机会均等', 'One to nine — intuition says: equal odds.'],
  [2.6, '每个数字，都该占 11.1%', 'Each should lead 11.1% of the time.'],
  [3.0, '可在真实世界里，「1」占了将近三成', 'In the real world, 1 leads almost 30% of the time.'],
]);
V.note(6.9, 9.2, '直觉：各占 1/9');
V.note(10.4, 12.3, '真实数据：第一位是 1 的，约 30.1%', { color: C.goldHi });
V.cue(0.1, 'swell', 0.8).cue(2.9, 'sparkle', 0.6).cue(5.4, 'whoosh', 0.9);
for (let i = 0; i < 9; i++) V.cue(6.3 + i * 0.09, 'tick', 0.5, -0.8 + i * 0.2);
V.cue(8.8, 'rise', 0.6).cue(9.25, 'zoom', 0.5).cue(9.9, 'chime', 0.8);

/* ================================================================
 * 2. 标题卡 12.5–18.5
 * ================================================================ */
V.titleCard(12.3, 18.6, { title: '《第一位数字》', subtitle: '为什么世界偏爱 1', en: "The First Digit · Benford's Law" });
V.cue(12.3, 'reverse', { dur: 1.6, align: 'end', gain: 0.8 }).cue(12.3, 'impact', 0.9).cue(12.3, 'boom', 0.6).cue(12.8, 'chime', 0.4);

/* ================================================================
 * 3. 历史锚点 A — 1881 纽康与脏页对数表 18.5–36
 * ================================================================ */
V.label(18.6, 36.2, '1881 · 华盛顿 · 对数表');
V.scene(18.4, 28.6, (g, lt) => {
  g.spot(W / 2, 450, 640, 0.1);
  // 9 叠书页（像书口侧面），每叠对应一个首位数字
  const dirtK = prog(lt, 3.8, 7.5, E.inOut);
  const pw = 150, ph = 380, gap = 22, x0 = W / 2 - (9 * pw + 8 * gap) / 2;
  for (let i = 0; i < 9; i++) {
    const k = prog(lt, 0.3 + i * 0.18, 1.0 + i * 0.18, E.outBack);
    if (k <= 0) continue;
    const x = x0 + i * (pw + gap), y = 260 + (1 - k) * 60;
    const [fx, fy] = g.float(lt, i, 1.5);
    g.ctx.save(); g.ctx.globalAlpha *= clamp(k * 1.5);
    g.ctx.translate(x + pw / 2 + fx, y + ph / 2 + fy); g.ctx.rotate((i - 4) * 0.006);
    // 多层纸页
    for (let L = 3; L >= 0; L--) g.fillRR(-pw / 2 + L * 4, -ph / 2 + L * 4, pw, ph, 4, L ? '#cbbfa5' : C.paper, { shadow: L ? 0 : 24 });
    // 污渍：越前面越脏
    const dirt = dirtK * Math.pow(BEN[i] / BEN[0], 1.1);
    const gr = g.ctx.createLinearGradient(0, ph / 2, 0, -ph / 2);
    gr.addColorStop(0, `rgba(92,64,30,${0.75 * dirt})`); gr.addColorStop(0.6, `rgba(110,80,40,${0.35 * dirt})`); gr.addColorStop(1, `rgba(110,80,40,${0.12 * dirt})`);
    g.ctx.fillStyle = gr; g.rrect(-pw / 2, -ph / 2, pw, ph, 4); g.ctx.fill();
    // 指印
    const r = rng(40 + i);
    const nPrints = Math.round(dirt * 7);
    for (let p = 0; p < nPrints; p++) {
      g.ctx.save(); g.ctx.translate((r() - 0.5) * pw * 0.7, ph * (0.15 + r() * 0.3)); g.ctx.rotate(r() * 3);
      g.ctx.fillStyle = `rgba(70,48,24,${0.18 + 0.2 * r()})`; g.ctx.beginPath(); g.ctx.ellipse(0, 0, 16, 22, 0, 0, 6.3); g.ctx.fill(); g.ctx.restore();
    }
    // 页眉：首位数字 + 范围
    g.text(String(i + 1), 0, -ph / 2 + 70, { size: 72, weight: 900, fam: 'serif', color: C.ink });
    g.text(`${i + 1}.000–${i + 1}.999`, 0, -ph / 2 + 130, { size: 20, weight: 500, fam: 'en', color: 'rgba(42,36,32,.75)' });
    for (let rr = 0; rr < 8; rr++) g.ctx.fillStyle = 'rgba(42,36,32,.22)', g.ctx.fillRect(-pw / 2 + 22, -ph / 2 + 165 + rr * 22, pw - 44 - (rr % 3) * 12, 5);
    g.ctx.restore();
  }
  // 磨损程度刻度
  const k2 = prog(lt, 6.5, 7.5);
  if (k2 > 0) {
    g.path([[x0, 700], [x0 + 9 * pw + 8 * gap, 700]], k2, { color: C.orange, lw: 2, alpha: 0.7 });
    g.text('磨损最严重', x0 + 60, 726, { size: 24, weight: 500, fam: 'hand', color: C.orange, alpha: k2 });
    g.text('几乎是新的', x0 + 9 * pw + 8 * gap - 60, 726, { size: 24, weight: 500, fam: 'hand', color: C.dim, alpha: k2 });
  }
});
for (let i = 0; i < 9; i++) V.cue(18.7 + i * 0.18, 'paper', 0.45, -0.8 + i * 0.2);
V.cue(18.4, 'whoosh', 0.5).cue(22.2, 'pen', { dur: 3.7, gain: 0.5 }).cue(24.9, 'pen', { dur: 1.0, gain: 0.6 });

V.scene(28.0, 36.4, (g, lt) => {
  V.push(g, lt, 0.005);
  const k = prog(lt, 0.2, 1.4, E.out);
  g.spot(W / 2 - 200, 450, 600, 0.1);
  // 论文首页复原
  g.paper(W / 2 - 230, 450 + (1 - k) * 40, 620, 560, {
    rot: lerp(-0.12, -0.035, k), alpha: k, seed: 9, bodyTop: 90,
    draw: (g2, w, h) => {
      g2.text('AMERICAN JOURNAL OF MATHEMATICS · VOL. IV · 1881', 0, -h / 2 + 40, { size: 16, weight: 500, fam: 'en', color: 'rgba(42,36,32,.7)', ls: 2 });
      g2.line(-w / 2 + 40, -h / 2 + 62, w / 2 - 40, -h / 2 + 62, { color: 'rgba(42,36,32,.4)', lw: 1 });
      g2.text('Note on the Frequency of Use', 0, -h / 2 + 112, { size: 34, weight: 500, fam: 'en', italic: true, color: C.ink });
      g2.text('of the Different Digits', 0, -h / 2 + 152, { size: 34, weight: 500, fam: 'en', italic: true, color: C.ink });
      g2.text('in Natural Numbers.', 0, -h / 2 + 192, { size: 34, weight: 500, fam: 'en', italic: true, color: C.ink });
      g2.text('BY SIMON NEWCOMB', 0, -h / 2 + 240, { size: 18, weight: 500, fam: 'en', color: 'rgba(42,36,32,.8)', ls: 4 });
      g2.text('“That the ten digits do not occur with equal frequency', 0, -h / 2 + 300, { size: 19, weight: 400, fam: 'en', italic: true, color: 'rgba(42,36,32,.85)' });
      g2.text('must be evident to any one making much use of logarithmic tables…”', 0, -h / 2 + 326, { size: 19, weight: 400, fam: 'en', italic: true, color: 'rgba(42,36,32,.85)' });
      g2.stamp(w / 2 - 90, h / 2 - 70, '示意', { k: prog(lt, 1.6, 2.1), size: 30 });
    },
  });
  // 人物剪影 + 铭牌
  const k2 = prog(lt, 1.6, 2.8, E.out);
  const px = W / 2 + 380, py = 400;
  g.ctx.save(); g.ctx.globalAlpha *= k2; g.ctx.translate(px, py - 40 + (1 - k2) * 20);
  g.ctx.beginPath(); g.ctx.arc(0, 0, 100, 0, 6.3); g.ctx.fillStyle = 'rgba(234,234,242,.06)'; g.ctx.fill();
  g.ctx.save(); g.ctx.clip();
  g.circle(0, -18, 40, 'rgba(234,234,242,.28)');
  g.ctx.beginPath(); g.ctx.ellipse(0, 92, 78, 74, 0, 0, 6.3); g.ctx.fillStyle = 'rgba(234,234,242,.22)'; g.ctx.fill();
  g.ctx.restore();
  g.circle(0, 0, 100, null, { stroke: 'rgba(201,169,106,.7)', lw: 2 });
  g.ctx.restore();
  g.fillRR(px - 170, py + 110, 340, 120, 10, 'rgba(20,20,46,.85)', { stroke: 'rgba(201,169,106,.5)', alpha: k2, lw: 1.5 });
  g.text('西蒙·纽康', px, py + 148, { size: 36, weight: 700, fam: 'serif', color: C.goldHi, alpha: k2 });
  g.text('Simon Newcomb · 天文学家', px, py + 194, { size: 24, weight: 400, fam: 'en', italic: true, color: C.dim, alpha: k2 });
  // 57 年
  const k3 = prog(lt, 4.6, 5.6, E.out);
  if (k3 > 0) {
    g.text('1881', px - 120, 690, { size: 40, weight: 700, fam: 'en', color: C.text, alpha: k3 });
    g.path([[px - 70, 690], [px + 70, 690]], prog(lt, 4.8, 6.4), { color: C.gold, lw: 2, dash: [6, 8], alpha: 0.8 });
    g.text('1938', px + 120, 690, { size: 40, weight: 700, fam: 'en', color: C.goldHi, alpha: prog(lt, 6.0, 6.8) });
    g.text('57 年', px, 662, { size: 24, weight: 500, fam: 'hand', color: C.orange, alpha: prog(lt, 5.4, 6.2) });
  }
});
V.cue(28.0, 'slide', 0.6).cue(28.2, 'paper', 0.8).cue(29.6, 'stamp', 0.8).cue(29.6, 'bubble', 0.4).cue(32.6, 'pop', 0.4).cue(32.8, 'pen', { dur: 1.6, gain: 0.5 }).cue(34.0, 'ding', 0.5);
V.subs_seq(19.0, [
  [3.3, '1881年，天文学家纽康在翻对数表时发现', 'In 1881, astronomer Simon Newcomb noticed something odd.'],
  [3.1, '前面几页，总比后面的更脏、更旧', 'The first pages of his log tables were always dirtier.'],
  [3.2, '人们查得最多的，是以「1」开头的数', 'People looked up numbers starting with 1 the most.'],
  [3.2, '他写了两页纸的短文，然后被遗忘了 57 年', 'He wrote a two-page note — then it was forgotten for 57 years.'],
  [3.0, '直到另一个人，又注意到了那几页脏纸', 'Until someone else noticed the same dirty pages.'],
]);
V.note(23.2, 27.6, '前面的页，被翻得更旧');

/* ================================================================
 * 4. 历史锚点 B — 1938 本福特 20229 个数 36–52
 * ================================================================ */
V.label(36.4, 52.2, '1938 · 纽约州 · 通用电气');
const CATS = ['河流面积', '城市人口', '物理常数', '分子量', '比热', '门牌号', '死亡率', '杂志数字', '棒球统计', '电费'];
const RAIN = (() => { // 预生成数字雨：首位服从本福特分布
  const r = rng(77), out = [];
  for (let i = 0; i < 240; i++) {
    const u = r(); let acc = 0, d = 1; for (let k = 0; k < 9; k++) { acc += BEN[k]; if (u <= acc) { d = k + 1; break; } }
    const mag = Math.floor(r() * 4);
    const str = String(Math.floor((d + r()) * Math.pow(10, mag)));
    out.push({ d, str, cat: Math.floor(r() * CATS.length), t: r() * 6.5, jit: r() });
  }
  return out;
})();
V.scene(36.0, 52.4, (g, lt) => {
  g.spot(W / 2, 470, 700, 0.09);
  // 类别标签行
  CATS.forEach((c, i) => {
    const k = prog(lt, 0.4 + i * 0.12, 1.0 + i * 0.12, E.outBack);
    const x = W / 2 - 4.5 * 172 + i * 172;
    g.pill(x, 190 + (1 - k) * 20, c, { size: 24, alpha: clamp(k) * (1 - prog(lt, 13.5, 15)) });
  });
  // 直方图（计数随数字落下而增长）
  const base = 680, cx = W / 2;
  const fallT = lt - 2.2;
  const counts = Array(9).fill(0);
  const bw = 92, gap = 34, total = 9 * bw + 8 * gap, x0 = cx - total / 2;
  for (const p of RAIN) {
    const tt = fallT - p.t; if (tt < 0) continue;
    const dur = 1.1, q = clamp(tt / dur);
    const sx = W / 2 - 4.5 * 172 + p.cat * 172, sy = 225;
    const tx = x0 + (p.d - 1) * (bw + gap) + bw / 2 + (p.jit - 0.5) * 40, ty = base - 10;
    if (q < 1) {
      const e = E.in(q);
      g.text(p.str, lerp(sx, tx, E.inOut(q)), lerp(sy, ty, e), { size: 22, weight: 500, fam: 'en', color: p.d === 1 ? C.goldHi : C.text, alpha: 0.85 * (1 - q * 0.7) });
    } else counts[p.d - 1]++;
  }
  const sum = counts.reduce((a, b) => a + b, 0) || 1;
  const settle = prog(lt, 9.5, 11, E.inOut);
  const vals = counts.map((c, i) => lerp(c / 240, BEN[i], settle));
  const showPct = prog(lt, 10.5, 11.5);
  bars(g, cx, base, vals, { vmax: 0.32, hmax: 340, highlight: 0, glow: 22 * settle, labels: PCT, labelAlpha: showPct });
  // 计数器
  const kc = prog(lt, 2.0, 9.6, E.inOut);
  const ka = prog(lt, 1.6, 2.4) * (1 - prog(lt, 13.6, 14.6));
  g.text(g.count(Math.round(20229 * kc)), W - 260, 300, { size: 64, weight: 700, fam: 'en', color: C.goldHi, alpha: ka, align: 'center' });
  g.text('个数字 · numbers', W - 260, 350, { size: 22, weight: 500, color: C.dim, alpha: ka });
  // 本福特曲线 + 公式
  const kf = prog(lt, 11.4, 12.6);
  if (kf > 0) {
    const pts = BEN.map((v, i) => [x0 + i * (bw + gap) + bw / 2, base - (v / 0.32) * 340 - 60]);
    g.path(pts, kf, { color: C.orange, lw: 2.5, dash: [2, 8], alpha: 0.9 });
    const kk = prog(lt, 12, 13.2, E.out);
    g.fillRR(W - 470, 420 - (1 - kk) * 10, 400, 110, 12, 'rgba(20,20,46,.8)', { stroke: 'rgba(201,169,106,.55)', alpha: kk, lw: 1.5 });
    g.text('P(d) = log₁₀(1 + 1/d)', W - 270, 476 - (1 - kk) * 10, { size: 40, weight: 500, fam: 'en', italic: true, color: C.goldHi, alpha: kk });
  }
});
for (let i = 0; i < 26; i++) V.cue(38.4 + i * 0.27, 'tick', 0.28 + 0.1 * (i % 3), Math.sin(i) * 0.6);
V.cue(36.0, 'whoosh', 0.6).cue(38.0, 'counter', { dur: 7.6, gain: 0.35 }).cue(46.0, 'rise', 0.5).cue(47.0, 'chime', 0.8).cue(47.4, 'pen', { dur: 1.2, gain: 0.5 }).cue(48.0, 'flip', 0.6);
V.subs_seq(36.6, [
  [3.3, '1938年，物理学家本福特收集了 20229 个数字', 'In 1938, physicist Frank Benford gathered 20,229 numbers.'],
  [3.4, '河流面积、城市人口、物理常数、杂志上的数……', 'River areas, populations, physical constants, magazine figures…'],
  [3.3, '来源毫不相干，第一位却排出同一个形状', 'Unrelated sources — the same shape, every time.'],
  [4.4, '「1」开头占 30.1%，而「9」只有 4.6%', 'One leads 30.1% of the time. Nine, just 4.6%.'],
]);
V.note(40.4, 46.2, '20 类数据 · 20,229 个数', {});

/* ================================================================
 * 5. 机制 A — 一个会长大的数 52–76
 * ================================================================ */
V.label(52.2, 76.4, '机制 · 一个会长大的数');
const SIM_A = 56.5, SIM_B = 69.0, YEARS = 25.2;
const simYear = (t) => clamp((t - SIM_A) / (SIM_B - SIM_A)) * YEARS;
V.scene(52.0, 76.6, (g, lt, s) => {
  const t = s.t;
  g.spot(W / 2, 420, 700, 0.09);
  // 规则卡（52–56.4），之后上移缩小成角标
  const kr = prog(t, 52.4, 53.4, E.outBack), shrink = prog(t, 55.6, 56.6, E.inOut);
  const rcx = lerp(W / 2, 330, shrink), rcy = lerp(440, 250, shrink), rs = lerp(1, 0.62, shrink);
  g.ctx.save(); g.ctx.translate(rcx, rcy); g.ctx.scale(rs, rs); g.ctx.globalAlpha *= clamp(kr);
  g.fillRR(-330, -120, 660, 240, 16, 'rgba(20,20,46,.85)', { stroke: 'rgba(201,169,106,.6)', lw: 2, shadow: 30 });
  g.text('规则', 0, -70, { size: 26, weight: 500, color: C.gold, ls: 10 });
  g.text('100 元，每年增长 10%', 0, -5, { size: 50, weight: 900, fam: 'serif', color: C.text });
  g.text('a number that grows 10% a year', 0, 58, { size: 26, fam: 'en', italic: true, weight: 400, color: C.dim });
  g.ctx.restore();

  const k = prog(t, 55.8, 56.8, E.out);
  if (k <= 0) return;
  const y = simYear(t), val = 100 * Math.pow(1.1, y);
  const str = String(Math.floor(val));
  // 大计数器
  const cx = W / 2 + 120, cy = 300;
  const first = str[0], rest = str.slice(1);
  const wf = g.measure(first, { size: 150, weight: 900, fam: 'serif' }), wr = g.measure(rest, { size: 150, weight: 700, fam: 'serif' });
  const x0 = cx - (wf + wr) / 2;
  g.text(first, x0 + wf / 2, cy, { size: 150, weight: 900, fam: 'serif', color: C.goldHi, alpha: k, glow: 26 });
  g.text(rest, x0 + wf + wr / 2, cy, { size: 150, weight: 700, fam: 'serif', color: C.text, alpha: k * 0.9 });
  g.text('第 ' + y.toFixed(1) + ' 年', cx + 360, cy + 40, { size: 30, weight: 500, fam: 'hand', color: C.orange, alpha: k });
  // 9 根"停留时间"柱：在首位为 d 的区间内累计年数
  const spent = Array(9).fill(0);
  const tYear = (v) => Math.log(v / 100) / Math.log(1.1);
  for (let d = 1; d <= 9; d++) {
    const a = tYear(d * 100), b = tYear((d + 1) * 100);
    spent[d - 1] = clamp(y - a, 0, b - a);
  }
  spent[0] += clamp(y - tYear(1000), 0, YEARS); // 过 1000 后又回到 "1"
  const vmax = 8.4, hmax = 300, base = 700;
  const cur = +str[0] - 1;
  const res = bars(g, W / 2, base, spent.map((v) => v / vmax * 0.32), {
    vmax: 0.32, hmax, highlight: cur, glow: 18, alpha: k,
    labels: spent.map((v) => (v > 0.05 ? v.toFixed(1) + ' 年' : '')), labelSize: 24,
  });
  // 当前位置指示
  const ix = res.x0 + cur * (res.bw + res.gap) + res.bw / 2;
  g.text('▼', ix, 380 + Math.sin(t * 5) * 3, { size: 26, color: C.gold, alpha: k * 0.9 });
  // 两个关键对比标注
  const kA = env(t, 60.0, 67.4, 0.5, 0.5), kB = env(t, 67.8, 76.6, 0.5, 0.4);
  if (kA > 0) g.text('100 → 200：要翻一倍', res.x0 + res.bw / 2 + 110, 430, { size: 28, weight: 500, fam: 'hand', color: C.orange, alpha: kA, align: 'left' });
  if (kB > 0) g.text('900 → 1000：只差 11%', res.x0 + 8 * (res.bw + res.gap) + res.bw / 2 - 40, 520, { size: 28, weight: 500, fam: 'hand', color: C.orange, alpha: kB, align: 'right' });
}, { fin: 0.4 });
// 每跨一个"百"响一声
for (let d = 2; d <= 11; d++) {
  const yr = Math.log(d) / Math.log(1.1);
  V.cue(SIM_A + yr / YEARS * (SIM_B - SIM_A), d === 10 ? 'chime' : 'tick', d === 10 ? 0.7 : 0.5);
}
V.cue(52.0, 'whoosh', 0.6).cue(52.4, 'flip', 0.7).cue(55.6, 'slide', 0.6).cue(56.6, 'counter', { dur: 12.4, gain: 0.18 });
V.subs_seq(52.6, [
  [3.0, '为什么偏偏是 1？看一个会长大的数', 'Why 1? Watch a number grow.'],
  [3.6, '100 元，每年涨 10%，盯住它的第一位', '100 dollars, +10% a year. Watch the first digit.'],
  [3.6, '从 100 到 200 要翻一倍，足足 7 年多', 'From 100 to 200 it has to double — over 7 years.'],
  [3.4, '越往后，同样的一步走得越快', 'The higher it climbs, the faster each step goes.'],
  [2.8, '900 到 1000，只差 11%：1 年就过', '900 to 1000 is only 11% — about a year.'],
  [2.9, '过了 1000，又从「1」开头，重新慢慢爬', 'Past 1000, it is back to 1 — crawling again.'],
  [2.6, '「1」开头的时间，永远最长', 'Time spent at 1 is always the longest.'],
]);

/* ================================================================
 * 6. 机制 B — 倍数的尺子 76–90
 * ================================================================ */
V.label(76.6, 90.2, '机制 · 倍数的尺子');
const DROPS = (() => { const r = rng(123); return [...Array(130)].map((_, i) => ({ u: r(), t: 6.6 + i * 0.045 + r() * 0.2 })); })();
V.scene(76.2, 90.4, (g, lt) => {
  V.push(g, lt, 0.004);
  const L = 230, R = W - 230, Y = 560, len = R - L;
  const xOf = (v) => L + Math.log10(v) * len;
  g.spot(W / 2, 480, 760, 0.08);
  const k = prog(lt, 0.3, 1.8, E.inOut);
  // 尺身
  g.fillRR(L - 20, Y - 6, (len + 40) * k, 64, 8, 'rgba(237,228,211,.92)', { shadow: 20 });
  for (let d = 1; d <= 10; d++) {
    const kd = prog(lt, 0.6 + d * 0.12, 1.1 + d * 0.12);
    const x = xOf(d);
    g.line(x, Y - 6, x, Y + 30, { color: C.ink, lw: 3, alpha: kd });
    g.text(String(d), x, Y + 44, { size: 26, weight: 700, fam: 'serif', color: C.ink, alpha: kd });
    if (d < 10) for (let s = 1; s < 10; s++) { const xs = xOf(d + s / 10); g.line(xs, Y - 6, xs, Y + (s === 5 ? 16 : 9), { color: C.ink, lw: 1, alpha: kd * 0.6 }); }
  }
  // 1→2 段高亮括号
  const kb = prog(lt, 7.2, 8.4, E.out);
  if (kb > 0) {
    const a = xOf(1), b = xOf(2);
    g.fillRR(a, Y - 6, (b - a) * kb, 64, 6, 'rgba(201,169,106,.35)');
    g.path([[a, Y + 100], [a, Y + 116], [b, Y + 116], [b, Y + 100]], kb, { color: C.gold, lw: 3 });
    g.text('30.1%', (a + b) / 2, Y + 150, { size: 40, weight: 700, color: C.goldHi, alpha: kb, glow: 14 });
    const a9 = xOf(9), b9 = xOf(10);
    g.path([[a9, Y + 100], [a9, Y + 116], [b9, Y + 116], [b9, Y + 100]], kb, { color: C.dim, lw: 2 });
    g.text('4.6%', (a9 + b9) / 2, Y + 150, { size: 30, weight: 600, color: C.dim, alpha: kb });
  }
  // 等距 = 等倍数：箭头示意 ×2 与 ×1.11
  const ke = env(lt, 3.6, 7.4, 0.5, 0.5);
  if (ke > 0) {
    const arc = (x1, x2, label, col) => {
      const pts = []; for (let i = 0; i <= 24; i++) { const q = i / 24; pts.push([lerp(x1, x2, q), Y - 30 - Math.sin(q * Math.PI) * 60]); }
      g.path(pts, prog(lt, 3.8, 4.8), { color: col, lw: 2.5, alpha: ke });
      g.text(label, (x1 + x2) / 2, Y - 112, { size: 30, weight: 600, fam: 'hand', color: col, alpha: ke });
    };
    arc(xOf(1), xOf(2), '×2', C.goldHi);
    arc(xOf(9), xOf(10), '×1.11', C.dim);
  }
  // 随机落点：均匀落在"倍数尺"上 → 落在 1–2 的最多
  const piles = Array(9).fill(0);
  for (const p of DROPS) {
    const tt = lt - p.t; if (tt < 0) continue;
    const x = L + p.u * len, d = Math.floor(Math.pow(10, p.u)) - 1;
    const q = clamp(tt / 0.5);
    const segW = xOf(d + 2) - xOf(d + 1);
    if (q < 1) { g.circle(x, lerp(180, Y - 20, E.in(q)), 6, d === 0 ? C.goldHi : C.text, { alpha: 0.9 }); continue; }
    const n = piles[d]++;
    const cols = Math.max(1, Math.floor(segW / 15));
    const px = xOf(d + 1) + 8 + (n % cols) * (segW - 8) / cols, py = Y - 22 - Math.floor(n / cols) * 14;
    g.circle(px, py, 5.5, d === 0 ? C.gold : 'rgba(234,234,242,.75)', { alpha: 0.95 });
  }
}, { fin: 0.5 });
DROPS.forEach((d, i) => { if (i % 3 === 0) V.cue(76.2 + d.t + 0.5, 'drop', 0.45, (d.u - 0.5) * 1.4); });
V.cue(76.2, 'whoosh', 0.6).cue(76.5, 'slide', 0.5).cue(80.0, 'pen', { dur: 1.0, gain: 0.5 }).cue(83.4, 'pen', { dur: 1.2, gain: 0.6 }).cue(84.4, 'chime', 0.7);
V.subs_seq(76.8, [
  [3.2, '换一把尺子：每一格不是「加多少」，而是「乘多少」', 'A ruler marked in ratios, not steps.'],
  [3.3, '1 到 2 是翻一倍，9 到 10 只多一成', '1 to 2 is a doubling. 9 to 10, barely a tenth.'],
  [3.3, '所以 1 到 2 这一段，占了整把尺子的 30.1%', 'So 1 to 2 takes 30.1% of the ruler.'],
  [3.4, '跨越的数量级越多，数据就越贴近这把尺子', 'The more orders of magnitude, the closer the fit.'],
]);
V.note(80.2, 83.4, '等距 = 等倍数', { y: 760 });

/* ================================================================
 * 7. 反直觉转折 — 编出来的数 90–104
 * ================================================================ */
V.label(90.2, 104.2, '反转 · 编出来的数');
const FAKE = [0.112, 0.104, 0.118, 0.121, 0.127, 0.109, 0.112, 0.098, 0.099];
V.scene(90.0, 104.4, (g, lt) => {
  V.push(g, lt, 0.005);
  const k = prog(lt, 0.2, 1.4, E.out);
  const panel = (cx, title, vals, col, ka) => {
    g.fillRR(cx - 400, 170, 800, 560, 18, 'rgba(20,20,46,.6)', { stroke: 'rgba(138,138,160,.3)', alpha: ka, lw: 1.5 });
    g.text(title, cx, 220, { size: 34, weight: 700, color: col, alpha: ka });
    bars(g, cx, 640, vals.map((v) => v * ka), { bw: 54, gap: 24, hmax: 300, vmax: 0.32, digitSize: 30, alpha: ka, highlight: col === C.goldHi ? 0 : -1, glow: 12 });
  };
  panel(W / 2 - 430, '真实的报销单', BEN, C.goldHi, k);
  const k2 = prog(lt, 1.2, 2.4, E.out);
  panel(W / 2 + 430, '编造的报销单', FAKE, C.text, k2);
  // 本福特参考线叠在右侧
  const kr = prog(lt, 4.0, 5.4);
  if (kr > 0) {
    const bw = 54, gap = 24, x0 = W / 2 + 430 - (9 * bw + 8 * gap) / 2;
    const pts = BEN.map((v, i) => [x0 + i * (bw + gap) + bw / 2, 640 - (v / 0.32) * 300]);
    g.path(pts, kr, { color: C.orange, lw: 2.5, dash: [3, 8] });
    g.text('应有的形状', x0 + 160, 640 - (BEN[0] / 0.32) * 300 - 30, { size: 24, weight: 500, fam: 'hand', color: C.orange, alpha: kr });
  }
  g.stamp(W / 2 + 640, 300, '异常', { k: prog(lt, 5.6, 6.2), size: 44, rot: 0.2 });
  // 1992 尼格里尼
  const kn = env(lt, 7.8, 14.4, 0.6, 0.4);
  if (kn > 0) {
    g.fillRR(W / 2 - 300, 360 - (1 - kn) * 10, 600, 130, 14, 'rgba(10,10,28,.92)', { stroke: 'rgba(201,169,106,.6)', alpha: kn, lw: 1.5, shadow: 40 });
    g.text('马克·尼格里尼 · 1992', W / 2, 405 - (1 - kn) * 10, { size: 36, weight: 700, fam: 'serif', color: C.goldHi, alpha: kn });
    g.text('Mark Nigrini · forensic accounting', W / 2, 452 - (1 - kn) * 10, { size: 24, weight: 400, fam: 'en', italic: true, color: C.dim, alpha: kn });
  }
  g.text('示意数据 · illustrative', W / 2 + 430 + 330, 712, { size: 18, weight: 500, color: C.dim, alpha: k2 * 0.8, align: 'right' });
}, { fin: 0.5 });
V.cue(90.0, 'whoosh', 0.6).cue(90.3, 'slide', 0.4).cue(91.3, 'slide', 0.4).cue(94.0, 'pen', { dur: 1.4, gain: 0.5 }).cue(95.6, 'stamp', 1.0).cue(95.6, 'wrong', 0.5).cue(97.8, 'flip', 0.6).cue(98.0, 'ding', 0.5);
V.subs_seq(90.5, [
  [3.3, '人在编数字时，会下意识地「平均分配」', 'When people fake numbers, they spread them evenly.'],
  [3.3, '可均匀，恰恰是最不自然的', 'But evenness is exactly what nature avoids.'],
  [3.4, '1992年起，会计学者尼格里尼把它用进了查账', 'From 1992, accountant Mark Nigrini brought it into auditing.'],
  [3.0, '第一位数字，成了一台测谎仪', 'The first digit became a lie detector.'],
]);

/* ================================================================
 * 8. 现实落点 104–116
 * ================================================================ */
V.label(104.2, 111.4, '现实 · 它在哪里成立');
const YES = ['河流面积', '城市人口', '股票成交量', '电费账单'], NO = ['身高', '电话号码', '考试分数'];
V.scene(104.0, 111.6, (g, lt) => {
  V.push(g, lt, 0.005);
  g.text('✓ 适用', W / 2 - 400, 230, { size: 34, weight: 700, color: C.goldHi, alpha: prog(lt, 0.3, 0.9) });
  YES.forEach((s, i) => { const k = prog(lt, 0.5 + i * 0.3, 1.1 + i * 0.3, E.outBack); g.pill(W / 2 - 400, 320 + i * 96 + (1 - k) * 16, s, { size: 34, alpha: clamp(k) }); });
  g.text('✗ 不适用', W / 2 + 400, 230, { size: 34, weight: 700, color: C.dim, alpha: prog(lt, 3.6, 4.2) });
  NO.forEach((s, i) => {
    const k = prog(lt, 3.8 + i * 0.3, 4.4 + i * 0.3, E.outBack);
    const w = g.pill(W / 2 + 400, 320 + i * 96 + (1 - k) * 16, s, { size: 34, alpha: clamp(k), color: C.dim, stroke: 'rgba(138,138,160,.5)', fill: 'rgba(138,138,160,.08)' });
    g.line(W / 2 + 400 - w / 2 - 6, 320 + i * 96, W / 2 + 400 + w / 2 + 6, 320 + i * 96, { color: C.red, lw: 3, k: prog(lt, 4.6 + i * 0.3, 5.0 + i * 0.3), alpha: 0.9 });
  });
  g.line(W / 2, 220, W / 2, 640, { color: C.faint, lw: 1.5, alpha: prog(lt, 0.2, 1), dash: [4, 8] });
  g.text('跨越数量级 · 自然增长', W / 2 - 400, 700, { size: 26, weight: 500, fam: 'hand', color: C.orange, alpha: prog(lt, 2, 2.8) });
  g.text('有上下限 · 人为编号', W / 2 + 400, 700, { size: 26, weight: 500, fam: 'hand', color: C.dim, alpha: prog(lt, 5.4, 6.2) });
});
V.cue(104.0, 'whoosh', 0.5).cue(104.3, 'correct', 0.5, -0.4);
YES.forEach((_, i) => V.cue(104.5 + i * 0.3, 'pop', 0.4, -0.5));
NO.forEach((_, i) => V.cue(107.8 + i * 0.3, 'pop', 0.35, 0.5));
NO.forEach((_, i) => V.cue(108.6 + i * 0.3, 'snap', 0.5, 0.5));
V.cue(108.6, 'wrong', 0.4, 0.4);
V.subs_seq(104.5, [
  [3.2, '跨越多个数量级、自然生长的数据，都爱它', 'Data that grows across orders of magnitude loves it.'],
  [3.4, '身高、电话号码、考试分数，则不归它管', 'Heights, phone numbers, test scores — not so much.'],
]);
// 金句
V.scene(111.2, 116.4, (g, lt) => {
  V.push(g, lt, 0.01);
  g.spot(W / 2, 470, 700, 0.14);
  g.textReveal('自然生长的数，偏爱从 1 开始', W / 2, 460, prog(lt, 0.3, 2.2, E.linear), { size: 84, weight: 900, fam: 'serif', color: C.goldHi, glow: 18, glowColor: 'rgba(201,169,106,.35)' });
  g.text('Things that grow naturally prefer to begin with 1.', W / 2, 570, { size: 32, fam: 'en', italic: true, weight: 400, color: C.dim, alpha: prog(lt, 2.2, 3.2) });
  g.line(W / 2 - 180 * prog(lt, 2.5, 3.5), 640, W / 2 + 180 * prog(lt, 2.5, 3.5), 640, { color: C.gold, alpha: 0.5, lw: 1.5 });
}, { fin: 0.6, fout: 0.8 });
V.cue(111.2, 'reverse', { dur: 1.2, align: 'end', gain: 0.5 }).cue(111.2, 'impact', 0.5).cue(113.2, 'sparkle', 0.7);

/* ================================================================
 * 9. 声明与引用 116–130
 * ================================================================ */
V.endCards(116.2, {
  disclaimerDur: 5.6, citeDur: 8.2,
  disclaimer: ['本片为数学规律的科普演示，部分图表为示意', '本福特定律只是统计倾向，不能单独作为造假证据', '有上下限、跨度小或人为编号的数据并不适用'],
  cites: ['Newcomb, S. (1881). Am. J. Math., 4(1), 39–40.', 'Benford, F. (1938). Proc. Am. Philos. Soc., 78(4), 551–572.', "Nigrini, M. J. (2012). Benford's Law. Wiley."],
  question: '你的工资条，第一位是几？',
  credit: '@zhiyusay 出品 · 动画由代码生成',
});
V.cue(116.2, 'whoosh', 0.4).cue(121.8, 'paper', 0.5).cue(124.0, 'ding', 0.6);

// 卡点：场景起点吸附到小节头 / drop（无 BGM 时按 77 BPM 网格）
V.sync();
V.mount();
