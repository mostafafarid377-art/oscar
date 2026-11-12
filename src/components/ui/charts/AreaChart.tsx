import { useId } from 'react';
import { cn } from '@/utils/cn';

export interface AreaPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaPoint[];
  height?: number;
  className?: string;
  formatValue?: (value: number) => string;
  ariaLabel: string;
}

export function AreaChart({ data, height = 140, className, formatValue, ariaLabel }: AreaChartProps) {
  const gradientId = useId().replace(/:/g, '');
  if (data.length < 2) {
    return (
      <div className={cn('flex items-center justify-center text-xs text-text-secondary', className)} style={{ height }}>
        —
      </div>
    );
  }

  const width = 520;
  const padding = { top: 14, right: 10, bottom: 10, left: 10 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * innerW;
    const y = padding.top + innerH - ((point.value - min) / span) * innerH;
    return { x, y, ...point };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const bottom = padding.top + innerH;
  const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${bottom} L ${points[0].x.toFixed(1)} ${bottom} Z`;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={ariaLabel} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C6FF3D" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#C6FF3D" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * ratio}
            y2={padding.top + innerH * ratio}
            stroke="#2B323D"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="#C6FF3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={`${p.label}-${i}`} cx={p.x} cy={p.y} r="3" fill="#090B0F" stroke="#C6FF3D" strokeWidth="1.8">
            <title>{`${p.label}: ${formatValue ? formatValue(p.value) : p.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-text-secondary">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
