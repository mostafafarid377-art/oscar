import { Database, HardDriveUpload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/store';

/**
 * Makes the demo/production boundary visible at all times.
 *
 * Rule 8 of the Phase 1 brief: demo data and real data must never be silently
 * mixed. This banner is the honest answer to "what am I looking at?".
 */
export function DataSourceNotice() {
  const { t } = useTranslation();
  const { dataSource, liveAvailable, setDataSource } = useApp();

  // No Supabase configured at all → the Phase 0 demo banner already covers it.
  if (!liveAvailable) return null;

  const isLive = dataSource === 'live';

  return (
    <div
      className={`mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${
        isLive
          ? 'border-lime/25 bg-lime/[0.05]'
          : 'border-amber-400/25 bg-amber-400/[0.05]'
      }`}
      role="status"
    >
      {isLive ? (
        <Database className="h-3.5 w-3.5 shrink-0 text-lime" aria-hidden="true" />
      ) : (
        <HardDriveUpload className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
      )}
      <p className="flex-1 text-[11px] leading-relaxed text-text-secondary">
        <span className={`font-semibold ${isLive ? 'text-lime' : 'text-amber-300'}`}>
          {isLive ? t('dataSource.liveTitle') : t('dataSource.demoTitle')} —{' '}
        </span>
        {isLive ? t('dataSource.liveBody') : t('dataSource.demoBody')}
      </p>
      <button
        type="button"
        onClick={() => setDataSource(isLive ? 'demo' : 'live')}
        className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-[10px] font-semibold text-text-primary transition hover:border-white/25 hover:bg-white/5"
      >
        {isLive ? t('dataSource.switchToDemo') : t('dataSource.switchToLive')}
      </button>
    </div>
  );
}
