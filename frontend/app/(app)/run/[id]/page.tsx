'use client';

import { use, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import SparklineChart from '../../../../src/components/SparklineChart';
import FailureBarChart from '../../../../src/components/FailureBarChart';
import PromptDiff from '../../../../src/components/PromptDiff';
import TestCaseFeed from '../../../../src/components/TestCaseFeed';
import RunControlPanel from '../../../../src/components/RunControlPanel';
import { useRunStream } from '../../../../src/hooks/useRunStream';
import { ToastContext } from '../../../../src/components/ToastProvider';
import {
  fetchRun,
  exportRun,
} from '../../../../lib/api';
import { formatDate, formatScore, statusBadgeClass } from '../../../../lib/utils';
import type { Run, PromptVersion } from '../../../../lib/types';

// ── helpers ──────────────────────────────────────────────────────

function parseFailureSummary(summary: string): { type: string; count: number }[] {
  if (!summary) return [];
  return summary
    .split(',')
    .map((s) => {
      const [cat, cnt] = s.trim().split(':');
      return { type: cat?.trim() ?? '', count: parseInt(cnt?.trim() ?? '0', 10) };
    })
    .filter((d) => d.type && !isNaN(d.count));
}

const statusColors: Record<string, string> = {
  success: 'var(--green)',
  info: 'var(--blue)',
  warning: 'var(--yellow)',
  danger: 'var(--red)',
  neutral: 'var(--text-muted)',
};

// ── page ─────────────────────────────────────────────────────────

export default function RunViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = use(params);
  const { addToast } = useContext(ToastContext);

  const [initialRunData, setInitialRunData] = useState<Run | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  // Load run on mount
  useEffect(() => {
    fetchRun(runId)
      .then((r) => {
        setInitialRunData(r);
        setVersions(r.prompt_versions);
        const bestIdx = r.prompt_versions.findIndex((v) => v.version === r.best_version);
        setSelectedIdx(bestIdx >= 0 ? bestIdx : 0);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [runId]);

  // WebSocket / mock streaming via new hook API
  const { run, scoreHistory, testCaseResults, isConnected, status: wsStatus } = useRunStream({
    runId,
    enabled: true,
    initialRun: initialRunData,
  });

  const handlePause = useCallback(() => {
    addToast('Pause not yet implemented', 'info');
  }, [addToast]);

  const handleStop = useCallback(() => {
    addToast('Stop not yet implemented', 'info');
  }, [addToast]);

  const handleExport = useCallback(async () => {
    try {
      const data = await exportRun(runId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `run-${runId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Run exported as JSON', 'success');
    } catch {
      addToast('Failed to export run', 'error');
    }
  }, [runId, addToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePause();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleExport();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (window.confirm('Stop this run?')) {
          handleStop();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(versions.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePause, handleStop, handleExport, versions.length]);

  // ── render states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        Loading run…
      </div>
    );
  }

  if (error || !run) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', fontFamily: 'var(--font-sans)' }}>
        <p style={{ color: 'var(--red)', fontWeight: 500 }}>{error ?? 'Run not found'}</p>
        <Link href="/dashboard" style={{ color: 'var(--accent-light)', fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const selectedVersion = versions[selectedIdx] ?? versions[0];
  const prevVersion = selectedIdx > 0 ? versions[selectedIdx - 1] : undefined;
  // scoreHistory stores scores as 0-100 integers; versions store 0-1 floats
  const sparkData = scoreHistory.length > 0
    ? scoreHistory.map((s) => ({ version: s.version, score: s.score }))
    : versions.map((v) => ({ version: v.version, score: Math.round(v.score * 100) }));
  const failureData = parseFailureSummary(selectedVersion?.failure_summary ?? '');
  const statusClass = statusBadgeClass(run.status);
  const statusColor = statusColors[statusClass] ?? 'var(--text-muted)';

  // Token counter estimate
  const tokenCount = versions.reduce((sum, v) => sum + (v.passed + v.failed) * 50, 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 500, color: 'var(--text)' }}>
              Run: {run.task_id}
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: statusColor, border: `1px solid ${statusColor}`, borderRadius: 'var(--radius-sm)', padding: '0.125rem 0.5rem' }}>
              {run.status}
            </span>
            {run.status === 'running' && (
              <span style={{ fontSize: '0.6875rem', color: isConnected ? 'var(--green)' : 'var(--text-muted)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.125rem 0.375rem' }}>
                ws: {wsStatus}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Started {formatDate(run.started_at)} · {run.total_iterations} iteration{run.total_iterations !== 1 ? 's' : ''} · target {formatScore(run.accuracy_target)}
          </p>
        </div>
      </div>

      {/* ── Version selector ── */}
      {versions.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Versions</p>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {versions.map((v, i) => {
              const isBest = v.version === run.best_version;
              const isSelected = i === selectedIdx;
              return (
                <button
                  key={v.version}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    flexShrink: 0,
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(108,92,231,0.15)' : 'var(--bg-card)',
                    color: isBest ? 'var(--green)' : isSelected ? 'var(--accent-light)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8125rem',
                    fontWeight: isBest ? 500 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.125rem',
                    minWidth: '56px',
                  }}
                >
                  <span>v{v.version}</span>
                  <span style={{ fontSize: '0.6875rem', color: isBest ? 'var(--green)' : 'var(--text-muted)' }}>{formatScore(v.score)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Three-column grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 280px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >

        {/* ── Left column: RunControlPanel ── */}
        <div>
          <RunControlPanel
            run={run}
            scoreHistory={sparkData}
            onPause={handlePause}
            onStop={handleStop}
            onExport={handleExport}
          />
        </div>

        {/* ── Center column: PromptDiff + OptimizerReasoning ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Version label */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            v{prevVersion?.version ?? 0} → v{selectedVersion?.version}
          </span>

          {/* Prompt diff */}
          <PromptDiff
            oldPrompt={prevVersion?.prompt_text ?? ''}
            newPrompt={selectedVersion?.prompt_text ?? ''}
          />

          {/* Collapsible optimizer reasoning */}
          <div>
            <button
              type="button"
              onClick={() => setReasoningOpen((o) => !o)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                padding: '0.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Optimizer reasoning {reasoningOpen ? '▴' : '▾'}
            </button>
            {reasoningOpen && (
              <pre
                style={{
                  background: 'var(--bg-surface)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '0.5rem 0 0',
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                }}
              >
                {selectedVersion?.optimizer_reasoning || 'No reasoning available.'}
              </pre>
            )}
          </div>
        </div>

        {/* ── Right column: SparklineChart + FailureBarChart + TestCaseFeed + token counter ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Sparkline */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-card)', padding: '0.75rem' }}>
            <SparklineChart data={sparkData} target={Math.round(run.accuracy_target * 100)} />
          </div>

          {/* Failure bar chart */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-card)', padding: '0.75rem' }}>
            <FailureBarChart data={failureData} />
          </div>

          {/* Test case feed */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '0.5px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Test Cases</span>
            </div>
            <TestCaseFeed results={testCaseResults} />
          </div>

          {/* Token counter */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            Tokens: {tokenCount.toLocaleString()}
          </span>
        </div>

      </div>
    </div>
  );
}
