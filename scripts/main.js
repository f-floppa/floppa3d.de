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
  const reveals = document.querySelectorAll('.reveal, .reveal--stagger');

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
      threshold: 0.08,
      rootMargin: '0px 0px -80px 0px',
    }
  );

  reveals.forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Gallery: hover = preview, click = select, mouseleave = revert to selected
 * Also wires up tap-to-zoom lightbox and mobile swipe pagination dots.
 */
function setupGallery() {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;

  const mainImg = gallery.querySelector('.gallery__main img');
  const thumbs = gallery.querySelectorAll('.gallery__thumb');

  if (mainImg && thumbs.length > 0) {
    let selectedSrc = mainImg.src;

    function setMainSrc(src) {
      mainImg.src = src;
    }

    function setSelected(thumb) {
      thumbs.forEach((t) => t.removeAttribute('aria-current'));
      thumb.setAttribute('aria-current', 'true');
      selectedSrc = thumb.dataset.src;
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('mouseenter', () => setMainSrc(thumb.dataset.src));
      thumb.addEventListener('mouseleave', () => setMainSrc(selectedSrc));
      thumb.addEventListener('click', () => {
        setSelected(thumb);
        setMainSrc(selectedSrc);
      });
    });
  }

  // Tap-to-Zoom lightbox
  setupGalleryZoom(gallery);

  // Mobile swipe pagination dots
  setupGallerySwipe(gallery);
}

/**
 * Tap-to-Zoom: click the main image to open a <dialog> lightbox.
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
 * Mobile swipe gallery: sync pagination dots with scroll-snap track.
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
 * Works across both the desktop sticky bar and the mobile bottom-sheet.
 * - Click chip: toggle on/off (multiple allowed per group)
 * - "Alle" clears both groups
 * - Empty group = no restriction (show all)
 * - URL param ?kategorie=blumen,deko&material=pla pre-selects on load
 */
function setupShopFilter() {
  // All chips — desktop bar + bottom sheet
  const chips = document.querySelectorAll('.shop-filter__chip[data-filter]');
  if (chips.length === 0) return;

  const cards = document.querySelectorAll('[data-product]');
  const emptyState = document.querySelector('[data-empty-state]');
  const countEl = document.querySelector('[data-result-count]');
  const activeCountEl = document.querySelector('[data-filter-active-count]');

  const active = {
    kategorie: new Set(),
    material: new Set(),
  };

  function activeTotal() {
    return active.kategorie.size + active.material.size;
  }

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
    if (activeCountEl) {
      const n = activeTotal();
      activeCountEl.textContent = n;
      activeCountEl.hidden = n === 0;
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

  const params = new URLSearchParams(window.location.search);
  const katParam = params.get('kategorie');
  const matParam = params.get('material');
  if (katParam) katParam.split(',').forEach((v) => v && active.kategorie.add(v.trim()));
  if (matParam) matParam.split(',').forEach((v) => v && active.material.add(v.trim()));

  syncChipStates();
  applyFilter();
}

/**
 * Mobile bottom-sheet filter panel.
 */
function setupFilterSheet() {
  const sheet = document.querySelector('[data-filter-sheet]');
  if (!sheet) return;

  const openBtns = document.querySelectorAll('[data-filter-sheet-open]');
  const closeBtns = document.querySelectorAll('[data-filter-sheet-close]');

  function openSheet() {
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtns.forEach((btn) => btn.addEventListener('click', openSheet));
  closeBtns.forEach((btn) => btn.addEventListener('click', closeSheet));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) closeSheet();
  });
}

/**
 * Scroll progress bar at the top of the viewport.
 * Reflects how far through the document the user has scrolled.
 */
function setupScrollProgress() {
  if (REDUCED_MOTION.matches) return;
  const bar = document.querySelector('[data-scroll-progress]');
  if (!bar) return;

  let ticking = false;
  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}

/**
 * Sticky CTA bar on product detail pages:
 * shows when the in-page CTA scrolls out of view (mobile only via CSS).
 */
function setupStickyProductCta() {
  const sticky = document.querySelector('[data-sticky-cta]');
  const cta = document.querySelector('[data-product-cta]');
  if (!sticky || !cta) return;

  // Reserve bottom space on mobile so the sticky bar never overlaps content
  document.body.classList.add('has-sticky-cta');

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      const show = !entry.isIntersecting;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
    },
    { threshold: 0, rootMargin: '0px 0px -10px 0px' }
  );

  observer.observe(cta);
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
  setupFilterSheet();
  setupScrollProgress();
  setupStickyProductCta();
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
