'use client';
// src/components/RunConfigForm.tsx — Full run configuration form
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTasks, listDatasets, getModels, createRun } from '../../lib/api';
import { useToast } from './ToastProvider';
import type { Task, ModelInfo, RunConfig } from '../../lib/types';

interface RunConfigFormProps {
  initialTaskId?: string;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '0.375rem',
  fontFamily: 'var(--font-sans)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const SEED_STRATEGIES: { value: RunConfig['seed_strategy']; label: string }[] = [
  { value: 'zero_shot', label: 'Zero-shot' },
  { value: 'role_based', label: 'Role-based' },
  { value: 'chain_of_thought', label: 'Chain-of-thought' },
  { value: 'format_constrained', label: 'Format-constrained' },
];

const CONCURRENCY_OPTIONS: RunConfig['concurrency'][] = [1, 3, 5];

export default function RunConfigForm({ initialTaskId }: RunConfigFormProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [datasets, setDatasets] = useState<{ dataset_id: string; name: string }[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);

  const [taskId, setTaskId] = useState(initialTaskId ?? '');
  const [datasetId, setDatasetId] = useState('');
  const [target, setTarget] = useState(80);
  const [maxIter, setMaxIter] = useState(10);
  const [seedStrategy, setSeedStrategy] = useState<RunConfig['seed_strategy']>('zero_shot');
  const [concurrency, setConcurrency] = useState<RunConfig['concurrency']>(1);
  const [modelId, setModelId] = useState('');

  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  // Load tasks and models on mount
  useEffect(() => {
    fetchTasks()
      .then((data) => {
        setTasks(data);
        if (!initialTaskId && data.length > 0) setTaskId(data[0].task_id);
      })
      .catch((err: unknown) => {
        addToast(err instanceof Error ? err.message : 'Failed to load tasks', 'error');
      })
      .finally(() => setTasksLoading(false));

    getModels()
      .then((data) => {
        setModels(data);
        const first = data.find((m) => m.available);
        if (first) setModelId(first.id);
      })
      .catch((err: unknown) => {
        addToast(err instanceof Error ? err.message : 'Failed to load models', 'error');
      });
  }, [initialTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync initialTaskId if it changes after mount
  useEffect(() => {
    if (initialTaskId) setTaskId(initialTaskId);
  }, [initialTaskId]);

  // Fetch datasets when taskId changes
  useEffect(() => {
    if (!taskId) {
      setDatasets([]);
      setDatasetId('');
      return;
    }
    setDatasetsLoading(true);
    listDatasets(taskId)
      .then((data) => {
        setDatasets(data);
        if (data.length > 0) setDatasetId(data[0].dataset_id);
        else setDatasetId('');
      })
      .catch((err: unknown) => {
        addToast(err instanceof Error ? err.message : 'Failed to load datasets', 'error');
      })
      .finally(() => setDatasetsLoading(false));
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const runConfig: RunConfig = {
    task_id: taskId,
    dataset_id: datasetId || undefined,
    max_iterations: maxIter,
    accuracy_target: target / 100,
    seed_strategy: seedStrategy,
    concurrency,
    model_id: modelId,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskId) return;
    setLoading(true);
    try {
      const { run_id } = await createRun(runConfig);
      router.push(`/run/${run_id}`);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to start run', 'error');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Task select */}
        <div>
          <label htmlFor="run-task-select" style={labelStyle}>Task</label>
          <select
            id="run-task-select"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            disabled={tasksLoading || loading}
            required
            style={inputStyle}
          >
            {tasksLoading && <option value="">Loading tasks…</option>}
            {tasks.map((t) => (
              <option key={t.task_id} value={t.task_id}>
                {t.task_id} — {t.description}
              </option>
            ))}
          </select>
        </div>

        {/* Dataset dropdown */}
        <div>
          <label htmlFor="run-dataset-select" style={labelStyle}>Dataset</label>
          <select
            id="run-dataset-select"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            disabled={!taskId || datasetsLoading || loading}
            style={inputStyle}
          >
            {datasetsLoading && <option value="">Loading datasets…</option>}
            {!datasetsLoading && datasets.length === 0 && (
              <option value="">No datasets available</option>
            )}
            {datasets.map((d) => (
              <option key={d.dataset_id} value={d.dataset_id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Accuracy target */}
        <div>
          <label htmlFor="run-target" style={labelStyle}>
            Accuracy target: {target}%
          </label>
          <input
            id="run-target"
            type="range"
            min={50}
            max={100}
            step={1}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            disabled={loading}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginTop: '0.25rem' }}>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Max iterations */}
        <div>
          <label htmlFor="run-max-iter" style={labelStyle}>Max iterations</label>
          <input
            id="run-max-iter"
            type="number"
            min={1}
            max={100}
            value={maxIter}
            onChange={(e) => setMaxIter(Math.min(100, Math.max(1, Number(e.target.value))))}
            disabled={loading}
            style={inputStyle}
          />
        </div>

        {/* Seed strategy radio group */}
        <div>
          <span style={labelStyle}>Seed strategy</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {SEED_STRATEGIES.map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--text)' }}>
                <input
                  type="radio"
                  name="seed-strategy"
                  value={value}
                  checked={seedStrategy === value}
                  onChange={() => setSeedStrategy(value)}
                  disabled={loading}
                  style={{ accentColor: 'var(--accent)' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Concurrency segmented control */}
        <div>
          <span style={labelStyle}>Concurrency</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {CONCURRENCY_OPTIONS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setConcurrency(val)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: concurrency === val ? 'var(--accent)' : 'var(--bg-surface)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  fontWeight: concurrency === val ? 600 : 400,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Model radio list */}
        <div>
          <span style={labelStyle}>Model</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {models.map((m) => (
              <label
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  cursor: !m.available || loading ? 'not-allowed' : 'pointer',
                  opacity: m.available ? 1 : 0.5,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                }}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={modelId === m.id}
                  onChange={() => setModelId(m.id)}
                  disabled={!m.available || loading}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: m.available ? '#16a34a' : '#dc2626',
                    flexShrink: 0,
                  }}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        {/* JSON preview */}
        <pre
          style={{
            background: 'var(--bg-surface)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            overflowX: 'auto',
            margin: 0,
            color: 'var(--text-secondary)',
          }}
        >
          {JSON.stringify(runConfig, null, 2)}
        </pre>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || tasksLoading || !taskId || !modelId}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: loading ? 'var(--bg-card)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : 'var(--text)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: loading || tasksLoading || !taskId || !modelId ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background 0.15s',
          }}
        >
          {loading && (
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: '0.875rem',
                height: '0.875rem',
                border: '2px solid var(--text-muted)',
                borderTopColor: 'var(--text)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          )}
          {loading ? 'Starting…' : 'Start Run'}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}
