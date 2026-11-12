import { Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Settings as SettingsIcon, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/store';
import { Avatar } from '@/components/ui';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { useLanguage } from '@/hooks/useLanguage';

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { profile, notifications, activeVehicle, signOut } = useApp();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink-950/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <Logo compact to="/app" />
        </div>

        <div className="hidden min-w-0 flex-col lg:flex">
          <p className="truncate text-sm font-medium text-text-primary">
            {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model} ${activeVehicle.year}` : t('garage.emptyTitle')}
          </p>
          <p className="truncate text-[11px] text-text-secondary">
            {activeVehicle
              ? `${formatNumber(activeVehicle.mileage, language)} ${t('common.km')} · ${activeVehicle.plate}`
              : t('nav.primaryVehicle')}
          </p>
        </div>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher compact className="sm:hidden" />
          <LanguageSwitcher className="hidden sm:inline-flex" />

          <Link
            to="/app/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-text-secondary transition hover:border-lime/40 hover:text-lime"
            aria-label={`${t('nav.notifications')}${unread ? ` (${unread})` : ''}`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unread > 0 ? (
              <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold text-ink-950">
                {unread}
              </span>
            ) : null}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg border border-line py-1 pe-2 ps-1 transition hover:border-lime/40"
            >
              <Avatar name={profile.name} size="sm" className="h-7 w-7" />
              <span className="hidden max-w-[7.5rem] truncate text-xs font-medium text-text-primary sm:block">
                {profile.name}
              </span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-text-secondary transition', open && 'rotate-180')} aria-hidden="true" />
            </button>

            {open ? (
              <div
                role="menu"
                className="absolute end-0 mt-2 w-56 animate-fade-up overflow-hidden rounded-xl border border-line bg-ink-800 p-1.5 shadow-card"
              >
                <div className="border-b border-line/70 px-3 py-2.5">
                  <p className="truncate text-xs font-semibold text-text-primary">{profile.name}</p>
                  <p className="truncate text-[11px] text-text-secondary">{profile.email}</p>
                </div>
                <Link
                  to="/app/settings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
                >
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('settings.profile')}
                </Link>
                <Link
                  to="/app/settings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
                >
                  <SettingsIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('nav.settings')}
                </Link>
                <Link
                  to="/login"
                  role="menuitem"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  <LogOut className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />
                  {t('nav.logout')}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {onOpenMobileMenu ? null : null}
    </header>
  );
}
