import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import it from './locales/it';
import { getLanguageFromPathname } from '../seo/localizedPaths';

export type AppLanguage = 'en' | 'it';

const STORAGE_KEY = 'nihongo.language';

function detectBrowserLanguage(): AppLanguage {
  const lang = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase();
  return lang.startsWith('it') ? 'it' : 'en';
}

function readStoredLanguage(): AppLanguage | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'it') return v;
    return null;
  } catch {
    return null;
  }
}

export function setAppLanguage(lang: AppLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  return i18n.changeLanguage(lang);
}

export function getInitialLanguage(): AppLanguage {
  if (typeof window !== 'undefined') {
    const fromPath = getLanguageFromPathname(window.location.pathname);
    if (fromPath) return fromPath;
  }
  return readStoredLanguage() ?? detectBrowserLanguage();
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      it: { translation: it },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
