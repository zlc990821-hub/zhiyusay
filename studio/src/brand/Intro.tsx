import { useCallback } from "react";
import { BrandCanvas, drawSubtitle, drawTitle } from "./BrandCanvas";
import { CX, CY, GOLD, PALE, PARTICLES, W, H, clamp, drawCore, drawFilm, easeOutCubic, orbitPos, smooth } from "./centrifuge";

const TE = 4.2; // 挣脱的时刻
const ESC = 7; // 挣脱的那一颗

// 角度累积：先越转越快，挣脱后逐渐放缓
const F = (t: number) => {
  if (t <= TE) return 0.35 * t + 0.09 * t * t * t;
  const fte = 0.35 * TE + 0.09 * TE * TE * TE;
  const tau = t - TE;
  return fte + 0.25 * tau + (5.1 / 1.6) * (1 - Math.exp(-1.6 * tau));
};

const particles = PARTICLES.map((p, i) => (i === ESC ? { ...p, r: 420, k: 1, size: 4.5, th0: Math.PI / 2 - F(TE) } : p));

export const Intro: React.FC = () => {
  const draw = useCallback((ctx: CanvasRenderingContext2D, t: number, frame: number) => {
    const tau = t - TE;
    const fadeIn = smooth(t / 0.8);
    const fadeOut = 1 - smooth((t - 7.4) / 0.6);
    const master = fadeIn * fadeOut;

    // 挣脱瞬间的轻微震动
    const shake = tau > 0 ? Math.sin(tau * 90) * 10 * Math.exp(-7 * tau) : 0;
    ctx.save();
    ctx.translate(shake, shake * 0.4);

    const ringAlpha = master * (1 - 0.62 * smooth((t - 5.0) / 1.5));
    const radiusScale = 1 + 0.15 * easeOutCubic(tau / 1.5) * (tau > 0 ? 1 : 0);
    const coreI = master * (t < TE ? 0.25 + 0.75 * smooth(t / 4) : 0.35 + 1.3 * Math.exp(-2.2 * tau));
    drawCore(ctx, coreI, t < TE ? 1 : 1 + 0.6 * Math.exp(-3 * tau));

    // 轨道粒子与拖尾
    ctx.globalCompositeOperation = "lighter";
    const m = 8, win = 0.12;
    particles.forEach((p, i) => {
      if (i === ESC && t > TE) return;
      for (let j = 0; j < m; j++) {
        const t1 = t - (j * win) / m, t2 = t - ((j + 1) * win) / m;
        const a = orbitPos(p, p.th0 + p.k * F(Math.max(0, t1)), radiusScale);
        const b = orbitPos(p, p.th0 + p.k * F(Math.max(0, t2)), radiusScale);
        const bright = 0.45 + 0.55 * (a.depth + 1) / 2;
        const alpha = ringAlpha * bright * (1 - j / m) * (j === 0 ? 1 : 0.55);
        ctx.strokeStyle = `rgba(${i === ESC ? PALE : GOLD}, ${alpha})`;
        ctx.lineWidth = p.size * (0.6 + 0.4 * (a.depth + 1) / 2) * (1 - j / (m * 1.4));
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    });

    // 挣脱的光点：沿切线向左飞出，留下长长的光迹
    if (tau > 0) {
      const s = orbitPos(particles[ESC], Math.PI / 2, 1);
      const dx = 220 * tau + 4300 * tau * tau * tau; // 先悬停，再猛地甩出
      const hx = s.x - dx, hy = s.y - 40 * tau * tau;
      const fade = clamp(1 - (tau - 0.5) / 1.2);
      const grad = ctx.createLinearGradient(s.x, s.y, hx, hy);
      grad.addColorStop(0, `rgba(${GOLD}, 0)`);
      grad.addColorStop(1, `rgba(${PALE}, ${0.95 * fade * master})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 6;
      ctx.shadowColor = `rgba(${GOLD}, 1)`;
      ctx.shadowBlur = 34;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // 光点本身
      if (hx > -40) {
        const hr = 46 + 30 * Math.exp(-6 * tau);
        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        hg.addColorStop(0, `rgba(255,255,255, ${master})`);
        hg.addColorStop(0.25, `rgba(${PALE}, ${0.9 * master})`);
        hg.addColorStop(1, `rgba(${GOLD}, 0)`);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
      }
      // 冲击波
      const wave = clamp(tau / 0.9);
      if (wave < 1) {
        ctx.strokeStyle = `rgba(${GOLD}, ${0.35 * (1 - wave) * master})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(CX, CY, 60 + 700 * easeOutCubic(wave), (60 + 700 * easeOutCubic(wave)) * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";

    // 标题：光带扫过，字随之显现
    const rev = clamp((t - 5.0) / 1.0);
    drawTitle(ctx, { x: CX, y: CY, reveal: smooth(rev) * 1.02, sweep: rev < 1 ? smooth(rev) : null, alpha: master });
    // 口号
    drawSubtitle(ctx, "不知道，所以继续探索", CX, CY + 215, 68, master * smooth((t - 6.3) / 0.7));
    ctx.restore();

    drawFilm(ctx, frame);
  }, []);
  return <BrandCanvas draw={draw} />;
};
