import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Plus,
  Receipt,
  Wrench,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DemoBadge,
  EmptyState,
  ProgressBar,
  StatusPill,
  Tabs,
  VerificationBadge,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { VehicleSwitcher } from '@/features/vehicles/VehicleSwitcher';
import { AddMaintenanceModal } from '@/features/maintenance/AddMaintenanceModal';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/useToast';
import { daysUntil, formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { recordTitle, workshopName } from '@/utils/vehicle';
import { cn } from '@/utils/cn';

const CHECKLIST_KEYS = ['oil', 'filter', 'levels', 'brakes', 'tyres', 'lights'] as const;

export default function MaintenancePage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { activeVehicle, recordsForVehicle, updateRecord } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState('upcoming');
  const [modalOpen, setModalOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({ oil: true, filter: true, levels: false, brakes: false, tyres: false, lights: false });

  const records = activeVehicle ? recordsForVehicle(activeVehicle.id) : [];

  const groups = useMemo(
    () => ({
      upcoming: records.filter((r) => r.status === 'scheduled'),
      overdue: records.filter((r) => r.status === 'overdue'),
      completed: records.filter((r) => r.status === 'completed'),
      all: records,
    }),
    [records],
  );

  const list = groups[tab as keyof typeof groups] ?? records;

  const spent = groups.completed.reduce((sum, r) => sum + r.cost, 0);
  const avg = groups.completed.length ? Math.round(spent / groups.completed.length) : 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  if (!activeVehicle) {
    return <EmptyState title={t('garage.emptyTitle')} body={t('garage.emptyBody')} />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('maintenance.title')}
        subtitle={t('maintenance.subtitle', { vehicle: `${activeVehicle.make} ${activeVehicle.model}` })}
        badge={<DemoBadge label={t('common.demoBadge')} />}
        actions={
          <>
            <VehicleSwitcher />
            <Button onClick={() => setModalOpen(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              {t('maintenance.addEvent')}
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: t('maintenance.overdue'),
            value: formatNumber(groups.overdue.length, language),
            icon: AlertTriangle,
            tone: groups.overdue.length ? 'danger' : 'neutral',
          },
          {
            label: t('maintenance.upcoming'),
            value: formatNumber(groups.upcoming.length, language),
            icon: CalendarClock,
            tone: 'info',
          },
          {
            label: t('maintenance.spentThisYear'),
            value: formatCurrency(spent, language),
            icon: Receipt,
            tone: 'lime',
          },
          {
            label: t('maintenance.avgPerService'),
            value: formatCurrency(avg, language),
            icon: Wrench,
            tone: 'neutral',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-line bg-ink-800 p-3.5">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Icon className="h-3 w-3" aria-hidden="true" />
                <span className="truncate text-[9.5px] uppercase tracking-wider">{stat.label}</span>
              </div>
              <p
                className={cn(
                  'mt-1.5 truncate text-base font-semibold',
                  stat.tone === 'danger' ? 'text-red-300' : stat.tone === 'lime' ? 'text-lime' : 'text-text-primary',
                )}
              >
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader
              title={t('maintenance.history')}
              subtitle={t('maintenance.serviceCount', { count: records.length })}
              icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
            />
            <Tabs
              value={tab}
              onChange={setTab}
              className="mb-4"
              ariaLabel={t('common.filters')}
              items={[
                { id: 'upcoming', label: t('maintenance.upcoming'), count: groups.upcoming.length },
                { id: 'overdue', label: t('maintenance.overdue'), count: groups.overdue.length },
                { id: 'completed', label: t('maintenance.completed'), count: groups.completed.length },
                { id: 'all', label: t('maintenance.all'), count: groups.all.length },
              ]}
            />

            {list.length === 0 ? (
              <EmptyState
                icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
                title={t('maintenance.noMatchTitle')}
                body={t('maintenance.noMatchBody')}
                className="py-10"
              />
            ) : (
              <ul className="space-y-2.5">
                {list.map((record) => {
                  const days = daysUntil(record.date);
                  const isMileageBased = Boolean(record.intervalKm);
                  return (
                    <li
                      key={record.id}
                      className={cn(
                        'rounded-xl border p-3.5 transition',
                        record.status === 'overdue'
                          ? 'border-red-500/25 bg-red-500/[0.04]'
                          : 'border-line bg-ink-900/40',
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-xs font-semibold text-text-primary">{recordTitle(record, language)}</p>
                            <StatusPill status={record.status} />
                          </div>
                          <p className="mt-1 text-[10.5px] text-text-secondary">
                            {formatDate(record.date, language)} · {formatNumber(record.mileage, language)} {t('common.km')} ·{' '}
                            {workshopName(record, language)}
                          </p>
                        </div>
                        <div className="text-end">
                          {record.cost > 0 ? (
                            <p className="text-xs font-semibold text-text-primary">{formatCurrency(record.cost, language)}</p>
                          ) : null}
                          <p className="text-[9.5px] uppercase tracking-wider text-text-secondary">
                            {isMileageBased ? t('maintenance.mileageBased') : t('maintenance.dateBased')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone="neutral" className="gap-1">
                          <Gauge className="h-2.5 w-2.5" aria-hidden="true" />
                          {record.nextDueMileage
                            ? t('maintenance.nextAt', { km: formatNumber(record.nextDueMileage, language) })
                            : t('maintenance.dueOn', { date: formatDate(record.nextDueDate ?? record.date, language) })}
                        </Badge>
                        <span
                          className={cn(
                            'text-[10px] font-medium',
                            record.status === 'overdue' ? 'text-red-300' : 'text-text-secondary',
                          )}
                        >
                          {record.status === 'overdue'
                            ? t('maintenance.overdueBy', { count: Math.max(1, Math.abs(days)) })
                            : record.status === 'scheduled'
                              ? t('maintenance.dueIn', { count: Math.max(0, days) })
                              : formatDate(record.date, language)}
                        </span>
                        <VerificationBadge level={record.verification} />
                      </div>

                      {record.partsReplaced?.length ? (
                        <p className="mt-2 text-[10px] text-text-secondary">
                          <span className="text-text-primary/80">{t('maintenance.partsNote')}: </span>
                          {record.partsReplaced.join(', ')}
                        </p>
                      ) : null}

                      {record.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={() => {
                            updateRecord(record.id, {
                              status: 'completed',
                              date: new Date().toISOString().slice(0, 10),
                              mileage: activeVehicle.mileage,
                            });
                            toast(t('maintenance.markedComplete'));
                          }}
                          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-lime/25 bg-lime/[0.07] px-2.5 py-1.5 text-[10.5px] font-medium text-lime transition hover:bg-lime/[0.14]"
                        >
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          {t('maintenance.markComplete')}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader
              title={t('maintenance.checklist')}
              subtitle={t('maintenance.checklistProgress', { done: checkedCount, total: CHECKLIST_KEYS.length })}
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            />
            <ProgressBar value={(checkedCount / CHECKLIST_KEYS.length) * 100} label={t('maintenance.checklist')} />
            <ul className="mt-3 space-y-1">
              {CHECKLIST_KEYS.map((key) => {
                const isChecked = Boolean(checked[key]);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1 py-2 text-start transition hover:bg-white/[0.03]"
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                          isChecked ? 'border-lime bg-lime text-ink-950' : 'border-line bg-ink-900',
                        )}
                      >
                        {isChecked ? <Check className="h-2.5 w-2.5" aria-hidden="true" /> : null}
                      </span>
                      <span
                        className={cn(
                          'text-[11px] leading-snug',
                          isChecked ? 'text-text-secondary line-through' : 'text-text-primary',
                        )}
                      >
                        {t(`maintenance.checklistSample.${key}`)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[9.5px] leading-relaxed text-text-secondary">{t('maintenance.mileageUnitNote')}</p>
          </Card>

          <Card>
            <CardHeader title={t('maintenance.costByCategory')} icon={<Receipt className="h-4 w-4" aria-hidden="true" />} />
            <ul className="space-y-2">
              {[
                { key: 'maintenance', value: records.filter((r) => r.kind === 'maintenance').reduce((s, r) => s + r.cost, 0) },
                { key: 'repairs', value: records.filter((r) => r.kind === 'repair').reduce((s, r) => s + r.cost, 0) },
                { key: 'inspection', value: records.filter((r) => r.kind === 'inspection').reduce((s, r) => s + r.cost, 0) },
              ].map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-text-secondary">
                    {row.key === 'inspection' ? t('maintenance.kindInspection') : t(`expenseCategories.${row.key}`)}
                  </span>
                  <span className="font-medium text-text-primary">{formatCurrency(row.value, language)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
              <span className="text-[11px] font-medium text-text-primary">{t('maintenance.totalThisYear')}</span>
              <span className="text-xs font-semibold text-lime">
                {formatCurrency(records.reduce((s, r) => s + r.cost, 0), language)}
              </span>
            </div>
          </Card>

          <div className="rounded-2xl border border-dashed border-line bg-ink-900/40 p-4">
            <p className="text-[10.5px] leading-relaxed text-text-secondary">
              {t('maintenance.addSubtitle')} {t('common.demoBadge')}.
            </p>
          </div>
        </div>
      </div>

      <AddMaintenanceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultMileage={activeVehicle.mileage}
      />
    </div>
  );
}
