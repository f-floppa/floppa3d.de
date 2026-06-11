/**
 * Selbsttest über den generierten Output:
 *  1. keine unersetzten {{Platzhalter}} im HTML
 *  2. keine TMG/TTDSG-Reste, kein PLATZHALTER
 *  3. alle internen Links/Bilder/Skripte zeigen auf existierende Dateien
 *  4. keine externen Ressourcen-Loads (src/href auf fremde Domains),
 *     erlaubt: Formspree-Action (Formular-POST), reine Text-Links
 * Ausführen: node tools/selftest.mjs  (Exit-Code 1 bei Fehlern)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const htmlFiles = [];

function collect(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'pages', 'templates', 'docs'].includes(name)) continue;
    const p = path.join(dir, name);
    if (name.startsWith('Gesellschaftsvertrag')) continue; // privat, gitignored
    if (fs.statSync(p).isDirectory()) collect(p);
    else if (p.endsWith('.html')) htmlFiles.push(p);
  }
}
collect(ROOT);

const errors = [];

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  // HTML-Kommentare ausblenden (z. B. vorbereiteter, inaktiver Analytics-Block)
  const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

  // 1) unersetzte Template-Platzhalter
  const leftover = html.match(/\{\{\w+\}\}/g);
  if (leftover) errors.push(`${rel}: unersetzte Platzhalter ${[...new Set(leftover)].join(', ')}`);

  // 2) Rechts-/Platzhalter-Reste
  if (/TMG|TTDSG/.test(html)) errors.push(`${rel}: TMG/TTDSG-Rest gefunden`);
  if (/PLATZHALTER/.test(html)) errors.push(`${rel}: PLATZHALTER gefunden`);

  // 3) interne Verweise prüfen (href/src/srcset/poster, nur lokale Pfade)
  const refs = [...html.matchAll(/(?:href|src|poster)="(\/[^"#?]+)[^"]*"/g)].map(m => m[1])
    .concat([...html.matchAll(/srcset="(\/[^"\s]+)/g)].map(m => m[1]));
  for (const ref of new Set(refs)) {
    if (ref === '/') continue;
    if (ref.startsWith('/assets/models/') || ref.startsWith('/assets/video/')) continue; // optionale Runtime-Dateien
    const target = path.join(ROOT, decodeURIComponent(ref));
    if (!fs.existsSync(target)) errors.push(`${rel}: toter Verweis ${ref}`);
  }

  // 4) externe Ressourcen-Loads (Links <a href> sind ok, src/Stylesheets nicht)
  const extLoads = [...html.matchAll(/<(?:script|img|link|iframe|video|source)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)]
    .map(m => m[1])
    .filter(u => !u.startsWith('https://floppa3d.de'));
  for (const u of extLoads) errors.push(`${rel}: externer Ressourcen-Load ${u}`);
}

if (errors.length) {
  console.error(`✗ Selbsttest fehlgeschlagen (${errors.length}):`);
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
}
console.log(`✓ Selbsttest OK — ${htmlFiles.length} HTML-Dateien geprüft (Links, Platzhalter, externe Loads).`);
