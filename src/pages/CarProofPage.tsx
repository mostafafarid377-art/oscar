import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpenCheck,
  Download,
  FileText,
  Gauge,
  Receipt,
  ShieldCheck,
  ClipboardCheck,
  Info,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DemoBadge,
  Donut,
  Tabs,
  EmptyState,
  AreaChart,
  BarList,
  VerificationBadge,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { VehicleSwitcher } from '@/features/vehicles/VehicleSwitcher';
import { TimelineItem } from '@/features/carproof/TimelineItem';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { DEMO_EXPENSES, DEMO_MILEAGE } from '@/data/mockData';
import {
  VERIFICATION_ORDER,
  VERIFICATION_ICON,
  verificationRank,
} from '@/components/ui/VerificationBadge';

const EXPENSE_COLORS: Record<string, string> = {
  maintenance: '#C6FF3D',
  repairs: '#60A5FA',
  insurance: '#A78BFA',
  fuel: '#FBBF24',
  other: '#9199A8',
};

const EXPENSE_TONES = {
  maintenance: 'lime',
  repairs: 'sky',
  insurance: 'violet',
  fuel: 'amber',
  other: 'neutral',
} as const;

export default function CarProofPage() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const { language } = useLanguage();
  const { vehicles, activeVehicle, recordsForVehicle, documentsForVehicle } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState('all');
  const [exporting, setExporting] = useState(false);

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? activeVehicle;

  const records = vehicle ? recordsForVehicle(vehicle.id) : [];
  const documents = vehicle ? documentsForVehicle(vehicle.id) : [];
  const mileage = vehicle ? DEMO_MILEAGE.filter((m) => m.vehicleId === vehicle.id) : [];

  const filteredRecords = useMemo(() => {
    if (tab === 'all') return records;
    if (tab === 'maintenance') return records.filter((r) => r.kind === 'maintenance');
    if (tab === 'repairs') return records.filter((r) => r.kind === 'repair');
    if (tab === 'documents') return [];
    return records;
  }, [records, tab, tab]);

  const verifiedCount = records.filter((r) => r.verification !== 'owner_reported').length;
  const verifiedPercent = records.length ? Math.round((verifiedCount / records.length) * 100) : 0;
  const expenses = vehicle ? DEMO_EXPENSES[vehicle.id] ?? [] : [];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const allParts = [...new Set(records.flatMap((r) => r.partsReplaced ?? []))];

  const mileageSeries = mileage.map((m) => ({
    label: new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { month: 'short' }).format(new Date(m.date)),
    value: m.mileage,
  }));

  const handleExport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 900));
    setExporting(false);
    toast(t('carproof.exportDemo'), 'info');
  };

  if (!vehicle) {
    return (
      <EmptyState
        title={t('garage.emptyTitle')}
        body={t('garage.emptyBody')}
        action={
          <Link to="/app/garage">
            <Button>{t('garage.addVehicle')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('carproof.title')}
        subtitle={t('carproof.subtitle', { vehicle: `${vehicle.make} ${vehicle.model} ${vehicle.year}` })}
        badge={<DemoBadge label={t('common.demoBadge')} />}
        actions={
          <>
            <VehicleSwitcher />
            <Button
              variant="secondary"
              size="md"
              loading={exporting}
              onClick={handleExport}
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              {t('carproof.export')}
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-dashed border-line bg-ink-900/50 px-3.5 py-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-text-secondary">{t('carproof.demoNotice')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-4">
          {/* Overview */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img
                src={vehicle.image}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="h-32 w-full rounded-xl border border-line object-cover sm:h-24 sm:w-36"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-text-primary">
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </h2>
                  <VerificationBadge level={vehicle.verification} />
                </div>
                <p className="mt-1 text-[11px] text-text-secondary">
                  {vehicle.plate} · VIN {vehicle.vin} · {formatNumber(vehicle.mileage, language)} {t('common.km')}
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-line/60 bg-ink-900/50 px-2.5 py-2">
                    <dt className="text-[9.5px] uppercase tracking-wider text-text-secondary">{t('carproof.timeline')}</dt>
                    <dd className="text-xs font-semibold text-text-primary">{records.length}</dd>
                  </div>
                  <div className="rounded-lg border border-line/60 bg-ink-900/50 px-2.5 py-2">
                    <dt className="text-[9.5px] uppercase tracking-wider text-text-secondary">{t('carproof.documents')}</dt>
                    <dd className="text-xs font-semibold text-text-primary">{documents.length}</dd>
                  </div>
                  <div className="rounded-lg border border-line/60 bg-ink-900/50 px-2.5 py-2">
                    <dt className="text-[9.5px] uppercase tracking-wider text-text-secondary">{t('carproof.verifiedShare')}</dt>
                    <dd className="text-xs font-semibold text-lime">{verifiedPercent}%</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader
              title={t('carproof.timeline')}
              subtitle={t('carproof.recordsTotal', { count: records.length })}
              icon={<BookOpenCheck className="h-4 w-4" aria-hidden="true" />}
            />
            <Tabs
              className="mb-5"
              ariaLabel={t('common.filter')}
              value={tab}
              onChange={setTab}
              items={[
                { id: 'all', label: t('carproof.filterAll'), count: records.length },
                { id: 'maintenance', label: t('maintenance.kindMaintenance'), count: records.filter((r) => r.kind === 'maintenance').length },
                { id: 'repairs', label: t('maintenance.kindRepair'), count: records.filter((r) => r.kind === 'repair').length },
                { id: 'inspection', label: t('maintenance.kindInspection'), count: records.filter((r) => r.kind === 'inspection').length },
              ]}
            />
            {filteredRecords.length === 0 ? (
              <EmptyState title={t('carproof.emptyTitle')} body={t('carproof.emptyBody')} className="py-10" />
            ) : (
              <ol>
                {(tab === 'inspection'
                  ? records.filter((r) => r.kind === 'inspection')
                  : filteredRecords
                ).map((record, index, arr) => (
                  <TimelineItem key={record.id} record={record} last={index === arr.length - 1} />
                ))}
              </ol>
            )}
          </Card>

          {/* Mileage history */}
          <Card>
            <CardHeader
              title={t('carproof.mileageHistory')}
              subtitle={
                mileage.length > 1
                  ? `${formatNumber(mileage[0].mileage, language)} → ${formatNumber(mileage[mileage.length - 1].mileage, language)} ${t('common.km')}`
                  : undefined
              }
              icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
            />
            {mileageSeries.length > 1 ? (
              <AreaChart
                data={mileageSeries}
                ariaLabel={t('carproof.mileageHistory')}
                formatValue={(v) => `${formatNumber(v, language)} ${t('common.km')}`}
              />
            ) : (
              <EmptyState title={t('common.noResults')} className="py-8" />
            )}
            <ul className="mt-4 space-y-1.5">
              {mileage.slice(-4).reverse().map((entry) => (
                <li key={entry.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">{formatDate(entry.date, language)}</span>
                  <span className="font-medium text-text-primary">
                    {formatNumber(entry.mileage, language)} {t('common.km')}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          {/* Verification status */}
          <Card>
            <CardHeader title={t('carproof.verification')} icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} />
            <ul className="space-y-2.5">
              {VERIFICATION_ORDER.map((level) => {
                const Icon = VERIFICATION_ICON[level];
                const count = records.filter((r) => r.verification === level).length;
                const active = verificationRank(vehicle.verification) >= verificationRank(level);
                return (
                  <li key={level} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        active ? 'border border-lime/25 bg-lime/10 text-lime' : 'border border-line bg-ink-900 text-text-secondary'
                      }`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-medium text-text-primary">{t(`carproof.${level.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`)}</p>
                        <span className="text-[10px] text-text-secondary">{count}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-text-secondary">
                        {t(`carproof.${level.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}Desc`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader title={t('carproof.expenses')} icon={<Receipt className="h-4 w-4" aria-hidden="true" />} />
            <div className="flex items-center gap-4">
              <Donut
                slices={expenses.map((e) => ({ label: t(`expenseCategories.${e.key}`), value: e.amount, color: EXPENSE_COLORS[e.key] }))}
                size={104}
                thickness={12}
                centerValue={formatCurrency(totalExpenses, language)}
              />
              <BarList
                className="flex-1"
                items={expenses.map((e) => ({ label: t(`expenseCategories.${e.key}`), value: e.amount, tone: EXPENSE_TONES[e.key] }))}
                formatValue={(v) => formatNumber(v, language)}
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
              <span className="text-[11px] text-text-secondary">{t('carproof.totalSpend')}</span>
              <span className="text-xs font-semibold text-text-primary">{formatCurrency(totalExpenses, language)}</span>
            </div>
          </Card>

          {/* Parts */}
          <Card>
            <CardHeader
              title={t('carproof.parts')}
              subtitle={t('carproof.partsCount', { count: allParts.length })}
              icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
            />
            {allParts.length === 0 ? (
              <p className="text-xs text-text-secondary">{t('carproof.noParts')}</p>
            ) : (
              <ul className="space-y-1.5">
                {allParts.map((part) => (
                  <li key={part} className="flex items-center gap-2 rounded-lg border border-line/60 bg-ink-900/40 px-2.5 py-2 text-[11px] text-text-primary">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-lime" aria-hidden="true" />
                    <span className="truncate">{part}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader
              title={t('carproof.documents')}
              icon={<FileText className="h-4 w-4" aria-hidden="true" />}
              action={
                <Link to="/app/documents" className="text-[11px] font-medium text-lime hover:underline">
                  {t('carproof.viewDocuments')}
                </Link>
              }
            />
            {documents.length === 0 ? (
              <p className="text-xs text-text-secondary">{t('documents.emptyBody')}</p>
            ) : (
              <ul className="space-y-2">
                {documents.slice(0, 4).map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2.5 rounded-lg border border-line/60 bg-ink-900/40 px-2.5 py-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-text-primary">
                        {language === 'ar' ? doc.nameAr ?? doc.name : doc.name}
                      </p>
                      <p className="text-[10px] text-text-secondary">{formatDate(doc.date, language)}</p>
                    </div>
                    <Badge tone="neutral" className="shrink-0 text-[9px] uppercase">
                      {doc.fileType}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
