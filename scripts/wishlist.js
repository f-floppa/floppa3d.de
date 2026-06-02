/**
 * Wishlist Module
 * Persists liked products in localStorage.
 * Works on shop grid (product cards) and syncs count badge in header.
 */

const STORAGE_KEY = 'floppa3d-wishlist';

function getWishlist() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveWishlist(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

function updateBadge(set) {
  const badges = document.querySelectorAll('[data-wishlist-count]');
  badges.forEach((badge) => {
    const count = set.size;
    badge.textContent = count;
    badge.hidden = count === 0;
  });
}

function syncButtons(set) {
  document.querySelectorAll('[data-wishlist-btn]').forEach((btn) => {
    const slug = btn.dataset.slug;
    const active = set.has(slug);
    btn.setAttribute('aria-pressed', active);
    btn.classList.toggle('is-active', active);
    btn.setAttribute(
      'aria-label',
      active ? 'Von Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'
    );
  });
}

function setupWishlist() {
  const wishlist = getWishlist();

  syncButtons(wishlist);
  updateBadge(wishlist);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wishlist-btn]');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const slug = btn.dataset.slug;
    const current = getWishlist();

    if (current.has(slug)) {
      current.delete(slug);
    } else {
      current.add(slug);
    }

    saveWishlist(current);
    syncButtons(current);
    updateBadge(current);
  });

  // Wishlist nav button: link to shop with wishlist filter
  // (simple: just go to shop.html, full wishlist page is future work)
  document.querySelectorAll('[data-wishlist-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = '/shop.html';
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupWishlist);
} else {
  setupWishlist();
}
