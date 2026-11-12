import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CarFront, MoreVertical, Pencil, Star, Trash2, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge, VerificationBadge } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { formatNumber } from '@/utils/format';
import type { Vehicle } from '@/types';
import { cn } from '@/utils/cn';
import { useApp } from '@/lib/store';

export function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
  isPrimary,
  recordCount,
}: {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
  isPrimary: boolean;
  recordCount: number;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { setPrimaryVehicle } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-ink-800 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-card">
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-900">
        <img
          src={vehicle.image}
          alt={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-800/90 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute start-3 top-3 flex flex-wrap items-center gap-1.5">
          {isPrimary ? (
            <Badge tone="lime" icon={<Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />}>
              {t('garage.primary')}
            </Badge>
          ) : null}
        </div>
        <div className="absolute end-3 top-3" ref={ref}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={t('common.actions')}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-ink-950/70 text-text-primary backdrop-blur transition hover:bg-ink-950"
          >
            <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div className="absolute end-0 mt-1.5 w-44 animate-fade-up overflow-hidden rounded-xl border border-line bg-ink-800 p-1 shadow-card">
              <button
                type="button"
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                {t('garage.editVehicle')}
              </button>
              {!isPrimary ? (
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryVehicle(vehicle.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                  {t('garage.setPrimary')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-red-300 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                {t('garage.deleteVehicle')}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-text-primary">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              {vehicle.year} · {vehicle.trim ?? t(`categories.${vehicle.category}`)} · {vehicle.plate}
            </p>
          </div>
          <Link
            to={`/app/garage/${vehicle.id}`}
            aria-label={t('garage.openVehicle')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-text-secondary transition hover:border-lime/40 hover:text-lime"
          >
            <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />
          </Link>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line/60 bg-ink-900/50 px-2.5 py-1.5">
            <dt className="text-[9.5px] uppercase tracking-wider text-text-secondary">{t('dashboard.currentMileage')}</dt>
            <dd className="text-xs font-semibold text-text-primary">
              {formatNumber(vehicle.mileage, language)} {t('common.km')}
            </dd>
          </div>
          <div className="rounded-lg border border-line/60 bg-ink-900/50 px-2.5 py-1.5">
            <dt className="text-[9.5px] uppercase tracking-wider text-text-secondary">{t('carproof.recordsTotal', { count: recordCount })}</dt>
            <dd className="truncate text-xs font-semibold text-text-primary">{t(`fuels.${vehicle.fuelType}`)}</dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between gap-2">
          <VerificationBadge level={vehicle.verification} />
          <span className={cn('flex items-center gap-1 text-[10px] text-text-secondary')}>
            <CarFront className="h-3 w-3" aria-hidden="true" />
            {t(`drivetrains.${vehicle.drivetrain}`)}
          </span>
        </div>
      </div>
    </article>
  );
}
