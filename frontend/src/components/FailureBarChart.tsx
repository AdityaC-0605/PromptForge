'use client';
// src/components/FailureBarChart.tsx — Recharts horizontal bar chart for failure type counts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

interface FailureBarChartProps {
  data: { type: string; count: number }[];
}

export default function FailureBarChart({ data }: FailureBarChartProps) {
  if (!data.length) {
    return (
      <div
        style={{
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-sans)',
        }}
      >
        No failures recorded
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="type"
          width={100}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
        />
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
          formatter={(value: number) => [value, 'Failures']}
        />
        <Bar dataKey="count" fill="var(--red)" fillOpacity={0.75} radius={[0, 3, 3, 0]}>
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
