import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Wallet } from 'lucide-react';
import { Card, CardHeader, Donut, BarList } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { formatCurrency, formatNumber } from '@/utils/format';
import { DEMO_EXPENSES } from '@/data/mockData';
import type { Vehicle } from '@/types';

const COLORS: Record<string, string> = {
  maintenance: '#C6FF3D',
  repairs: '#60A5FA',
  insurance: '#A78BFA',
  fuel: '#FBBF24',
  other: '#9199A8',
};

const TONES = {
  maintenance: 'lime',
  repairs: 'sky',
  insurance: 'violet',
  fuel: 'amber',
  other: 'neutral',
} as const;

export function ExpensesCard({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const expenses = DEMO_EXPENSES[vehicle.id] ?? DEMO_EXPENSES['veh-elantra-2018'];
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const maintenanceTotal = expenses
    .filter((e) => e.key === 'maintenance' || e.key === 'repairs')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card>
      <CardHeader
        title={t('dashboard.expenses')}
        subtitle={t('dashboard.expensesSubtitle')}
        icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
        action={
          <Link to="/app/carproof" className="flex items-center gap-1 text-[11px] font-medium text-lime hover:underline">
            {t('carproof.expenses')}
            <ArrowRight className="h-3 w-3 rtl-flip" aria-hidden="true" />
          </Link>
        }
      />
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <Donut
          slices={expenses.map((e) => ({ label: t(`expenseCategories.${e.key}`), value: e.amount, color: COLORS[e.key] }))}
          centerValue={formatCurrency(total, language)}
          centerLabel={t('dashboard.expenseTotal')}
          size={126}
        />
        <div className="w-full flex-1">
          <BarList
            items={expenses.map((e) => ({
              label: t(`expenseCategories.${e.key}`),
              value: e.amount,
              tone: TONES[e.key],
            }))}
            formatValue={(v) => formatCurrency(v, language)}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-ink-900/60 px-3 py-2.5">
        <span className="text-[11px] text-text-secondary">{t('carproof.totalSpend')}</span>
        <span className="text-xs font-semibold text-text-primary">
          {formatNumber(maintenanceTotal, language)} EGP · {t('common.demoBadge')}
        </span>
      </div>
    </Card>
  );
}
