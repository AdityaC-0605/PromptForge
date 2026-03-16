"use client";

interface FailureCluster {
  category: string;
  count: number;
  examples: { input: string; expected: string; actual: string }[];
}

interface FailureHeatmapProps {
  clusters: FailureCluster[];
  total: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  wrong_content: {
    bg: "rgba(108, 92, 231, 0.2)",
    text: "var(--accent-secondary)",
    label: "Wrong Content",
  },
  wrong_format: {
    bg: "rgba(253, 203, 110, 0.15)",
    text: "var(--warning)",
    label: "Wrong Format",
  },
  refusal: {
    bg: "rgba(255, 107, 107, 0.15)",
    text: "var(--danger)",
    label: "Refusal",
  },
  hallucination: {
    bg: "rgba(116, 185, 255, 0.15)",
    text: "var(--info)",
    label: "Hallucination",
  },
  error: {
    bg: "rgba(255, 107, 107, 0.1)",
    text: "var(--danger)",
    label: "Error",
  },
};

export default function FailureHeatmap({ clusters, total }: FailureHeatmapProps) {
  if (!clusters.length) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Failure Analysis
        </h3>
        <div className="flex items-center gap-2 py-8 justify-center">
          <span className="text-2xl">✅</span>
          <span style={{ color: 'var(--success)' }}>All test cases passed!</span>
        </div>
      </div>
    );
  }

  const totalFailures = clusters.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Failure Analysis
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {totalFailures} failures / {total} total
        </span>
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-lg overflow-hidden mb-5" style={{ height: '28px' }}>
        {clusters.map((cluster) => {
          const color = CATEGORY_COLORS[cluster.category] || CATEGORY_COLORS.error;
          const pct = (cluster.count / total) * 100;
          return (
            <div
              key={cluster.category}
              style={{
                width: `${pct}%`,
                background: color.bg,
                borderRight: '1px solid var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: pct > 8 ? 'auto' : '0',
              }}
              title={`${color.label}: ${cluster.count}`}
            >
              {pct > 8 && (
                <span className="text-xs font-medium" style={{ color: color.text }}>
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
        {/* Passed portion */}
        <div style={{
          width: `${((total - totalFailures) / total) * 100}%`,
          background: 'var(--success-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
            {Math.round(((total - totalFailures) / total) * 100)}% ✓
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        {clusters.map((cluster) => {
          const color = CATEGORY_COLORS[cluster.category] || CATEGORY_COLORS.error;
          return (
            <div key={cluster.category}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color.text }} />
                  <span className="text-sm font-medium" style={{ color: color.text }}>
                    {color.label}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {cluster.count} cases
                </span>
              </div>
              {cluster.examples.slice(0, 2).map((ex, i) => (
                <div key={i} className="ml-5 mb-1.5 p-2 rounded text-xs" style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid rgba(42,42,58,0.5)',
                }}>
                  <div className="truncate" style={{ color: 'var(--text-secondary)' }}>
                    <strong>In:</strong> {ex.input}
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="truncate" style={{ color: 'var(--success)' }}>
                      <strong>Expected:</strong> {ex.expected}
                    </span>
                    <span className="truncate" style={{ color: 'var(--danger)' }}>
                      <strong>Got:</strong> {ex.actual}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
