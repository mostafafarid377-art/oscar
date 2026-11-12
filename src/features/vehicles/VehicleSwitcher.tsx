import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';

export function VehicleSwitcher({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { vehicles, primaryVehicleId, setPrimaryVehicle, activeVehicle } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeVehicle) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('dashboard.switchVehicle')}
        className={cn(
          'flex items-center gap-2.5 rounded-xl border border-line bg-ink-800 px-2.5 py-2 text-xs font-medium text-text-primary transition hover:border-lime/40',
          compact && 'px-2 py-1.5',
        )}
      >
        <img src={activeVehicle.image} alt="" className="h-7 w-9 rounded-md object-cover" />
        <span className="hidden max-w-[9rem] truncate sm:block">
          {activeVehicle.make} {activeVehicle.model}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-text-secondary transition', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t('dashboard.switchVehicle')}
          className="absolute end-0 z-30 mt-2 w-72 animate-fade-up overflow-hidden rounded-xl border border-line bg-ink-800 p-1.5 shadow-card"
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            {t('dashboard.switchVehicle')}
          </p>
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              role="option"
              aria-selected={vehicle.id === primaryVehicleId}
              type="button"
              onClick={() => {
                setPrimaryVehicle(vehicle.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition',
                vehicle.id === primaryVehicleId ? 'bg-lime/10' : 'hover:bg-white/5',
              )}
            >
              <img src={vehicle.image} alt="" className="h-8 w-11 rounded-md object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-text-primary">
                  {vehicle.make} {vehicle.model}
                </span>
                <span className="block text-[10px] text-text-secondary">
                  {vehicle.year} · {formatNumber(vehicle.mileage, language)} {t('common.km')}
                </span>
              </span>
              {vehicle.id === primaryVehicleId ? <Check className="h-3.5 w-3.5 text-lime" aria-hidden="true" /> : null}
            </button>
          ))}
          <Link
            to="/app/garage"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg border-t border-line/70 px-2.5 py-2.5 text-xs font-medium text-lime transition hover:bg-lime/5"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t('garage.addVehicle')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
