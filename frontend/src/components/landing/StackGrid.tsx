const STACK = [
  { name: 'Next.js 15', role: 'App Router + RSC' },
  { name: 'FastAPI', role: 'Python backend' },
  { name: 'TypeScript', role: 'End-to-end types' },
  { name: 'Recharts', role: 'Data visualization' },
  { name: 'SQLite', role: 'Run persistence' },
  { name: 'WebSockets', role: 'Live streaming' },
  { name: 'Gemini', role: 'LLM provider' },
  { name: 'Ollama', role: 'Local LLM provider' },
];

export default function StackGrid() {
  return (
    <section
      id="stack"
      style={{ padding: '5rem 2rem', maxWidth: 1000, margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          Stack
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 500,
            color: 'var(--text)',
            letterSpacing: '-0.5px',
          }}
        >
          Built with open-source tools
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
        }}
      >
        {STACK.map((item) => (
          <div
            key={item.name}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '1.25rem 1rem',
              background: 'var(--bg-card)',
            }}
          >
            <div
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '0.25rem',
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '0.625rem',
              }}
            >
              {item.role}
            </div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.625rem',
                fontWeight: 500,
                padding: '0.125rem 0.5rem',
                borderRadius: 999,
                background: 'rgba(22,163,74,0.15)',
                color: '#16a34a',
                letterSpacing: '0.03em',
              }}
            >
              free
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
