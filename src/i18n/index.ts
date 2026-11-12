import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import ar from './ar';
import type { Language } from '@/types';

export const LANGUAGE_STORAGE_KEY = 'caros.language';

/**
 * Arabic uses six CLDR plural categories (zero, one, two, few, many, other).
 * Registering them explicitly is a no-op where Intl.PluralRules already
 * supports Arabic, and a safety net where it does not.
 */
function registerArabicPlural() {
  try {
    i18n.services.pluralResolver.addRule('ar', ['zero', 'one', 'two', 'few', 'many', 'other']);
  } catch {
    // Older i18next builds infer the Arabic rules themselves.
  }
}

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'ar' || stored === 'en') return stored;
  return 'en';
}

export function applyDocumentLanguage(language: Language): void {
  const root = document.documentElement;
  root.lang = language;
  root.dir = language === 'ar' ? 'rtl' : 'ltr';
  root.classList.toggle('font-arabic', language === 'ar');
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

registerArabicPlural();
applyDocumentLanguage((i18n.language as Language) ?? 'en');

export default i18n;
