import { useCallback } from "react";
import { BrandCanvas, drawSubtitle, drawTitle } from "./BrandCanvas";
import { CX, CY, GOLD, PALE, PARTICLES, clamp, drawCore, drawFilm, easeInCubic, easeOutCubic, orbitPos, smooth } from "./centrifuge";

// 片尾：飞远的光点回到中心，所有光点收拢成一个点，熄灭；回到零
const TM = 1.6; // 光点归来的时刻
const TC = 4.6; // 收拢完成的时刻

const G = (t: number) => 0.25 * t + (t > TM ? 0.6 * Math.pow(t - TM, 2) : 0);

export const Outro: React.FC = () => {
  const draw = useCallback((ctx: CanvasRenderingContext2D, t: number, frame: number) => {
    const fadeIn = smooth(t / 0.6);
    const fadeOut = 1 - smooth((t - 7.3) / 0.7);

    const collapse = easeInCubic(clamp((t - TM) / (TC - TM)));
    const radiusScale = 1.15 * (1 - collapse);
    const ringAlpha = fadeIn * (0.38 + 0.62 * smooth((t - TM) / 1.5)) * (t < TC + 0.2 ? 1 : 0);

    // 中心：收拢时变亮，最后缩成一个点熄灭
    let coreI = 0.35 + 1.1 * smooth((t - TM) / (TC - TM));
    let coreR = 1;
    if (t > TC) {
      const k = clamp((t - TC) / 0.7);
      coreR = 1 - 0.95 * easeOutCubic(k);
      coreI = 1.45 * (1 - easeInCubic(k));
    }
    drawCore(ctx, fadeIn * coreI, coreR);

    ctx.globalCompositeOperation = "lighter";
    const m = 8, win = 0.12;
    PARTICLES.forEach((p) => {
      for (let j = 0; j < m; j++) {
        const t1 = t - (j * win) / m, t2 = t - ((j + 1) * win) / m;
        const rs1 = 1.15 * (1 - easeInCubic(clamp((t1 - TM) / (TC - TM))));
        const rs2 = 1.15 * (1 - easeInCubic(clamp((t2 - TM) / (TC - TM))));
        const a = orbitPos(p, p.th0 + p.k * G(Math.max(0, t1)), rs1);
        const b = orbitPos(p, p.th0 + p.k * G(Math.max(0, t2)), rs2);
        const bright = 0.45 + 0.55 * (a.depth + 1) / 2;
        const alpha = ringAlpha * bright * (1 - j / m) * (j === 0 ? 1 : 0.55);
        ctx.strokeStyle = `rgba(${GOLD}, ${alpha})`;
        ctx.lineWidth = p.size * (0.6 + 0.4 * (a.depth + 1) / 2) * (1 - j / (m * 1.4));
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    });
    void radiusScale;

    // 归来的光点：从右侧飞回中心
    if (t > 0.5 && t < TM + 0.3) {
      const k = clamp((t - 0.5) / (TM - 0.5));
      const e = easeOutCubic(k);
      const hx = 1980 - (1980 - CX) * e, hy = CY + 99 * (1 - e);
      const tailX = Math.min(1990, hx + 600 * (1 - e) + 60);
      const grad = ctx.createLinearGradient(tailX, hy, hx, hy);
      grad.addColorStop(0, `rgba(${GOLD}, 0)`);
      grad.addColorStop(1, `rgba(${PALE}, ${0.9 * (k < 1 ? 1 : 0)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tailX, hy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      if (k < 1) {
        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 24);
        hg.addColorStop(0, `rgba(${PALE}, 1)`);
        hg.addColorStop(1, `rgba(${GOLD}, 0)`);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hx, hy, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 熄灭前最后一闪
    if (t > TC + 0.55 && t < TC + 1.2) {
      const k = clamp((t - TC - 0.55) / 0.65);
      const r = 10 + 220 * easeOutCubic(k);
      ctx.strokeStyle = `rgba(${PALE}, ${0.4 * (1 - k)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(CX, CY, r, r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    // 标题在光点归来后散开、淡去
    const dis = clamp((t - TM) / 1.0);
    drawTitle(ctx, { x: CX, y: CY, reveal: 1.02, sweep: null, alpha: fadeIn * (1 - smooth(dis)), spacing: 64 + 80 * easeOutCubic(dis) });

    // 黑暗里留下口号
    // 收尾与片头最后一帧完全一致：金色「离心力」+ 口号，首尾呼应
    const endAlpha = smooth((t - 5.6) / 0.9) * fadeOut;
    drawTitle(ctx, { x: CX, y: CY, reveal: 1.02, sweep: null, alpha: endAlpha });
    drawSubtitle(ctx, "不知道，所以继续探索", CX, CY + 215, 68, smooth((t - 6.0) / 0.8) * fadeOut);

    drawFilm(ctx, frame);
  }, []);
  return <BrandCanvas draw={draw} />;
};
