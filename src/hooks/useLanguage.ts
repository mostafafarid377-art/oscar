import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { applyDocumentLanguage, LANGUAGE_STORAGE_KEY } from '@/i18n';
import { useApp } from '@/lib/store';
import type { Language } from '@/types';

export function useLanguage() {
  const { i18n } = useTranslation();
  const { settings, updateSettings } = useApp();

  const language = (settings.language ?? (i18n.language as Language) ?? 'en') as Language;
  const isRtl = language === 'ar';

  const changeLanguage = useCallback(
    (next: Language) => {
      void i18n.changeLanguage(next);
      applyDocumentLanguage(next);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      updateSettings({ language: next });
    },
    [i18n, updateSettings],
  );

  const toggleLanguage = useCallback(() => {
    changeLanguage(language === 'ar' ? 'en' : 'ar');
  }, [changeLanguage, language]);

  return { language, isRtl, changeLanguage, toggleLanguage };
}
