/**
 * Mobile-Audit — prüft alle Seiten bei 390×844 (iPhone-ähnlich) auf
 * horizontalen Overflow und macht Mobile-Screenshots.
 * Ausführen: node tools/mobile-audit.mjs  (Server auf :4242 muss laufen)
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const edge = EDGE_PATHS.find(p => fs.existsSync(p));
if (!edge) { console.error('Edge nicht gefunden'); process.exit(1); }

const OUT = path.join(process.env.TEMP || '/tmp', 'floppa-mobile');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['index', '/'],
  ['shop', '/shop.html'],
  ['auftragsdruck', '/auftragsdruck.html'],
  ['about', '/about.html'],
  ['kontakt', '/kontakt.html'],
  ['faq', '/faq.html'],
  ['material', '/material.html'],
  ['produkt', '/produkte/nordic-flow.html'],
  ['impressum', '/impressum.html'],
  ['journal', '/journal/index.html'],
];

const VW = 390;

// Erwartet eine bereits laufende Edge-Instanz:
// msedge --headless=new --remote-debugging-port=9223 --remote-allow-origins=* --user-data-dir=<tmp>
const PORT = 9223;
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${PORT}`, defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: VW, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
// Scroll-Reveals sofort sichtbar machen, sonst sind Fullpage-Screenshots
// unterhalb des Viewports leer (IntersectionObserver feuert dort nie)
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

for (const [name, url] of PAGES) {
  await page.goto('http://localhost:4242' + url, { waitUntil: 'networkidle0', timeout: 15000 });
  const report = await page.evaluate((vw) => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - vw;
    const offenders = [];
    if (overflow > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          // nur "äußerste" Übeltäter melden, keine Kinder von bereits gemeldeten
          if (!offenders.some(o => o.el.contains(el))) {
            offenders.push({ el, desc: `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} → left ${Math.round(r.left)}, right ${Math.round(r.right)}, w ${Math.round(r.width)}` });
          }
        }
      }
    }
    const grid = document.querySelector('.featured-strip__grid');
    const gridCols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : null;
    return {
      scrollWidth: doc.scrollWidth,
      overflow,
      offenders: offenders.slice(0, 8).map(o => o.desc),
      featuredCols: gridCols,
    };
  }, VW);
  console.log(`\n── ${name} (${url})`);
  console.log(`   scrollWidth ${report.scrollWidth}px (Overflow: ${report.overflow > 1 ? '⚠ +' + report.overflow + 'px' : 'OK'})`);
  if (report.featuredCols) console.log(`   .featured-strip__grid: ${report.featuredCols} Spalten`);
  for (const o of report.offenders) console.log('   ⚠ ' + o);
  await page.screenshot({ path: path.join(OUT, `p-${name}.png`), fullPage: true });
}

await browser.disconnect();
console.log('\nScreenshots: ' + OUT);
