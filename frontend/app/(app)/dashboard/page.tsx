'use client';
// app/(app)/dashboard/page.tsx — Dashboard page
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchRuns, fetchTasks, isMockMode } from '@/lib/api';
import { formatDate, formatScore, statusBadgeClass } from '@/lib/utils';
import RunConfigForm from '@/src/components/RunConfigForm';
import type { RunSummary, Task } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      if (isMockMode()) {
        const { mockRunSummaries, mockTasks } = await import('@/lib/mockData');
        setRuns(mockRunSummaries);
        setTasks(mockTasks);
      } else {
        const [runsData, tasksData] = await Promise.all([fetchRuns(), fetchTasks()]);
        setRuns(runsData);
        setTasks(tasksData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build task_id → human-readable label lookup
  const taskMap = new Map(tasks.map((t) => [t.task_id, t.description || t.task_id]));

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'var(--text)',
          marginBottom: '2rem',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Dashboard
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Recent Runs */}
        <section>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: '1rem',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Recent Runs
          </h2>

          {loading && (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
              }}
            >
              Loading runs…
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  color: 'var(--red)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {error}
              </p>
              <button
                onClick={loadData}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && runs.length === 0 && (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
              }}
            >
              No runs yet. Start your first run using the form.
            </div>
          )}

          {!loading && !error && runs.length > 0 && (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                background: 'var(--bg-card)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '0.5px solid var(--border-subtle)',
                    }}
                  >
                    {['Task', 'Status', 'Best Score', 'Iterations', 'Started'].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, idx) => (
                    <tr
                      key={run.run_id}
                      onClick={() => router.push(`/run/${run.run_id}`)}
                      style={{
                        borderTop: idx === 0 ? 'none' : '0.5px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                      }}
                    >
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text)',
                          fontWeight: 500,
                        }}
                      >
                        {taskMap.get(run.task_id) ?? run.task_id}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={run.status} />
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatScore(run.best_score)}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {run.total_iterations}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {formatDate(run.started_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* New Run */}
        <aside>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: '1rem',
              fontFamily: 'var(--font-sans)',
            }}
          >
            New Run
          </h2>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '1.25rem',
              background: 'var(--bg-card)',
            }}
          >
            <RunConfigForm />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  running: 'Running',
  early_stopped: 'Early Stopped',
  stopped: 'Stopped',
  error: 'Error',
  max_iterations: 'Max Iterations',
};

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  success: { color: 'var(--green)', bg: 'rgba(0,210,160,0.1)', border: 'rgba(0,210,160,0.25)' },
  info: { color: 'var(--accent-light)', bg: 'rgba(108,92,231,0.1)', border: 'rgba(108,92,231,0.25)' },
  warning: { color: 'var(--yellow)', bg: 'rgba(253,203,110,0.1)', border: 'rgba(253,203,110,0.25)' },
  danger: { color: 'var(--red)', bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.25)' },
  neutral: { color: 'var(--text-secondary)', bg: 'rgba(139,139,158,0.1)', border: 'rgba(139,139,158,0.25)' },
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusBadgeClass(status as Parameters<typeof statusBadgeClass>[0]);
  const colors = STATUS_COLORS[cls] ?? STATUS_COLORS.neutral;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        color: colors.color,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
