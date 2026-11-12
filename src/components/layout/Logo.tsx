import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useTranslation } from 'react-i18next';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl border border-lime/25 bg-lime/10 text-lime',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 14.5c0-3.3 2.9-6.5 9-6.5s9 3.2 9 6.5" strokeLinecap="round" />
        <circle cx="6.5" cy="16.5" r="1.6" />
        <circle cx="17.5" cy="16.5" r="1.6" />
        <path d="M9 13h6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ compact, to = '/', className }: { compact?: boolean; to?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className={cn('group flex items-center gap-2.5 rounded-lg focus-visible:outline-none', className)}
      aria-label={t('common.appName')}
    >
      <LogoMark className="transition group-hover:border-lime/50" />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-text-primary">
          Car<span className="text-lime">OS</span>
        </span>
        {!compact ? (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-text-secondary">
            {t('common.demoMode')}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
