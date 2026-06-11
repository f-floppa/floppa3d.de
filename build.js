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
// HTML Generators
// -----------------------------------------------------------------------------

function generateGallery(images, name) {
  if (!images || images.length === 0) return '';
  const main = images[0];
  const safeName = escapeAttr(name);

  let html = '<div class="gallery">';
  html += `<figure class="gallery__main" id="gallery-main">`;
  html += `<img src="/assets/products/${escapeAttr(main)}" alt="${safeName}" loading="eager" decoding="async" width="1200" height="1200">`;
  html += `</figure>`;

  html += '<div class="gallery__thumbs">';
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = `/assets/products/${escapeAttr(img)}`;
    const current = i === 0 ? ' aria-current="true"' : '';
    html += `<button class="gallery__thumb" data-src="${src}" data-index="${i}" aria-label="Bild ${i + 1} anzeigen"${current}>`;
    html += `<img src="${src}" alt="" loading="lazy" decoding="async" width="200" height="200">`;
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

function generateColors(colors) {
  if (!colors || colors.length === 0) return '';
  let html = '<section class="product__colors" aria-label="Verfügbare Farben">';
  html += '<h3 class="eyebrow">Farben</h3>';
  html += '<ul class="cluster">';
  for (const c of colors) {
    html += `<li class="color-chip">${escapeHtml(c)}</li>`;
  }
  html += '</ul></section>';
  return html;
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

function productCard(p) {
  const img = (p.images && p.images[0]) ? p.images[0] : 'placeholder.webp';
  return `<a class="product-card" href="/produkte/${escapeAttr(p.slug)}.html">
    <figure class="product-card__image-wrap">
      <img src="/assets/products/${escapeAttr(img)}" alt="${escapeAttr(p.name)}" loading="lazy" decoding="async" width="600" height="600">
    </figure>
    <div class="product-card__body">
      <p class="eyebrow">${escapeHtml(p.categoryLabel)} · ${escapeHtml(p.material)}</p>
      <h3 class="product-card__title serif">${escapeHtml(p.name)}</h3>
      <p class="product-card__price">${escapeHtml(p.price)}</p>
    </div>
  </a>`;
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
    "url": url,
    "offers": {
      "@type": "Offer",
      "price": product.priceNumeric,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": safeUrl(product.etsyUrl)
    }
  };
  // Defensive: escape any "</" inside JSON to prevent breaking the script tag
  const json = JSON.stringify(data).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">${json}</script>`;
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

function renderFooter() {
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
          <li><a class="site-footer__nav-link" href="https://www.etsy.com/de/shop/Floppa3D" target="_blank" rel="noopener noreferrer">Etsy</a></li>
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
    etsyUrl: escapeAttr(safeUrl(product.etsyUrl)),
    galleryHtml: generateGallery(product.images, product.name),
    detailsHtml: generateDetails(product.details),
    colorsHtml: generateColors(product.colors),
    relatedHtml: generateRelated(product.slug, product.category, allProducts)
  };

  const innerContent = renderTemplate(productTpl, productData);

  const ogImage = product.images && product.images[0]
    ? `${SITE_URL}/assets/products/${product.images[0]}`
    : `${SITE_URL}/assets/logos/full-on-light.png`;

  const layoutData = {
    title: escapeHtml(product.name),
    description: escapeAttr(product.shortDescription),
    canonicalUrl: `${SITE_URL}/produkte/${product.slug}.html`,
    ogType: 'product',
    ogImage: ogImage,
    jsonLd: generateJsonLd(product),
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
  { name: 'index',       output: 'index.html',        title: 'Floppa3D',                    description: 'Floppa3D – Professional Print Studio. Minimalistische Objekte aus dem 3D-Drucker: Blume, Deko, Organisation. Aus PLA und PETG, Made in Germany.', ogType: 'website' },
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

  const layoutData = {
    title: escapeHtml(page.title),
    description: escapeAttr(page.description),
    canonicalUrl: canonicalUrl,
    ogType: page.ogType,
    ogImage: `${SITE_URL}/assets/logos/full-on-light.png`,
    jsonLd: '',
    header: renderHeader(),
    footer: renderFooter(),
    content: innerContent
  };

  return renderTemplate(layoutTpl, layoutData);
}

function productCardWithDataAttrs(p) {
  const img = (p.images && p.images[0]) ? p.images[0] : 'placeholder.webp';
  const tags = (p.tags || []).join(',');
  return `<a class="product-card" href="/produkte/${escapeAttr(p.slug)}.html"
    data-product
    data-category="${escapeAttr(p.category)}"
    data-material="${escapeAttr(p.material.toLowerCase())}"
    data-tags="${escapeAttr(tags)}">
    <figure class="product-card__image-wrap">
      <img src="/assets/products/${escapeAttr(img)}" alt="${escapeAttr(p.name)}" loading="lazy" decoding="async" width="600" height="600">
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
  const { products } = JSON.parse(productsRaw);
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
