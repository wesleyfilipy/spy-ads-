'use client';

interface DataPoint {
  value: number;
  label?: string;
}

interface MiniLineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

export function MiniLineChart({
  data,
  color = '#6366f1',
  height = 48,
  showArea = true,
}: MiniLineChartProps) {
  if (!data.length) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 200;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = values.map((v, i) => ({
    x: padding + (i / Math.max(values.length - 1, 1)) * chartWidth,
    y: padding + chartHeight - ((v - min) / range) * chartHeight,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${points[0].x},${height} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      {showArea && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.12"
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

export function BarChart({ data, color = '#6366f1', height = 80 }: MiniLineChartProps & { height?: number }) {
  if (!data.length) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const barWidth = 100 / data.length;

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      {values.map((v, i) => {
        const barH = (v / max) * 90;
        const x = i * barWidth + barWidth * 0.1;
        const w = barWidth * 0.8;
        return (
          <rect
            key={i}
            x={x}
            y={100 - barH}
            width={w}
            height={barH}
            rx="2"
            fill={color}
            fillOpacity={i === values.length - 1 ? 1 : 0.6}
          />
        );
      })}
    </svg>
  );
}

export function DonutChart({
  data,
  size = 80,
}: {
  data: Array<{ value: number; color: string; label: string }>;
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const r = 35;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const segments = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const segment = { ...d, dash, offset };
    offset += dash;
    return segment;
  });

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth="10"
          strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
          strokeDashoffset={-seg.offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      ))}
    </svg>
  );
}
