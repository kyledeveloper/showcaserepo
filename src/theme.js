// Dark / light theme. Defaults to the OS preference; once the user toggles
// manually, system changes are ignored for the rest of the session.

import { t, getLanguage, onLanguageChange } from './i18n.js';

const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let theme = systemTheme.matches ? 'dark' : 'light';
let manualTheme = false;

const SUN_ICON =
  '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke-width="1.7"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-width="1.7" stroke-linecap="round"/></svg>';
const MOON_ICON =
  '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5 8.7 8.7 0 1 0 20.5 14.2Z" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function getTheme() {
  return theme;
}

function updateThemeButton(button) {
  const label = t(theme === 'dark' ? 'themeToLight' : 'themeToDark');
  button.setAttribute('aria-label', label);
  button.title = label;
  button.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
}

export function applyTheme(nextTheme) {
  theme = nextTheme;
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#07111c' : '#edf5f7';
  const button = document.getElementById('theme-toggle');
  if (button) updateThemeButton(button);
  // The Three.js background listens for this to re-tint itself.
  window.dispatchEvent(new CustomEvent('portfolio-theme', { detail: theme }));
}

export function initTheme() {
  const button = document.getElementById('theme-toggle');
  if (button) {
    button.addEventListener('click', () => {
      manualTheme = true;
      applyTheme(theme === 'dark' ? 'light' : 'dark');
    });
    updateThemeButton(button);
    onLanguageChange(() => updateThemeButton(button));
  }
  systemTheme.addEventListener('change', (event) => {
    if (!manualTheme) applyTheme(event.matches ? 'dark' : 'light');
  });
  applyTheme(theme);
}

// Keep the language toggle label in sync (EN / 中 + aria-label).
export function initLanguageToggle(setLanguage) {
  const button = document.getElementById('language-toggle');
  if (!button) return () => {};
  const sync = () => {
    const language = getLanguage();
    button.textContent = language === 'zh' ? 'EN' : '中';
    button.setAttribute('aria-label', t('languageSwitch'));
    button.title = t('languageSwitch');
  };
  button.addEventListener('click', () => {
    setLanguage(getLanguage() === 'zh' ? 'en' : 'zh');
  });
  const off = onLanguageChange(sync);
  sync();
  return off;
}
