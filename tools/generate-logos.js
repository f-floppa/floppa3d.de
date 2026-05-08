/**
 * Logo-Generator für Floppa3D
 * Schreibt nach ../assets/logos/ mit dem aktuellen Namensschema.
 * Ausführen: cd tools && node generate-logos.js
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'logos');

const S = 4;
const LAYER_H = 7;
const RHYTHM = 11;
function ly(i) { return i * RHYTHM; }

const SPINE_W = 14; // F und 3 spine beide gleich breit

function drawF(ctx, ox, oy, color, s) {
  ctx.fillStyle = color;
  ctx.fillRect(ox, oy + ly(0)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(1)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(2)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(3)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(4)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(5)*s, 58*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(6)*s, 58*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(7)*s,  SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(8)*s,  SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(9)*s,  SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(10)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(11)*s, SPINE_W*s, LAYER_H*s);
}

function drawThree(ctx, ox, oy, color, s) {
  ctx.fillStyle = color;
  const rx = ox + (80 - SPINE_W) * s; // right spine
  ctx.fillRect(ox, oy + ly(0)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(1)*s, 80*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(2)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(3)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(4)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(5)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(6)*s, 80*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(7)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(8)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(9)*s, SPINE_W*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(10)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(11)*s, 80*s, LAYER_H*s);
}

const PAD = 36;
const MARK_W = 168;
const MARK_H = 128;

function drawWithText(opts) {
  const W = 580, H = 200;
  const canvas = createCanvas(W * S, H * S);
  const ctx = canvas.getContext('2d');

  if (opts.bg) {
    if (opts.bg === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, W * S, H * S);
      grad.addColorStop(0, '#121820');
      grad.addColorStop(1, '#1a2332');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = opts.bg;
    }
    ctx.fillRect(0, 0, W * S, H * S);
  }

  const markX = PAD * S;
  const markY = ((H - MARK_H) / 2) * S;

  drawF(ctx, markX, markY, opts.colorF, S);
  drawThree(ctx, markX + 88 * S, markY, opts.colorThree, S);

  const divX = markX + MARK_W * S + 20 * S;
  const divH = 90 * S;
  const divY = ((H - 90) / 2) * S;
  ctx.fillStyle = opts.dividerColor;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(divX, divY, 1 * S, divH);
  ctx.globalAlpha = 1;

  const textX = divX + 20 * S;
  const centerY = (H / 2) * S;
  ctx.font = `900 ${40 * S}px Arial`;

  const parts = [
    { text: 'F',     color: opts.colorF },
    { text: 'loppa', color: opts.wordColor },
    { text: '3',     color: opts.colorThree },
    { text: 'D',     color: opts.wordColor },
  ];

  let cx = textX;
  for (const p of parts) {
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, cx, centerY - 4 * S);
    cx += ctx.measureText(p.text).width;
  }

  ctx.font = `600 ${9 * S}px Arial`;
  ctx.fillStyle = opts.taglineColor;
  ctx.fillText('PROFESSIONAL PRINT STUDIO', textX, centerY + 24 * S);

  return canvas;
}

function drawIconOnly(opts) {
  const size = MARK_W + PAD * 2;
  const canvas = createCanvas(size * S, size * S);
  const ctx = canvas.getContext('2d');
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, size * S, size * S);
  }
  const ox = PAD * S;
  const oy = ((size - MARK_H) / 2) * S;
  drawF(ctx, ox, oy, opts.colorF, S);
  drawThree(ctx, ox + 88 * S, oy, opts.colorThree, S);
  return canvas;
}

const out = (name, canvas) => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), canvas.toBuffer('image/png'));
  console.log('Saved: assets/logos/' + name);
};

// Full logo on dark
out('full-on-dark.png', drawWithText({
  bg: '#0a0e12', colorF: '#00875A', colorThree: '#26B99F',
  dividerColor: '#4a5a6a', wordColor: '#ffffff', taglineColor: '#5A7068',
}));

// Full logo on standard
out('full-on-standard.png', drawWithText({
  bg: '#121820', colorF: '#00875A', colorThree: '#26B99F',
  dividerColor: '#4a5a6a', wordColor: '#ffffff', taglineColor: '#5A7068',
}));

// Full logo on gradient
out('full-on-gradient.png', drawWithText({
  bg: 'gradient', colorF: '#00875A', colorThree: '#26B99F',
  dividerColor: '#4a5a6a', wordColor: '#ffffff', taglineColor: '#5A7068',
}));

// Full logo on light
out('full-on-light.png', drawWithText({
  bg: '#f5f5f5', colorF: '#00875A', colorThree: '#26B99F',
  dividerColor: '#999999', wordColor: '#121820', taglineColor: '#666666',
}));

// Mark only on dark
out('mark-on-dark.png', drawIconOnly({
  bg: '#0a0e12', colorF: '#00875A', colorThree: '#26B99F',
}));

// Mark only on standard
out('mark-on-standard.png', drawIconOnly({
  bg: '#121820', colorF: '#00875A', colorThree: '#26B99F',
}));

// Mark only on light
out('mark-on-light.png', drawIconOnly({
  bg: '#f5f5f5', colorF: '#00875A', colorThree: '#26B99F',
}));

console.log('\nAll 7 logos generated. (full-transparent.png separat via gen-transparent.js)');
