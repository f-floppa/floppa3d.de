# Website-Upgrade — Zusammenfassung

Branch `feat/website-upgrade` · Juni 2026 · Alle Phasen des Playbooks (`FLOPPA3D-WEBSITE-UPGRADE.md`) umgesetzt.
**Nicht mergen ohne Review** — offene Zulieferungen stehen in [OFFENE-PUNKTE.md](OFFENE-PUNKTE.md), alle Textänderungen in [docs/COPY-CHANGES.md](docs/COPY-CHANGES.md).

## Phase 0 — Audit
- `docs/AUDIT.md`: Dateibaum, Build-/Deploy-Mechanismus, Bildgrößen, CSS/JS-Inventar. Lighthouse nicht verfügbar → statische Baseline (~31 MB PNGs als Hauptproblem).

## Phase 1 — Rechts-Fixes
- TMG→DDG, TTDSG→TDDDG in allen Quellen (Grep über Output: 0 Treffer).
- „Firma" → „Unternehmen" auf den drei Rechtsseiten; Stand-Datum → Juni 2026.
- § 19-UStG-Hinweis im Footer aller Seiten + unter jedem Produktpreis.

## Phase 2 — Etsy-Link-System
- Zentrale Pflege in `data/products.json` (`etsyUrl` je Produkt + neu `etsyShopUrl` für den Footer). Leer ⇒ Build rendert „Bald auf Etsy verfügbar" (deaktiviert, `aria-disabled`) + „Frage vorab stellen →"-Link; URL eingetragen ⇒ klickbarer Button. Getestet in beide Richtungen.
- **Nebenbefund behoben:** 3 verwaiste Produktseiten gelöschter Produkte entfernt (`blumentopf-facette-pro`, `organizer-stack`, `wandobjekt-spectra` — waren noch live, mit toten Links).

## Phase 3 — Performance & SEO
- **31,2 MB PNG → 1,7 MB WebP** (44 Bilder, `tools/optimize-images.mjs`); `<picture>`-Fallbacks mit echten Bildmaßen (PNG-Header-Parser in `build.js`, nur Builtins); LCP-Bilder mit `fetchpriority="high"`; CSS-Backgrounds auf WebP.
- JSON-LD: Organization (alle Seiten), Product **ohne** `offers` bis Etsy live (schaltet automatisch um), BreadcrumbList, FAQPage (aus FAQ-Quelle generiert) — alle Blöcke parse-validiert.
- Title-Fix (`Floppa3D | Floppa3D` → sprechender Startseiten-Title), 404-Texte, OG-Share-Card (`assets/og/home.png`, Layer-Line-Look), Apple-Touch-Icon + 192/512-Icons + `site.webmanifest`.
- **Bonus:** `assets/fonts/` war leer (Site lief auf System-Fallbacks!) — Fraunces, Inter Tight, JetBrains Mono als Variable Fonts (latin, SIL OFL) self-hosted geladen (`tools/fetch-fonts.mjs`, ~200 KB gesamt) + Preloads.

## Phase 4 — Texte
- Hero-Lead, Über-uns-Snippet, Shop-Lead, About-Werte, FAQ-Versandantwort (inkl. Du/Sie-Fix) humanisiert — Details in `docs/COPY-CHANGES.md`. Produkttexte waren bereits auf Ziel-Ton und blieben unangetastet. `[INPUT:…]`-Platzhalter auf About + Interviewfragen in OFFENE-PUNKTE.

## Phase 5 — Animationen
- View-Transition-Morph Shop ↔ Produktbild (`vt-<slug>`), Scroll-Reveals (bestehendes Observer-System vervollständigt, `html.js`-Gate für No-JS-Fallback), Layer-Print-Reveal auf Headlines (CSS scroll-driven, 5 Schichten), Karten-Hover mit Lift + Bild-Crossfade (nur `hover:hover`), Sticky Mobile-CTA (<768px, IntersectionObserver), klickbare Farb-Swatches aus `products.json` (Bildwechsel automatisch, sobald Farbbilder existieren). Alles hinter `prefers-reduced-motion` bzw. `@supports`.

## Phase 6 — 3D-/AR-Viewer
- `model-viewer` self-hosted (`assets/vendor/`), Sektion je Produktseite mit Auto-Einblendung nur bei vorhandenem GLB (HEAD-Check, Vendor-Code lädt erst dann). Export-Anleitung: `tools/README-3D.md`.

## Phase 7 — Neue Inhalte
- `auftragsdruck.html` (Hero, 3 Zielgruppen, Ablauf, Material, FAQ, CTA mit `?betreff=`-Prefill ins Kontaktformular) — in Hauptnavigation.
- `material.html` (PLA/PETG ehrlich eingeordnet, FAQ-Kompostierbarkeits-Formulierung wörtlich übernommen) — im Footer.
- `journal/` mit zwei Artikeln (PLA vs. PETG ~700 Wörter, Pflege ~650 Wörter) — im Footer.
- Hero-Timelapse-Slot (aktiviert sich selbst, sobald `assets/video/hero-timelapse.mp4` liegt), Analytics vorbereitet aber inaktiv (`docs/analytics-setup.md`, DSE-Entwurf), Insta-Grid zurückgestellt (keine Bilder in `assets/social/`).
- Sitemap um alle neuen Seiten erweitert (generiert).

## Selbsttest
- `tools/selftest.mjs` (bleibt im Repo): 21 HTML-Dateien — keine unersetzten Platzhalter, kein TMG/TTDSG/PLATZHALTER, alle internen Verweise existieren, keine externen Ressourcen-Loads (einzige Ausnahme bleibt die Formspree-Form-Action).
- Build deterministisch (kein Diff nach Re-Build), lokaler Server-Smoke-Test: alle Kernseiten + Assets 200.
- Commits ausschließlich als `f-floppa <florian.kindler@floppa3d.de>`.

## Abweichungen vom Playbook (bewusst)
1. Akzentfarbe ist Grün/Mint (`#00875A`/`#26B99F`) statt des angenommenen Teal — überall `var(--color-accent)` genutzt.
2. Scroll-Reveals über das vorhandene IntersectionObserver-System statt eines zweiten CSS-only-Systems (ein Mechanismus, gleiche Optik, breiterer Browser-Support).
3. Font-Dateinamen ohne `[ ] ,` (URL-sicher) — `typography.css` entsprechend angepasst.
4. `.gitignore` schützt jetzt `Gesellschaftsvertrag*` (lag untracked im öffentlichen Repo-Root).
5. Draft-PR nicht möglich: `gh` CLI ist nicht installiert → Branch nur gepusht (siehe OFFENE-PUNKTE).
