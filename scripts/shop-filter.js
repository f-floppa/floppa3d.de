/**
 * Shop Filter Module
 * Handles category and material filtering with URL state persistence
 */

/**
 * Gets all active filters grouped by filter-group
 */
function getActiveFilters() {
  const filters = new Map();

  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const groupName = group.getAttribute('data-filter-group');
    const active = Array.from(group.querySelectorAll('[data-filter][data-state="active"]')).map(
      (btn) => btn.getAttribute('data-filter').split(':')[1]
    );

    if (active.length > 0) {
      filters.set(groupName, active);
    }
  });

  return filters;
}

/**
 * Checks if a product matches all active filter groups
 */
function productMatches(product, activeFilters) {
  for (const [groupName, values] of activeFilters) {
    const productValue = product.getAttribute(`data-${groupName}`);
    if (!productValue || !values.includes(productValue)) {
      return false;
    }
  }
  return true;
}

/**
 * Applies filters and updates product visibility
 */
function applyFilters() {
  const activeFilters = getActiveFilters();
  const products = document.querySelectorAll('[data-product]');
  let visibleCount = 0;

  products.forEach((product) => {
    const isVisible = activeFilters.size === 0 || productMatches(product, activeFilters);
    product.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount++;
  });

  // Update result count if present
  const countEl = document.querySelector('[data-result-count]');
  if (countEl) {
    countEl.textContent = `${visibleCount} ${visibleCount === 1 ? 'Ergebnis' : 'Ergebnisse'}`;
  }

  // Show/hide empty state
  const emptyState = document.querySelector('[data-empty-state]');
  if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? '' : 'none';
  }

  // Update URL
  updateFilterUrl(activeFilters);
}

/**
 * Updates the URL with current filter state
 */
function updateFilterUrl(activeFilters) {
  const params = new URLSearchParams();

  for (const [groupName, values] of activeFilters) {
    params.set(groupName, values.join(','));
  }

  const queryString = params.toString();
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}

/**
 * Loads filters from URL and sets button states
 */
function loadFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);

  params.forEach((value, groupName) => {
    const values = value.split(',');
    const group = document.querySelector(`[data-filter-group="${groupName}"]`);

    if (group) {
      values.forEach((val) => {
        const btn = group.querySelector(`[data-filter="kategorie:${val}"], [data-filter="${groupName}:${val}"]`);
        if (btn) {
          btn.setAttribute('data-state', 'active');
        }
      });
    }
  });
}

/**
 * Sets up filter button listeners
 */
function setupFilterListeners() {
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const filterValue = btn.getAttribute('data-filter');

      // "all" button resets all filters in the group
      if (filterValue === 'all') {
        const group = btn.closest('[data-filter-group]');
        if (group) {
          group.querySelectorAll('[data-filter]').forEach((b) => {
            b.removeAttribute('data-state');
          });
        }
      } else {
        // Toggle active state on filter button
        const isActive = btn.getAttribute('data-state') === 'active';
        if (isActive) {
          btn.removeAttribute('data-state');
        } else {
          btn.setAttribute('data-state', 'active');
        }

        // Deactivate "all" button if any specific filter is active
        const group = btn.closest('[data-filter-group]');
        if (group) {
          const allBtn = group.querySelector('[data-filter="all"]');
          if (allBtn) {
            allBtn.removeAttribute('data-state');
          }
        }
      }

      applyFilters();
    });
  });
}

/**
 * Main initialization
 */
function init() {
  loadFiltersFromUrl();
  setupFilterListeners();
  applyFilters();
}

/**
 * Run init when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init, getActiveFilters, applyFilters };
