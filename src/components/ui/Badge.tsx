import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'lime' | 'neutral' | 'warning' | 'danger' | 'info' | 'violet';

const TONES: Record<Tone, string> = {
  lime: 'border-lime/30 bg-lime/10 text-lime',
  neutral: 'border-line bg-white/[0.04] text-text-secondary',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  danger: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  violet: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function DemoBadge({ label = 'Demo data' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line/90 bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-lime/70" aria-hidden="true" />
      {label}
    </span>
  );
}
