/**
 * Erzeugt die OG-Share-Card der Startseite (1200×630) im Layer-Line-Look
 * sowie Touch-Icons (180/192/512) aus dem Logo-Mark.
 * Ausführen: npm i sharp --no-save && node tools/make-og.mjs
 * Farben aus styles/variables.css (Dark-Theme): bg #16181D, Akzent #26B99F.
 */
import sharp from 'sharp';
import fs from 'node:fs';

const BG = '#16181D';
const ACCENT = '#26B99F';
const FG = '#E8ECF0';
const MUTED = '#8A909A';

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BG}"/>
  ${[0, 1, 2, 3, 4].map(i =>
    `<rect x="64" y="${418 + i * 30}" width="${380 - i * 48}" height="12" rx="6" fill="${ACCENT}" opacity="${0.95 - i * 0.16}"/>`
  ).join('')}
  <text x="64" y="210" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="700" fill="${FG}">Floppa3D</text>
  <text x="64" y="285" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="${MUTED}">3D-gedruckte Pflanztöpfe &amp; Deko · Made in Bavaria</text>
  <text x="64" y="340" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${ACCENT}">floppa3d.de</text>
</svg>`;

fs.mkdirSync('assets/og', { recursive: true });
await sharp(Buffer.from(svg)).png().toFile('assets/og/home.png');
console.log('→ assets/og/home.png');

// Touch-Icons aus dem SVG-Mark, quadratisch auf Brand-Hintergrund gesetzt
const markSvg = fs.readFileSync('assets/logos/mark.svg');
async function icon(size, out, bg) {
  const inner = Math.round(size * 0.62);
  const mark = await sharp(markSvg, { density: 300 })
    .resize(inner, inner, { fit: 'inside' })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(out);
  console.log('→', out);
}

await icon(180, 'assets/logos/apple-touch-icon.png', '#F5F1EA');
await icon(192, 'assets/logos/icon-192.png', '#F5F1EA');
await icon(512, 'assets/logos/icon-512.png', '#F5F1EA');
console.log('✓ OG-Card + Icons erzeugt.');
