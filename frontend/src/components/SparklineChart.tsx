'use client';
// src/components/SparklineChart.tsx — Compact Recharts area chart for score progression
import {
  AreaChart,
  Area,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface SparklineChartProps {
  data: { version: number; score: number }[];
  target?: number;
  height?: number; // default 80 for compact sparkline
}

export default function SparklineChart({ data, target, height = 80 }: SparklineChartProps) {
  if (!data.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-sans)',
        }}
      >
        No data yet
      </div>
    );
  }

  const visible = data.slice(-10);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={visible} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <XAxis dataKey="version" hide />
        <YAxis domain={[0, 100]} hide />
        {target !== undefined && (
          <ReferenceLine
            y={target}
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        )}
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
          }}
          formatter={(value: number) => [`${value}%`, 'Score']}
          labelFormatter={(label) => `v${label}`}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#16a34a"
          strokeWidth={1.5}
          fill="#16a34a"
          fillOpacity={0.15}
          dot={false}
          activeDot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
