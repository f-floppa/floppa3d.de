/**
 * Theme Toggle Module
 * Handles dark/light mode switching with LocalStorage persistence
 * and respect for prefers-color-scheme
 */

const THEME_KEY = 'floppa3d-theme';
const DARK_PREFERENCE = '(prefers-color-scheme: dark)';

/**
 * Gets the current theme: explicit (from dataset) or system preference
 */
function getCurrentTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit) return explicit;

  return window.matchMedia(DARK_PREFERENCE).matches ? 'dark' : 'light';
}

/**
 * Sets the theme on documentElement and updates localStorage
 */
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // Safari Private Mode / disabled storage — silently continue
  }
}

/**
 * Clears explicit theme, falls back to system preference
 */
function clearExplicitTheme() {
  delete document.documentElement.dataset.theme;
  try {
    localStorage.removeItem(THEME_KEY);
  } catch (e) {
    // Storage unavailable — silently continue
  }
}

/**
 * Initializes theme on page load
 */
function initTheme() {
  // Prevent transition flash during initial load
  document.documentElement.classList.add('no-transition');

  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (e) { /* Storage unavailable */ }

  if (stored === 'light' || stored === 'dark') {
    document.documentElement.dataset.theme = stored;
  }
  // Otherwise, keep no data-theme to respect system preference

  // Remove no-transition class after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 100);
  });
}

/**
 * Toggles theme and updates UI
 */
function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  setTheme(newTheme);
  updateToggleButton(newTheme);
}

/**
 * Updates the toggle button's aria-pressed and icon
 */
function updateToggleButton(theme) {
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;

  button.setAttribute('aria-pressed', theme === 'dark');

  // Update icon text if using text content
  if (button.dataset.icon) {
    button.dataset.icon = theme === 'dark' ? 'moon' : 'sun';
  }
  // Or update text content if using emoji/text
  if (button.textContent.includes('☀️') || button.textContent.includes('🌙')) {
    button.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/**
 * Sets up the toggle button listener
 */
function setupToggleListener() {
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;

  // Set initial state
  updateToggleButton(getCurrentTheme());

  button.addEventListener('click', () => {
    toggleTheme();
  });
}

/**
 * Listens for system theme changes (only when no explicit theme set)
 */
function setupSystemPreferenceListener() {
  const mediaQuery = window.matchMedia(DARK_PREFERENCE);

  const handleChange = (e) => {
    // Only respond if user hasn't set explicit theme
    let userPref = null;
    try { userPref = localStorage.getItem(THEME_KEY); } catch (err) {}
    if (!userPref) {
      updateToggleButton(e.matches ? 'dark' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
}

/**
 * Initialize on DOMContentLoaded
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupToggleListener();
    setupSystemPreferenceListener();
  });
} else {
  initTheme();
  setupToggleListener();
  setupSystemPreferenceListener();
}

export { setTheme, getCurrentTheme, toggleTheme };
