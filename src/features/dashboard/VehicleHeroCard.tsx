import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Gauge, Fuel, Cog, ShieldCheck, CalendarClock } from 'lucide-react';
import { Badge, Button, DemoBadge, VerificationBadge } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { formatNumber } from '@/utils/format';
import { maintenanceHealth } from '@/utils/vehicle';
import { useApp } from '@/lib/store';
import type { Vehicle } from '@/types';
import { VehicleSwitcher } from '@/features/vehicles/VehicleSwitcher';

export function VehicleHeroCard({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { recordsForVehicle } = useApp();
  const health = maintenanceHealth(recordsForVehicle(vehicle.id));

  const healthTone = health.level === 'critical' ? 'danger' : health.level === 'attention' ? 'warning' : 'lime';
  const healthLabel =
    health.level === 'critical'
      ? t('dashboard.healthCritical')
      : health.level === 'attention'
        ? t('dashboard.healthAttention')
        : t('dashboard.healthHealthy');

  const specs = [
    { icon: Gauge, label: t('dashboard.currentMileage'), value: `${formatNumber(vehicle.mileage, language)} ${t('common.km')}` },
    { icon: Fuel, label: t('vehicle.fuelType'), value: t(`fuels.${vehicle.fuelType}`) },
    { icon: Cog, label: t('vehicle.transmission'), value: t(`transmissions.${vehicle.transmission}`) },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-800">
      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
        <img
          src={vehicle.image}
          alt={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/40 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="lime">{t('dashboard.primaryVehicle')}</Badge>
            <DemoBadge label={t('common.demoBadge')} />
          </div>
          <div className="hidden sm:block">
            <VehicleSwitcher />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-lime">
              {vehicle.make} · {vehicle.trim ?? vehicle.category}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {vehicle.model} <span className="text-text-secondary">{vehicle.year}</span>
            </h2>
            <p className="mt-1 text-[11px] text-white/60">
              {t('dashboard.plate')}: {vehicle.plate} · VIN {vehicle.vin.slice(-6)}
            </p>
          </div>
          <Link to={`/app/garage/${vehicle.id}`} className="shrink-0 self-start sm:self-auto">
            <Button size="sm" variant="secondary" className="backdrop-blur">
              {t('garage.openVehicle')}
              <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-line/70 p-4 sm:grid-cols-3 sm:p-5">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div key={spec.label} className="rounded-xl border border-line/60 bg-ink-900/40 p-3">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Icon className="h-3 w-3" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-wider">{spec.label}</span>
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-text-primary">{spec.value}</p>
            </div>
          );
        })}
        <div className="col-span-2 rounded-xl border border-line/60 bg-ink-900/40 p-3 sm:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-wider">{t('dashboard.maintenanceStatus')}</span>
            </div>
            <Badge tone={healthTone}>{healthLabel}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VerificationBadge level={vehicle.verification} />
            {health.overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-300">
                <CalendarClock className="h-3 w-3" aria-hidden="true" />
                {t('dashboard.healthAttentionBody', { count: health.overdueCount })}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
