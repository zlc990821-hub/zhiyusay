/* {{TITLE}} — Vibe知识大赏 */
const V = Vibe.create({ duration: 130, watermark: '@zhiyusay', bpm: 77, seed: 1 });
const { C, E, prog, env, clamp, lerp, rng } = Vibe;
const W = V.W, H = V.H;

V.music({
  prog: ['Am', 'F', 'C', 'G'],
  sections: [[0, 12, 'pad'], [12, 18, 'pad+bell'], [18, 50, 'pad+piano'], [50, 90, 'pad+piano+bass+kick+shaker'],
    [90, 104, 'pad+arp+bass+kick'], [104, 116, 'pad+piano+bell'], [116, 999, 'pad']],
});

/* ① 冷开场钩子 0–12 */
V.scene(0, 12.4, (g, lt) => {
  g.spot(W / 2, 460, 600, 0.1);
  const k = prog(lt, 0.5, 2.0, E.out);
  g.text('?', W / 2, 460 - (1 - k) * 20, { size: 220, weight: 900, fam: 'serif', color: C.goldHi, alpha: k, glow: 30 });
}, { fin: 0.01 });
V.subs_seq(0.6, [
  [3.0, '钩子第一句：抛出问题', 'Hook line one.'],
  [3.0, '直觉的答案是……', 'Intuition says…'],
  [3.2, '可真实世界不这么想', 'Reality disagrees.'],
]);
V.cue(0.1, 'swell', 0.8).cue(8.0, 'chime', 0.8);

/* 标题卡 */
// 标题卡起点会被 V.sync() 吸到第一个 drop（bgm.py use --hit 12.4 已让 drop 落在 12.4s 附近）
V.titleCard(12.2, 18.4, { title: '{{TITLE}}', subtitle: '一句话副标题', en: 'English Title' });
V.cue(12.2, 'reverse', { dur: 1.5, align: 'end' }).cue(12.2, 'impact').cue(12.2, 'boom', 0.6);

/* ② 历史锚点 18–50 */
V.label(18.4, 50, '年份 · 地点 · 事件');

/* ③ 机制模拟 50–90 */

/* ④ 反直觉转折 90–104 */

/* ⑤ 现实落点 + 金句 104–116 */

/* ⑥ 声明与引用 116–130 */
V.endCards(116, {
  disclaimer: ['本片为科普演示，部分图表为示意', '第二条声明', '第三条声明'],
  cites: ['Author, A. (Year). Title. Journal, Vol(No), pages.'],
  question: '互动问题？',
  credit: '@zhiyusay 出品 · 动画由代码生成',
});

// 卡点：场景起点吸附到 drop / 小节头 / 拍（必须放在最后、mount 之前）
V.sync();
V.mount();
