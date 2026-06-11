# Offene Punkte — nur Florian/Paul können das liefern

## [P7] Hero-Timelapse drehen (sobald möglich)
- **Was fehlt:** Video eines Drucks im Zeitraffer: 10–15 s, 1080p, loopfähig, **< 15 MB**
- **Wo:** `assets/video/hero-timelapse.mp4` ablegen — die Startseite bindet es automatisch ein (bei Reduced-Motion bleibt es aus). Kein Build nötig.

## [P7] Instagram-Grid (10 Min)
- **Was fehlt:** Mindestens 6 quadratische Bilder unter `assets/social/`
- **Status:** Bewusst noch nicht eingebaut (kein Embed, keine externen Scripts geplant — statisches Grid mit Link aufs Profil). Bilder ablegen, dann kurz Bescheid geben oder selbst ein 6er-Grid auf der Startseite ergänzen.

## [P7] Analytics aktivieren (optional, 5 Min)
- Vorbereitet aber inaktiv — Anleitung in `docs/analytics-setup.md`, DSE-Absatz-Entwurf in `docs/dse-absatz-analytics.md` (vor Einbau prüfen!).

## [Bonus] Schrift-Subsets prüfen (optional)
- Fraunces/Inter Tight/JetBrains Mono wurden als Variable Fonts (latin-Subset, SIL-OFL) self-hosted nach `assets/fonts/` geladen — die Site nutzt damit erstmals ihre eigentliche Typografie. Kurz visuell abnehmen.

## [P5] Farbbilder für Swatch-Bildwechsel (optional, ca. 30 Min)
- **Was fehlt:** Je Produkt Fotos/Renders pro Farbvariante — aktuell existiert für KEIN Produkt ein Farbbild
- **Schema:** `assets/products/<slug>/farbe-<name>.webp` (Name kleingeschrieben, Leerzeichen → `-`, Umlaute ae/oe/ue/ss; z. B. `farbe-sand-beige.webp`)
- **Danach:** `node build.js` — Swatches bekommen automatisch `data-img` und wechseln das Hauptbild.

## [P6] GLB + USDZ für alle 6 Produkte exportieren (ca. 20 Min/Produkt)
- **Was fehlt:** 3D-Modelle unter `assets/models/<slug>.glb` (+ `.usdz` für iOS-AR)
- **Anleitung:** `tools/README-3D.md` — Viewer erscheint automatisch, sobald die Dateien liegen.

## [P4] Interview-Input für die Über-uns-Seite (15 Min)
- **Was fehlt:** Persönliche Details für die Story (Platzhalter `[INPUT: …]` auf `pages/about.html`)
- **Fragen:**
  1. Wie seid ihr konkret zum 3D-Druck gekommen?
  2. Was war euer erster Drucker?
  3. Woher kommt der Name „Floppa"?
  4. Wer entwirft, wer druckt?
  5. Lieblingsstück im Sortiment – und warum?
- **Danach:** Antworten an die Story-Absätze anfügen, Platzhalter entfernen, `node build.js`.

## [P2] Etsy-URLs eintragen, sobald der Shop live ist (5 Min)
- **Was fehlt:** Echte Etsy-URLs (Shop + 6 Listings)
- **Wo:** `data/products.json` → `etsyShopUrl` (Shop-Link für Footer) und je Produkt `etsyUrl`
- **Danach:** `node build.js` ausführen und committen. Buttons, Footer-Link und JSON-LD-`offers` schalten automatisch um.
- **Zusätzlich manuell:** Etsy-Block auf `pages/kontakt.html` wieder auf den Shop verlinken (steht aktuell auf „Bald verfügbar").
