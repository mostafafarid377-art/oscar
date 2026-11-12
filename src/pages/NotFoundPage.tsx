import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';
import { Logo } from '@/components/layout/Logo';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <Logo />
      <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-ink-800 text-lime">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-text-primary">{t('errors.notFoundTitle')}</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">{t('errors.notFoundBody')}</p>
      <div className="mt-6 flex gap-2">
        <Link to="/app">
          <Button>{t('errors.goDashboard')}</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">{t('auth.backHome')}</Button>
        </Link>
      </div>
      <span className="mt-8 text-[10px] uppercase tracking-[0.2em] text-text-secondary">404</span>
    </div>
  );
}
