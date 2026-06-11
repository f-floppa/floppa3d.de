# Projekt-Audit — floppa3d.de

Stand: 2026-06-11 · Branch `feat/website-upgrade`

## (a) Dateibaum Seiten & Assets

```
QUELLEN (hier wird editiert)
├── pages/                  Seiten-Bodys: index, shop, about, faq, kontakt,
│                           impressum, datenschutz, agb, 404
├── templates/
│   ├── _layout.html        Globales HTML-Gerüst (head, Theme-Script, Slots)
│   └── product.html        Produktseiten-Template
├── data/products.json      6 Produkte: Texte, Preise, Farben, Bilder, etsyUrl
├── styles/                 reset → variables → typography → layout → components (via main.css)
├── scripts/                main.js (Nav, Reveals, Galerie, Shop-Filter), theme.js, shop-filter.js
├── build.js                Builder (nur Node-Builtins)
└── server.js               Lokaler Dev-Server

GENERIERT (nie von Hand editieren)
├── index|shop|about|faq|kontakt|impressum|datenschutz|agb|404 .html
├── produkte/<slug>.html    6 Produktseiten
├── sitemap.xml, robots.txt
```

Produkt-Slugs: `nordic-flow`, `stack-pot`, `leaf-dock`, `luma-arch`, `cozy-bunny`, `orbit-key-tray`.

## (b) Deploy & Build

- **Deploy:** GitHub Pages, legacy build (kein GitHub-Action-Workflow, `.github/` existiert nicht), Branch `main`, Pfad `/`. Custom Domain `floppa3d.de` (CNAME), `.nojekyll` vorhanden, HTTPS erzwungen.
- **Build:** `node build.js` — liest `data/products.json`, `templates/`, `pages/`; schreibt Root-HTML, `produkte/*.html`, `sitemap.xml`, `robots.txt`. Generierter Output wird mitcommittet und direkt von Pages serviert.
- Node v24.14.1 / npm 11.11.0 lokal verfügbar.

## (c) Bilddateien (Größen in KB)

| Datei | KB |
|---|---|
| assets/categories/category-blumen.png | 1930 |
| assets/categories/category-deko.png | 1797 |
| assets/categories/category-organisation.png | 1773 |
| assets/hero/hero-filament.png | 1856 |
| assets/team/founders.png | 2065 |
| assets/products/&lt;slug&gt;/01–04.png (24 Dateien) | je ~375–520 |
| assets/products/&lt;slug&gt;/05.png (6 Dateien) | je ~1820–2270 |
| assets/logos/full-*.png (5) | je ~36–61 |
| assets/logos/mark-*.png (4) | je ~5–6 |
| assets/logos/mark.svg | 1,4 |

**Summe Produkt-/Content-Bilder: ~28 MB PNG, keine WebP-Versionen.** Größter Hebel für Performance.

## (d) CSS-/JS-Dateien

| Datei | KB | Zweck |
|---|---|---|
| styles/components.css | 41,7 | Komponenten (Header, Cards, Galerie, Hero, …) |
| styles/typography.css | 5,0 | @font-face + Typo-Skala |
| styles/main.css | 4,4 | Entry, Imports, Basis, View-Transition-Root |
| styles/layout.css | 3,7 | Layout-Utilities |
| styles/variables.css | 3,6 | Design-Tokens (Akzent: `#00875A` hell / `#26B99F` dunkel) |
| styles/reset.css | 1,9 | Reset |
| scripts/main.js | 6,2 | Nav, Smooth-Scroll, Reveal-Observer, Galerie, Shop-Filter |
| scripts/shop-filter.js | 4,3 | (separat, Filter-Logik) |
| scripts/theme.js | 3,6 | Theme-Toggle + localStorage `floppa3d-theme` |

## Weitere Befunde

1. **`assets/fonts/` ist leer** — `typography.css` deklariert Fraunces / Inter Tight / JetBrains Mono als self-hosted Variable Fonts, die Dateien fehlen aber. Die Site rendert derzeit komplett mit System-Fallbacks.
2. `@view-transition { navigation: auto; }` ist in `main.css` bereits global aktiv — für P5-T1 fehlen nur die `view-transition-name`s pro Produkt.
3. Scroll-Reveals existieren bereits als IntersectionObserver-System (`.reveal` + `.is-visible` in `scripts/main.js`) inkl. Reduced-Motion-Behandlung — wird wiederverwendet, kein zweites System.
4. Kein `site.webmanifest`, kein `apple-touch-icon` (nur SVG-Favicon + PNG-Fallback).
5. Title-Muster `{{title}} | Floppa3D` im Layout erzeugt auf der Startseite `Floppa3D | Floppa3D`.
6. Etsy-Platzhalter: `etsyUrl` aller 6 Produkte = `…?listing=PLATZHALTER`; Footer-Etsy-Link in `build.js` fest verdrahtet.

## Baseline (P0-T2)

Lighthouse/Audit-Tool in dieser Umgebung nicht verfügbar — Baseline aus statischer Analyse: ~28 MB unkomprimierte PNGs ohne `<picture>`/WebP sind der dominante Performance-Faktor; CSS/JS sind klein und unkritisch.
