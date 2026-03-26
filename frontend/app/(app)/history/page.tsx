'use client';

import { useRunHistory } from '@/src/hooks/useRunHistory';
import RunHistoryTable from '@/src/components/RunHistoryTable';

export default function HistoryPage() {
  const { runs, loading, error, refetch } = useRunHistory();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        Loading runs…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--red)', fontFamily: 'var(--font-sans)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={refetch}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '1.5rem' }}>Run History</h1>
      <RunHistoryTable runs={runs} />
    </div>
  );
}
