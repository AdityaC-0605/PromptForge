"use client";

import { useState, useEffect } from "react";

interface RunSummaryProps {
  runId: string;
  taskId: string;
  status: string;
  totalIterations: number;
  bestScore: number;
  bestVersion: number;
  accuracyTarget: number;
  llmProvider: string;
  startedAt: number;
  finishedAt: number | null;
  timeElapsed?: number;
}

export default function RunSummary({
  runId,
  taskId,
  status,
  totalIterations,
  bestScore,
  bestVersion,
  accuracyTarget,
  llmProvider,
  startedAt,
  finishedAt,
  timeElapsed,
}: RunSummaryProps) {
  const statusBadgeClass =
    status === "completed" ? "badge-success" :
    status === "running" ? "badge-info" :
    status === "early_stopped" ? "badge-warning" :
    status === "error" ? "badge-danger" : "badge-neutral";

  const statusLabel =
    status === "early_stopped" ? "Early Stopped" :
    status === "max_iterations" ? "Max Iterations" :
    status.charAt(0).toUpperCase() + status.slice(1);

    const targetReached = bestScore >= accuracyTarget;

  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    if (status === "running") {
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  const elapsed = timeElapsed
    ? timeElapsed
    : finishedAt
    ? finishedAt - startedAt
    : now / 1000 - startedAt;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Run Summary
        </h3>
        <span className={`badge ${statusBadgeClass}`}>
          {status === "running" && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Best Score */}
        <div className="metric-card">
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Best Accuracy
          </div>
          <div className="text-2xl font-bold" style={{
            color: targetReached ? 'var(--success)' : 'var(--accent-secondary)',
          }}>
            {(bestScore * 100).toFixed(1)}%
          </div>
          <div className="mt-2">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${bestScore * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Iterations */}
        <div className="metric-card">
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Iterations
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {totalIterations}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Best at v{bestVersion}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Task</span>
          <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{taskId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Target</span>
          <span style={{ color: targetReached ? 'var(--success)' : 'var(--text-secondary)' }}>
            {(accuracyTarget * 100).toFixed(0)}%
            {targetReached && " ✓"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>LLM Provider</span>
          <span className="badge badge-neutral">{llmProvider || "–"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Duration</span>
          <span style={{ color: 'var(--text-secondary)' }}>{formatDuration(elapsed)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Run ID</span>
          <span className="font-mono text-xs truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
            {runId}
          </span>
        </div>
      </div>
    </div>
  );
}
