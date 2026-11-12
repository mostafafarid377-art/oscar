import { useTranslation } from 'react-i18next';
import { ImageIcon, Sparkles, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui';
import { DiagnosticCard } from './DiagnosticCard';
import type { ChatMessage } from '@/types';
import { cn } from '@/utils/cn';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const { t, i18n } = useTranslation();
  const isUser = message.role === 'user';
  const text = i18n.language === 'ar' && message.textAr ? message.textAr : message.text;

  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <span
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
          isUser ? 'border-line bg-ink-900 text-text-secondary' : 'border-lime/25 bg-lime/10 text-lime',
        )}
        aria-hidden="true"
      >
        {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </span>

      <div className={cn('min-w-0 max-w-[86%] sm:max-w-[78%]', isUser && 'flex flex-col items-end')}>
        {!isUser ? (
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-text-primary">{t('ai.title')}</span>
            <Badge tone="neutral" className="px-1.5 py-0.5 text-[8.5px] uppercase">
              {t('ai.demoReply')}
            </Badge>
          </div>
        ) : null}

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed',
            isUser
              ? 'rounded-ee-md bg-lime text-ink-950'
              : 'rounded-es-md border border-line bg-ink-900 text-text-secondary',
          )}
        >
          {message.attachment ? (
            <span className="mb-1.5 flex items-center gap-1.5 rounded-lg bg-ink-950/30 px-2 py-1 text-[10px]">
              <ImageIcon className="h-3 w-3" aria-hidden="true" />
              {message.attachment.name}
            </span>
          ) : null}
          {text}
        </div>

        {message.diagnostic ? <DiagnosticCard diagnostic={message.diagnostic} /> : null}
      </div>
    </div>
  );
}
