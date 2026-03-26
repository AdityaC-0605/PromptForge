import Link from 'next/link';

export default function CtaSection() {
  return (
    <section
      style={{
        padding: '6rem 2rem',
        background: 'var(--bg-surface)',
        borderTop: '0.5px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 500,
            color: 'var(--text)',
            marginBottom: '1rem',
            lineHeight: 1.2,
            letterSpacing: '-1px',
          }}
        >
          Ready to stop guessing?
        </h2>
        <p
          style={{
            fontSize: '1.0625rem',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          Pick a task, drop in a seed prompt, and let PromptForge find the best version automatically.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/run"
            className="btn-primary"
            style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}
          >
            Start optimizing →
          </Link>
          <Link
            href="#demo"
            className="btn-ghost"
            style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}
          >
            See a demo run
          </Link>
        </div>
      </div>
    </section>
  );
}
