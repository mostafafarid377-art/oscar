import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Cog,
  FileText,
  Fuel,
  Gauge,
  Palette,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Button, Card, CardHeader, EmptyState, Badge, VerificationBadge, ProgressBar } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { recordTitle, workshopName } from '@/utils/vehicle';
import { VERIFICATION_ORDER, verificationRank } from '@/components/ui/VerificationBadge';

export default function VehicleDetailsPage() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const { language, isRtl } = useLanguage();
  const { vehicles, recordsForVehicle, documentsForVehicle } = useApp();
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  if (!vehicle) {
    return (
      <div>
        <EmptyState
          title={t('vehicle.notFound')}
          body={t('vehicle.notFoundBody')}
          action={
            <Link to="/app/garage">
              <Button variant="secondary">{t('vehicle.back')}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const records = recordsForVehicle(vehicle.id);
  const documents = documentsForVehicle(vehicle.id);
  const completed = records.filter((r) => r.status === 'completed');
  const rank = verificationRank(vehicle.verification) + 1;
  const completeness = Math.min(
    100,
    Math.round((completed.length / 6) * 55 + Math.min(documents.length, 5) * 9 + (rank / 4) * 0),
  );

  const specs = [
    { icon: Gauge, label: t('vehicle.mileage'), value: `${formatNumber(vehicle.mileage, language)} ${t('common.km')}` },
    { icon: CalendarDays, label: t('vehicle.year'), value: String(vehicle.year) },
    { icon: Cog, label: t('vehicle.transmission'), value: t(`transmissions.${vehicle.transmission}`) },
    { icon: Fuel, label: t('vehicle.fuelType'), value: t(`fuels.${vehicle.fuelType}`) },
    { icon: Settings2, label: t('vehicle.drivetrain'), value: t(`drivetrains.${vehicle.drivetrain}`) },
    { icon: Palette, label: t('vehicle.color'), value: vehicle.color },
  ];

  const engineSpecs = [
    { label: t('vehicle.displacement'), value: vehicle.engine.displacement },
    { label: t('vehicle.cylinders'), value: String(vehicle.engine.cylinders) },
    { label: t('vehicle.power'), value: vehicle.engine.power },
    { label: t('vehicle.torque'), value: vehicle.engine.torque },
    { label: t('vehicle.oilSpec'), value: vehicle.engine.oilSpec },
  ];

  return (
    <div className="animate-fade-in">
      <Link
        to="/app/garage"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-text-secondary transition hover:text-lime"
      >
        <BackIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t('vehicle.back')}
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-800">
        <div className="relative aspect-[16/9] sm:aspect-[21/9]">
          <img
            src={vehicle.image}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/30 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <Badge tone="lime">{vehicle.isPrimary ? t('garage.primary') : t('common.demoBadge')}</Badge>
                <VerificationBadge level={vehicle.verification} />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-3xl">
                <span className="sr-only">{t('vehicle.overviewHeading')}: </span>
                <span dir="ltr" className="inline">
                  {vehicle.make} {vehicle.model} {vehicle.year}
                </span>
              </h1>
              <p className="mt-1 text-[11px] text-white/60 sm:text-xs">
                {vehicle.trim ? `${vehicle.trim} · ` : ''}
                {t('vehicle.plate')}: {vehicle.plate} · {t('vehicle.vin')}: {vehicle.vin}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-4">
          <Card padded={false}>
            <div className="p-5 pb-0">
              <CardHeader title={t('vehicle.specs')} icon={<Gauge className="h-4 w-4" aria-hidden="true" />} />
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl border-t border-line bg-line/60 sm:grid-cols-3">
              {specs.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div key={spec.label} className="bg-ink-800 p-4">
                    <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-secondary">
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {spec.label}
                    </dt>
                    <dd className="mt-1.5 truncate text-xs font-semibold text-text-primary">{spec.value}</dd>
                  </div>
                );
              })}
            </dl>
          </Card>

          <Card>
            <CardHeader title={t('vehicle.engine')} icon={<Cog className="h-4 w-4" aria-hidden="true" />} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {engineSpecs.map((s) => (
                <div key={s.label}>
                  <dt className="text-[10px] uppercase tracking-wider text-text-secondary">{s.label}</dt>
                  <dd className="mt-0.5 text-xs font-medium text-text-primary">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-ink-900/60 px-3 py-2.5">
              <span className="text-[11px] text-text-secondary">{t('vehicle.purchaseDate')}</span>
              <span className="text-[11px] font-medium text-text-primary">{formatDate(vehicle.purchaseDate, language)}</span>
            </div>
          </Card>

          <Card>
            <CardHeader
              title={t('vehicle.recentMaintenance')}
              icon={<Wrench className="h-4 w-4" aria-hidden="true" />}
              action={
                <Link to="/app/maintenance" className="text-[11px] font-medium text-lime hover:underline">
                  {t('vehicle.viewHistory')}
                </Link>
              }
            />
            {records.length === 0 ? (
              <EmptyState title={t('vehicle.noRecords')} body={t('vehicle.noRecordsBody')} className="py-8" />
            ) : (
              <ul className="divide-y divide-line/60">
                {records.slice(0, 5).map((record) => (
                  <li key={record.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-text-primary">{recordTitle(record, language)}</p>
                      <p className="mt-0.5 truncate text-[11px] text-text-secondary">
                        {formatDate(record.date, language)} · {formatNumber(record.mileage, language)} {t('common.km')} ·{' '}
                        {workshopName(record, language)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-text-primary">
                      {record.cost ? formatCurrency(record.cost, language) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title={t('vehicle.passportScore')} icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} />
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-text-primary">{Math.min(100, completeness)}%</p>
              <Badge tone={completeness > 60 ? 'lime' : 'warning'}>
                {completeness > 60 ? t('carproof.verified') : t('dashboard.healthAttention')}
              </Badge>
            </div>
            <ProgressBar value={completeness} className="mt-3" label={t('vehicle.passportScore')} />
            <p className="mt-3 text-[11px] leading-relaxed text-text-secondary">
              {t('carproof.progress', { percent: Math.round((rank / VERIFICATION_ORDER.length) * 100) })}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {VERIFICATION_ORDER.map((level) => (
                <VerificationBadge key={level} level={level} />
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('vehicle.quickLinks')} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
            <div className="space-y-2">
              <Link
                to="/app/carproof"
                className="flex items-center justify-between rounded-xl border border-line bg-ink-900/40 px-3 py-2.5 text-xs font-medium text-text-primary transition hover:border-lime/30 hover:bg-ink-900"
              >
                <span className="flex items-center gap-2">
                  <BookOpenCheck className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                  {t('vehicle.openPassport')}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-text-secondary rtl-flip" aria-hidden="true" />
              </Link>
              <Link
                to="/app/ai-mechanic"
                className="flex items-center justify-between rounded-xl border border-lime/20 bg-lime/[0.06] px-3 py-2.5 text-xs font-medium text-lime transition hover:bg-lime/[0.12]"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('vehicle.askMechanic')}
                </span>
                <ArrowRight className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />
              </Link>
              <Link
                to="/app/documents"
                className="flex items-center justify-between rounded-xl border border-line bg-ink-900/40 px-3 py-2.5 text-xs font-medium text-text-primary transition hover:border-lime/30 hover:bg-ink-900"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                  {t('vehicle.documents')}
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-text-secondary">
                    {documents.length}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-text-secondary rtl-flip" aria-hidden="true" />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('vehicle.verification')} icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} />
            <ul className="space-y-2.5">
              {VERIFICATION_ORDER.map((level, index) => {
                const active = index <= verificationRank(vehicle.verification);
                return (
                  <li key={level} className="flex items-center justify-between gap-2">
                    <span className={active ? 'text-[11px] text-text-primary' : 'text-[11px] text-text-secondary'}>
                      {t(`carproof.${level.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`)}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-lime' : 'bg-ink-700'}`}
                      aria-hidden="true"
                    />
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 border-t border-line/70 pt-3 text-[10.5px] leading-relaxed text-text-secondary">
              {t('carproof.trustBody')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
