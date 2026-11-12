import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, SearchX } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-ink-900/40 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-ink-800 text-text-secondary">
        {icon ?? <SearchX className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel,
}: {
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-sm text-text-secondary">{body}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-ink-900/40 px-6 py-16 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-lime" aria-hidden="true" />
      <p className="text-sm text-text-secondary" role="status" aria-live="polite">
        {label}
      </p>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-2xl border border-line bg-ink-800 p-5', className)}>
      <div className="mb-4 h-3 w-24 rounded-full bg-ink-700" />
      <div className="mb-2 h-4 w-2/3 rounded-full bg-ink-700" />
      <div className="h-3 w-1/2 rounded-full bg-ink-700/70" />
    </div>
  );
}
