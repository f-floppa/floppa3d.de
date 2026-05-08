/**
 * Transparentes Logo (für E-Mail / hellen Hintergrund) — Floppa3D
 * Schreibt nach ../assets/logos/full-transparent.png
 * Ausführen: cd tools && node gen-transparent.js
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT_PATH = path.join(__dirname, '..', 'assets', 'logos', 'full-transparent.png');

const S = 4;
const LAYER_H = 7;
const RHYTHM = 11;
function ly(i) { return i * RHYTHM; }

function drawF(ctx, ox, oy, color, s) {
  ctx.fillStyle = color;
  ctx.fillRect(ox, oy + ly(0)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(1)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(2)*s, 14*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(3)*s, 14*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(4)*s, 14*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(5)*s, 58*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(6)*s, 58*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(7)*s,  14*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(8)*s,  14*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(9)*s,  14*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(10)*s, 14*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(11)*s, 14*s, LAYER_H*s);
}

function drawThree(ctx, ox, oy, color, s) {
  ctx.fillStyle = color;
  const rx = ox + 73*s;
  ctx.fillRect(ox, oy + ly(0)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(1)*s, 80*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(2)*s, 7*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(3)*s, 7*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(4)*s, 7*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(5)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(6)*s, 80*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(7)*s, 7*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(8)*s, 7*s, LAYER_H*s);
  ctx.fillRect(rx, oy + ly(9)*s, 7*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(10)*s, 80*s, LAYER_H*s);
  ctx.fillRect(ox, oy + ly(11)*s, 80*s, LAYER_H*s);
}

const PAD = 36;
const MARK_W = 168;
const MARK_H = 128;
const W = 580;
const H = 200;

const canvas = createCanvas(W * S, H * S);
const ctx = canvas.getContext('2d');
// transparent — no fill

const markX = PAD * S;
const markY = ((H - MARK_H) / 2) * S;

drawF(ctx, markX, markY, '#00875A', S);
drawThree(ctx, markX + 88 * S, markY, '#26B99F', S);

const divX = markX + MARK_W * S + 20 * S;
const divH = 90 * S;
const divY = ((H - 90) / 2) * S;
ctx.fillStyle = '#4a5a6a';
ctx.globalAlpha = 0.6;
ctx.fillRect(divX, divY, 1 * S, divH);
ctx.globalAlpha = 1;

const textX = divX + 20 * S;
const centerY = (H / 2) * S;
const fontSize = 40 * S;
ctx.font = `900 ${fontSize}px Arial`;

const parts = [
  { text: 'F',     color: '#00875A' },
  { text: 'loppa', color: '#121820' },
  { text: '3',     color: '#26B99F' },
  { text: 'D',     color: '#121820' },
];

let cx = textX;
for (const p of parts) {
  ctx.fillStyle = p.color;
  ctx.fillText(p.text, cx, centerY - 4 * S);
  cx += ctx.measureText(p.text).width;
}

ctx.font = `600 ${9 * S}px Arial`;
ctx.fillStyle = '#666666';
ctx.fillText('PROFESSIONAL PRINT STUDIO', textX, centerY + 24 * S);

const outDir = path.dirname(OUT_PATH);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(OUT_PATH, canvas.toBuffer('image/png'));
console.log('Saved: assets/logos/full-transparent.png');
