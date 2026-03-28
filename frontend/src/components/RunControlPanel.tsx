'use client';
// src/components/RunControlPanel.tsx — Left-column panel for the live run view

import type { Run, RunStatus } from '../../lib/types';
import ScoreRing from './ScoreRing';

interface RunControlPanelProps {
  run: Run;
  scoreHistory: { version: number; score: number }[];
  onPause: () => void;
  onStop: () => void;
  onExport: () => void;
}

const STATUS_COLORS: Record<RunStatus, { bg: string; color: string }> = {
  running:       { bg: '#166534', color: '#bbf7d0' },
  completed:     { bg: '#1e3a5f', color: '#bfdbfe' },
  early_stopped: { bg: '#713f12', color: '#fef08a' },
  stopped:       { bg: '#713f12', color: '#fef08a' },
  error:         { bg: '#7f1d1d', color: '#fecaca' },
  max_iterations:{ bg: '#3b0764', color: '#e9d5ff' },
};

const STATUS_LABELS: Record<RunStatus, string> = {
  running:        'Running',
  completed:      'Completed',
  early_stopped:  'Early Stopped',
  stopped:        'Stopped',
  error:          'Error',
  max_iterations: 'Max Iterations',
};

const monoStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono), monospace',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0.875rem',
  borderRadius: 'var(--radius-sm, 6px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  cursor: 'pointer',
  width: '100%',
  justifyContent: 'space-between',
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.0625rem 0.3125rem',
  borderRadius: '3px',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono), monospace',
  fontSize: '0.6875rem',
  lineHeight: 1.4,
};

export default function RunControlPanel({
  run,
  onPause,
  onStop,
  onExport,
}: RunControlPanelProps) {
  const scoreInt = Math.round(run.best_score * 100);
  const targetInt = Math.round(run.accuracy_target * 100);
  const currentIteration = run.prompt_versions.length;
  const latestVersion = run.prompt_versions[run.prompt_versions.length - 1];

  const statusStyle = STATUS_COLORS[run.status] ?? STATUS_COLORS.error;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius, 8px)',
        border: '1px solid var(--border)',
        minWidth: 200,
      }}
    >
      {/* Score ring + score/target */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ScoreRing score={scoreInt} target={targetInt} size={96} />
        <span style={{ ...monoStyle, fontSize: '0.875rem', color: 'var(--text)' }}>
          {scoreInt}% / {targetInt}%
        </span>
      </div>

      {/* Iteration counter */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ ...monoStyle, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Iteration {String(currentIteration).padStart(2, '0')} / {String(run.total_iterations).padStart(2, '0')}
        </span>
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.1875rem 0.625rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: statusStyle.bg,
            color: statusStyle.color,
            letterSpacing: '0.02em',
          }}
        >
          {STATUS_LABELS[run.status]}
        </span>
      </div>

      {/* Stats table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.8125rem',
        }}
      >
        <tbody>
          {[
            { label: 'Passed',      value: latestVersion != null ? String(latestVersion.passed) : '—' },
            { label: 'Failed',      value: latestVersion != null ? String(latestVersion.failed) : '—' },
            { label: 'Token count', value: '—' },
          ].map(({ label, value }) => (
            <tr key={label}>
              <td
                style={{
                  padding: '0.3125rem 0',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {label}
              </td>
              <td
                style={{
                  padding: '0.3125rem 0',
                  textAlign: 'right',
                  ...monoStyle,
                  color: 'var(--text)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button type="button" aria-label="Pause run (keyboard shortcut: P)" onClick={onPause} style={btnBase}>
          <span>⏸ Pause</span>
          <kbd style={kbdStyle}>P</kbd>
        </button>

        <button
          type="button"
          aria-label="Stop run (keyboard shortcut: Escape)"
          onClick={onStop}
          style={{ ...btnBase, color: 'var(--color-error, #ef4444)', borderColor: 'var(--color-error, #ef4444)' }}
        >
          <span>⏹ Stop</span>
          <kbd style={{ ...kbdStyle }}>Esc</kbd>
        </button>

        <button type="button" aria-label="Export run (keyboard shortcut: E)" onClick={onExport} style={btnBase}>
          <span>↓ Export</span>
          <kbd style={kbdStyle}>E</kbd>
        </button>
      </div>
    </div>
  );
}
