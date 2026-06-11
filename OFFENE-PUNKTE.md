# Offene Punkte — nur Florian/Paul können das liefern

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
