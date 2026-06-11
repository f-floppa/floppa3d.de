# Offene Punkte — nur Florian/Paul können das liefern

## [P2] Etsy-URLs eintragen, sobald der Shop live ist (5 Min)
- **Was fehlt:** Echte Etsy-URLs (Shop + 6 Listings)
- **Wo:** `data/products.json` → `etsyShopUrl` (Shop-Link für Footer) und je Produkt `etsyUrl`
- **Danach:** `node build.js` ausführen und committen. Buttons, Footer-Link und JSON-LD-`offers` schalten automatisch um.
- **Zusätzlich manuell:** Etsy-Block auf `pages/kontakt.html` wieder auf den Shop verlinken (steht aktuell auf „Bald verfügbar").
