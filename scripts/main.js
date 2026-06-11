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

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('is-open');
    menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', !isOpen);
  });

  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
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

  if (!mainImg || thumbs.length === 0) return;

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
