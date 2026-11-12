import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/utils/cn';

export function LanguageSwitcher({ compact, className }: { compact?: boolean; className?: string }) {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => changeLanguage(language === 'ar' ? 'en' : 'ar')}
        aria-label={t('settings.switchLanguage')}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-text-secondary transition hover:border-lime/40 hover:text-lime',
          className,
        )}
      >
        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        {language === 'ar' ? 'EN' : 'ع'}
      </button>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center rounded-xl border border-line bg-ink-900/60 p-1', className)}
      role="group"
      aria-label={t('a11y.languageSelector')}
    >
      {(['en', 'ar'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => changeLanguage(code)}
          aria-pressed={language === code}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            language === code ? 'bg-lime text-ink-950' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {code === 'en' ? 'English' : 'العربية'}
        </button>
      ))}
    </div>
  );
}
