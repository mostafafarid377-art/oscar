import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
}

export function Tabs({ items, value, onChange, className, ariaLabel, size = 'md' }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-ink-900/70 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition',
              size === 'md' ? 'px-3.5 py-2 text-xs' : 'px-2.5 py-1.5 text-[11px]',
              active
                ? 'bg-lime text-ink-950'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  active ? 'bg-ink-950/15 text-ink-950' : 'bg-white/10 text-text-secondary',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
