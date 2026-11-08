/* =====================================================================
 * vibe.js — Vibe知识大赏 风格短片的确定性 Canvas 渲染引擎
 *
 * 核心原则：画面 = f(t)。没有 requestAnimationFrame、没有 Math.random，
 * 同一个 t 永远画出同一帧，这样 Playwright 才能逐帧截出可复现的视频。
 *
 * 用法（在 projects/<slug>/film.js 中）：
 *   const V = Vibe.create({ duration: 120, watermark: '@zhiyusay' });
 *   V.scene(0, 12, (g, lt, s) => { ... });      // g = 绘图助手, lt = 场景内时间
 *   V.sub(1, 4, '中文字幕', 'English line');
 *   V.label(17, 40, '1881 · 华盛顿 · 对数表');
 *   V.note(20, 24, '注释带小字');
 *   V.cue(3.2, 'whoosh');                         // 音效点（导出给 audio.py）
 *   V.mount();
 * ===================================================================== */
(function (root) {
  'use strict';

  // ---------- 调色板（全片只从这里取色） ----------
  const C = {
    bg0: '#050510', bg1: '#0c0c22', bg2: '#14142e',
    text: '#EAEAF2', dim: '#8A8AA0', faint: '#4a4a64',
    gold: '#C9A96A', goldHi: '#F1D9A0', cream: '#EDE4D3', paper: '#E6DCC6',
    red: '#B53A2F', orange: '#E8A87C', teal: '#7FB8B0', blue: '#7C9CE8',
    ink: '#2A2420',
  };

  const FONT = {
    sans: '"Noto Sans SC","WenQuanYi Zen Hei",sans-serif',
    serif: '"Noto Serif SC","Noto Sans SC",serif',
    en: '"EB Garamond","Noto Serif SC",serif',
    hand: '"LXGW WenKai","Noto Serif SC",serif',
    mono: '"EB Garamond","Noto Sans SC",monospace',
  };

  // ---------- 数学与缓动 ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    linear: (x) => x,
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
    outBack: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    spring: (x) => 1 - Math.cos(x * Math.PI * 2.5) * Math.exp(-x * 6),
  };
  /** t 在 [a,b] 内的进度（0..1），带缓动 */
  const prog = (t, a, b, ease = E.inOut) => ease(clamp((t - a) / Math.max(1e-6, b - a)));
  /** 进场-停留-退场 包络：返回 0..1 */
  const env = (t, a, b, fin = 0.5, fout = 0.5) =>
    Math.min(prog(t, a, a + fin, E.out), 1 - prog(t, b - fout, b, E.in));

  // ---------- 固定种子随机 ----------
  function rng(seed = 1) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- 引擎 ----------
  function create(opts = {}) {
    const W = opts.width || 1920, H = opts.height || 1080, FPS = opts.fps || 30;
    const V = {
      W, H, FPS, C, FONT, E, clamp, lerp, prog, env, rng, hash,
      duration: opts.duration || 120,
      watermark: opts.watermark ?? '@zhiyusay',
      bpm: opts.bpm || 77,
      scenes: [], subs: [], labels: [], notes: [], cues: [], overlays: [],
      _probe: null,
    };
    V.beat = 60 / V.bpm; V.bar = V.beat * 4;

    V.scene = (a, b, fn, o = {}) => { V.scenes.push({ a, b, fn, z: o.z || 0, fin: o.fin ?? 0.6, fout: o.fout ?? 0.6 }); return V; };
    V.overlay = (a, b, fn) => { V.overlays.push({ a, b, fn }); return V; };
    V.sub = (a, b, zh, en = '') => { V.subs.push({ a, b, zh, en }); return V; };
    V.label = (a, b, text) => { V.labels.push({ a, b, text }); return V; };
    V.note = (a, b, text, o = {}) => { V.notes.push({ a, b, text, ...o }); return V; };
    V.cue = (t, name, gain = 1, pan = 0) => { V.cues.push({ t: +t.toFixed(3), name, gain, pan }); return V; };
    /** 配乐设定：{ prog:['Am','F','C','G'], sections:[[0,8,'pad'],...], gain, sfx_gain } */
    V.music = (m) => { V._music = m; return V; };
    /** 字幕串：按顺序排，每条自动接在上一条后面 */
    V.subs_seq = (start, items, gap = 0.25) => {
      let t = start;
      for (const [dur, zh, en] of items) { V.sub(t, t + dur, zh, en); t += dur + gap; }
      return t;
    };

    // ---------- 背景粒子（光尘） ----------
    const dust = [];
    { const r = rng(opts.seed || 7);
      for (let i = 0; i < 140; i++) dust.push({ x: r() * W, y: r() * H, z: 0.3 + r() * 0.7, ph: r() * 6.28, sp: 0.15 + r() * 0.5 }); }

    // ---------- 绘图助手 g ----------
    function makeG(ctx) {
      const g = { ctx, W, H, C, FONT, E, prog, env, clamp, lerp };

      g.font = (size, weight = 700, fam = 'sans', italic = false) =>
        `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT[fam] || fam}`;

      /** 文字。o: size weight fam color align base alpha ls(字距 px) italic stroke glow maxW */
      g.text = (str, x, y, o = {}) => {
        str = String(str);
        const f = g.font(o.size || 40, o.weight ?? 700, o.fam || 'sans', o.italic);
        if (V._probe) { (V._probe[f] = V._probe[f] || new Set()).add(str); }
        ctx.save();
        ctx.font = f;
        ctx.globalAlpha *= o.alpha ?? 1;
        ctx.textAlign = o.align || 'center';
        ctx.textBaseline = o.base || 'middle';
        if (o.ls) ctx.letterSpacing = o.ls + 'px';
        if (o.glow) { ctx.shadowColor = o.glowColor || o.color || C.gold; ctx.shadowBlur = o.glow; }
        if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor || 'rgba(5,5,16,.85)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
        ctx.fillStyle = o.color || C.text;
        if (o.gradient) {
          const m = ctx.measureText(str), w = m.width, sz = o.size || 40;
          const x0 = ctx.textAlign === 'center' ? x - w / 2 : ctx.textAlign === 'right' ? x - w : x;
          const gr = ctx.createLinearGradient(x0, y - sz / 2, x0, y + sz / 2);
          o.gradient.forEach((c, i) => gr.addColorStop(i / (o.gradient.length - 1), c));
          ctx.fillStyle = gr;
        }
        ctx.fillText(str, x, y);
        ctx.restore();
      };
      g.measure = (str, o = {}) => { ctx.save(); ctx.font = g.font(o.size || 40, o.weight ?? 700, o.fam || 'sans', o.italic); if (o.ls) ctx.letterSpacing = o.ls + 'px'; const w = ctx.measureText(String(str)).width; ctx.restore(); return w; };

      /** 文字逐字出现（淡入 + 上浮），用于强调句 */
      g.textReveal = (str, x, y, k, o = {}) => {
        const chars = [...String(str)];
        const total = g.measure(str, o);
        let cx = (o.align === 'left') ? x : x - total / 2;
        chars.forEach((ch, i) => {
          const w = g.measure(ch, o);
          const kk = clamp(k * (chars.length + 3) - i, 0, 1);
          const e = E.out(kk);
          if (kk > 0) g.text(ch, cx + w / 2, y + (1 - e) * 14, { ...o, align: 'center', alpha: (o.alpha ?? 1) * e });
          cx += w;
        });
      };

      g.rrect = (x, y, w, h, r = 12) => {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      };
      g.fillRR = (x, y, w, h, r, fill, o = {}) => {
        ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
        if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = o.shadow; ctx.shadowOffsetY = o.shadow / 3; }
        g.rrect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
        if (o.stroke) { ctx.shadowColor = 'transparent'; ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke; ctx.stroke(); }
        ctx.restore();
      };
      g.line = (x1, y1, x2, y2, o = {}) => {
        ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = o.color || C.dim; ctx.lineWidth = o.lw || 2;
        ctx.lineCap = 'round'; if (o.dash) ctx.setLineDash(o.dash);
        const k = o.k ?? 1;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, k), lerp(y1, y2, k)); ctx.stroke(); ctx.restore();
      };
      g.circle = (x, y, r, fill, o = {}) => {
        ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
        if (o.glow) { ctx.shadowColor = o.glowColor || fill; ctx.shadowBlur = o.glow; }
        ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (o.stroke) { ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke; ctx.stroke(); }
        ctx.restore();
      };
      /** 按进度 k 画折线/曲线（自绘效果） */
      g.path = (pts, k = 1, o = {}) => {
        if (pts.length < 2) return;
        const segs = []; let L = 0;
        for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); L += d; }
        let rem = L * clamp(k);
        ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = o.color || C.gold; ctx.lineWidth = o.lw || 3;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (o.dash) ctx.setLineDash(o.dash);
        if (o.glow) { ctx.shadowColor = o.color || C.gold; ctx.shadowBlur = o.glow; }
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        let end = pts[0];
        for (let i = 1; i < pts.length && rem > 0; i++) {
          const d = segs[i - 1];
          if (rem >= d) { ctx.lineTo(pts[i][0], pts[i][1]); end = pts[i]; rem -= d; }
          else { const q = rem / d; end = [lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)]; ctx.lineTo(end[0], end[1]); rem = 0; }
        }
        ctx.stroke(); ctx.restore();
        return end;
      };

      /** 米白纸卡（带打孔、阴影、微旋转） */
      g.card = (cx, cy, w, h, o = {}) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.scale(o.scale ?? 1, o.scale ?? 1);
        ctx.globalAlpha *= o.alpha ?? 1;
        g.fillRR(-w / 2, -h / 2, w, h, o.r ?? 10, o.fill || C.cream, { shadow: o.shadow ?? 30 });
        if (o.hole) g.circle(0, -h / 2 + 16, 5, 'rgba(0,0,0,.35)');
        if (o.draw) o.draw(g, w, h);
        ctx.restore();
      };

      /** 做旧文献（论文首页复原） */
      g.paper = (cx, cy, w, h, o = {}) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot ?? -0.03); ctx.globalAlpha *= o.alpha ?? 1;
        g.fillRR(-w / 2, -h / 2, w, h, 4, C.paper, { shadow: 40 });
        // 做旧：边缘暗角
        const gr = ctx.createRadialGradient(0, 0, Math.min(w, h) * 0.2, 0, 0, Math.max(w, h) * 0.7);
        gr.addColorStop(0, 'rgba(120,90,40,0)'); gr.addColorStop(1, 'rgba(120,90,40,.28)');
        ctx.fillStyle = gr; ctx.fillRect(-w / 2, -h / 2, w, h);
        // 假正文行
        const r = rng(o.seed || 3);
        ctx.fillStyle = 'rgba(42,36,32,.22)';
        const top = o.bodyTop ?? (-h / 2 + h * 0.42);
        for (let yy = top; yy < h / 2 - 30; yy += 18) {
          const lw = (w - 80) * (0.75 + r() * 0.25);
          ctx.fillRect(-w / 2 + 40, yy, yy + 18 > h / 2 - 30 ? lw * 0.5 : lw, 5);
        }
        if (o.draw) o.draw(g, w, h);
        ctx.restore();
      };

      /** 红色印章 */
      g.stamp = (x, y, txt, o = {}) => {
        const k = o.k ?? 1; if (k <= 0) return;
        const sc = lerp(1.6, 1, E.out(k));
        ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.18); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(k * 2) * (o.alpha ?? 0.9);
        const s = o.size || 34, w = g.measure(txt, { size: s, weight: 900, fam: 'serif' }) + s * 0.9, h = s * 1.6;
        ctx.strokeStyle = o.color || C.red; ctx.lineWidth = 4; g.rrect(-w / 2, -h / 2, w, h, 6); ctx.stroke();
        g.text(txt, 0, 2, { size: s, weight: 900, fam: 'serif', color: o.color || C.red });
        ctx.restore();
      };

      /** 胶囊标签 */
      g.pill = (x, y, txt, o = {}) => {
        const s = o.size || 30, w = g.measure(txt, { size: s, weight: o.weight ?? 600, fam: o.fam }) + s * 1.4, h = s * 1.8;
        g.fillRR(x - w / 2, y - h / 2, w, h, h / 2, o.fill || 'rgba(201,169,106,.12)', { stroke: o.stroke || 'rgba(201,169,106,.6)', alpha: o.alpha ?? 1, lw: 1.5 });
        g.text(txt, x, y + 1, { size: s, weight: o.weight ?? 600, fam: o.fam, color: o.color || C.goldHi, alpha: o.alpha ?? 1 });
        return w;
      };

      /** 数字滚动 */
      g.count = (v, dec = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

      /** 微漂浮（≤2px，周期 3–5s）让静止画面"活着" */
      g.float = (t, seed = 0, amp = 2) => [Math.sin(t * 1.3 + seed) * amp, Math.cos(t * 1.1 + seed * 1.7) * amp];

      /** 局部聚光（让主视觉区更亮） */
      g.spot = (x, y, r, alpha = 0.12, color = '201,169,106') => {
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${color},${alpha})`); gr.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      return g;
    }

    // ---------- 固定层 ----------
    function drawBg(g, t) {
      const { ctx } = g;
      const gr = ctx.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, W * 0.75);
      gr.addColorStop(0, C.bg2); gr.addColorStop(0.55, C.bg1); gr.addColorStop(1, C.bg0);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      // 呼吸光晕：两团缓慢漂移的冷/暖光，保证画面永远在"呼吸"
      g.spot(W * 0.5 + Math.sin(t * 0.31) * 360, H * 0.42 + Math.cos(t * 0.23) * 120, 640, 0.07 + 0.03 * Math.sin(t * 0.9), '124,156,232');
      g.spot(W * 0.5 + Math.cos(t * 0.27) * 420, H * 0.55 + Math.sin(t * 0.19) * 140, 560, 0.05 + 0.025 * Math.cos(t * 0.8), '201,169,106');
      for (const d of dust) {
        const x = (d.x + t * 6 * d.sp * d.z) % W, y = (d.y - t * 3 * d.sp * d.z + H) % H;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.9 * d.sp + d.ph));
        g.circle(x, y, 0.6 + d.z * 1.3, `rgba(234,234,242,${0.08 + 0.32 * tw * d.z})`);
      }
    }

    function drawChrome(g, t) {
      // 水印（左上，全片固定）
      if (V.watermark) g.text(V.watermark, 56, 58, { size: 26, weight: 500, align: 'left', color: C.dim, alpha: 0.55, ls: 1 });
      // 顶部标签
      for (const l of V.labels) {
        const a = env(t, l.a, l.b, 0.5, 0.4); if (a <= 0) continue;
        g.text(l.text, W / 2, 92 - (1 - a) * 6, { size: 28, weight: 500, color: C.gold, alpha: a * 0.9, ls: 6 });
        const w = g.measure(l.text, { size: 28, weight: 500, ls: 6 });
        g.line(W / 2 - w / 2 - 70, 92, W / 2 - w / 2 - 24, 92, { color: C.gold, alpha: a * 0.5, lw: 1.5 });
        g.line(W / 2 + w / 2 + 24, 92, W / 2 + w / 2 + 70, 92, { color: C.gold, alpha: a * 0.5, lw: 1.5 });
      }
      // 注释带 (y≈760)
      for (const n of V.notes) {
        const a = env(t, n.a, n.b, 0.4, 0.35); if (a <= 0) continue;
        g.text(n.text, n.x ?? W / 2, (n.y ?? 768) + (1 - a) * 8, { size: n.size || 30, weight: 500, fam: n.fam || 'hand', color: n.color || C.orange, alpha: a * 0.92, stroke: 6 });
      }
      // 双语字幕 (85%–91%)
      for (const s of V.subs) {
        const a = env(t, s.a, s.b, 0.28, 0.22); if (a <= 0) continue;
        const dy = (1 - a) * 8;
        g.text(s.zh, W / 2, 935 + dy, { size: 46, weight: 700, color: C.text, alpha: a, stroke: 8, ls: 1 });
        if (s.en) g.text(s.en, W / 2, 988 + dy, { size: 27, weight: 400, fam: 'en', italic: true, color: C.dim, alpha: a * 0.95, stroke: 6 });
      }
    }

    // ---------- 帧渲染 ----------
    let canvas, ctx, G;
    V.render = (t) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      drawBg(G, t);
      const act = V.scenes.filter((s) => t >= s.a && t < s.b).sort((a, b) => a.z - b.z);
      for (const s of act) {
        ctx.save();
        ctx.globalAlpha = env(t, s.a, s.b, s.fin, s.fout);
        s.fn(G, t - s.a, { t, dur: s.b - s.a, a: s.a, b: s.b });
        ctx.restore();
      }
      for (const o of V.overlays) if (t >= o.a && t < o.b) { ctx.save(); o.fn(G, t - o.a, { t }); ctx.restore(); }
      drawChrome(G, t);
      // 暗角
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    };

    /** 收集全片用到的字形，按需加载 unicode-range 子集字体 */
    async function preloadFonts() {
      V._probe = {};
      for (let t = 0; t < V.duration; t += 0.2) { try { V.render(t); } catch (e) { console.error(e); } }
      const jobs = [];
      for (const [f, set] of Object.entries(V._probe)) {
        const text = [...new Set([...set].join(''))].join('') + '0123456789';
        jobs.push(document.fonts.load(f, text).catch(() => {}));
      }
      V._probe = null;
      await Promise.all(jobs);
      await document.fonts.ready;
    }

    V.mount = async (el) => {
      canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      Object.assign(canvas.style, { width: '100vw', height: 'auto', display: 'block', background: '#000' });
      (el || document.body).appendChild(canvas);
      ctx = canvas.getContext('2d'); G = makeG(ctx);
      await preloadFonts();
      root.__canvas = canvas;
      root.__render = (t) => V.render(t);
      root.__meta = { width: W, height: H, fps: FPS, duration: V.duration, bpm: V.bpm };
      root.__cues = () => V.cues.slice().sort((a, b) => a.t - b.t);
      root.__music = () => V._music || null;
      root.__subs = () => V.subs.slice();
      const q = new URLSearchParams(location.search);
      if (q.has('t')) V.render(+q.get('t'));
      else if (!navigator.webdriver) { // 浏览器预览：实时播放
        const t0 = performance.now();
        const loop = () => { V.render(((performance.now() - t0) / 1000) % V.duration); requestAnimationFrame(loop); };
        loop();
      } else V.render(0);
      root.__ready = true;
    };

    // ---------- 通用组件（标题卡 / 声明卡 / 引用卡） ----------
    /** 慢推镜：以画面中心缓慢放大，静态卡片也有运动 */
    const push = (g, lt, rate = 0.006) => { const z = 1 + lt * rate; g.ctx.translate(W / 2, H / 2); g.ctx.scale(z, z); g.ctx.translate(-W / 2, -H / 2); };
    V.push = push;

    V.titleCard = (a, b, o) => V.scene(a, b, (g, lt, s) => {
      push(g, lt, 0.008);
      const k1 = prog(lt, 0.1, 1.0, E.out), k2 = prog(lt, 0.5, 1.6, E.out), k3 = prog(lt, 1.2, 2.2, E.out);
      g.spot(W / 2, H * 0.43, 620, 0.14);
      g.text(o.kicker || 'VIBE知识大赏', W / 2, 330 - (1 - k1) * 10, { size: 30, weight: 500, color: C.gold, alpha: k1 * 0.85, ls: 14 });
      g.line(W / 2 - 220 * k2, 380, W / 2 + 220 * k2, 380, { color: C.gold, alpha: 0.45, lw: 1.5 });
      const sc = lerp(1.06, 1, E.out(k2));
      g.ctx.save(); g.ctx.translate(W / 2, 470); g.ctx.scale(sc, sc);
      g.text(o.title, 0, 0, { size: o.size || 120, weight: 900, fam: 'serif', gradient: [C.goldHi, C.gold, '#8f7442'], alpha: k2, glow: 24, glowColor: 'rgba(201,169,106,.35)' });
      g.ctx.restore();
      if (o.subtitle) g.text(o.subtitle, W / 2, 590 + (1 - k3) * 8, { size: 40, weight: 500, color: C.text, alpha: k3 });
      if (o.en) g.text(o.en, W / 2, 648 + (1 - k3) * 8, { size: 30, weight: 400, fam: 'en', italic: true, color: C.dim, alpha: k3 });
    }, { fin: 0.3, fout: 0.7 });

    V.endCards = (a, o) => {
      const d1 = o.disclaimerDur || 6, d2 = o.citeDur || 8;
      V.scene(a, a + d1 + 0.5, (g, lt) => {
        push(g, lt, 0.006);
        const k = prog(lt, 0.2, 1.2, E.out);
        g.fillRR(W / 2 - 560, 300, 1120, 380, 18, 'rgba(20,20,46,.7)', { stroke: 'rgba(201,169,106,.35)', alpha: k, lw: 1.5 });
        g.text('声明 · DISCLAIMER', W / 2, 360, { size: 28, weight: 500, color: C.gold, alpha: k, ls: 8 });
        (o.disclaimer || []).forEach((ln, i) => {
          const kk = prog(lt, 0.6 + i * 0.35, 1.4 + i * 0.35, E.out);
          g.text(ln, W / 2, 440 + i * 58 + (1 - kk) * 8, { size: 32, weight: 500, color: C.text, alpha: kk * 0.92 });
        });
      });
      V.scene(a + d1 - 0.1, a + d1 + d2, (g, lt) => {
        push(g, lt, 0.006);
        const k = prog(lt, 0.1, 1.0, E.out);
        g.text('REFERENCES', W / 2, 220, { size: 26, weight: 500, color: C.gold, alpha: k * 0.8, ls: 10 });
        (o.cites || []).forEach((c, i) => {
          const kk = prog(lt, 0.4 + i * 0.4, 1.3 + i * 0.4, E.out);
          g.text(c, W / 2, 300 + i * 62 + (1 - kk) * 8, { size: 28, weight: 400, fam: 'en', italic: true, color: C.text, alpha: kk * 0.85 });
        });
        const k2 = prog(lt, 2.2, 3.2, E.out);
        if (o.question) g.text(o.question, W / 2, 640 + (1 - k2) * 10, { size: 54, weight: 900, fam: 'serif', color: C.goldHi, alpha: k2, glow: 16, glowColor: 'rgba(201,169,106,.3)' });
        if (o.credit) g.text(o.credit, W / 2, 730, { size: 28, weight: 500, color: C.dim, alpha: prog(lt, 3, 4) });
      });
      return a + d1 + d2;
    };

    return V;
  }

  root.Vibe = { create, C, FONT, E, clamp, lerp, prog, env, rng, hash };
})(typeof window !== 'undefined' ? window : globalThis);
