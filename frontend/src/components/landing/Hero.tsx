import Link from 'next/link';

export default function Hero() {
  return (
    <section
      style={{
        textAlign: 'center',
        padding: '6rem 2rem 4rem',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.875rem',
          border: '1px solid var(--border)',
          borderRadius: 999,
          marginBottom: '2rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#16a34a',
            display: 'inline-block',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        Open source · 100% free stack
      </div>

      <h1
        style={{
          fontSize: 52,
          fontWeight: 500,
          lineHeight: 1.1,
          color: 'var(--text)',
          marginBottom: '1.5rem',
          letterSpacing: '-1.5px',
        }}
      >
        Prompts that engineer themselves
      </h1>

      <p
        style={{
          fontSize: 17,
          fontWeight: 400,
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
          maxWidth: 520,
          margin: '0 auto 2.5rem',
        }}
      >
        PromptForge runs your prompt against a test suite, clusters failures, and rewrites the prompt automatically — iterating until it hits your accuracy target.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/run"
          className="btn-primary"
          style={{ fontSize: '1rem', padding: '0.75rem 1.75rem' }}
        >
          Start optimizing →
        </Link>
        <Link
          href="#demo"
          className="btn-ghost"
          style={{ fontSize: '1rem', padding: '0.75rem 1.75rem' }}
        >
          See a demo run
        </Link>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </section>
  );
}
