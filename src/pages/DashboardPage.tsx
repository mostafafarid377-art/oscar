import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bell, BookOpenCheck, FileCheck2, Wrench } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocalized } from '@/hooks/useLocalized';
import { VehicleHeroCard } from '@/features/dashboard/VehicleHeroCard';
import { MaintenanceStatusCard } from '@/features/dashboard/MaintenanceStatusCard';
import { UpcomingServices } from '@/features/dashboard/UpcomingServices';
import { RecentRepairs } from '@/features/dashboard/RecentRepairs';
import { ExpensesCard } from '@/features/dashboard/ExpensesCard';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { relativeTime } from '@/utils/format';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { num } = useLocalized();
  const { activeVehicle, profile, notifications, records, documents, recordsForVehicle } = useApp();

  if (!activeVehicle) {
    return (
      <div>
        <PageHeader title={t('nav.dashboard')} />
        <EmptyState
          icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
          title={t('garage.emptyTitle')}
          body={t('garage.emptyBody')}
          action={
            <Link
              to="/app/garage"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-lime px-4 text-xs font-semibold text-ink-950"
            >
              {t('garage.emptyCta')}
              <ArrowRight className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />
            </Link>
          }
        />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('dashboard.greetingMorning') : hour < 18 ? t('dashboard.greetingAfternoon') : t('dashboard.greetingEvening');
  const unread = notifications.filter((n) => !n.read).length;
  const vehicleRecords = recordsForVehicle(activeVehicle.id);
  const verifiedDocs = documents.filter((d) => d.verification !== 'owner_reported').length;
  const latestUpdate = notifications[0]?.date;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting}, ${profile.name.split(' ')[0]}`}
        subtitle={t('dashboard.subtitle', { vehicle: `${activeVehicle.make} ${activeVehicle.model}` })}
        badge={
          latestUpdate ? (
            <span className="text-[10px] text-text-secondary">
              {t('dashboard.lastUpdated', { time: relativeTime(latestUpdate, language) })}
            </span>
          ) : undefined
        }
        actions={
          <Link
            to="/app/notifications"
            className="flex items-center gap-2 rounded-xl border border-line bg-ink-800 px-3 py-2 text-xs font-medium text-text-primary transition hover:border-lime/40"
          >
            <Bell className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
            {unread > 0 ? t('dashboard.unread', { count: unread }) : t('dashboard.noUnread')}
            <span className="rounded-full bg-lime/15 px-1.5 py-0.5 text-[10px] font-bold text-lime">{notifications.length}</span>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-4">
          <VehicleHeroCard vehicle={activeVehicle} />
          <div className="grid gap-4 sm:grid-cols-2">
            <UpcomingServices vehicle={activeVehicle} />
            <RecentRepairs vehicle={activeVehicle} />
          </div>
          <ExpensesCard vehicle={activeVehicle} />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t('dashboard.servicesCompleted'), value: vehicleRecords.filter((r) => r.status === 'completed').length, icon: Wrench },
              { label: t('dashboard.docsVerified'), value: verifiedDocs, icon: FileCheck2 },
              { label: t('dashboard.recentRepairs'), value: records.filter((r) => r.kind === 'repair').length, icon: BookOpenCheck },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border border-line bg-ink-800 p-2.5 text-center">
                  <Icon className="mx-auto h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                  <p className="mt-1.5 text-base font-semibold leading-none text-text-primary">{num(stat.value)}</p>
                  <p className="mt-1 line-clamp-2 text-[9.5px] leading-tight text-text-secondary">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <MaintenanceStatusCard vehicle={activeVehicle} />
          <QuickActions />

          <Card>
            <CardHeader title={t('dashboard.insightTitle')} icon={<BookOpenCheck className="h-4 w-4" aria-hidden="true" />} />
            <p className="text-xs leading-relaxed text-text-secondary">
              {t('dashboard.insightBody', { count: documents.filter((d) => d.vehicleId === activeVehicle.id).length })}
            </p>
            <Link
              to="/app/documents"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-lime hover:underline"
            >
              {t('dashboard.insightCta')}
              <ArrowRight className="h-3 w-3 rtl-flip" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
