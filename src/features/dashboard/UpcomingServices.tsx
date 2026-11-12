import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarClock, Wrench } from 'lucide-react';
import { Card, CardHeader, StatusPill, EmptyState } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate, formatNumber, daysUntil } from '@/utils/format';
import { upcomingRecords, recordTitle } from '@/utils/vehicle';
import type { Vehicle } from '@/types';

export function UpcomingServices({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { recordsForVehicle } = useApp();
  const records = upcomingRecords(recordsForVehicle(vehicle.id), 4);

  return (
    <Card>
      <CardHeader
        title={t('dashboard.upcoming')}
        subtitle={t('dashboard.upcomingSubtitle')}
        icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
        action={
          <Link
            to="/app/maintenance"
            className="flex items-center gap-1 text-[11px] font-medium text-lime hover:underline"
          >
            {t('common.viewAll')}
            <ArrowRight className="h-3 w-3 rtl-flip" aria-hidden="true" />
          </Link>
        }
      />
      {records.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
          title={t('dashboard.noUpcoming')}
          body={t('maintenance.emptyBody')}
          className="py-8"
        />
      ) : (
        <ul className="divide-y divide-line/60">
          {records.map((record) => {
            const days = daysUntil(record.date);
            return (
              <li key={record.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-text-secondary">
                  <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">{recordTitle(record, language)}</p>
                  <p className="mt-0.5 text-[11px] text-text-secondary">
                    {formatDate(record.date, language)}
                    {record.nextDueMileage
                      ? ` · ${formatNumber(record.nextDueMileage, language)} ${t('common.km')}`
                      : ''}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-text-secondary">
                  {days >= 0
                    ? t('dashboard.daysLeft', { count: days })
                    : t('dashboard.overdueBy', { count: Math.abs(days) })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3 flex items-center gap-1.5">
        <StatusPill status="scheduled" />
        <span className="text-[10px] text-text-secondary">{t('maintenance.demoCalendar')}</span>
      </div>
    </Card>
  );
}
