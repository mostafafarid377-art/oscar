import { cn } from '@/utils/cn';

export interface BarItem {
  label: string;
  value: number;
  tone?: 'lime' | 'sky' | 'violet' | 'amber' | 'neutral';
}

const TONE_CLASS = {
  lime: 'bg-lime',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  amber: 'bg-amber-400',
  neutral: 'bg-text-secondary/60',
} as const;

export function BarList({
  items,
  formatValue,
  className,
}: {
  items: BarItem[];
  formatValue?: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
            <span className="text-text-secondary">{item.label}</span>
            <span className="font-medium tabular-nums text-text-primary">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className={cn('h-full rounded-full transition-all duration-700', TONE_CLASS[item.tone ?? 'lime'])}
              style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
