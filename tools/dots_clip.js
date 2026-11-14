// 生成“光点方阵”数据镜头：N 颗金色光点逐个亮起 → 逐条核对 → 大部分化成尘埃散去 → 剩下几颗。
// 黑底金色粒子风格，竖屏 1080x1920，30 帧，无文字（字幕在剪映里加）。
//
// 用法：node tools/dots_clip.js <输出.mp4> [留下的光点数=9] [帧目录]
// 例子：node tools/dots_clip.js "episodes/01-焦虑-素材/S2-担心核对.mp4" 9
//
// 依赖：playwright（环境自带）、ffmpeg。
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const OUT = process.argv[2] || 'dots.mp4';
const KEEP = parseInt(process.argv[3] || '9', 10);
const FRAME_DIR = process.argv[4] || fs.mkdtempSync(path.join(os.tmpdir(), 'dots-'));
const FPS = 30, DURATION = 15, W = 1080, H = 1920;

const html = `<!doctype html><html><body style="margin:0;background:#000">
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W},H=${H},KEEP=${KEEP},COLS=10,ROWS=10,N=100;
const ctx=document.getElementById('c').getContext('2d');
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng(20261114);
// 背景星尘
const stars=[];for(let i=0;i<340;i++)stars.push({x:R()*W,y:R()*H,r:0.5+R()*1.3,a:0.06+R()*0.30,p:R()*6.28,s:0.3+R()*0.9});
// 方阵：放在画面中上部，下方三分之一留给字幕
const GAP=90,X0=(W-(COLS-1)*GAP)/2,Y0=800-(ROWS-1)*GAP/2;
// 留下的光点：分散挑选，避免挤在一起
const order=[...Array(N).keys()];
for(let i=N-1;i>0;i--){const j=Math.floor(R()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
const keep=new Set();
for(const k of order){ if(keep.size>=KEEP)break;
  const r=Math.floor(k/COLS),c=k%COLS;let ok=true;
  for(const q of keep){const qr=Math.floor(q/COLS),qc=q%COLS;if(Math.abs(qr-r)<=1&&Math.abs(qc-c)<=1){ok=false;break}}
  if(ok)keep.add(k)}
for(const k of order){if(keep.size>=KEEP)break;keep.add(k)}
// 四个阶段的时间点（秒）
const T_APPEAR=0.3, APPEAR_STEP=0.033;   // 0.3–3.6  逐个亮起（写下每一个担心）
const T_SCAN=4.3,  SCAN_STEP=0.036;      // 4.3–7.9  逐条核对
const T_FADE=8.7,  FADE_SPAN=2.2;        // 8.7–11.8 化成尘埃
const dots=[];
for(let k=0;k<N;k++){const r=Math.floor(k/COLS),c=k%COLS;
  const d={k,x:X0+c*GAP,y:Y0+r*GAP,ph:R()*6.28,keep:keep.has(k),tf:T_FADE+R()*FADE_SPAN,parts:[]};
  if(!d.keep)for(let i=0;i<14;i++)d.parts.push({ang:R()*6.28,sp:8+R()*34,vy:-(30+R()*120),r:0.8+R()*1.9,life:0.9+R()*1.1,dl:R()*0.35});
  dots.push(d)}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>t*t*(3-2*t);
function glow(x,y,rad,a,hot){ if(a<=0.002)return;
  const g=ctx.createRadialGradient(x,y,0,x,y,rad);
  const core=hot?'255,246,222':'255,232,170';
  g.addColorStop(0,'rgba('+core+','+a+')');
  g.addColorStop(0.16,'rgba(244,198,104,'+a*0.85+')');
  g.addColorStop(0.42,'rgba(196,138,44,'+a*0.22+')');
  g.addColorStop(1,'rgba(150,96,20,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rad,0,6.2832);ctx.fill()}
window.draw=function(t){
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  // 中心极淡的暖色雾，避免死黑
  const bg=ctx.createRadialGradient(W/2,820,0,W/2,820,1100);
  bg.addColorStop(0,'rgba(34,24,8,0.55)');bg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  for(const s of stars){const a=s.a*(0.6+0.4*Math.sin(t*s.s+s.p));
    ctx.fillStyle='rgba(226,196,138,'+a+')';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.2832);ctx.fill()}
  // 整体极慢推近
  const z=1+0.03*(t/${DURATION});
  ctx.save();ctx.translate(W/2,800);ctx.scale(z,z);ctx.translate(-W/2,-800);
  for(const d of dots){
    const ta=T_APPEAR+d.k*APPEAR_STEP, a0=clamp((t-ta)/0.4,0,1);
    if(a0<=0)continue;
    const pop=a0<1?1+0.55*Math.sin(a0*Math.PI):1;          // 亮起时的一下膨胀
    const tw=0.86+0.14*Math.sin(t*1.7+d.ph);                // 呼吸闪烁
    const ts=T_SCAN+d.k*SCAN_STEP, sc=clamp(1-Math.abs(t-ts)/0.13,0,1); // 核对扫过
    let alive=1, f=0;
    if(!d.keep){f=clamp((t-d.tf)/0.8,0,1);alive=1-ease(f)}
    const endBoost=d.keep?1+0.35*ease(clamp((t-11.2)/1.6,0,1)):1;       // 剩下的更亮
    const a=ease(a0)*tw*alive;
    glow(d.x,d.y,(37+20*sc)*pop*endBoost,clamp(a*(0.92+0.5*sc)*endBoost,0,1),sc>0.3||endBoost>1.15);
    if(sc>0){ctx.strokeStyle='rgba(255,236,190,'+0.55*sc+')';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(d.x,d.y,18+18*(1-sc),0,6.2832);ctx.stroke()}
    if(!d.keep&&f>0){
      // 留一个极淡的影子，表示“这里曾经有一个担心”
      ctx.strokeStyle='rgba(206,160,84,'+0.16*ease(f)+')';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(d.x,d.y,8,0,6.2832);ctx.stroke();
      for(const p of d.parts){const lt=(t-d.tf-p.dl)/p.life;if(lt<=0||lt>=1)continue;
        const e=1-Math.pow(1-lt,2);
        const px=d.x+Math.cos(p.ang)*p.sp*e+Math.sin(lt*5+p.ang)*5, py=d.y+Math.sin(p.ang)*p.sp*e*0.5+p.vy*lt*p.life;
        ctx.fillStyle='rgba(248,214,138,'+0.85*(1-lt)*(1-lt)+')';
        ctx.beginPath();ctx.arc(px,py,p.r*(1-0.5*lt),0,6.2832);ctx.fill()}
    }
  }
  ctx.restore();
};
</script></body></html>`;

(async () => {
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html);
  const total = FPS * DURATION;
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.draw(t), i / FPS);
    await page.screenshot({ path: path.join(FRAME_DIR, `f_${String(i).padStart(4, '0')}.png`) });
    if (i % 90 === 0) console.log(`frame ${i}/${total}`);
  }
  await browser.close();
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  // 加一点极轻的静态颗粒，避免暗部渐变出现色带（不要用随帧变化的噪点，文件会大上百倍）
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAME_DIR, 'f_%04d.png'),
    '-vf', 'noise=alls=4:allf=u,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  console.log('written', OUT, 'frames in', FRAME_DIR);
})();
