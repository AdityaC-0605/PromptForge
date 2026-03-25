'use client';

import { useState, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import SparklineChart from './SparklineChart';
import { formatDate, formatDuration, formatScore, statusBadgeClass } from '../../lib/utils';
import { exportRun, fetchRun } from '../../lib/api';
import type { RunSummary, RunStatus } from '../../lib/types';

// ── Types ────────────────────────────────────────────────────────

interface RunHistoryTableProps {
  runs: RunSummary[];
  onRerun?: (run: RunSummary) => void;
  onDelete?: (runId: string) => void;
}

interface SparklineData {
  version: number;
  score: number;
}

// ── Score Badge ──────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  let color: string;
  let bg: string;
  let border: string;

  if (score < 0.70) {
    color = '#dc2626';
    bg = 'rgba(220,38,38,0.1)';
    border = 'rgba(220,38,38,0.25)';
  } else if (score < 0.95) {
    color = '#d97706';
    bg = 'rgba(217,119,6,0.1)';
    border = 'rgba(217,119,6,0.25)';
  } else {
    color = '#16a34a';
    bg = 'rgba(22,163,74,0.1)';
    border = 'rgba(22,163,74,0.25)';
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      fontFamily: 'var(--font-mono)',
      color,
      background: bg,
      border: `1px solid ${border}`,
    }}>
      {formatScore(score)}
    </span>
  );
}

// ── Status Badge ─────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  running: 'Running',
  early_stopped: 'Early Stopped',
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
  const cls = statusBadgeClass(status as RunStatus);
  const colors = STATUS_COLORS[cls] ?? STATUS_COLORS.neutral;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 500,
      fontFamily: 'var(--font-sans)',
      color: colors.color,
      background: colors.bg,
      border: `1px solid ${colors.border}`,
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Empty State ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blink-cursor {
          animation: blink 1s step-end infinite;
        }
      `}</style>
      <div style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-card)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
      }}>
        <span>&gt; No runs yet. Start your first optimization.</span>
        <span className="blink-cursor">_</span>
      </div>
    </>
  );
}

// ── Filter Bar ───────────────────────────────────────────────────

interface FilterState {
  taskId: string;
  statuses: RunStatus[];
  scoreMin: string;
  scoreMax: string;
  dateFrom: string;
  dateTo: string;
}

interface FilterBarProps {
  runs: RunSummary[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

function FilterBar({ runs, filters, onChange }: FilterBarProps) {
  const taskIds = Array.from(new Set(runs.map(r => r.task_id))).sort();
  const allStatuses: RunStatus[] = ['completed', 'running', 'early_stopped', 'error', 'max_iterations'];

  const toggleStatus = (s: RunStatus) => {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter(x => x !== s)
      : [...filters.statuses, s];
    onChange({ ...filters, statuses: next });
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.375rem 0.625rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
    display: 'block',
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      padding: '1rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      marginBottom: '1rem',
      alignItems: 'flex-end',
    }}>
      {/* Task select */}
      <div>
        <label style={labelStyle}>Task</label>
        <select
          value={filters.taskId}
          onChange={e => onChange({ ...filters, taskId: e.target.value })}
          style={{ ...inputStyle, minWidth: '160px' }}
        >
          <option value="">All tasks</option>
          {taskIds.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      {/* Status multi-select */}
      <div>
        <label style={labelStyle}>Status</label>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {allStatuses.map(s => {
            const active = filters.statuses.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '999px',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'rgba(108,92,231,0.15)' : 'var(--bg-surface)',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.1s',
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score range */}
      <div>
        <label style={labelStyle}>Score range (%)</label>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={filters.scoreMin}
            onChange={e => onChange({ ...filters, scoreMin: e.target.value })}
            style={{ ...inputStyle, width: '60px' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>–</span>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="100"
            value={filters.scoreMax}
            onChange={e => onChange({ ...filters, scoreMax: e.target.value })}
            style={{ ...inputStyle, width: '60px' }}
          />
        </div>
      </div>

      {/* Date range */}
      <div>
        <label style={labelStyle}>Date range</label>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
            style={inputStyle}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>–</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => onChange({ ...filters, dateTo: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Clear button */}
      {(filters.taskId || filters.statuses.length > 0 || filters.scoreMin || filters.scoreMax || filters.dateFrom || filters.dateTo) && (
        <button
          onClick={() => onChange({ taskId: '', statuses: [], scoreMin: '', scoreMax: '', dateFrom: '', dateTo: '' })}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export default function RunHistoryTable({ runs, onRerun, onDelete }: RunHistoryTableProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    taskId: '',
    statuses: [],
    scoreMin: '',
    scoreMax: '',
    dateFrom: '',
    dateTo: '',
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sparklineData, setSparklineData] = useState<Record<string, SparklineData[]>>({});
  const [loadingSparkline, setLoadingSparkline] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // ── Client-side filtering ──────────────────────────────────────

  const filtered = runs.filter(run => {
    if (filters.taskId && run.task_id !== filters.taskId) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(run.status)) return false;

    const scoreMinVal = filters.scoreMin !== '' ? parseFloat(filters.scoreMin) / 100 : null;
    const scoreMaxVal = filters.scoreMax !== '' ? parseFloat(filters.scoreMax) / 100 : null;
    if (scoreMinVal !== null && run.best_score < scoreMinVal) return false;
    if (scoreMaxVal !== null && run.best_score > scoreMaxVal) return false;

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime() / 1000;
      if (run.started_at < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() / 1000 + 86400; // inclusive
      if (run.started_at > to) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.started_at - a.started_at);

  // ── Row expand / sparkline ─────────────────────────────────────

  const handleRowClick = useCallback(async (runId: string) => {
    if (expandedRow === runId) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(runId);

    if (!sparklineData[runId]) {
      setLoadingSparkline(runId);
      try {
        const fullRun = await fetchRun(runId);
        const data: SparklineData[] = fullRun.prompt_versions.map(v => ({
          version: v.version,
          score: Math.round(v.score * 100),
        }));
        setSparklineData(prev => ({ ...prev, [runId]: data }));
      } catch {
        setSparklineData(prev => ({ ...prev, [runId]: [] }));
      } finally {
        setLoadingSparkline(null);
      }
    }
  }, [expandedRow, sparklineData]);

  // ── Actions ────────────────────────────────────────────────────

  const handleView = (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    router.push(`/run/${runId}`);
  };

  const handleRerun = (e: React.MouseEvent, run: RunSummary) => {
    e.stopPropagation();
    if (onRerun) {
      onRerun(run);
    } else {
      router.push(`/run?task=${run.task_id}`);
    }
  };

  const handleExport = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    if (exportingId) return;
    setExportingId(runId);
    try {
      const data = await exportRun(runId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `run-${runId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    if (onDelete) onDelete(runId);
  };

  // ── Empty state (no runs at all) ───────────────────────────────

  if (runs.length === 0) {
    return <EmptyState />;
  }

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${color}33`,
    background: `${color}11`,
    color,
    cursor: 'pointer',
    fontSize: '0.7rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    transition: 'all 0.1s',
    whiteSpace: 'nowrap' as const,
  });

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    fontSize: '0.7rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.875rem 1rem',
    verticalAlign: 'middle',
  };

  return (
    <div>
      <FilterBar runs={runs} filters={filters} onChange={setFilters} />

      {sorted.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
        }}>
          No runs match the current filters.
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
                <th style={thStyle}>Run ID</th>
                <th style={thStyle}>Task</th>
                <th style={thStyle}>Dataset</th>
                <th style={thStyle}>Model</th>
                <th style={thStyle}>Iterations</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Started</th>
                <th style={thStyle}>Duration</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((run, idx) => {
                const isExpanded = expandedRow === run.run_id;
                const duration = run.finished_at
                  ? formatDuration(run.finished_at - run.started_at)
                  : run.status === 'running' ? 'Running…' : '-';

                return (
                  <Fragment key={run.run_id}>
                    <tr
                      onClick={() => handleRowClick(run.run_id)}
                      style={{
                        borderTop: idx === 0 ? 'none' : '0.5px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        background: isExpanded ? 'var(--bg-card-hover)' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {run.run_id}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{run.task_id}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>-</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>-</td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{run.total_iterations}</td>
                      <td style={tdStyle}><ScoreBadge score={run.best_score} /></td>
                      <td style={tdStyle}><StatusBadge status={run.status} /></td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(run.started_at)}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{duration}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                          <button style={actionBtnStyle('var(--accent-light)')} onClick={e => handleView(e, run.run_id)}>View</button>
                          <button style={actionBtnStyle('#16a34a')} onClick={e => handleRerun(e, run)}>Re-run</button>
                          <button
                            style={actionBtnStyle('var(--text-secondary)')}
                            onClick={e => handleExport(e, run.run_id)}
                            disabled={exportingId === run.run_id}
                          >
                            {exportingId === run.run_id ? '…' : 'Export'}
                          </button>
                          <button style={actionBtnStyle('#dc2626')} onClick={e => handleDelete(e, run.run_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${run.run_id}-sparkline`} style={{ borderTop: '0.5px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                        <td colSpan={10} style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                              Score history
                            </span>
                            <div style={{ flex: 1, maxWidth: '400px' }}>
                              {loadingSparkline === run.run_id ? (
                                <div style={{ height: 60, display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-sans)' }}>
                                  Loading…
                                </div>
                              ) : (
                                <SparklineChart
                                  data={sparklineData[run.run_id] ?? []}
                                  height={60}
                                />
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                              Best: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{formatScore(run.best_score)}</span>
                              {' · '}
                              v{run.best_version}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
