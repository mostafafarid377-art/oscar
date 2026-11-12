import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { MOBILE_PRIMARY_ITEMS, NAV_ITEMS } from './navigation';
import { cn } from '@/utils/cn';
import { useApp } from '@/lib/store';

export function BottomNav() {
  const { t } = useTranslation();
  const { notifications } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const primaryPaths = MOBILE_PRIMARY_ITEMS.map((i) => i.to);
  const shortLabel = (labelKey: string) => {
    const key = labelKey.replace('nav.', '');
    return t(`navShort.${key}`, { defaultValue: t(labelKey) });
  };
  const moreItems = NAV_ITEMS.filter((i) => !primaryPaths.includes(i.to));

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] mx-3 animate-fade-up rounded-2xl border border-line bg-ink-800 p-2 shadow-card">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              {t('nav.menu')}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition',
                        isActive ? 'bg-lime/10 text-lime' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {shortLabel(item.labelKey)}
                  </NavLink>
                );
              })}
              <Link
                to="/login"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
              >
                {t('nav.logout')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label={t('nav.mainNavigation')}
      >
        <ul className="flex items-stretch justify-around px-1">
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const showDot = item.to === '/app/notifications' && unread > 0;
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'relative flex flex-col items-center gap-1 px-1 pb-2.5 pt-2.5 text-[10px] font-medium transition',
                      isActive ? 'text-lime' : 'text-text-secondary',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative">
                        <Icon className={cn('h-[18px] w-[18px]', isActive && 'drop-shadow-[0_0_8px_rgba(198,255,61,0.5)]')} aria-hidden="true" />
                        {showDot ? (
                          <span className="absolute -end-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
                        ) : null}
                      </span>
                      <span className="max-w-full truncate">{shortLabel(item.labelKey)}</span>
                      {isActive ? <span className="absolute -top-px h-0.5 w-8 rounded-full bg-lime" aria-hidden="true" /> : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={cn(
                'flex w-full flex-col items-center gap-1 px-1 pb-2.5 pt-2.5 text-[10px] font-medium transition',
                moreOpen ? 'text-lime' : 'text-text-secondary',
              )}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
              {t('navShort.menu')}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
