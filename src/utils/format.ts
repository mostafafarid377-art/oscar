import type { Language } from '@/types';

/**
 * Arabic uses Western digits here on purpose: plate numbers, VINs and mileage
 * are cross-referenced with physical documents, so consistency beats
 * localisation for a vehicle passport.
 */
export function formatNumber(value: number, language: Language = 'en'): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US').format(value);
}

export function formatCurrency(value: number, language: Language = 'en'): string {
  const currency = language === 'ar' ? 'ج.م' : 'EGP';
  return `${formatNumber(value, language)} ${currency}`;
}

export function formatDate(iso: string, language: Language = 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(iso: string, language: Language = 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function relativeTime(iso: string, language: Language = 'en'): string {
  const date = new Date(iso).getTime();
  const diffMs = Date.now() - date;
  const diffDays = Math.round(diffMs / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(language === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / 3_600_000);
    return rtf.format(-Math.max(1, diffHours), 'hour');
  }
  if (Math.abs(diffDays) < 30) return rtf.format(-diffDays, 'day');
  return rtf.format(-Math.round(diffDays / 30), 'month');
}

export function formatFileSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

export function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}
