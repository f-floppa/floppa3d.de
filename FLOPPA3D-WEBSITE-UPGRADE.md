# FLOPPA3D WEBSITE-UPGRADE — Arbeitsanweisung für Claude Code

> **Dieses Dokument ist dein kompletter Auftrag.** Lies es einmal ganz durch.
> Lege dann eine Todo-Liste mit ALLEN Task-IDs an (P0-T1 bis P7-T7 plus ABSCHLUSS)
> und arbeite sie strikt in Reihenfolge ab. Für jeden Task gilt derselbe Loop:
> **umsetzen → AKZEPTANZ prüfen → mit vorgegebener Message committen → nächster Task.**

---

## R) Eiserne Regeln — gelten bei JEDEM Task

- **R1 Branch:** Arbeite ausschließlich auf dem Branch `feat/website-upgrade` (existiert bereits und enthält diese Datei). Committe oder pushe NIE auf den Deploy-Branch `main` (GitHub Pages geht sonst sofort live).
- **R2 Keine externen Requests:** Keine CDNs, keine Google Fonts, keine Embeds, kein Tracking. Alles wird self-hosted. Einzige bestehende Ausnahme: Formspree (Kontaktformular). Nichts Neues hinzufügen, das eine fremde Domain lädt.
- **R3 Reduced Motion:** Jede neue Animation steht in `@media (prefers-reduced-motion: no-preference) { … }`.
- **R4 Progressive Enhancement:** Neue CSS-Features stehen hinter `@supports`. Ohne Support muss aller Inhalt normal sichtbar sein. Niemals Inhalte per Default verstecken und erst per Animation einblenden.
- **R5 Kein Framework:** Kein Tailwind, kein React, kein NEUER Build-Step. Vanilla HTML/CSS/JS. Der vorhandene Builder `node build.js` (nur Node-Builtins) IST der Build der Site — nutzen und erweitern, nicht ersetzen. Bestehende CSS-Variablen/Klassen wiederverwenden statt neue Farbwerte zu erfinden.
- **R6 Rechtstexte:** Auf den Rechtsseiten (Impressum, Datenschutz, AGB) AUSSCHLIESSLICH die in Phase 1 gelisteten exakten Ersetzungen. Kein Umformulieren, kein "Verbessern", auch nicht in Phase 4.
- **R7 Nichts erfinden:** Keine erfundenen Zahlen, Kundenstimmen, Anekdoten, Biografien. Fehlt dir Input → Platzhalter `[INPUT: konkrete Frage]` + Eintrag in `OFFENE-PUNKTE.md`. Stelle dem Nutzer KEINE Fragen.
- **R8 Nie hängenbleiben:** Schlägt ein Task nach 2 Versuchen fehl → Eintrag in `OFFENE-PUNKTE.md`, weiter zum nächsten Task.
- **R9 Pfade:** Die Site läuft auf der Root-Domain `https://floppa3d.de`. Verwende absolute Pfade (`/assets/…`) in allem neuen Code, damit auch Seiten unter `/produkte/` funktionieren.
- **R10 Quellen statt Output:** NIEMALS generierte Dateien direkt editieren (Root-`*.html`, `produkte/*.html`, `sitemap.xml`, `robots.txt`). Immer die Quellen ändern (`pages/`, `templates/`, `data/products.json`, `styles/`, `scripts/`, `build.js`) und danach `node build.js` ausführen. Den generierten Output mitcommitten — GitHub Pages serviert ihn direkt. Akzeptanz-Prüfungen laufen gegen den generierten Output.
- **R11 Git-Account:** Alle Commits als `f-floppa <florian.kindler@floppa3d.de>`. Das ist im Repo bereits lokal per `git config` gesetzt — verifiziere zu Beginn mit `git config user.name` (muss `f-floppa` ergeben). Falls nicht: nur lokal setzen, nie `--global`.

## B) Blocker-Protokoll: `OFFENE-PUNKTE.md`

Lege die Datei beim ersten Blocker im Repo-Root an. Format pro Eintrag:

```markdown
## [P5-T6] Farbbilder fehlen
- **Was fehlt:** Bilddateien je Farbvariante
- **Warum blockiert:** Bildwechsel pro Swatch braucht eine Datei pro Farbe
- **Was Florian tun muss:** Fotos/Renders nach Schema assets/products/<slug>/farbe-<name>.webp ablegen (ca. 30 Min)
```

## F) Projekt-Fakten (nicht raten — hier nachschlagen)

- Statische Site auf GitHub Pages, Custom Domain `floppa3d.de` — ABER: Die HTML-Seiten werden GENERIERT. `node build.js` (nur Node-Builtins, kein npm install nötig) rendert:
  - `pages/<name>.html` (Seiten-Bodys) + `templates/_layout.html` → Root-`*.html`
  - `data/products.json` + `templates/product.html` (+ Layout) → `produkte/<slug>.html`
  - außerdem `sitemap.xml` und `robots.txt` (Funktionen `generateSitemap`/`generateRobots` in `build.js`)
- **Quellen (hier editieren):** `pages/`, `templates/`, `data/products.json`, `styles/`, `scripts/`, `assets/`, `build.js`. **Generiert (nie von Hand anfassen):** Root-`*.html`, `produkte/*.html`, `sitemap.xml`, `robots.txt`.
- Lokaler Dev-Server: `node server.js` (bzw. `npm run serve`).
- Branches: `main` = Deploy-Branch (GitHub Pages, live!), daneben existiert `dev`.
- Seiten: index, shop, about, faq, kontakt, impressum, datenschutz, agb, 404 — alle als `pages/<name>.html` + 6 generierte Produktseiten unter `produkte/`.
- Produkt-Slugs (Quelle: `data/products.json`): `nordic-flow`, `stack-pot`, `leaf-dock`, `luma-arch`, `cozy-bunny`, `orbit-key-tray`.
- `data/products.json` enthält je Produkt: `name`, `price`, `shortDescription`, `longDescription`, `details` (= Spezifikations-Tabelle), `colors`, `images` (PNG-Pfade), `etsyUrl` (aktuell PLATZHALTER), `tags`, `featured`.
- Brand: Dark-/Light-Theme (localStorage-Key `floppa3d-theme`), dunkle Basis `#1F1B17`, Teal-Akzent (echten Wert aus dem bestehenden CSS lesen!), Logo = F aus Layer-Lines. Das **Layer-Line-Motiv** ist das Signature-Element.
- Sprache: Deutsch, Anrede „Sie". Betreiber: Floppa3D GbR (2 Gründer: Florian & Paul), Kleinunternehmer § 19 UStG, Werkstatt in Neufarn bei Freising.
- Der Etsy-Shop ist **noch nicht live** — alle Etsy-Links sind Platzhalter (`etsyUrl` in `data/products.json` + fest verdrahteter Shop-Link im Footer in `build.js`).

## F2) Build-System: verbindliche Task-Anpassungen

Die Phasen-Texte unten beschreiben das ZIEL-Verhalten (Markup, CSS, Verhalten, Akzeptanz). Wo sie direkte Edits an Root-HTML oder `produkte/*.html` verlangen, gilt stattdessen diese Tabelle. **Bei Widerspruch gewinnt F2.**

| Task | Anpassung |
|---|---|
| P1-T1 | Ersetzungen in `pages/*.html`, `templates/*.html`, `data/products.json` und `build.js` (Descriptions in `STATIC_PAGES`) durchführen, danach `node build.js`. Akzeptanz-Grep über das ganze Repo mit `--exclude-dir=node_modules` — muss dadurch auch im generierten Output 0 Treffer liefern. |
| P1-T2, P1-T4 | Rechtsseiten-Quellen sind `pages/impressum.html`, `pages/datenschutz.html`, `pages/agb.html`. |
| P1-T3 | Footer-Zeile EINMAL in `templates/_layout.html` (gilt für alle Seiten); Preis-Hinweis in `templates/product.html`. |
| P2 komplett | Die zentrale Etsy-Quelle EXISTIERT bereits: `etsyUrl` in `data/products.json` (+ Footer-Shop-Link in `build.js`). KEINE neue JSON-Datei, KEIN Fetch-Script. Stattdessen: PLATZHALTER-URLs in `products.json` auf `""` setzen; `build.js`/`templates/product.html` so erweitern, dass eine leere `etsyUrl` den Coming-soon-Zustand statisch rendert (wie in P2-T2/T3 beschrieben: `is-coming-soon`, `aria-disabled="true"`, Text „Bald auf Etsy verfügbar", sichtbarer `etsy-hint`-Link) und eine gefüllte URL einen klickbaren Button (`target="_blank"`, `rel="noopener"`; bestehende `safeUrl()`-Prüfung in `build.js` beibehalten). Footer-Shop-Link genauso behandeln. Akzeptanz sinngemäß: `grep -rn "PLATZHALTER" --exclude-dir=node_modules .` = 0; Test-URL in `products.json` + `node build.js` → Button klickbar; danach zurücksetzen. P2-T4-Eintrag entsprechend: „Etsy-URLs in `data/products.json` eintragen, `node build.js` ausführen, committen (5 Min)". |
| P3-T2 | Produktbilder: `<picture>`-Umbau in `templates/product.html` bzw. an der Stelle in `build.js`, die `<img>` rendert. Bildlisten stehen in `products.json`. Statische Seiten: `pages/*.html`. |
| P3-T3 | `robots.txt`/`sitemap.xml` werden von `build.js` generiert. Output prüfen, bei Abweichungen in `build.js` anpassen — NICHT von Hand schreiben. |
| P3-T4 | `build.js` erzeugt bereits Product-JSON-LD (nutzt `etsyUrl`). Bestehende Blöcke prüfen und erweitern statt doppelt einfügen. Organization-Schema in `templates/_layout.html`; FAQPage aus `pages/faq.html` generieren (in `build.js` oder statisch in der Page). Solange Etsy nicht live: keine `offers`. |
| P3-T5 | Titles kommen aus den `STATIC_PAGES`-Einträgen in `build.js` und `templates/_layout.html` — dort ändern. |
| P3-T6 | `pages/404.html` existiert bereits. Inhalt prüfen und ggf. an die Vorgabe angleichen statt neu anlegen. |
| P4 | Texte in `pages/*.html` sowie `shortDescription`/`longDescription` in `data/products.json` ändern. `details` (Spezifikations-Tabellen) NICHT anfassen. Danach `node build.js`. |
| P5-T1 | Shop-Kacheln werden von `build.js` in die Seiten injiziert — `view-transition-name` dort bzw. in `templates/product.html` setzen (pro Slug eindeutig). |
| P5-T4, P5-T5, P5-T6, P6-T2 | Einbau in `templates/product.html` (+ ggf. `build.js`) — gilt damit automatisch für alle 6 Produktseiten. Swatches aus dem `colors`-Array in `products.json` generieren. |
| P7-T2, P7-T3, P7-T4 | Neue Seiten als `pages/<name>.html` + Eintrag in `STATIC_PAGES` in `build.js`; Navigation in `templates/_layout.html`. Journal: Output-Pfade `journal/…` sind möglich (`writeFile` legt Ordner an). |
| P7-T7 | Sitemap wird generiert — neue Seiten erscheinen automatisch, sobald sie in `STATIC_PAGES` stehen. Prüfen, dass alle neuen URLs im Output auftauchen. |
| A-T1 | Zusätzlich abhaken: `node build.js` läuft fehlerfrei durch UND direkt nach dem Build zeigt `git status` keine Diffs (Quellen und generierter Output konsistent committed). Lokal testen mit `node server.js` statt `python3 -m http.server`. |

---

# PHASE 0 — Audit

### P0-T1 Inventar
Erstelle `docs/AUDIT.md` mit: (a) Dateibaum der Seiten/Assets (Quellen vs. generierter Output kennzeichnen), (b) Deploy-Mechanismus (welcher Branch, Action ja/nein) + Build-Ablauf (`build.js`: was liest es, was schreibt es), (c) Tabelle aller Bilddateien mit Größe in KB, (d) Liste aller CSS-/JS-Dateien.
**AKZEPTANZ:** Datei existiert, enthält alle 4 Abschnitte.
**COMMIT:** `docs: projekt-audit`

### P0-T2 Baseline
Falls Lighthouse/ein Audit-Tool verfügbar ist: Werte für `index.html` und eine Produktseite in `docs/AUDIT.md` ergänzen. Falls nicht verfügbar: Abschnitt „Baseline: Tool nicht verfügbar" eintragen und weitermachen (R8).
**COMMIT:** `docs: performance-baseline`

---

# PHASE 1 — Rechts-Fixes (mechanische Ersetzungen, sonst NICHTS)

> ⚠️ Build-System: Task-Anpassungen in Abschnitt F2 gehen vor (Quellen editieren, dann `node build.js`).

### P1-T1 Gesetzesnamen aktualisieren
Führe diese Ersetzungen **in dieser Reihenfolge** in allen Quell-Dateien durch (siehe F2):

| # | Suchen (exakt) | Ersetzen durch |
|---|---|---|
| 1 | `§ 5 TMG` | `§ 5 DDG` |
| 2 | `§ 7 Abs. 1 TMG` | `§ 7 Abs. 1 DDG` |
| 3 | `§§ 8 bis 10 TMG` | `§§ 8 bis 10 DDG` |
| 4 | `Telemediengesetz (TMG)` | `Digitale-Dienste-Gesetz (DDG)` |
| 5 | `Telemediengesetz` | `Digitale-Dienste-Gesetz` |
| 6 | `TMG` (Rest-Vorkommen) | `DDG` |
| 7 | `Telekommunikation-Telemedien-Datenschutzgesetz` | `Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz` |
| 8 | `TTDSG` (Rest-Vorkommen) | `TDDDG` |

Auch Meta-Descriptions prüfen (Impressum erwähnt TMG im `<meta>` — Quelle: `STATIC_PAGES` in `build.js`).
**AKZEPTANZ:** `grep -rniE "TMG|TTDSG" --include="*.html" --exclude-dir=node_modules .` liefert **0 Treffer** (nach `node build.js`).
**COMMIT:** `fix: tmg→ddg und ttdsg→tdddg aktualisiert`

### P1-T2 „Firma" → „Unternehmen"
Nur auf den drei Rechtsseiten (Quellen, siehe F2): Wo „Firma" als Beschriftung/Label für „Floppa3D GbR" steht → „Unternehmen". (Eine GbR führt keine Firma im Rechtssinn.) Andere Vorkommen des Wortes unverändert lassen.
**COMMIT:** `fix: gbr-korrekte bezeichnung im impressum`

### P1-T3 § 19-UStG-Hinweis
Füge im Footer (`templates/_layout.html`) unter der Copyright-Zeile ein:
```html
<p class="legal-note">Kein Ausweis der Umsatzsteuer gemäß § 19 UStG (Kleinunternehmerregelung).</p>
```
Dieselbe Zeile zusätzlich in `templates/product.html` direkt unter dem Preis. CSS einmal global:
```css
.legal-note { font-size: .78rem; opacity: .7; }
```
**AKZEPTANZ:** Zeile auf jeder generierten Seite im Footer sichtbar + auf 6 Produktseiten beim Preis.
**COMMIT:** `feat: §19-ustg-hinweis ergänzt`

### P1-T4 Stand-Datum
„Stand:"-Datum auf den drei Rechtsseiten (Quellen) auf den aktuellen Monat setzen.
**COMMIT:** `fix: stand-datum rechtsseiten`

---

# PHASE 2 — Etsy-Link-System (Platzhalter raus)

> ⚠️ **ABWEICHUNG — F2 lesen:** Die zentrale Etsy-Quelle existiert bereits (`etsyUrl` in `data/products.json`). P2-T1 (neue JSON) und P2-T2 (Fetch-Script) ENTFALLEN. Umzusetzen ist dasselbe Ziel-Verhalten serverseitig im Build: leere `etsyUrl` ⇒ Coming-soon-Zustand, gefüllte URL ⇒ klickbarer Button. Markup/CSS/Texte aus den folgenden Tasks als Referenz verwenden.

### P2-T1 Zentrale Link-Datei — ENTFÄLLT (F2: `data/products.json` ist die zentrale Quelle; PLATZHALTER-URLs auf `""` setzen)

### P2-T2 Link-Script — ENTFÄLLT als Fetch-Script (F2: Verhalten im Build rendern)
Referenz für den Ziel-Zustand pro Button:
- URL vorhanden: `href` gesetzt, `target="_blank"`, `rel="noopener"`, normaler Button.
- URL leer: kein `href`, Klasse `is-coming-soon`, `aria-disabled="true"`, Text „Bald auf Etsy verfügbar", zugehöriger `etsy-hint`-Link sichtbar.

### P2-T3 Templates/Build umstellen
1. Etsy-Buttons in `templates/product.html` / `build.js` nach obigem Referenz-Zustand rendern (Shop-Link im Footer ebenso).
2. Auf jeder Produktseite neben dem Haupt-CTA ergänzen (im Template):
```html
<a class="etsy-hint" href="/kontakt.html" hidden>Frage vorab stellen →</a>
```
(`hidden` entfällt im Coming-soon-Zustand.)
3. CSS für den deaktivierten Zustand (vorhandene Button-Klasse weiterverwenden):
```css
.is-coming-soon { opacity: .55; pointer-events: none; cursor: default; }
```
**AKZEPTANZ:** `grep -rn "PLATZHALTER" --exclude-dir=node_modules .` = 0 Treffer. Lokal: Alle Etsy-Buttons zeigen „Bald auf Etsy verfügbar". Trage testweise eine URL in `products.json` ein + `node build.js` → Button wird klickbar. Test-URL danach wieder entfernen + erneut bauen.
**COMMIT:** `feat: platzhalter-links durch coming-soon-zustand ersetzt`

### P2-T4 Offener Punkt
`OFFENE-PUNKTE.md`: „[P2] Etsy-URLs in `data/products.json` eintragen, `node build.js` ausführen und committen, sobald der Shop live ist (5 Min)."
**COMMIT:** `docs: offener punkt etsy-urls`

---

# PHASE 3 — Performance & SEO

> ⚠️ Build-System: Task-Anpassungen in Abschnitt F2 gehen vor.

### P3-T1 Bild-Konvertierung
Erstelle `tools/optimize-images.mjs`:
```js
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
```
Ausführen: `npm i sharp --no-save && node tools/optimize-images.mjs` (es gibt bereits eine `package.json` — KEIN `npm init`). `node_modules/` steht schon in `.gitignore`. Falls npm/Netz nicht verfügbar → R8.
**AKZEPTANZ:** Zu jeder PNG existiert eine WebP; WebP-Dateien sind kleiner.
**COMMIT:** `perf: webp-versionen aller bilder + konvertierungs-skript`

### P3-T2 Bilder einbinden
Jedes Content-`<img src="….png">` (Quellen: Templates/`build.js`/`pages/`, siehe F2) umstellen auf:
```html
<picture>
  <source srcset="/assets/….webp" type="image/webp">
  <img src="/assets/….png" alt="…" width="W" height="H" loading="lazy" decoding="async">
</picture>
```
`W`/`H` = echte Pixelmaße (auslesen, nicht raten). Ausnahmen: Hero-Bild und das erste Produktbild jeder Produktseite bekommen KEIN `loading="lazy"`, sondern `fetchpriority="high"`. Leere `alt`-Attribute inhaltlich füllen; rein dekorative Bilder: `alt=""`.
**AKZEPTANZ:** Konsole fehlerfrei, kein sichtbarer Layout-Shift beim Laden, Alt-Texte vollständig.
**COMMIT:** `perf: picture-elemente, dimensionen, lazy loading, alt-texte`

### P3-T3 robots.txt + sitemap.xml
Werden bereits von `build.js` generiert (siehe F2). Prüfen, dass der Output dem entspricht:
`robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://floppa3d.de/sitemap.xml
```
`sitemap.xml`: alle bestehenden Seiten als `<url><loc>https://floppa3d.de/…</loc></url>` (Standard-Sitemap-Namespace). Abweichungen in `build.js` korrigieren. Neue Seiten kommen in P7-T7 dazu.
**AKZEPTANZ:** `node -e "..."` oder `xmllint` bestätigt valides XML (alternativ Sichtprüfung).
**COMMIT:** `fix: robots/sitemap-generierung geprüft` (nur committen, wenn es Änderungen gab)

### P3-T4 JSON-LD
Bestehende JSON-LD-Blöcke in `build.js` zuerst prüfen (Product existiert teilweise schon!), dann ergänzen:
- **Alle Seiten — Organization** (Werte aus dem Impressum und Footer übernehmen, NICHT erfinden):
```json
{ "@context": "https://schema.org", "@type": "Organization",
  "name": "Floppa3D GbR", "url": "https://floppa3d.de",
  "logo": "https://floppa3d.de/<pfad-zum-logo>",
  "email": "<aus impressum>", "sameAs": ["<instagram-url-aus-footer>"] }
```
- **Produktseiten — Product** (solange Etsy nicht live ist OHNE `offers`):
```json
{ "@context": "https://schema.org", "@type": "Product",
  "name": "<Produktname>", "image": ["https://floppa3d.de/<hauptbild>"],
  "description": "<kurzbeschreibung der seite>",
  "brand": { "@type": "Brand", "name": "Floppa3D" }, "material": "<PLA oder PETG>" }
```
- **Produktseiten — BreadcrumbList** (Start → Shop → Produkt).
- **faq.html — FAQPage** aus den vorhandenen Fragen/Antworten generieren (Antworttexte 1:1 übernehmen).
In `OFFENE-PUNKTE.md`: „[P3] `offers` (Preis EUR, availability) im Product-Schema ergänzen, sobald Etsy live."
**AKZEPTANZ:** Jeder JSON-LD-Block im generierten Output parst fehlerfrei (`node -e 'JSON.parse(...)'` oder gleichwertig).
**COMMIT:** `feat: strukturierte daten (organization, product, breadcrumb, faq)`

### P3-T5 Title-Tags
Startseite exakt: `<title>Floppa3D – 3D-gedruckte Pflanztöpfe & Deko aus Bayern</title>`. Alle anderen Seiten auf Muster `<Seitenname> | Floppa3D` bringen (Produktseiten: `<Produktname> | Floppa3D`). Quelle: `STATIC_PAGES` in `build.js` + `templates/_layout.html` (siehe F2).
**AKZEPTANZ:** Kein Title im generierten Output lautet mehr `Floppa3D | Floppa3D`.
**COMMIT:** `fix: aussagekräftige title-tags`

### P3-T6 404-Seite
`pages/404.html` existiert bereits (GitHub Pages nutzt die generierte `404.html` automatisch). Inhalt prüfen und ggf. angleichen an:
```html
<main class="page-404">
  <h1>404 — Diese Seite wurde nie gedruckt.</h1>
  <p>Vielleicht ein Tippfehler — passiert den Besten (auch unserem Slicer).</p>
  <p><a href="/">Zur Startseite</a> · <a href="/shop.html">Zum Shop</a></p>
</main>
```
**AKZEPTANZ:** Seite rendert in beiden Themes korrekt.
**COMMIT:** `feat: 404-seite überarbeitet` (nur committen, wenn es Änderungen gab)

### P3-T7 OG-Bild Startseite
Erstelle `tools/make-og.mjs` (Teal-Hex vorher aus dem CSS auslesen und einsetzen):
```js
import sharp from 'sharp';
const TEAL = '#2DD4BF'; // ← durch echten Akzentwert aus dem CSS ersetzen!
const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#1F1B17"/>
  ${[0,1,2,3,4].map(i => `<rect x="64" y="${418 + i*30}" width="${380 - i*48}" height="12" rx="6" fill="${TEAL}" opacity="${0.95 - i*0.16}"/>`).join('')}
  <text x="64" y="210" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="700" fill="#F5F2EC">Floppa3D</text>
  <text x="64" y="285" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#CFC8BD">3D-gedruckte Pflanztöpfe &amp; Deko · Made in Bavaria</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('assets/og/home.png');
```
`og:image`/`twitter:image` der Startseite (Quelle: `build.js`/`_layout.html`) auf `https://floppa3d.de/assets/og/home.png` setzen. `OFFENE-PUNKTE.md`: „[P3] OG-Bild später durch Version mit echtem Produktfoto ersetzen."
**COMMIT:** `feat: og-share-card startseite`

### P3-T8 Icons/Manifest
Prüfe `apple-touch-icon` (180×180) und `site.webmanifest`. Fehlt etwas → aus dem vorhandenen Logo erzeugen (sharp; im Repo gibt es bereits Logo-Tools unter `tools/`) und im Layout-`<head>` verlinken.
**COMMIT:** `feat: touch-icons und webmanifest`

---

# PHASE 4 — Texte menschlicher machen

> ⚠️ Build-System: Texte liegen in `pages/*.html` und in `data/products.json` (`shortDescription`/`longDescription`). `details` (Spezifikations-Tabellen) NICHT anfassen. Nach Änderungen `node build.js`.

**Ziel:** Die Texte klingen aktuell stylish, aber kühl und stakkatohaft. Sie sollen klingen wie zwei echte Menschen, die ihre Produkte selbst entwerfen und drucken — ohne geschwätzig zu werden.

**Voice Guide:** Es sprechen zwei Gründer, die selbst am Drucker stehen. Warm, direkt, konkret, auf Augenhöhe. Trockener Humor sparsam. „Sie"-Anrede beibehalten. Tagline „Professional Print Studio" bleibt.

**Kalibrierung — genau dieser Ton:**

| Vorher (Ist-Stil) | Nachher (Ziel-Stil) |
|---|---|
| „Blume. Deko. Organisation." | „Pflanztöpfe, Deko und kleine Helfer für den Schreibtisch — entworfen am Rechner, gedruckt in unserer Werkstatt bei Freising." |
| „Kein Einheitsbrei. Nur Stücke, die wir auch selbst stehen lassen würden." | „Wir drucken nur, was wir uns selbst ins Regal stellen würden — und das meinen wir wörtlich: Jedes Stück geht durch unsere Hände, bevor es in den Karton kommt." |
| „Produktion auf Nachfrage." | „Gedruckt wird erst, wenn Sie bestellen. Das dauert ein, zwei Tage länger — dafür steht hier nichts im Lager und nichts wird weggeworfen." |

**Regeln:**
1. Konkret schlägt abstrakt: Adjektiv-Stapel durch das ersetzen, was wirklich passiert.
2. Maximal EIN Stakkato-Fragment pro Sektion, sonst vollständige Sätze.
3. Aktiv, „wir" statt unpersönlicher Formen.
4. Leserfragen vorwegnehmen (Größe? Pflege? Dauer?) statt zu behaupten.
5. Produkttexte: 1 sinnlicher Satz (Haptik/Wirkung im Raum) + 1 praktischer Satz (Einsatz/Pflege). Spezifikations-Tabellen NICHT anfassen.
6. Mikrotexte mitnehmen: Buttons, Formular-Hilfetexte, FAQ-Antworten, 404.
7. Textmenge pro Seite: maximal +30 % gegenüber vorher.
8. **R6 + R7 beachten:** Rechtsseiten tabu. Nichts erfinden — für die Über-uns-Seite Platzhalter `[INPUT: …]` setzen und diese Interviewfragen in `OFFENE-PUNKTE.md` schreiben: Wie seid ihr zum 3D-Druck gekommen? Erster Drucker? Warum der Name „Floppa"? Wer entwirft, wer druckt? Lieblingsstück und warum?

**Umfang:** Startseite, Shop, About, FAQ, Kontakt (je `pages/<name>.html`), alle 6 Produkte (`data/products.json`).
**Deliverable zusätzlich:** `docs/COPY-CHANGES.md` mit Vorher/Nachher je geändertem Abschnitt (zweispaltig oder untereinander), damit der Review in 5 Minuten geht.
**AKZEPTANZ:** Alle Seiten umgeschrieben, COPY-CHANGES.md vollständig, kein `[INPUT:…]` ohne zugehörigen OFFENE-PUNKTE-Eintrag, Rechtsseiten unverändert (git diff prüfen!).
**COMMIT:** `feat: website-texte humanisiert` (+ `docs: copy-changes dokumentiert`)

---

# PHASE 5 — Animationen & Interaktion

> ⚠️ Build-System: Produktseiten-Einbauten gehören nach `templates/product.html` (+ ggf. `build.js`) — siehe F2.

### P5-T1 View Transitions (Seitenwechsel-Morph)
Global ins CSS:
```css
@view-transition { navigation: auto; }
```
Auf jeder Shop-Kachel UND dem zugehörigen Produktseiten-Hauptbild dasselbe eindeutige `view-transition-name` setzen, z. B. `style="view-transition-name: vt-nordic-flow"` (gerendert aus dem Slug — Kacheln und Produktbild werden von `build.js`/Templates erzeugt). Ein Name darf pro Seite nur EINMAL vorkommen.
**AKZEPTANZ:** In Chrome morpht das Produktbild von Shop → Produktseite. In Firefox: normale Navigation, keine Fehler.
**COMMIT:** `feat: view transitions zwischen shop und produktseiten`

### P5-T2 Scroll-Reveals
```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: revealUp .7s ease-out both;
      animation-timeline: view();
      animation-range: entry 0% entry 60%;
    }
    @keyframes revealUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: none; }
    }
  }
}
```
Klasse `.reveal` auf Produktkarten und Inhalts-Sektionen von Start- und Shop-Seite — NICHT auf Above-the-fold-Elemente (Hero).
**AKZEPTANZ:** Mit DevTools-Emulation „prefers-reduced-motion: reduce": keine Animation, alles sichtbar. Ohne `@supports`-Treffer (Firefox): alles sofort sichtbar.
**COMMIT:** `feat: scroll-reveals (css scroll-driven)`

### P5-T3 Layer-Print-Reveal (Signature-Effekt)
```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .layer-reveal {
      animation: layerReveal .9s steps(5, end) both;
      animation-timeline: view();
      animation-range: entry 0% entry 45%;
    }
    @keyframes layerReveal {
      from { clip-path: inset(100% 0 0 0); }
      to   { clip-path: inset(0 0 0 0); }
    }
  }
}
```
Anwenden auf die Section-Headlines von Start- und Shop-Seite (Überschriften bauen sich in 5 „Schichten" von unten auf — Anspielung auf FDM-Layer). Dies ist der EINE auffällige Effekt der Seite; alles andere bleibt dezent.
**COMMIT:** `feat: layer-print-reveal für headlines`

### P5-T4 Produktkarten-Hover
Karte: `transition: transform .2s ease, box-shadow .2s ease;` Hover: `transform: translateY(-4px)` + dezenter Schatten. Wo ein zweites Produktbild existiert (`images`-Array in `products.json` prüfen!): beide Bilder stapeln, beim Hover Crossfade (~200 ms) zum zweiten Bild. Touch-Geräte: kein Hover-Zwang, Klick führt direkt zur Produktseite.
**COMMIT:** `feat: produktkarten-hover`

### P5-T5 Sticky Mobile-CTA (Produktseiten)
Gib dem bestehenden Haupt-CTA-Container in `templates/product.html` die Klasse `product-cta`. Dann im Template vor `</body>`:
```html
<div class="sticky-cta" hidden>
  <span class="sticky-cta__price"><!-- Preis aus products.json --> <small>zzgl. Versand</small></span>
  <a class="<bestehende-button-klasse>"><!-- gleicher Etsy-/Coming-soon-Zustand wie Haupt-CTA (Phase 2) --></a>
</div>
```
```css
.sticky-cta { position: fixed; inset: auto 0 0 0; display: flex; gap: 12px;
  align-items: center; justify-content: space-between; padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: var(--bg, #1F1B17); border-top: 1px solid rgba(127,127,127,.25); z-index: 50; }
@media (min-width: 768px) { .sticky-cta { display: none; } }
```
```js
const cta = document.querySelector('.product-cta');
const bar = document.querySelector('.sticky-cta');
if (cta && bar) new IntersectionObserver(([e]) => { bar.hidden = e.isIntersecting; }).observe(cta);
```
**AKZEPTANZ:** Bei 390 px Breite erscheint die Bar nach dem Scrollen am Haupt-CTA vorbei; ab 768 px nie sichtbar.
**COMMIT:** `feat: sticky mobile-cta auf produktseiten`

### P5-T6 Farb-Swatches
Farb-Aufzählungen der Produktseiten (Quelle: `colors`-Array in `products.json`, gerendert via Template/`build.js`) in klickbare Swatches umbauen:
```html
<div class="swatches" role="group" aria-label="Farbe wählen">
  <button type="button" data-color="Sand Beige" style="--sw:#D6C4A8" aria-pressed="true"></button>
  …
</div>
<p class="swatch-label">Gewählte Farbe: Sand Beige</p>
```
```css
.swatches button { width: 28px; height: 28px; border-radius: 50%;
  background: var(--sw); border: 2px solid transparent; cursor: pointer; }
.swatches button[aria-pressed="true"] { border-color: var(--accent, #2DD4BF); }
```
```js
document.querySelectorAll('.swatches button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.swatches').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    const label = btn.closest('section, main').querySelector('.swatch-label');
    if (label) label.textContent = `Gewählte Farbe: ${btn.dataset.color}`;
    if (btn.dataset.img) {
      const img = document.querySelector('.product-hero img, main picture img');
      if (img) img.src = btn.dataset.img;
    }
  });
});
```
Hex-Näherungen (an Brand-Palette anpassen erlaubt): Sand Beige `#D6C4A8`, Sage Green `#9CAF88`, Terracotta `#C56B4E`, Anthrazit/Matt Schwarz `#3A3A3A`, Weiß/Cremeweiß `#F2EFE9`. Unbekannte Farbnamen: neutrales Grau `#8A8A8A`, Name wird trotzdem angezeigt. `data-img` NUR setzen, wenn die Datei `assets/products/<slug>/farbe-<name>.webp` wirklich existiert. Fehlende Farbbilder je Produkt in `OFFENE-PUNKTE.md` auflisten.
**COMMIT:** `feat: farb-swatches auf produktseiten`

---

# PHASE 6 — 3D-/AR-Viewer

> ⚠️ Build-System: Viewer-Sektion gehört nach `templates/product.html` — siehe F2.

### P6-T1 model-viewer self-hosten
```
npm i @google/model-viewer --no-save
cp node_modules/@google/model-viewer/dist/model-viewer.min.js assets/vendor/model-viewer.min.js
```
KEIN CDN-Load (R2). Falls npm scheitert → R8.
**COMMIT:** `feat: model-viewer vendor (self-hosted)`

### P6-T2 Viewer-Sektion mit Auto-Ausblendung
Im Produkt-Template nach dem Hauptbild:
```html
<section class="viewer3d" data-model="<slug>" hidden>
  <h2>In 3D ansehen</h2>
  <model-viewer src="/assets/models/<slug>.glb" ios-src="/assets/models/<slug>.usdz"
    ar camera-controls touch-action="pan-y"
    poster="<pfad-zum-hauptbild-webp>" style="width:100%; height:420px;"></model-viewer>
  <p class="viewer3d__hint">Tipp: Auf dem Smartphone „AR" tippen und das Stück direkt ins eigene Regal stellen.</p>
</section>
```
Script (lädt den Vendor-Code nur, wenn ein Modell existiert):
```js
document.querySelectorAll('.viewer3d[data-model]').forEach(async (sec) => {
  try {
    const r = await fetch(`/assets/models/${sec.dataset.model}.glb`, { method: 'HEAD' });
    if (!r.ok) return;
    if (!customElements.get('model-viewer')) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = '/assets/vendor/model-viewer.min.js';
      document.head.append(s);
    }
    sec.hidden = false;
  } catch {}
});
```
**AKZEPTANZ:** Ohne GLB-Dateien ist die Sektion unsichtbar und die Konsole fehlerfrei. Lege testweise eine beliebige GLB unter `assets/models/<slug>.glb` → Sektion erscheint, Viewer lädt. Testdatei danach entfernen.
**COMMIT:** `feat: 3d/ar-viewer mit graceful fallback`

### P6-T3 Export-Anleitung
`tools/README-3D.md` mit Schritt-für-Schritt: STL/3MF in Blender importieren → Decimate auf < 100k Dreiecke → Material/Farbe setzen → glTF-/GLB-Export → `npx @gltf-transform/cli optimize in.glb out.glb` (Ziel < 5 MB) → USDZ für iOS per Apple Reality Converter → Dateien nach `assets/models/<slug>.glb|.usdz`.
`OFFENE-PUNKTE.md`: „[P6] GLB + USDZ für alle 6 Produkte exportieren (Anleitung tools/README-3D.md, ca. 20 Min/Produkt)."
**COMMIT:** `docs: 3d-export-anleitung`

---

# PHASE 7 — Neue Inhalte & Vorbereitungen

> ⚠️ Build-System: Neue Seiten = `pages/<name>.html` + `STATIC_PAGES`-Eintrag in `build.js`; Navigation in `templates/_layout.html` — siehe F2.

### P7-T1 Timelapse-Hero-Slot
CSS für `.hero-video` (object-fit: cover, absolut hinter dem Hero-Inhalt, dezentes Overlay für Lesbarkeit). JS am Ende der Startseite:
```js
(async () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const r = await fetch('/assets/video/hero-timelapse.mp4', { method: 'HEAD' });
    if (!r.ok) return;
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true });
    v.src = '/assets/video/hero-timelapse.mp4';
    v.className = 'hero-video';
    document.querySelector('<hero-selektor>')?.prepend(v);
  } catch {}
})();
```
`<hero-selektor>` = echter Container der Startseite. Solange das Video fehlt, ändert sich nichts. `OFFENE-PUNKTE.md`: „[P7] Timelapse drehen: 10–15 s, 1080p, loopfähig, < 15 MB, nach `assets/video/hero-timelapse.mp4`."
**COMMIT:** `feat: hero-video-slot mit fallback`

### P7-T2 Landingpage Auftragsdruck
`pages/auftragsdruck.html` + `STATIC_PAGES`-Eintrag (Kopf/Footer kommen aus dem Layout, Voice Guide aus Phase 4). Sektionen in dieser Reihenfolge: (1) Hero „Ihre Idee. Unser Drucker." + 1 Satz, (2) drei Karten: Vereine & Events / Unternehmen / Prototypen & Einzelstücke — je 2–3 Sätze, was möglich ist, (3) „So läuft's": Anfrage → Angebot → Druck (je 1–2 Sätze), (4) Material-Kurzinfo (PLA/PETG, 2 Sätze), (5) 3 FAQ-Einträge (Mindestmenge? Eigenes Design mitbringen? Dauer?), (6) CTA-Button zu `kontakt.html?betreff=Auftragsdruck`. Im Kontaktformular 3 Zeilen JS ergänzen, die den `betreff`-URL-Parameter ins Betreff-/Nachrichtenfeld vorbefüllen. Seite in die Hauptnavigation aufnehmen.
**COMMIT:** `feat: landingpage auftragsdruck`

### P7-T3 Seite Material & Nachhaltigkeit
`pages/material.html` + `STATIC_PAGES`-Eintrag: Was ist PLA (pflanzenbasiert), was ist PETG, warum Druck auf Bestellung = kein Lagerüberschuss, ehrliche Einordnung der Kompostierbarkeit — **die bestehende FAQ-Formulierung dazu wörtlich übernehmen, kein Greenwashing**. In die Footer-Navigation aufnehmen.
**COMMIT:** `feat: material- und nachhaltigkeitsseite`

### P7-T4 Journal
Journal-Übersicht + zwei Artikel à 600–900 Wörter (als Pages + `STATIC_PAGES`-Einträge mit Output `journal/…`), Voice Guide:
- `journal/pla-vs-petg.html` — Gliederung: Kurzantwort vorab / PLA-Eigenschaften / PETG-Eigenschaften / Vergleich (Wasser, UV, Hitze, Optik) / Empfehlung: welcher Topf für drinnen vs. Balkon / Pflege-Hinweis.
- `journal/3d-druck-deko-pflegen.html` — Gliederung: Reinigen (lauwarm, mild) / Was vermeiden (Spülmaschine, Hitze über ~50 °C, aggressive Reiniger) / Kratzer & Gebrauchsspuren / Drinnen vs. draußen / Wann austauschen.
Keine Aussagen über fremde Marken, keine Garantieversprechen. Journal in die Footer-Navigation aufnehmen.
**COMMIT:** `feat: journal mit zwei ratgeber-artikeln`

### P7-T5 Insta-Grid
NUR umsetzen, wenn unter `assets/social/` mindestens 6 Bilder liegen: 6er-Grid auf der Startseite, jedes Bild verlinkt auf das Instagram-Profil (Link aus dem Footer übernehmen), **kein Embed, kein externes Script**. Liegen dort keine Bilder: nichts einbauen, nur `OFFENE-PUNKTE.md`-Eintrag „[P7] 6 quadratische Bilder nach assets/social/ legen (10 Min)".
**COMMIT:** `feat: statisches instagram-grid` (oder `docs: offener punkt insta-grid`)

### P7-T6 Analytics vorbereiten (NICHT aktivieren)
1. Im Layout-`<head>` (`templates/_layout.html`) als Kommentar:
```html
<!-- Analytics (GoatCounter) — erst nach Freigabe aktivieren, siehe docs/analytics-setup.md
<script data-goatcounter="https://CODE.goatcounter.com/count" async src="/assets/vendor/count.js"></script>
-->
```
2. `docs/analytics-setup.md`: Account auf goatcounter.com anlegen (gratis) → `count.js` herunterladen nach `assets/vendor/count.js` → `CODE` ersetzen → Kommentar entfernen → Datenschutz-Absatz aus `docs/dse-absatz-analytics.md` in die Datenschutz-Quelle einfügen. (≈ 5 Min)
3. `docs/dse-absatz-analytics.md`: fertig formulierter Absatz (Reichweitenmessung mit GoatCounter, keine Cookies, keine dauerhafte Speicherung der vollständigen IP, Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO) — Datei oben deutlich markieren: **„ENTWURF — vor Einbau prüfen"**.
4. Die Datenschutz-Seite selbst NICHT anfassen (R6).
**COMMIT:** `feat: analytics vorbereitet (inaktiv)`

### P7-T7 Sitemap ergänzen
Sitemap wird von `build.js` generiert — prüfen, dass `auftragsdruck.html`, `material.html` und die Journal-Seiten im Output von `sitemap.xml` auftauchen (ggf. Liste in `generateSitemap`/`STATIC_PAGES` ergänzen).
**COMMIT:** `fix: sitemap um neue seiten ergänzt`

---

# ABSCHLUSS

### A-T1 Selbsttest (alles abhaken)
- [ ] `node build.js` läuft fehlerfrei durch; direkt danach zeigt `git status` keine Diffs (Quellen und generierter Output konsistent committed)
- [ ] Jede Seite lokal geöffnet (`node server.js`), beide Themes
- [ ] Mobile Breite 390 px geprüft (Sticky-CTA, Navigation, Grids)
- [ ] Browser-Konsole auf jeder Seite fehlerfrei
- [ ] Alle internen Links funktionieren, `grep -rn "PLATZHALTER" --exclude-dir=node_modules .` = 0
- [ ] `prefers-reduced-motion: reduce` emuliert → keine Animationen, alles sichtbar
- [ ] `grep -rniE "TMG|TTDSG" --exclude-dir=node_modules .` = 0; Rechtsseiten nur durch Phase 1 verändert (git diff)
- [ ] Keine Requests an fremde Domains außer Formspree (Netzwerk-Tab)
- [ ] `git log --format="%an"` der neuen Commits zeigt ausschließlich `f-floppa` (R11)

### A-T2 Zusammenfassung
`ZUSAMMENFASSUNG.md`: umgesetzte Tasks je Phase (Task-IDs), Lighthouse vorher/nachher (falls verfügbar), Links auf `OFFENE-PUNKTE.md` und `docs/COPY-CHANGES.md`.
**COMMIT:** `docs: zusammenfassung`

### A-T3 Übergabe
Branch `feat/website-upgrade` pushen und Draft-PR öffnen (`gh pr create --draft --title "Website-Upgrade" --body-file ZUSAMMENFASSUNG.md`). Falls `gh` fehlt oder keine Auth: nur pushen + Hinweis in `OFFENE-PUNKTE.md`. **Nicht mergen** — das macht Florian nach Review.

**Definition of Done:** Alle Task-IDs erledigt oder mit `OFFENE-PUNKTE.md`-Eintrag dokumentiert; Selbsttest komplett; keine neuen externen Requests; Rechtsseiten nur per Phase 1 geändert.

---

# START-PROMPT (für Florian zum Kopieren)

```text
Lies FLOPPA3D-WEBSITE-UPGRADE.md vollständig — sie ist dein kompletter Auftrag.

1. Lege eine Todo-Liste mit allen Task-IDs an (P0-T1 bis P7-T7 plus A-T1 bis A-T3).
2. Arbeite sie strikt in Reihenfolge ab: umsetzen → AKZEPTANZ prüfen → mit der
   vorgegebenen Commit-Message committen → nächster Task.
3. Halte die Eisernen Regeln R1–R11 bei jedem Task ein. Abschnitt F2
   (Build-System) geht den Phasen-Texten vor: nur Quellen editieren
   (pages/, templates/, data/products.json, build.js), danach node build.js.
4. Stelle mir keine Fragen. Was meinen Input braucht oder nach 2 Versuchen
   scheitert, kommt nach OFFENE-PUNKTE.md — dann weiter.
5. Du bist bereits auf dem Branch feat/website-upgrade — bleib dort,
   niemals auf den Deploy-Branch main committen oder pushen.
   Am Ende: ZUSAMMENFASSUNG.md, Branch pushen, Draft-PR öffnen, NICHT mergen.
```
