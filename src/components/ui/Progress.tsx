import { cn } from '@/utils/cn';

export function ProgressBar({
  value,
  className,
  tone = 'lime',
  label,
}: {
  value: number;
  className?: string;
  tone?: 'lime' | 'amber' | 'red' | 'sky';
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tones = {
    lime: 'bg-lime',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    sky: 'bg-sky-400',
  } as const;

  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink-700', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-700', tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
