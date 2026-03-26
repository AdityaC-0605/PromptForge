'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTasks } from '@/lib/api';
import type { Task } from '@/lib/types';

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTasks()
      .then(data => {
        if (!cancelled) {
          setTasks(data);
          if (data.length > 0) setSelectedTask(data[0]);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load tasks');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tasks...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--red)' }}>Error: {error}</div>;
  if (tasks.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks found.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '2rem' }}>Task Manager</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tasks.map(t => {
            const isSelected = selectedTask?.task_id === t.task_id;
            return (
              <div
                key={t.task_id}
                onClick={() => setSelectedTask(t)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected ? 'rgba(108, 92, 231, 0.05)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ fontWeight: 500, color: isSelected ? 'var(--accent)' : 'var(--text)', marginBottom: '0.25rem' }}>{t.task_id}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Method: {t.evaluation_method}</div>
              </div>
            );
          })}
        </div>

        {/* Task Details */}
        {selectedTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>{selectedTask.task_id}</h2>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Type: {selectedTask.task_type}</div>
                </div>
                <button
                  onClick={() => router.push(`/run?initialTaskId=${selectedTask.task_id}`)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Start Run
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Evaluation Method</h3>
                  <div>{selectedTask.evaluation_method}</div>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Dataset Size</h3>
                  <div>{selectedTask.dataset_size ?? 'Unknown'} items</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{selectedTask.description}</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Sample Test Cases (Mocked)</h2>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Test cases for {selectedTask.task_id} would be retrieved from the backend dataset here...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
