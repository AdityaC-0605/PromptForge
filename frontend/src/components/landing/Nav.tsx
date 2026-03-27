import Link from 'next/link';

export default function Nav() {
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .nav-center-links { display: none !important; }
        }
      `}</style>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 2rem',
          borderBottom: '0.5px solid var(--border-subtle)',
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              color: 'var(--bg)',
              flexShrink: 0,
            }}
          >
            →
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '1rem',
              color: 'var(--text)',
            }}
          >
            PromptForge
          </span>
        </div>

        {/* Center links — hidden on mobile */}
        <div
          className="nav-center-links"
          style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}
        >
          {['How it works', 'Features', 'Stack', 'Docs'].map((label) => (
            <Link
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 400,
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/run"
          className="btn-primary"
          style={{ fontSize: '0.875rem' }}
        >
          Get started →
        </Link>
      </nav>
    </>
  );
}
