import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpenCheck, Sparkles, BellRing, FileText } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { useApp } from '@/lib/store';

export function QuickActions() {
  const { t } = useTranslation();
  const { notifications } = useApp();
  const unread = notifications.filter((n) => !n.read).length;

  const actions = [
    {
      to: '/app/ai-mechanic',
      title: t('dashboard.askMechanic'),
      body: t('dashboard.askMechanicBody'),
      icon: Sparkles,
      highlight: true,
    },
    {
      to: '/app/carproof',
      title: t('dashboard.openPassport'),
      body: t('dashboard.openPassportBody'),
      icon: BookOpenCheck,
    },
    {
      to: '/app/notifications',
      title: t('dashboard.notifications'),
      body: unread ? t('dashboard.unread', { count: unread }) : t('dashboard.noUnread'),
      icon: BellRing,
    },
    {
      to: '/app/documents',
      title: t('nav.documents'),
      body: t('documents.storageNote'),
      icon: FileText,
    },
  ];

  return (
    <Card>
      <CardHeader title={t('dashboard.quickActions')} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className={`group flex flex-col gap-2 rounded-xl border p-3.5 transition ${
                action.highlight
                  ? 'border-lime/25 bg-lime/[0.06] hover:bg-lime/[0.12]'
                  : 'border-line bg-ink-900/40 hover:border-white/15 hover:bg-ink-900'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  action.highlight ? 'bg-lime/15 text-lime' : 'bg-white/[0.04] text-text-secondary group-hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className={`text-xs font-semibold ${action.highlight ? 'text-lime' : 'text-text-primary'}`}>
                  {action.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-relaxed text-text-secondary">{action.body}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
