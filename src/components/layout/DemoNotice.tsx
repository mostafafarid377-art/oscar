import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/store';
import { Link } from 'react-router-dom';

const DISMISS_KEY = 'caros.demo.noticeDismissed';

export function DemoNotice() {
  const { t } = useTranslation();
  const { resetDemoData } = useApp();
  const [dismissed, setDismissed] = useState(
    () => window.localStorage.getItem(DISMISS_KEY) === 'true',
  );

  if (dismissed) {
    return (
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem(DISMISS_KEY);
            setDismissed(false);
          }}
          className="text-[11px] text-text-secondary underline-offset-2 hover:text-lime hover:underline"
        >
          {t('demo.banner')}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-dashed border-line bg-ink-900/60 px-3.5 py-2.5">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" aria-hidden="true" />
      <p className="flex-1 text-[11px] leading-relaxed text-text-secondary">
        {t('common.demoNotice')}{' '}
        <button
          type="button"
          onClick={resetDemoData}
          className="font-medium text-lime underline-offset-2 hover:underline"
        >
          {t('demo.reset')}
        </button>{' '}
        ·{' '}
        <Link to="/" className="font-medium text-text-primary underline-offset-2 hover:underline">
          {t('landing.hero.secondaryCta')}
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, 'true');
          setDismissed(true);
        }}
        aria-label={t('common.close')}
        className="rounded p-1 text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}
