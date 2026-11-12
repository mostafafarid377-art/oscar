import { useTranslation } from 'react-i18next';
import { CheckCircle2, ClipboardCheck, Wrench } from 'lucide-react';
import { VerificationBadge, StatusPill, Badge } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { recordTitle, workshopName } from '@/utils/vehicle';
import type { MaintenanceItem } from '@/types';
import { cn } from '@/utils/cn';

const KIND_ICON = {
  maintenance: Wrench,
  repair: ClipboardCheck,
  inspection: CheckCircle2,
} as const;

export function TimelineItem({ record, last }: { record: MaintenanceItem; last?: boolean }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const Icon = KIND_ICON[record.kind];

  return (
    <li className="relative ps-9">
      {!last ? <span className="absolute inset-y-0 start-[13px] top-7 w-px bg-line" aria-hidden="true" /> : null}
      <span
        className={cn(
          'absolute start-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border',
          record.status === 'overdue'
            ? 'border-red-500/30 bg-red-500/10 text-red-300'
            : record.status === 'scheduled'
              ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
              : 'border-lime/25 bg-lime/10 text-lime',
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>

      <div className="pb-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-snug text-text-primary">{recordTitle(record, language)}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              {formatDate(record.date, language)} · {formatNumber(record.mileage, language)} {t('common.km')} ·{' '}
              {workshopName(record, language)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {record.cost > 0 ? (
              <span className="text-xs font-semibold text-text-primary">{formatCurrency(record.cost, language)}</span>
            ) : null}
            <StatusPill status={record.status} />
          </div>
        </div>

        {record.partsReplaced?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {record.partsReplaced.map((part) => (
              <Badge key={part} tone="neutral">
                {part}
              </Badge>
            ))}
          </div>
        ) : null}

        {(record.notes || record.notesAr) ? (
          <p className="mt-2 rounded-lg border border-line/60 bg-ink-900/50 px-2.5 py-2 text-[11px] leading-relaxed text-text-secondary">
            {language === 'ar' ? record.notesAr ?? record.notes : record.notes}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <VerificationBadge level={record.verification} />
          {record.nextDueDate ? (
            <span className="text-[10px] text-text-secondary">
              {t('maintenance.dueOn', { date: formatDate(record.nextDueDate, language) })}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
