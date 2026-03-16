"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchTasks, fetchRuns, startRun, type Task, type RunSummary } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedTask, setSelectedTask] = useState("");
  const [accuracyTarget, setAccuracyTarget] = useState(95);
  const [maxIterations, setMaxIterations] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([fetchTasks(), fetchRuns()]);
      setTasks(t);
      setRuns(r);
      if (t.length && !selectedTask) setSelectedTask(t[0].task_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }, [selectedTask]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStartRun() {
    if (!selectedTask) return;
    setStarting(selectedTask);
    setError(null);
    try {
      const result = await startRun({
        task_id: selectedTask,
        accuracy_target: accuracyTarget / 100,
        max_iterations: maxIterations,
      });
      router.push(`/run/${result.run_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
      setStarting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>Connecting to APE backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{
              background: "linear-gradient(135deg, var(--text-primary), var(--accent-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Automated Prompt Engineer
            </h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)", maxWidth: 600 }}>
              Select a task, set your accuracy target, and let APE optimize the prompt for you. 
              Real-time progress tracking and full audit trails.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "＋ New Run"}
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg" style={{
          background: "var(--danger-glow)",
          border: "1px solid rgba(255,107,107,0.3)",
          color: "var(--danger)",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* New Run Form */}
      {showForm && (
        <section className="glass-card p-6 mb-8" style={{ borderColor: "var(--border-glow)" }}>
          <h2 className="font-semibold text-lg mb-5" style={{ color: "var(--text-primary)" }}>
            Start New Optimization Run
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                TASK
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full p-2.5 rounded-lg text-sm"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              >
                {tasks.map((t) => (
                  <option key={t.task_id} value={t.task_id}>
                    {t.task_id.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {selectedTask && (
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {tasks.find(t => t.task_id === selectedTask)?.description?.slice(0, 100)}...
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                ACCURACY TARGET
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={accuracyTarget}
                  onChange={(e) => setAccuracyTarget(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: "var(--accent-primary)" }}
                />
                <span className="font-mono text-sm font-bold" style={{ color: "var(--accent-secondary)", minWidth: 40 }}>
                  {accuracyTarget}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                MAX ITERATIONS
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxIterations}
                onChange={(e) => setMaxIterations(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg text-sm"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              className="btn-primary"
              onClick={handleStartRun}
              disabled={!!starting}
            >
              {starting ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                  Starting...
                </>
              ) : (
                "🚀 Start Optimization"
              )}
            </button>
          </div>
        </section>
      )}

      {/* Task Cards */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          Available Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const evalBadge =
              task.evaluation_method === "exact_match" ? "badge-success" :
              task.evaluation_method === "f1_score" ? "badge-info" :
              "badge-warning";
            return (
              <div key={task.task_id} className="glass-card p-5 cursor-pointer" onClick={() => {
                setSelectedTask(task.task_id);
                setShowForm(true);
              }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {task.task_id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </h3>
                  <span className={`badge ${evalBadge}`}>
                    {task.evaluation_method}
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{
                  color: "var(--text-muted)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {task.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="badge badge-neutral">{task.task_type}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Runs */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent Runs
          </h2>
          {runs.length > 0 && (
            <Link href="/history" className="btn-ghost text-sm">View All →</Link>
          )}
        </div>

        {runs.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-3xl mb-3">🧪</p>
            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
              No runs yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Start an optimization run to see results here
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Best Score</th>
                  <th>Iterations</th>
                  <th>Started</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 10).map((run) => {
                  const statusCls =
                    run.status === "completed" ? "badge-success" :
                    run.status === "running" ? "badge-info" :
                    "badge-neutral";
                  return (
                    <tr key={run.run_id} className="cursor-pointer" onClick={() => router.push(`/run/${run.run_id}`)}>
                      <td className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {run.task_id.replace(/_/g, " ")}
                      </td>
                      <td>
                        <span className={`badge ${statusCls}`}>{run.status}</span>
                      </td>
                      <td className="font-mono" style={{ color: "var(--accent-secondary)" }}>
                        {(run.best_score * 100).toFixed(1)}%
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{run.total_iterations}</td>
                      <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(run.started_at * 1000).toLocaleString()}
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "var(--accent-secondary)" }}>View →</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
