import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Wrench } from 'lucide-react';
import { Badge, ProgressBar } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate, formatNumber } from '@/utils/format';
import { maintenanceHealth, recordTitle, upcomingRecords } from '@/utils/vehicle';
import type { Vehicle } from '@/types';
import { cn } from '@/utils/cn';

export function MaintenanceStatusCard({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { recordsForVehicle } = useApp();
  const records = recordsForVehicle(vehicle.id);
  const health = maintenanceHealth(records);
  const next = upcomingRecords(records, 1)[0];
  const completed = records.filter((r) => r.status === 'completed').length;
  const total = records.length || 1;
  const completion = Math.round((completed / total) * 100);

  const tone =
    health.level === 'critical' ? 'red' : health.level === 'attention' ? 'amber' : 'lime';
  const levelLabel =
    health.level === 'critical'
      ? t('dashboard.healthCritical')
      : health.level === 'attention'
        ? t('dashboard.healthAttention')
        : t('dashboard.healthHealthy');
  const badgeTone = health.level === 'critical' ? 'danger' : health.level === 'attention' ? 'warning' : 'lime';

  return (
    <div className="rounded-2xl border border-line bg-ink-800 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border',
              tone === 'red' && 'border-red-500/25 bg-red-500/10 text-red-300',
              tone === 'amber' && 'border-amber-400/25 bg-amber-400/10 text-amber-300',
              tone === 'lime' && 'border-lime/25 bg-lime/10 text-lime',
            )}
          >
            {health.level === 'healthy' ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="stat-label">{t('dashboard.maintenanceStatus')}</p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">{levelLabel}</p>
          </div>
        </div>
        <Badge tone={badgeTone}>{t('dashboard.healthHealthy') === levelLabel ? t('statuses.completed') : t('statuses.overdue')}</Badge>
      </div>

      <p className="text-xs leading-relaxed text-text-secondary">
        {health.overdueCount > 0
          ? t('dashboard.healthAttentionBody', { count: health.overdueCount })
          : t('dashboard.healthHealthyBody')}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-text-secondary">{t('dashboard.servicesCompleted')}</span>
          <span className="font-medium text-text-primary">
            {completed}/{records.length}
          </span>
        </div>
        <ProgressBar value={completion} tone={tone} label={t('dashboard.servicesCompleted')} />
      </div>

      {next ? (
        <div className="mt-4 rounded-xl border border-line bg-ink-900/70 p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-secondary">{t('dashboard.nextService')}</p>
          <p className="mt-1 truncate text-xs font-medium text-text-primary">{recordTitle(next, language)}</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            {formatDate(next.date, language)} · {t('dashboard.dueAt', { km: formatNumber(next.nextDueMileage ?? next.mileage, language) })}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-ink-900/40 p-3 text-[11px] text-text-secondary">
          {t('dashboard.noUpcoming')}
        </div>
      )}

      <Link
        to="/app/maintenance"
        className="mt-4 flex items-center justify-between rounded-lg text-[11px] font-medium text-lime transition hover:opacity-80"
      >
        <span className="flex items-center gap-1.5">
          <Wrench className="h-3 w-3" aria-hidden="true" />
          {t('nav.maintenance')}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />
      </Link>
    </div>
  );
}
