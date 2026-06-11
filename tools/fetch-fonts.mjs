/**
 * Lädt die in styles/typography.css erwarteten Variable Fonts (latin-Subset)
 * von der Google-Fonts-API und legt sie unter assets/fonts/ ab (Self-Hosting,
 * kein Laufzeit-CDN). Einmalig ausführen: node tools/fetch-fonts.mjs
 * Lizenzen: Fraunces, Inter Tight, JetBrains Mono — alle SIL OFL.
 */
import fs from 'node:fs';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const OUT = path.join(import.meta.dirname, '..', 'assets', 'fonts');

async function cssText(family) {
  const r = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, {
    headers: { 'User-Agent': UA }
  });
  if (!r.ok) throw new Error(`CSS ${family}: HTTP ${r.status}`);
  return r.text();
}

function latinUrl(css, style = 'normal') {
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const [, subset, body] = m;
    if (subset !== 'latin') continue;
    if (!body.includes(`font-style: ${style}`)) continue;
    const u = body.match(/url\((https:[^)]+\.woff2)\)/);
    if (u) return u[1];
  }
  throw new Error(`latin/${style} nicht gefunden`);
}

async function download(url, filename) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Font ${filename}: HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, filename), buf);
  console.log(`→ assets/fonts/${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
}

const fraunces = await cssText('Fraunces:opsz,wght@9..144,100..900');
await download(latinUrl(fraunces), 'Fraunces[opsz,SOFT,WONK,wght].woff2');

const interTight = await cssText('Inter+Tight:ital,wght@0,100..900;1,100..900');
await download(latinUrl(interTight, 'normal'), 'InterTight[wght].woff2');
await download(latinUrl(interTight, 'italic'), 'InterTight-Italic[wght].woff2');

const jbMono = await cssText('JetBrains+Mono:wght@100..800');
await download(latinUrl(jbMono), 'JetBrainsMono[wght].woff2');

console.log('✓ Fonts geladen.');
