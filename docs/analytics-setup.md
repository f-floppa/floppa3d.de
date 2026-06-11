# Analytics aktivieren (GoatCounter, cookielos) — ca. 5 Min

Vorbereitet, aber bewusst **inaktiv**. Zum Aktivieren:

1. Gratis-Account auf [goatcounter.com](https://www.goatcounter.com) anlegen → eigenen Code wählen (z. B. `floppa3d`).
2. `count.js` herunterladen (https://gc.zgo.at/count.js) und als `assets/vendor/count.js` ablegen (Self-Hosting, kein CDN).
3. In `templates/_layout.html` im auskommentierten Analytics-Block `CODE` durch den eigenen Code ersetzen und die Kommentar-Zeichen (`<!--` / `-->`) entfernen.
4. Den Absatz aus `docs/dse-absatz-analytics.md` **prüfen** und in die Datenschutzerklärung (`pages/datenschutz.html`) einfügen.
5. `node build.js` ausführen und committen.

Reihenfolge wichtig: Erst Datenschutzerklärung ergänzen, dann live schalten.
