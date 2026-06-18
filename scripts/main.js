/**
 * Main Site Module
 * Handles navigation, smooth scrolling, intersection observer for reveals, gallery
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Mobile navigation toggle
 */
function setupMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  const backdrop = document.querySelector('[data-nav-backdrop]');
  const closeBtn = document.querySelector('[data-nav-close]');

  if (!toggle || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    // Seite hinter dem offenen Menü nicht mitscrollen lassen
    document.body.classList.toggle('nav-open', open);
    if (open && closeBtn) closeBtn.focus();
    if (!open) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    setOpen(!menu.classList.contains('is-open'));
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => setOpen(false));
  }

  // Close menu on click outside (Backdrop) or on a drawer link
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('is-open')) return;
    if (e.target.closest('.site-header__drawer-link')) return; // Navigation läuft
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      setOpen(false);
    }
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
    }
  });
}

/**
 * Smooth scroll for anchor links
 */
function setupSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);

    if (!target) return;

    e.preventDefault();

    const behavior = REDUCED_MOTION.matches ? 'auto' : 'smooth';
    target.scrollIntoView({ behavior, block: 'start' });
  });
}

/**
 * Intersection Observer for reveal animations
 */
function setupRevealObserver() {
  const reveals = document.querySelectorAll('.reveal');

  // If reduced motion is preferred, just show all reveals immediately
  if (REDUCED_MOTION.matches) {
    reveals.forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '-50px',
    }
  );

  reveals.forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Gallery: hover = preview, click = select, mouseleave = revert to selected
 */
function setupGallery() {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;

  const mainImg = gallery.querySelector('.gallery__main img');
  const thumbs = gallery.querySelectorAll('.gallery__thumb');

  if (mainImg && thumbs.length > 0) {
    let selectedSrc = mainImg.src;

    function setMainSrc(src) {
      // Bei <picture> gewinnt die <source> — beide nachziehen
      const source = mainImg.parentElement.querySelector('source');
      if (source) source.srcset = src.replace(/\.png$/i, '.webp');
      mainImg.src = src;
    }

    function setSelected(thumb) {
      thumbs.forEach((t) => t.removeAttribute('aria-current'));
      thumb.setAttribute('aria-current', 'true');
      selectedSrc = thumb.dataset.src;
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('mouseenter', () => {
        setMainSrc(thumb.dataset.src);
      });

      thumb.addEventListener('mouseleave', () => {
        setMainSrc(selectedSrc);
      });

      thumb.addEventListener('click', () => {
        setSelected(thumb);
        setMainSrc(selectedSrc);
      });
    });
  }

  // Tap-to-Zoom Lightbox (Desktop) + mobile Swipe-Pagination
  setupGalleryZoom(gallery);
  setupGallerySwipe(gallery);
}

/**
 * Tap-to-Zoom: Klick aufs Hauptbild öffnet eine <dialog>-Lightbox.
 */
function setupGalleryZoom(gallery) {
  const trigger = gallery.querySelector('[data-gallery-zoom]');
  if (!trigger) return;

  let dialog = document.querySelector('.gallery-lightbox');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'gallery-lightbox';
    dialog.setAttribute('aria-label', 'Bildvorschau');
    dialog.innerHTML = `
      <button class="gallery-lightbox__close" aria-label="Schließen" autofocus>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <figure class="gallery-lightbox__figure">
        <img class="gallery-lightbox__img" src="" alt="">
      </figure>`;
    document.body.appendChild(dialog);

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('.gallery-lightbox__close')) {
        dialog.close();
      }
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dialog.close();
    });
  }

  const lightboxImg = dialog.querySelector('.gallery-lightbox__img');

  trigger.style.cursor = 'zoom-in';
  trigger.addEventListener('click', () => {
    lightboxImg.src = trigger.src;
    lightboxImg.alt = trigger.alt;
    dialog.showModal();
  });
}

/**
 * Mobile Swipe-Galerie: Pagination-Dots mit dem Scroll-Snap-Track synchronisieren.
 */
function setupGallerySwipe(gallery) {
  const track = gallery.querySelector('.gallery__swipe-track');
  const dots = gallery.querySelectorAll('.gallery__swipe-dot');
  if (!track || dots.length === 0) return;

  function updateDots() {
    const slides = track.querySelectorAll('.gallery__swipe-slide');
    if (slides.length === 0) return;
    const slideWidth = slides[0].offsetWidth;
    if (slideWidth === 0) return;
    const index = Math.round(track.scrollLeft / slideWidth);
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  }

  track.addEventListener('scroll', updateDots, { passive: true });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const slides = track.querySelectorAll('.gallery__swipe-slide');
      if (slides[i]) {
        track.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' });
      }
    });
  });
}

/**
 * Shop filter: multi-select chips for kategorie + material.
 * - Click chip: toggle on/off (multiple allowed per group)
 * - "Alle" clears the kategorie group
 * - Empty group = no restriction (show all)
 * - URL param ?kategorie=blumen,deko&material=pla pre-selects on load
 */
function setupShopFilter() {
  const chips = document.querySelectorAll('.shop-filter__chip[data-filter]');
  if (chips.length === 0) return;

  const cards = document.querySelectorAll('[data-product]');
  const emptyState = document.querySelector('[data-empty-state]');
  const countEl = document.querySelector('[data-result-count]');

  // Active filter state: Sets per group
  const active = {
    kategorie: new Set(),
    material: new Set(),
  };

  function applyFilter() {
    let visible = 0;
    cards.forEach((card) => {
      const catMatch = active.kategorie.size === 0 || active.kategorie.has(card.dataset.category);
      const matMatch = active.material.size  === 0 || active.material.has(card.dataset.material);
      const show = catMatch && matMatch;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (emptyState) emptyState.hidden = visible > 0;
    if (countEl) {
      countEl.textContent = visible === cards.length
        ? `${visible} Stücke`
        : `${visible} von ${cards.length} Stücken`;
    }
  }

  function syncChipStates() {
    chips.forEach((chip) => {
      const val = chip.dataset.filter;
      if (val === 'all') {
        const noneActive = active.kategorie.size === 0 && active.material.size === 0;
        chip.classList.toggle('is-active', noneActive);
      } else {
        const [group, value] = val.split(':');
        chip.classList.toggle('is-active', active[group]?.has(value));
      }
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.filter;
      if (val === 'all') {
        active.kategorie.clear();
        active.material.clear();
      } else {
        const [group, value] = val.split(':');
        if (active[group].has(value)) {
          active[group].delete(value);
        } else {
          active[group].add(value);
        }
      }
      syncChipStates();
      applyFilter();
    });
  });

  // Read URL params on load: comma-separated for multi-select
  // ?kategorie=blumen,deko&material=pla
  const params = new URLSearchParams(window.location.search);
  const katParam = params.get('kategorie');
  const matParam = params.get('material');

  if (katParam) {
    katParam.split(',').forEach((v) => v && active.kategorie.add(v.trim()));
  }
  if (matParam) {
    matParam.split(',').forEach((v) => v && active.material.add(v.trim()));
  }

  syncChipStates();
  applyFilter();
}

/**
 * Sticky Mobile-CTA auf Produktseiten:
 * sichtbar, sobald der Haupt-CTA aus dem Viewport gescrollt ist
 */
function setupStickyCta() {
  const cta = document.querySelector('.product__cta');
  const bar = document.querySelector('.sticky-cta');
  if (!cta || !bar) return;

  new IntersectionObserver(([entry]) => {
    bar.hidden = entry.isIntersecting;
  }).observe(cta);
}

/**
 * Farb-Swatches: Auswahl-Status + Label; Bildwechsel nur bei data-img
 */
function setupSwatches() {
  document.querySelectorAll('.swatches').forEach((group) => {
    const label = group.closest('section, main')?.querySelector('.swatch-label');
    const buttons = group.querySelectorAll('button');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        if (label) label.textContent = `Gewählte Farbe: ${btn.dataset.color}`;

        if (btn.dataset.img) {
          const img = document.querySelector('.gallery__main img');
          const source = document.querySelector('.gallery__main source');
          if (source) source.srcset = btn.dataset.img;
          if (img) img.src = btn.dataset.img;
        }
      });
    });
  });
}

/**
 * 3D-/AR-Viewer: Sektion nur einblenden (und Vendor-Code nur laden),
 * wenn das GLB-Modell wirklich existiert — sonst bleibt alles unsichtbar.
 */
function setupViewer3d() {
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
    } catch (e) {
      /* offline/Fehler → Sektion bleibt verborgen, keine Konsolen-Fehler */
    }
  });
}

/**
 * Timelapse-Hero: Video nur einbinden, wenn die Datei existiert
 * und keine Reduced-Motion-Präferenz gesetzt ist.
 */
async function setupHeroVideo() {
  const hero = document.querySelector('.hero--featured');
  if (!hero || REDUCED_MOTION.matches) return;

  try {
    const r = await fetch('/assets/video/hero-timelapse.mp4', { method: 'HEAD' });
    if (!r.ok) return;
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true });
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.src = '/assets/video/hero-timelapse.mp4';
    v.className = 'hero-video';
    v.setAttribute('aria-hidden', 'true');
    hero.prepend(v);
  } catch (e) {
    /* Datei fehlt/offline → Hero bleibt wie gehabt */
  }
}

/**
 * Kontaktformular: ?betreff=… aus der URL ins Betreff-Feld übernehmen
 */
function setupContactPrefill() {
  const subject = document.getElementById('contact-subject');
  if (!subject) return;
  const betreff = new URLSearchParams(window.location.search).get('betreff');
  if (betreff && !subject.value) subject.value = betreff;
}

/**
 * Main initialization function
 */
function init() {
  setupMobileNav();
  setupSmoothScroll();
  setupRevealObserver();
  setupGallery();
  setupShopFilter();
  setupStickyCta();
  setupSwatches();
  setupViewer3d();
  setupHeroVideo();
  setupContactPrefill();
}

/**
 * Run init when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init };
