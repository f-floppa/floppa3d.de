/**
 * build.js — Static Site Builder for Floppa3D
 *
 * Reads `data/products.json` and renders product detail pages from
 * `templates/product.html` wrapped in `templates/_layout.html`. Also
 * generates `sitemap.xml` and `robots.txt`.
 *
 * Run: `node build.js`
 *
 * Uses only Node.js builtins (fs, path). No npm install needed.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE_URL = 'https://floppa3d.de';
const ETSY_PREFIX = 'https://www.etsy.com/';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function writeFile(rel, content) {
  const fullPath = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

/**
 * Whitelist URLs to prevent injection of javascript:, data:, etc.
 * Only allow https Etsy URLs and our own relative paths.
 */
function safeUrl(url) {
  if (!url) return '#';
  const s = String(url).trim();
  if (s.startsWith('/') || s.startsWith('#')) return s;
  if (s.startsWith(ETSY_PREFIX)) return s;
  if (s.startsWith(SITE_URL)) return s;
  return '#';
}

function renderTemplate(tpl, data) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return data[key] != null ? data[key] : '';
  });
}

// -----------------------------------------------------------------------------
// Images: echte PNG-Maße lesen (IHDR-Header, nur Builtins) + <picture>-Helper
// -----------------------------------------------------------------------------

const PNG_DIM_CACHE = new Map();

function pngDimensions(relPath) {
  if (PNG_DIM_CACHE.has(relPath)) return PNG_DIM_CACHE.get(relPath);
  let dims = null;
  try {
    const fd = fs.openSync(path.join(ROOT, relPath), 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf.readUInt32BE(12) === 0x49484452) { // "IHDR"
      dims = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
  } catch (e) { /* Datei fehlt → Fallback-Maße des Aufrufers */ }
  PNG_DIM_CACHE.set(relPath, dims);
  return dims;
}

/**
 * <picture> mit WebP-Quelle und PNG-Fallback. `srcPng` beginnt mit "/".
 * priority=true → fetchpriority=high statt lazy (für LCP-Bilder).
 */
function pictureHtml(srcPng, alt, { fallbackW = 600, fallbackH = 600, priority = false } = {}) {
  const webp = srcPng.replace(/\.png$/i, '.webp');
  const dims = pngDimensions(srcPng.slice(1)) || { width: fallbackW, height: fallbackH };
  const loadingAttrs = priority
    ? 'fetchpriority="high" decoding="async"'
    : 'loading="lazy" decoding="async"';
  return `<picture><source srcset="${escapeAttr(webp)}" type="image/webp"><img src="${escapeAttr(srcPng)}" alt="${escapeAttr(alt)}" width="${dims.width}" height="${dims.height}" ${loadingAttrs}></picture>`;
}

// -----------------------------------------------------------------------------
// HTML Generators
// -----------------------------------------------------------------------------

function generateGallery(images, name, slug) {
  if (!images || images.length === 0) return '';
  const main = images[0];

  let html = '<div class="gallery">';
  html += `<figure class="gallery__main" id="gallery-main" style="view-transition-name: vt-${escapeAttr(slug)}">`;
  html += pictureHtml(`/assets/products/${main}`, name, { priority: true });
  html += `</figure>`;

  html += '<div class="gallery__thumbs">';
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = `/assets/products/${escapeAttr(img)}`;
    const current = i === 0 ? ' aria-current="true"' : '';
    html += `<button class="gallery__thumb" data-src="${src}" data-index="${i}" aria-label="Bild ${i + 1} anzeigen"${current}>`;
    html += pictureHtml(`/assets/products/${img}`, '', { fallbackW: 200, fallbackH: 200 });
    html += `</button>`;
  }
  html += '</div>';

  html += '</div>';
  return html;
}

function generateDetails(details) {
  if (!details) return '';
  let html = '<dl class="details-list">';
  for (const [key, value] of Object.entries(details)) {
    html += `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`;
  }
  html += '</dl>';
  return html;
}

/**
 * Farb-Swatches: Hex-Näherungen an die Brand-Palette.
 * Unbekannte Farbnamen fallen auf neutrales Grau zurück (Name bleibt sichtbar).
 */
const COLOR_HEX = {
  'Sand Beige': '#D6C4A8',
  'Sage Green': '#9CAF88',
  'Terracotta': '#C56B4E',
  'Matt Schwarz': '#3A3A3A',
  'Matte Black': '#2B2B2B',
  'Cremeweiß': '#F2EFE9',
  'Matt Weiß': '#F2EFE9',
  'Arctic White': '#F4F6F5',
  'Marble White': '#EDEAE4',
  'Olive Green': '#7A8450',
  'Forest Green': '#2F4F3E',
  'Moss Green': '#6B7F59',
  'Dusty Rose': '#C9A9A6',
  'Soft Peach': '#F2C4A8',
  'Soft Lavender': '#B9A7C9',
  'Lavendel': '#B9A7C9',
  'Stone Grey': '#9A9A94',
  'Warm Grey': '#A39E93',
  'Sandstone': '#C8B597',
  'Clay Brown': '#9B6A4F',
  'Matte Cream': '#EFE6D5'
};

function colorFileSlug(name) {
  return name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, '-');
}

function generateColors(colors, slug) {
  if (!colors || colors.length === 0) return '';
  let html = '<section class="product__colors" aria-label="Verfügbare Farben">';
  html += '<h3 class="eyebrow">Farben</h3>';
  html += '<div class="swatches" role="group" aria-label="Farbe wählen">';
  colors.forEach((c, i) => {
    const hex = COLOR_HEX[c] || '#8A8A8A';
    // Bildwechsel nur, wenn ein Farbbild wirklich existiert
    const rel = `assets/products/${slug}/farbe-${colorFileSlug(c)}.webp`;
    const dataImg = fs.existsSync(path.join(ROOT, rel)) ? ` data-img="/${rel}"` : '';
    html += `<button type="button" data-color="${escapeAttr(c)}" title="${escapeAttr(c)}" aria-label="${escapeAttr(c)}" aria-pressed="${i === 0 ? 'true' : 'false'}" style="--sw:${hex}"${dataImg}></button>`;
  });
  html += '</div>';
  html += `<p class="swatch-label text-sm">Gewählte Farbe: ${escapeHtml(colors[0])}</p>`;
  html += '</section>';
  return html;
}

/**
 * Etsy CTA: solange keine URL gepflegt ist (Shop noch nicht live),
 * wird ein deaktivierter "Bald verfügbar"-Zustand gerendert.
 */
function generateEtsyCta(product) {
  const href = safeUrl(product.etsyUrl);
  const isLive = Boolean(product.etsyUrl) && href !== '#';

  if (isLive) {
    return `<p class="text-sm text-muted">Kauf abgewickelt über Etsy.</p>
          <a class="btn btn--primary" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">
            <span>Auf Etsy ansehen</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
            </svg>
          </a>
          <a class="etsy-hint text-sm" href="/kontakt.html">Frage vorab stellen →</a>`;
  }

  return `<p class="text-sm text-muted">Der Verkauf startet in Kürze über Etsy.</p>
          <span class="btn btn--primary is-coming-soon" aria-disabled="true">Bald auf Etsy verfügbar</span>
          <a class="etsy-hint text-sm" href="/kontakt.html">Frage vorab stellen →</a>`;
}

/** Sticky Mobile-CTA (erscheint, sobald der Haupt-CTA aus dem Viewport scrollt) */
function generateStickyCta(product) {
  const href = safeUrl(product.etsyUrl);
  const isLive = Boolean(product.etsyUrl) && href !== '#';
  const btn = isLive
    ? `<a class="btn btn--primary btn--sm" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">Auf Etsy ansehen</a>`
    : `<span class="btn btn--primary btn--sm is-coming-soon" aria-disabled="true">Bald auf Etsy</span>`;
  return `<div class="sticky-cta" hidden>
  <span class="sticky-cta__price serif">${escapeHtml(product.price)} <small class="text-xs text-muted">zzgl. Versand</small></span>
  ${btn}
</div>`;
}

function generateRelated(currentSlug, currentCategory, allProducts) {
  const related = allProducts
    .filter(p => p.slug !== currentSlug && p.category === currentCategory)
    .slice(0, 3);

  if (related.length === 0) {
    // Fall back to any other products
    const fallback = allProducts.filter(p => p.slug !== currentSlug).slice(0, 3);
    return fallback.map(productCard).join('');
  }
  return related.map(productCard).join('');
}

/** Zweites Produktbild als Hover-Crossfade (nur wenn vorhanden) */
function cardAltImage(p) {
  if (!p.images || !p.images[1]) return '';
  return `<span class="product-card__img-alt" aria-hidden="true">${pictureHtml(`/assets/products/${p.images[1]}`, '')}</span>`;
}

function productCard(p) {
  const img = (p.images && p.images[0]) ? p.images[0] : 'placeholder.webp';
  return `<a class="product-card reveal" href="/produkte/${escapeAttr(p.slug)}.html">
    <figure class="product-card__image-wrap" style="view-transition-name: vt-${escapeAttr(p.slug)}">
      ${pictureHtml(`/assets/products/${img}`, p.name)}${cardAltImage(p)}
    </figure>
    <div class="product-card__body">
      <p class="eyebrow">${escapeHtml(p.categoryLabel)} · ${escapeHtml(p.material)}</p>
      <h3 class="product-card__title serif">${escapeHtml(p.name)}</h3>
      <p class="product-card__price">${escapeHtml(p.price)}</p>
    </div>
  </a>`;
}

function jsonLdScript(data) {
  // Defensive: escape any "</" inside JSON to prevent breaking the script tag
  const json = JSON.stringify(data).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">${json}</script>`;
}

function generateJsonLd(product) {
  const url = `${SITE_URL}/produkte/${product.slug}.html`;
  const images = (product.images || []).map(i => `${SITE_URL}/assets/products/${i}`);
  const data = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.shortDescription,
    "image": images,
    "brand": { "@type": "Brand", "name": "Floppa3D" },
    "category": product.categoryLabel,
    "material": product.material,
    "url": url
  };
  // offers erst, wenn der Etsy-Shop live ist (gepflegte etsyUrl)
  if (product.etsyUrl && safeUrl(product.etsyUrl) !== '#') {
    data.offers = {
      "@type": "Offer",
      "price": product.priceNumeric,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": safeUrl(product.etsyUrl)
    };
  }
  return jsonLdScript(data);
}

function generateOrgJsonLd() {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Floppa3D GbR",
    "url": SITE_URL,
    "logo": `${SITE_URL}/assets/logos/full-on-light.png`,
    "email": "management@floppa3d.de",
    "telephone": "+49 1515 4837335",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auweg 45",
      "postalCode": "85375",
      "addressLocality": "Neufarn bei Freising",
      "addressCountry": "DE"
    },
    "sameAs": ["https://www.instagram.com/floppa3d_ppstudio/"]
  });
}

function generateBreadcrumbJsonLd(product) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Start", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": `${SITE_URL}/shop.html` },
      { "@type": "ListItem", "position": 3, "name": product.name }
    ]
  });
}

/**
 * FAQPage-Schema aus den <details class="faq-item">-Blöcken der FAQ-Quelle.
 * Antworttexte werden 1:1 (ohne Markup) übernommen.
 */
function generateFaqJsonLd(faqHtml) {
  const items = [];
  const re = /<details class="faq-item">\s*<summary>([\s\S]*?)<\/summary>\s*<div class="faq-item__content">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(faqHtml)) !== null) {
    const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    items.push({
      "@type": "Question",
      "name": strip(m[1]),
      "acceptedAnswer": { "@type": "Answer", "text": strip(m[2]) }
    });
  }
  if (items.length === 0) return '';
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items
  });
}

// -----------------------------------------------------------------------------
// Header / Footer (shared snippets)
// -----------------------------------------------------------------------------

function renderHeader() {
  return `<header class="site-header">
  <div class="container site-header__inner">
    <a class="site-header__logo" href="/" aria-label="Floppa3D Startseite">
      <img class="site-header__mark" src="/assets/logos/mark.svg" alt="" width="42" height="32" aria-hidden="true">
      <span class="site-header__wordmark serif">Floppa3D</span>
    </a>

    <nav class="site-header__nav" aria-label="Hauptnavigation">
      <ul class="site-header__nav-list">
        <li><a class="site-header__nav-link" href="/shop.html">Shop</a></li>
        <li><a class="site-header__nav-link" href="/about.html">Über uns</a></li>
        <li><a class="site-header__nav-link" href="/faq.html">FAQ</a></li>
        <li><a class="site-header__nav-link" href="/kontakt.html">Kontakt</a></li>
      </ul>
    </nav>

    <div class="site-header__actions">
      <button class="theme-toggle" type="button" aria-label="Hell-/Dunkelmodus wechseln" aria-pressed="false" data-theme-toggle>
        <span class="theme-toggle__icon" aria-hidden="true">◐</span>
      </button>
      <button class="site-header__hamburger" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="site-drawer" data-nav-toggle>
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <div class="site-header__drawer" id="site-drawer" data-nav-menu>
    <nav class="site-header__drawer-nav" aria-label="Mobile Navigation">
      <a class="site-header__drawer-link" href="/shop.html">Shop</a>
      <a class="site-header__drawer-link" href="/about.html">Über uns</a>
      <a class="site-header__drawer-link" href="/faq.html">FAQ</a>
      <a class="site-header__drawer-link" href="/kontakt.html">Kontakt</a>
    </nav>
  </div>
  <div class="site-header__backdrop" data-nav-backdrop aria-hidden="true"></div>
</header>`;
}

let ETSY_SHOP_URL = '';

function renderFooter(etsyShopUrl = ETSY_SHOP_URL) {
  const shopHref = safeUrl(etsyShopUrl);
  const etsyItem = (etsyShopUrl && shopHref !== '#')
    ? `<li><a class="site-footer__nav-link" href="${escapeAttr(shopHref)}" target="_blank" rel="noopener noreferrer">Etsy</a></li>`
    : `<li><span class="site-footer__nav-link site-footer__nav-link--soon">Etsy <span class="text-xs">(bald)</span></span></li>`;
  return `<footer class="site-footer">
  <div class="container">
    <div class="site-footer__grid">

      <div class="site-footer__brand">
        <a class="site-footer__logo" href="/" aria-label="Floppa3D Startseite">
          <img class="site-footer__mark" src="/assets/logos/mark.svg" alt="" width="42" height="32" aria-hidden="true">
          <span class="site-footer__wordmark serif">Floppa3D</span>
        </a>
        <p class="site-footer__tagline">Professional Print Studio · Made in Germany</p>
      </div>

      <nav aria-label="Footer-Navigation">
        <h3 class="site-footer__col-heading">Navigation</h3>
        <ul class="site-footer__nav-list">
          <li><a class="site-footer__nav-link" href="/shop.html">Shop</a></li>
          <li><a class="site-footer__nav-link" href="/about.html">Über uns</a></li>
          <li><a class="site-footer__nav-link" href="/faq.html">FAQ</a></li>
          <li><a class="site-footer__nav-link" href="/kontakt.html">Kontakt</a></li>
        </ul>
      </nav>

      <nav aria-label="Rechtliches">
        <h3 class="site-footer__col-heading">Rechtliches</h3>
        <ul class="site-footer__nav-list">
          <li><a class="site-footer__nav-link" href="/impressum.html">Impressum</a></li>
          <li><a class="site-footer__nav-link" href="/datenschutz.html">Datenschutz</a></li>
          <li><a class="site-footer__nav-link" href="/agb.html">AGB</a></li>
        </ul>
      </nav>

      <div>
        <h3 class="site-footer__col-heading">Folgen</h3>
        <ul class="site-footer__nav-list">
          <li><a class="site-footer__nav-link" href="https://www.instagram.com/floppa3d_ppstudio/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li><a class="site-footer__nav-link" href="#" rel="noopener">TikTok <span class="text-xs">(bald)</span></a></li>
          ${etsyItem}
        </ul>
      </div>

    </div>

    <div class="site-footer__bottom">
      <p class="site-footer__copyright text-xs">&copy; ${new Date().getFullYear()} Floppa3D · Alle Rechte vorbehalten.</p>
      <ul class="site-footer__legal-links text-xs">
        <li><a class="site-footer__legal-link" href="/impressum.html">Impressum</a></li>
        <li><a class="site-footer__legal-link" href="/datenschutz.html">Datenschutz</a></li>
      </ul>
    </div>
    <p class="legal-note">Kein Ausweis der Umsatzsteuer gemäß § 19 UStG (Kleinunternehmerregelung).</p>
  </div>
</footer>`;
}

// -----------------------------------------------------------------------------
// Build Pipeline
// -----------------------------------------------------------------------------

function buildProductPage(product, allProducts, layoutTpl, productTpl) {
  const productData = {
    name: escapeHtml(product.name),
    slug: escapeAttr(product.slug),
    category: escapeAttr(product.category),
    categoryLabel: escapeHtml(product.categoryLabel),
    material: escapeHtml(product.material),
    price: escapeHtml(product.price),
    shortDescription: escapeHtml(product.shortDescription),
    longDescription: escapeHtml(product.longDescription),
    etsyCtaHtml: generateEtsyCta(product),
    galleryHtml: generateGallery(product.images, product.name, product.slug),
    detailsHtml: generateDetails(product.details),
    colorsHtml: generateColors(product.colors, product.slug),
    stickyCtaHtml: generateStickyCta(product),
    relatedHtml: generateRelated(product.slug, product.category, allProducts)
  };

  const innerContent = renderTemplate(productTpl, productData);

  const ogImage = product.images && product.images[0]
    ? `${SITE_URL}/assets/products/${product.images[0]}`
    : `${SITE_URL}/assets/logos/full-on-light.png`;

  const layoutData = {
    title: escapeHtml(product.name),
    titleTag: escapeHtml(`${product.name} | Floppa3D`),
    description: escapeAttr(product.shortDescription),
    canonicalUrl: `${SITE_URL}/produkte/${product.slug}.html`,
    ogType: 'product',
    ogImage: ogImage,
    jsonLd: generateOrgJsonLd() + '\n  ' + generateJsonLd(product) + '\n  ' + generateBreadcrumbJsonLd(product),
    header: renderHeader(),
    footer: renderFooter(),
    content: innerContent
  };

  return renderTemplate(layoutTpl, layoutData);
}

function generateSitemap(products) {
  const staticPages = [
    { loc: '/',                 priority: '1.0' },
    { loc: '/shop.html',        priority: '0.9' },
    { loc: '/about.html',       priority: '0.7' },
    { loc: '/faq.html',         priority: '0.6' },
    { loc: '/kontakt.html',     priority: '0.6' },
    { loc: '/impressum.html',   priority: '0.3' },
    { loc: '/datenschutz.html', priority: '0.3' },
    { loc: '/agb.html',         priority: '0.3' }
  ];

  const productPages = products.map(p => ({
    loc: `/produkte/${p.slug}.html`,
    priority: '0.8'
  }));

  const all = [...staticPages, ...productPages];
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const page of all) {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>\n';
  return xml;
}

function generateRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// -----------------------------------------------------------------------------
// Static Pages
// -----------------------------------------------------------------------------

const STATIC_PAGES = [
  { name: 'index',       output: 'index.html',        title: 'Floppa3D',                    description: 'Floppa3D – Professional Print Studio. Minimalistische Objekte aus dem 3D-Drucker: Blume, Deko, Organisation. Aus PLA und PETG, Made in Germany.', ogType: 'website', ogImage: `${SITE_URL}/assets/og/home.png` },
  { name: 'shop',        output: 'shop.html',         title: 'Shop',                        description: 'Alle Stücke aus dem Floppa3D Studio. Filtern Sie nach Kategorie und Material – Blume, Deko, Organisation. Made in Germany aus PLA oder PETG.', ogType: 'website' },
  { name: 'about',       output: 'about.html',        title: 'Über uns',                    description: 'Wer steckt hinter Floppa3D, wie drucken wir und warum. Unsere Material-Philosophie und der Anspruch an gute Form.', ogType: 'article' },
  { name: 'faq',         output: 'faq.html',          title: 'FAQ',                         description: 'Antworten auf häufige Fragen zu Versand, Materialien, Pflege und Sonderwünschen. Verkauf läuft über Etsy.', ogType: 'website' },
  { name: 'kontakt',     output: 'kontakt.html',      title: 'Kontakt',                     description: 'Schreiben Sie uns – Kooperationen, Sonderanfertigungen oder Fragen zu unseren Produkten.', ogType: 'website' },
  { name: 'impressum',   output: 'impressum.html',    title: 'Impressum',                   description: 'Impressum nach § 5 DDG.', ogType: 'website' },
  { name: 'datenschutz', output: 'datenschutz.html',  title: 'Datenschutzerklärung',        description: 'Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.', ogType: 'website' },
  { name: 'agb',         output: 'agb.html',          title: 'Allgemeine Geschäftsbedingungen', description: 'Allgemeine Geschäftsbedingungen für die Nutzung von floppa3d.de.', ogType: 'website' },
  { name: '404',         output: '404.html',          title: 'Seite nicht gefunden',        description: 'Die angeforderte Seite konnte nicht gefunden werden.', ogType: 'website' }
];

function buildStaticPage(page, layoutTpl, allProducts) {
  const bodyPath = path.join(ROOT, 'pages', `${page.name}.html`);
  if (!fs.existsSync(bodyPath)) {
    console.log(`  ⚠ Skipping ${page.name}: body file missing`);
    return null;
  }
  let innerContent = fs.readFileSync(bodyPath, 'utf8');

  // Inject dynamic product data into static pages
  const featured = allProducts.filter(p => p.featured);
  const featuredProductsHtml = featured.map(productCard).join('\n');
  const allProductsHtml = allProducts.map(productCardWithDataAttrs).join('\n');
  const productCount = allProducts.length;

  innerContent = renderTemplate(innerContent, {
    featuredProductsHtml,
    allProductsHtml,
    productCount: String(productCount),
    year: String(new Date().getFullYear())
  });

  const isHome = page.name === 'index';
  const canonicalUrl = isHome ? `${SITE_URL}/` : `${SITE_URL}/${page.output}`;

  const titleTag = isHome
    ? 'Floppa3D – 3D-gedruckte Pflanztöpfe & Deko aus Bayern'
    : `${page.title} | Floppa3D`;

  let jsonLd = generateOrgJsonLd();
  if (page.name === 'faq') {
    jsonLd += '\n  ' + generateFaqJsonLd(innerContent);
  }

  const layoutData = {
    title: escapeHtml(page.title),
    titleTag: escapeHtml(titleTag),
    description: escapeAttr(page.description),
    canonicalUrl: canonicalUrl,
    ogType: page.ogType,
    ogImage: page.ogImage || `${SITE_URL}/assets/logos/full-on-light.png`,
    jsonLd: jsonLd,
    header: renderHeader(),
    footer: renderFooter(),
    content: innerContent
  };

  return renderTemplate(layoutTpl, layoutData);
}

function productCardWithDataAttrs(p) {
  const img = (p.images && p.images[0]) ? p.images[0] : 'placeholder.webp';
  const tags = (p.tags || []).join(',');
  return `<a class="product-card reveal" href="/produkte/${escapeAttr(p.slug)}.html"
    data-product
    data-category="${escapeAttr(p.category)}"
    data-material="${escapeAttr(p.material.toLowerCase())}"
    data-tags="${escapeAttr(tags)}">
    <figure class="product-card__image-wrap" style="view-transition-name: vt-${escapeAttr(p.slug)}">
      ${pictureHtml(`/assets/products/${img}`, p.name)}${cardAltImage(p)}
    </figure>
    <div class="product-card__body">
      <p class="eyebrow">${escapeHtml(p.categoryLabel)} · ${escapeHtml(p.material)}</p>
      <h3 class="product-card__title serif">${escapeHtml(p.name)}</h3>
      <p class="product-card__price">${escapeHtml(p.price)}</p>
    </div>
  </a>`;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

function main() {
  console.log('🛠   Floppa3D Build');
  console.log('───────────────────────────────────');

  const productsRaw = readFile('data/products.json');
  const { products, etsyShopUrl } = JSON.parse(productsRaw);
  ETSY_SHOP_URL = etsyShopUrl || '';
  console.log(`✓ Loaded ${products.length} products`);

  const layoutTpl = readFile('templates/_layout.html');
  const productTpl = readFile('templates/product.html');
  console.log('✓ Loaded templates');

  let productCount = 0;
  for (const product of products) {
    const html = buildProductPage(product, products, layoutTpl, productTpl);
    writeFile(`produkte/${product.slug}.html`, html);
    console.log(`  → produkte/${product.slug}.html`);
    productCount++;
  }

  let pageCount = 0;
  for (const page of STATIC_PAGES) {
    const html = buildStaticPage(page, layoutTpl, products);
    if (html) {
      writeFile(page.output, html);
      console.log(`  → ${page.output}`);
      pageCount++;
    }
  }

  writeFile('sitemap.xml', generateSitemap(products));
  console.log('✓ sitemap.xml');

  if (!fs.existsSync(path.join(ROOT, 'robots.txt'))) {
    writeFile('robots.txt', generateRobots());
    console.log('✓ robots.txt');
  }

  if (!fs.existsSync(path.join(ROOT, '.nojekyll'))) {
    writeFile('.nojekyll', '');
    console.log('✓ .nojekyll');
  }

  if (!fs.existsSync(path.join(ROOT, 'CNAME'))) {
    writeFile('CNAME', 'floppa3d.de\n');
    console.log('✓ CNAME');
  }

  console.log('───────────────────────────────────');
  console.log(`✓ Built ${productCount} product pages + ${pageCount} static pages.`);
}

main();
