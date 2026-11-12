import { cn } from '@/utils/cn';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  slices,
  size = 132,
  thickness = 14,
  centerLabel,
  centerValue,
  className,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={centerLabel}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2B323D" strokeWidth={thickness} />
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dash = `${Math.max(length - 3, 0)} ${circumference - Math.max(length - 3, 0)}`;
          const el = (
            <circle
              key={slice.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            >
              <title>{`${slice.label}: ${slice.value}`}</title>
            </circle>
          );
          offset += length;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerValue ? (
          <span className="max-w-[72%] break-words text-center text-[11px] font-semibold leading-tight text-text-primary">
            {centerValue}
          </span>
        ) : null}
        {centerLabel ? (
          <span className="mt-0.5 max-w-[70%] text-center text-[9px] uppercase leading-tight tracking-wider text-text-secondary">
            {centerLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
