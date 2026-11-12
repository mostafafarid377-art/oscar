import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, ListChecks, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { DiagnosticSummary } from '@/types';
import { cn } from '@/utils/cn';

const URGENCY_TONE = {
  low: 'lime',
  medium: 'warning',
  high: 'danger',
} as const;

export function DiagnosticCard({ diagnostic }: { diagnostic: DiagnosticSummary }) {
  const { t } = useTranslation();
  const tone = URGENCY_TONE[diagnostic.urgency];
  const UrgencyIcon = diagnostic.urgency === 'high' ? AlertTriangle : Info;

  return (
    <div className="mt-2.5 overflow-hidden rounded-xl border border-line bg-ink-900/80">
      <div className="flex items-center justify-between gap-2 border-b border-line/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="h-3 w-3 shrink-0 text-lime" aria-hidden="true" />
          <p className="truncate text-[11px] font-semibold text-text-primary">{t('ai.diagnostics')}</p>
        </div>
        <Badge tone={tone} icon={<UrgencyIcon className="h-2.5 w-2.5" aria-hidden="true" />}>
          {t('ai.urgency')}: {t(`ai.urgency${diagnostic.urgency.charAt(0).toUpperCase()}${diagnostic.urgency.slice(1)}`)}
        </Badge>
      </div>

      <div className="space-y-2.5 px-3 py-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-secondary">{t('ai.vehicleContext')}</p>
          <p className="mt-0.5 text-[11.5px] font-medium text-text-primary">{t(diagnostic.topicKey)}</p>
        </div>
        <p className="text-[11px] leading-relaxed text-text-secondary">{t(diagnostic.summaryKey)}</p>

        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-secondary">
            <ListChecks className="h-3 w-3" aria-hidden="true" />
            {t('ai.suggestedActions')}
          </p>
          <ul className="space-y-1">
            {diagnostic.actions.map((action, index) => (
              <li key={action.key} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-text-primary">
                <span
                  className={cn(
                    'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold',
                    tone === 'danger' ? 'bg-red-500/15 text-red-300' : 'bg-lime/15 text-lime',
                  )}
                >
                  {index + 1}
                </span>
                {t(action.key)}
              </li>
            ))}
          </ul>
        </div>

        <p className="rounded-lg border border-dashed border-line/80 px-2 py-1.5 text-[9.5px] leading-relaxed text-text-secondary">
          {t('ai.noConfidence')}
        </p>
      </div>
    </div>
  );
}
