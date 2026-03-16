"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchRun, fetchBestPrompt, exportRun, connectRunWebSocket,
  type Run, type PromptVersion
} from "@/lib/api";
import ScoreChart from "@/components/ScoreChart";
import PromptDiff from "@/components/PromptDiff";
import FailureHeatmap from "@/components/FailureHeatmap";
import RunSummaryComponent from "@/components/RunSummary";

export default function RunPage() {
  const params = useParams();
  const runId = params.id as string;

  const [run, setRun] = useState<Run | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const loadRun = useCallback(async () => {
    try {
      const data = await fetchRun(runId);
      setRun(data);
      if (data.prompt_versions.length > 0) {
        setSelectedVersion(data.prompt_versions.length - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load run");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    loadRun();
  }, [loadRun]);

  // WebSocket for live updates
  useEffect(() => {
    if (!runId || (run && run.status !== "running")) return;

    const ws = connectRunWebSocket(
      runId,
      (data) => {
        const msg = data.event
          ? `[${data.event}] ${data.message || JSON.stringify(data)}`
          : JSON.stringify(data);
        setLiveEvents((prev) => [...prev, msg]);

        // Refresh run data on iteration_complete or run_complete
        if (data.event === "iteration_complete" || data.event === "run_complete") {
          loadRun();
        }
      },
      () => {
        // Reload when WS closes
        loadRun();
      }
    );

    wsRef.current = ws;
    return () => ws.close();
  }, [runId, run, loadRun]);

  // Auto-scroll live log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveEvents]);

  async function handleCopyPrompt() {
    if (!run) return;
    try {
      const { best_prompt } = await fetchBestPrompt(runId);
      await navigator.clipboard.writeText(best_prompt);
    } catch {
      // fallback
    }
  }

  async function handleExport() {
    if (!run) return;
    try {
      const data = await exportRun(runId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ape-run-${runId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>Loading run data...</p>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
          <p className="text-3xl mb-3">❌</p>
          <p className="font-semibold mb-2" style={{ color: "var(--danger)" }}>{error || "Run not found"}</p>
          <Link href="/" className="btn-ghost text-sm">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const versions = run.prompt_versions || [];
  const currentVersion: PromptVersion | null = versions[selectedVersion] || null;

  const chartData = versions.map((v) => ({
    version: v.version,
    score: v.score,
  }));

  // Parse failure clusters from summary (simplified)
  const failureClusters = currentVersion?.failure_summary
    ? parseFailureClusters(currentVersion.failure_summary)
    : [];

  const totalCases = currentVersion ? currentVersion.passed + currentVersion.failed : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-xs mb-2 inline-block" style={{ color: "var(--text-muted)" }}>
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {run.task_id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-sm" onClick={handleCopyPrompt}>
            📋 Copy Best Prompt
          </button>
          <button className="btn-ghost text-sm" onClick={handleExport}>
            📥 Export JSON
          </button>
        </div>
      </div>

      {/* Top Grid: Summary + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <RunSummaryComponent
            runId={run.run_id}
            taskId={run.task_id}
            status={run.status}
            totalIterations={run.total_iterations}
            bestScore={run.best_score}
            bestVersion={run.best_version}
            accuracyTarget={run.accuracy_target}
            llmProvider={run.llm_provider}
            startedAt={run.started_at}
            finishedAt={run.finished_at}
          />
        </div>
        <div className="lg:col-span-2">
          <ScoreChart data={chartData} target={run.accuracy_target} />
        </div>
      </div>

      {/* Version Selector */}
      {versions.length > 1 && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-muted)" }}>
              VERSION:
            </span>
            {versions.map((v, i) => (
              <button
                key={v.version}
                onClick={() => setSelectedVersion(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  selectedVersion === i ? "" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  background: selectedVersion === i
                    ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                    : "var(--bg-primary)",
                  color: selectedVersion === i ? "white" : "var(--text-secondary)",
                  border: `1px solid ${selectedVersion === i ? "transparent" : "var(--border)"}`,
                }}
              >
                v{v.version} — {(v.score * 100).toFixed(1)}%
                {v.version === run.best_version && " ★"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Grid: Prompt + Diff + Failures */}
      {currentVersion && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Current Prompt */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Prompt v{currentVersion.version}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: "var(--success)" }}>
                  ✓ {currentVersion.passed}
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--danger)" }}>
                  ✗ {currentVersion.failed}
                </span>
              </div>
            </div>
            <pre className="text-xs overflow-auto p-4 rounded-lg leading-relaxed" style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              maxHeight: 400,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              {currentVersion.prompt_text}
            </pre>

            {/* Optimizer Reasoning */}
            {currentVersion.optimizer_reasoning && (
              <div className="mt-4 p-3 rounded-lg" style={{
                background: "rgba(108,92,231,0.08)",
                border: "1px solid rgba(108,92,231,0.2)",
              }}>
                <h4 className="text-xs font-semibold mb-1.5" style={{ color: "var(--accent-secondary)" }}>
                  🧠 Optimizer Reasoning
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {currentVersion.optimizer_reasoning}
                </p>
              </div>
            )}
          </div>

          {/* Diff + Failures */}
          <div className="space-y-6">
            <PromptDiff
              diff={currentVersion.prompt_diff}
              oldVersion={currentVersion.version > 1 ? currentVersion.version - 1 : undefined}
              newVersion={currentVersion.version > 1 ? currentVersion.version : undefined}
            />
            <FailureHeatmap clusters={failureClusters} total={totalCases} />
          </div>
        </div>
      )}

      {/* Live Log (only during active runs) */}
      {run.status === "running" && liveEvents.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: "var(--accent-primary)" }} />
            Live Log
          </h3>
          <div className="overflow-auto rounded-lg p-3" style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            maxHeight: 250,
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.75rem",
          }}>
            {liveEvents.map((event, i) => (
              <div key={i} className="py-0.5" style={{ color: "var(--text-muted)" }}>
                {event}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to parse failure clusters from text summary
function parseFailureClusters(summary: string) {
  const clusters: { category: string; count: number; examples: { input: string; expected: string; actual: string }[] }[] = [];

  const patterns = [
    { regex: /wrong_content:\s*(\d+)/i, category: "wrong_content" },
    { regex: /wrong_format:\s*(\d+)/i, category: "wrong_format" },
    { regex: /refusal:\s*(\d+)/i, category: "refusal" },
    { regex: /error:\s*(\d+)/i, category: "error" },
  ];

  for (const { regex, category } of patterns) {
    const match = summary.match(regex);
    if (match) {
      clusters.push({ category, count: parseInt(match[1]), examples: [] });
    }
  }

  return clusters;
}
