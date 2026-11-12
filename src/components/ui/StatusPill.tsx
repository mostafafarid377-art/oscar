import { useTranslation } from 'react-i18next';
import { Badge } from './Badge';
import type { RecordStatus } from '@/types';

const TONES = {
  completed: 'lime',
  scheduled: 'info',
  overdue: 'danger',
  in_progress: 'warning',
} as const;

export function StatusPill({ status }: { status: RecordStatus }) {
  const { t } = useTranslation();
  return <Badge tone={TONES[status]}>{t(`statuses.${status}`)}</Badge>;
}
