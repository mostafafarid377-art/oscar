import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellOff,
  CheckCheck,
  Check,
  FileText,
  Settings2,
  Sparkles,
  Trash2,
  Wrench,
  Info,
} from 'lucide-react';
import { Badge, Button, Card, DemoBadge, EmptyState, Tabs } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, relativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { NotificationKind } from '@/types';

const KIND_ICON = {
  maintenance: Wrench,
  document: FileText,
  diagnostic: Sparkles,
  system: Info,
} as const;

const SEVERITY_STYLE = {
  critical: 'border-red-500/25 bg-red-500/[0.05]',
  warning: 'border-amber-400/25 bg-amber-400/[0.05]',
  info: 'border-line bg-ink-800',
} as const;

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { notifications, markAllNotificationsRead, markNotificationRead, deleteNotification, vehicles } = useApp();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');

  const unread = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.kind === (filter as NotificationKind));
  }, [notifications, filter]);

  const today = new Date().toISOString().slice(0, 10);
  const todays = filtered.filter((n) => n.date.slice(0, 10) === today);
  const earlier = filtered.filter((n) => n.date.slice(0, 10) !== today);

  const vehicleName = (id?: string) => {
    if (!id) return null;
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make} ${v.model}` : null;
  };

  const renderGroup = (items: typeof notifications) =>
    items.map((notif) => {
      const Icon = KIND_ICON[notif.kind];
      const vName = vehicleName(notif.vehicleId);
      return (
        <li key={notif.id}>
          <div
            className={cn(
              'group relative flex gap-3 rounded-xl border p-3.5 transition',
              SEVERITY_STYLE[notif.severity],
              !notif.read && 'ring-1 ring-inset ring-lime/15',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                notif.read
                  ? 'border-line bg-white/[0.03] text-text-secondary'
                  : 'border-lime/25 bg-lime/10 text-lime',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className={cn('text-xs font-semibold', notif.read ? 'text-text-secondary' : 'text-text-primary')}>
                  {language === 'ar' ? notif.titleAr : t(notif.titleKey)}
                </p>
                {!notif.read ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-label={t('notifications.unread')} />
                ) : null}
                <Badge tone="neutral" className="ms-auto px-1.5 py-0.5 text-[8.5px] uppercase">
                  {t(`notifications.types.${notif.kind}`)}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                {language === 'ar' ? notif.bodyAr : t(notif.bodyKey)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-text-secondary">
                <span>{formatDateTime(notif.date, language)}</span>
                {vName ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{vName}</span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{relativeTime(notif.date, language)}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {notif.href ? (
                  <Link
                    to={notif.href}
                    className="rounded-md border border-line bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-text-primary transition hover:border-lime/40 hover:text-lime"
                  >
                    {t('common.viewAll')}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => markNotificationRead(notif.id, !notif.read)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
                >
                  <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  {notif.read ? t('notifications.markUnread') : t('notifications.markRead')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteNotification(notif.id);
                    toast(t('notifications.deleted'), 'warning');
                  }}
                  aria-label={t('notifications.deleteNotif')}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-text-secondary transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </li>
      );
    });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        badge={<DemoBadge label={t('common.demoBadge')} />}
        actions={
          <>
            <Link to="/app/settings">
              <Button variant="secondary" size="md" icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}>
                {t('notifications.settings')}
              </Button>
            </Link>
            <Button
              size="md"
              disabled={unread === 0}
              onClick={() => {
                markAllNotificationsRead();
                toast(t('notifications.allRead'));
              }}
              icon={<CheckCheck className="h-4 w-4" aria-hidden="true" />}
            >
              {t('notifications.markAllRead')}
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs
          value={filter}
          onChange={setFilter}
          ariaLabel={t('common.filters')}
          items={[
            { id: 'all', label: t('notifications.filterAll'), count: notifications.length },
            { id: 'unread', label: t('notifications.filterUnread'), count: unread },
            { id: 'maintenance', label: t('notifications.filterMaintenance') },
            { id: 'document', label: t('notifications.filterDocuments') },
            { id: 'diagnostic', label: t('notifications.filterDiagnostics') },
          ]}
        />
        <span className="text-[11px] text-text-secondary sm:ms-auto">
          {unread > 0 ? t('dashboard.unread', { count: unread }) : t('dashboard.noUnread')}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={filter === 'unread' ? <BellOff className="h-5 w-5" aria-hidden="true" /> : <Bell className="h-5 w-5" aria-hidden="true" />}
          title={filter === 'unread' ? t('notifications.emptyUnread') : t('notifications.emptyTitle')}
          body={filter === 'unread' ? t('notifications.emptyUnreadBody') : t('notifications.emptyBody')}
        />
      ) : (
        <div className="space-y-5">
          {todays.length > 0 ? (
            <section>
              <h2 className="stat-label mb-2">{t('notifications.groupsToday')}</h2>
              <ul className="space-y-2">{renderGroup(todays)}</ul>
            </section>
          ) : null}
          {earlier.length > 0 ? (
            <section>
              <h2 className="stat-label mb-2">{t('notifications.groupsEarlier')}</h2>
              <ul className="space-y-2">{renderGroup(earlier)}</ul>
            </section>
          ) : null}
        </div>
      )}

      <Card className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-text-primary">{t('notifications.settings')}</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-text-secondary">{t('settings.notificationsBody')}</p>
            </div>
          </div>
          <Link to="/app/settings" className="shrink-0">
            <Button variant="outline" size="sm">
              {t('common.viewAll')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
