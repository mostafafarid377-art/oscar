import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './useLanguage';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';

/** Convenience helpers that always respect the active language. */
export function useLocalized() {
  const { language, isRtl, changeLanguage, toggleLanguage } = useLanguage();
  const { t, i18n } = useTranslation();

  const num = useCallback((value: number) => formatNumber(value, language), [language]);
  const money = useCallback((value: number) => formatCurrency(value, language), [language]);
  const date = useCallback((iso: string) => formatDate(iso, language), [language]);
  const pick = useCallback(
    (en: string, ar?: string) => (language === 'ar' ? ar ?? en : en),
    [language],
  );
  const dir = useCallback(<T,>(ltr: T, rtl: T) => (isRtl ? rtl : ltr), [isRtl]);

  return { t, i18n, language, isRtl, changeLanguage, toggleLanguage, num, money, date, pick, dir };
}
