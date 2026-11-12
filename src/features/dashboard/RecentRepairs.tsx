import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Wrench } from 'lucide-react';
import { Card, CardHeader, VerificationBadge, EmptyState } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { recordTitle, workshopName } from '@/utils/vehicle';
import type { Vehicle } from '@/types';

export function RecentRepairs({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { recordsForVehicle } = useApp();
  const repairs = recordsForVehicle(vehicle.id)
    .filter((r) => r.kind === 'repair' && r.status === 'completed')
    .slice(0, 3);

  return (
    <Card>
      <CardHeader
        title={t('dashboard.recentRepairs')}
        subtitle={t('dashboard.recentRepairsSubtitle')}
        icon={<Wrench className="h-4 w-4" aria-hidden="true" />}
        action={
          <Link to="/app/carproof" className="flex items-center gap-1 text-[11px] font-medium text-lime hover:underline">
            {t('dashboard.openPassport')}
            <ArrowRight className="h-3 w-3 rtl-flip" aria-hidden="true" />
          </Link>
        }
      />
      {repairs.length === 0 ? (
        <EmptyState title={t('vehicle.noRecords')} body={t('vehicle.noRecordsBody')} className="py-8" />
      ) : (
        <ul className="space-y-2.5">
          {repairs.map((record) => (
            <li key={record.id} className="rounded-xl border border-line/70 bg-ink-900/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium leading-snug text-text-primary">{recordTitle(record, language)}</p>
                <span className="shrink-0 text-xs font-semibold text-lime">{formatCurrency(record.cost, language)}</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-text-secondary">
                {workshopName(record, language)} · {formatDate(record.date, language)} ·{' '}
                {formatNumber(record.mileage, language)} {t('common.km')}
              </p>
              <div className="mt-2">
                <VerificationBadge level={record.verification} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
