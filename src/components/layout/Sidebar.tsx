import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpenCheck, ChevronsUpDown, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/utils/cn';
import { asset } from '@/utils/asset';
import { NAV_ITEMS } from './navigation';
import { Logo } from './Logo';
import { DemoBadge } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';

export function Sidebar() {
  const { t } = useTranslation();
  const { notifications, signOut, vehicles, activeVehicle } = useApp();
  const { isRtl } = useLanguage();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-e border-line/80 bg-ink-900/60 lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <div className="mx-3 mb-3 rounded-xl border border-line bg-ink-800/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            {t('nav.primaryVehicle')}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-text-secondary" aria-hidden="true" />
        </div>
        <Link to="/app/garage" className="flex items-center gap-2.5 rounded-lg transition hover:opacity-90">
          <img
            src={activeVehicle?.image ?? asset('/images/car-elantra.jpg')}
            alt=""
            className="h-9 w-12 rounded-md border border-line object-cover"
            loading="lazy"
          />
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-text-primary">
              {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : '—'}
            </span>
            <span className="block truncate text-[10px] text-text-secondary">
              {activeVehicle ? `${activeVehicle.year} · ${t('garage.results', { count: vehicles.length })}` : ''}
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin" aria-label={t('nav.mainNavigation')}>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const showBadge = item.to === '/app/notifications' && unread > 0;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition',
                      isActive
                        ? 'bg-lime/10 text-lime'
                        : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-lime' : 'text-text-secondary group-hover:text-text-primary')} aria-hidden="true" />
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                      {showBadge ? (
                        <span className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-bold text-ink-950">{unread}</span>
                      ) : null}
                      {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" /> : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 rounded-xl border border-line/80 bg-ink-800/50 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-text-primary">Phase 0</span>
          </div>
          <p className="text-[10.5px] leading-relaxed text-text-secondary">{t('common.demoNotice')}</p>
          <div className="mt-2.5">
            <DemoBadge label={t('common.demoBadge')} />
          </div>
        </div>
      </nav>

      <div className="border-t border-line/80 p-3">
        <Link
          to="/app/ai-mechanic"
          className="mb-2 flex items-center gap-2.5 rounded-xl border border-lime/20 bg-lime/[0.06] px-3 py-2.5 text-xs font-medium text-lime transition hover:bg-lime/[0.12]"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t('dashboard.askMechanic')}
        </Link>
        <Link
          to="/login"
          onClick={signOut}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-white/[0.04] hover:text-text-primary"
        >
          <LogOut className={cn('h-3.5 w-3.5', isRtl && 'rtl-flip')} aria-hidden="true" />
          {t('nav.logout')}
        </Link>
        <p className="mt-2 flex items-center gap-1 px-3 text-[10px] text-text-secondary">
          <BookOpenCheck className="h-3 w-3" aria-hidden="true" />
          CarProof · Mechanic AI
        </p>
      </div>
    </aside>
  );
}
