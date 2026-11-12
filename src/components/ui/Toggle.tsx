import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, id, disabled }: ToggleProps) {
  const toggleId = id ?? `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={toggleId} className="block cursor-pointer text-sm font-medium text-text-primary">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{description}</p> : null}
      </div>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition duration-200 disabled:opacity-40',
          checked ? 'border-lime/40 bg-lime/90' : 'border-line bg-ink-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-ink-950 transition-all duration-200',
            'h-[18px] w-[18px]',
            checked ? 'start-[22px]' : 'start-0.5',
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
