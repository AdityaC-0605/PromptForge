"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchRuns, type RunSummary } from "@/lib/api";

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchRuns()
      .then(setRuns)
      .finally(() => setLoading(false));
  }, []);

  const filteredRuns = filter === "all"
    ? runs
    : runs.filter((r) => r.status === filter);

  const uniqueTasks = Array.from(new Set(runs.map((r) => r.task_id)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Run History
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {runs.length} total runs across {uniqueTasks.length} tasks
          </p>
        </div>
        <Link href="/" className="btn-ghost text-sm">← Dashboard</Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {["all", "completed", "running", "early_stopped", "error"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all`}
            style={{
              background: filter === f
                ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                : "var(--bg-card)",
              color: filter === f ? "white" : "var(--text-secondary)",
              border: `1px solid ${filter === f ? "transparent" : "var(--border)"}`,
            }}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {filteredRuns.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
            No runs found
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {filter !== "all" ? "Try changing the filter" : "Start a new run from the dashboard"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run) => {
            const statusCls =
              run.status === "completed" ? "badge-success" :
              run.status === "running" ? "badge-info" :
              run.status === "early_stopped" ? "badge-warning" :
              run.status === "error" ? "badge-danger" : "badge-neutral";

            const duration = run.finished_at
              ? run.finished_at - run.started_at
              : null;

            return (
              <Link
                key={run.run_id}
                href={`/run/${run.run_id}`}
                className="glass-card p-5 block"
                style={{ textDecoration: "none" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {run.task_id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </h3>
                      <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {run.run_id.slice(0, 8)}...
                      </span>
                    </div>
                    <span className={`badge ${statusCls}`}>{run.status}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono" style={{
                        color: run.best_score >= 0.95 ? "var(--success)" : "var(--accent-secondary)",
                      }}>
                        {(run.best_score * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        best score
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                        {run.total_iterations}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        iterations
                      </div>
                    </div>
                    <div className="text-right" style={{ minWidth: 80 }}>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(run.started_at * 1000).toLocaleDateString()}
                      </div>
                      {duration && (
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {duration < 60 ? `${Math.round(duration)}s` : `${Math.floor(duration / 60)}m`}
                        </div>
                      )}
                    </div>
                    <span style={{ color: "var(--accent-secondary)", fontSize: "0.85rem" }}>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
