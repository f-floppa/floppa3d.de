/**
 * Erzeugt zu jeder PNG unter assets/ eine WebP-Version (Qualität 82).
 * Ausführen: npm i sharp --no-save && node tools/optimize-images.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

async function walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) await walk(p);
    else if (extname(p).toLowerCase() === '.png') {
      const out = p.replace(/\.png$/i, '.webp');
      await sharp(p).webp({ quality: 82 }).toFile(out);
      console.log('→', out);
    }
  }
}
await walk('assets');
