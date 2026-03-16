"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area
} from "recharts";

interface ScoreChartProps {
  data: { version: number; score: number }[];
  target?: number;
}

export default function ScoreChart({ data, target = 0.95 }: ScoreChartProps) {
  if (!data.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center" style={{ height: 300 }}>
        <p style={{ color: 'var(--text-muted)' }}>No data yet — start a run to see the score chart</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    scorePercent: Math.round(d.score * 100),
  }));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Accuracy Over Iterations
        </h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent-secondary)' }}>
            <span className="w-3 h-0.5 rounded" style={{ background: 'var(--accent-primary)' }} />
            Score
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--success)' }}>
            <span className="w-3 h-0.5 rounded" style={{ background: 'var(--success)', opacity: 0.5 }} />
            Target ({Math.round(target * 100)}%)
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(42,42,58,0.3)" strokeDasharray="3 3" />
          <XAxis
            dataKey="version"
            tick={{ fill: '#55556a', fontSize: 12 }}
            axisLine={{ stroke: '#2a2a3a' }}
            label={{ value: 'Version', position: 'insideBottom', offset: -5, fill: '#55556a', fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#55556a', fontSize: 12 }}
            axisLine={{ stroke: '#2a2a3a' }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: '#16161f',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: '#8b8b9e' }}
            itemStyle={{ color: '#a29bfe' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}%`, 'Accuracy']}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(label: any) => `Version ${label}`}
          />
          <ReferenceLine
            y={target * 100}
            stroke="#00d2a0"
            strokeDasharray="6 4"
            strokeOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="scorePercent"
            stroke="transparent"
            fill="url(#scoreGradient)"
          />
          <Line
            type="monotone"
            dataKey="scorePercent"
            stroke="#6c5ce7"
            strokeWidth={2.5}
            dot={{ fill: '#6c5ce7', stroke: '#16161f', strokeWidth: 2, r: 4 }}
            activeDot={{ fill: '#a29bfe', stroke: '#6c5ce7', strokeWidth: 2, r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
