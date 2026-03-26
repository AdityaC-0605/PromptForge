import RunConfigForm from '@/src/components/RunConfigForm';

export default function NewRunPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>New Run</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Configure a new optimization run. Select a task, set your target accuracy, and specify the maximum number of iterations.
      </p>
      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <RunConfigForm />
      </div>
    </div>
  );
}
