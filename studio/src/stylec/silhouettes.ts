// Silhouettes for Style C. Each is SVG markup (white fill) in a 600×600 box, figure centred.
// The same markup is (a) rasterised and sampled into particle targets and (b) drawn as a glowing outline.

const g = (body: string) => `<g fill="#fff" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;

export const SIL: Record<string, string> = {
  human: g(`
    <circle cx="300" cy="110" r="52"/>
    <path d="M 300 168 C 250 168 228 190 224 240 L 214 380 C 212 398 236 402 240 384 L 254 280 L 258 420 L 252 560 C 252 580 282 580 284 560 L 296 430 L 304 430 L 316 560 C 318 580 348 580 348 560 L 342 420 L 346 280 L 360 384 C 364 402 388 398 386 380 L 376 240 C 372 190 350 168 300 168 Z"/>`),
  cell: g(`
    <circle cx="300" cy="300" r="150"/>
    ${Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      return `<line x1="${300 + Math.cos(a) * 150}" y1="${300 + Math.sin(a) * 150}" x2="${300 + Math.cos(a + 0.12) * 205}" y2="${300 + Math.sin(a + 0.12) * 205}" stroke-width="9"/>`;
    }).join("")}`),
  fish: g(`
    <path d="M 120 300 C 180 210 330 190 430 260 C 460 280 470 300 470 300 C 470 300 460 322 430 340 C 330 410 180 390 120 300 Z"/>
    <path d="M 140 300 L 60 230 L 80 300 L 60 370 Z"/>
    <path d="M 270 228 C 290 170 340 170 360 232 Z"/>
    <path d="M 290 370 C 300 410 330 420 350 372 Z"/>`),
  lizard: g(`
    <path d="M 140 310 C 200 270 330 268 420 290 C 470 300 520 300 545 318 C 520 336 470 336 430 334 C 330 352 210 350 140 330 C 100 340 60 360 30 400 C 70 340 100 318 140 310 Z"/>
    <path d="M 200 330 L 170 395 L 150 400" fill="none" stroke-width="18"/>
    <path d="M 245 334 L 270 395 L 292 402" fill="none" stroke-width="18"/>
    <path d="M 380 334 L 355 395 L 334 400" fill="none" stroke-width="18"/>
    <path d="M 420 330 L 448 392 L 470 398" fill="none" stroke-width="18"/>`),
  shrew: g(`
    <path d="M 160 330 C 160 250 260 220 350 236 C 400 245 430 262 460 280 L 530 300 L 462 318 C 440 360 380 380 300 380 C 220 380 160 370 160 330 Z"/>
    <circle cx="410" cy="246" r="26"/>
    <path d="M 170 340 C 120 340 80 320 50 280" fill="none" stroke-width="12"/>
    <path d="M 230 372 L 222 410 M 270 376 L 266 412 M 360 372 L 368 410 M 400 362 L 412 404" fill="none" stroke-width="16"/>`),
  ape: g(`
    <circle cx="372" cy="170" r="50"/>
    <path d="M 340 200 C 280 190 220 230 205 300 C 195 350 215 400 260 410 C 300 418 340 400 352 360 C 365 310 380 250 340 200 Z"/>
    <path d="M 330 230 C 360 300 372 380 380 470" fill="none" stroke-width="34"/>
    <path d="M 250 250 C 236 320 230 400 236 470" fill="none" stroke-width="30"/>
    <path d="M 240 400 L 222 540 M 320 400 L 338 540" fill="none" stroke-width="40"/>`),
  sauropod: g(`
    <ellipse cx="270" cy="330" rx="150" ry="78"/>
    <path d="M 130 330 C 60 340 20 380 0 420" fill="none" stroke-width="38"/>
    <path d="M 380 300 C 430 230 450 150 470 90" fill="none" stroke-width="40"/>
    <ellipse cx="482" cy="80" rx="40" ry="24"/>
    <rect x="160" y="370" width="38" height="120" rx="16"/><rect x="220" y="380" width="38" height="112" rx="16"/>
    <rect x="300" y="380" width="38" height="112" rx="16"/><rect x="350" y="370" width="38" height="120" rx="16"/>`),
  trex: g(`
    <path d="M 120 330 C 160 300 240 280 300 290 C 340 260 360 220 380 200 L 500 214 L 498 252 L 412 262 C 400 300 380 330 360 350 C 330 390 270 400 220 380 C 180 370 120 380 40 420 C 80 370 100 344 120 330 Z"/>
    <path d="M 360 300 L 390 325" fill="none" stroke-width="12"/>
    <rect x="236" y="370" width="36" height="140" rx="16"/><rect x="290" y="364" width="36" height="146" rx="16"/>`),
  egg: g(`<circle cx="300" cy="300" r="190"/>`),
};

/** Where each silhouette sits on screen (pixel centre + box size). */
export type Place = { cx: number; cy: number; size: number };
