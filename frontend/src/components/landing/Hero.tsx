import Link from 'next/link';

export default function Hero() {
  return (
    <section
      style={{
        textAlign: 'center',
        padding: '8rem 2rem 6rem',
        maxWidth: 820,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 60%)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Badge */}
      <div
        className="glass-panel"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.4rem 1rem',
          borderRadius: 999,
          marginBottom: '2rem',
          fontSize: '0.8rem',
          fontWeight: 500,
          color: 'var(--accent-light)',
          animation: 'fadeInUp 0.8s ease-out forwards',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--green)',
            display: 'inline-block',
            boxShadow: '0 0 10px var(--green)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        Open source · 100% free stack
      </div>

      <h1
        style={{
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          letterSpacing: '-1.5px',
          background: 'linear-gradient(135deg, #ffffff 0%, #a29bfe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'fadeInUp 0.8s ease-out 0.1s forwards',
          opacity: 0,
        }}
        className="glow-text"
      >
        Prompts that engineer themselves
      </h1>

      <p
        style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          fontWeight: 400,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '3rem',
          maxWidth: 600,
          margin: '0 auto 3rem',
          animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
          opacity: 0,
        }}
      >
        PromptForge runs your prompt against a test suite, clusters failures, and rewrites the prompt automatically — iterating until it hits your accuracy target.
      </p>

      <div 
        style={{ 
          display: 'flex', 
          gap: '1.25rem', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          animation: 'fadeInUp 0.8s ease-out 0.3s forwards',
          opacity: 0,
        }}
      >
        <Link
          href="/run"
          className="btn-primary"
          style={{ fontSize: '1.1rem', padding: '0.875rem 2.25rem', borderRadius: 'var(--radius)' }}
        >
          Start optimizing
        </Link>
        <Link
          href="#demo"
          className="btn-ghost glass-panel"
          style={{ fontSize: '1.1rem', padding: '0.875rem 2.25rem', borderRadius: 'var(--radius)' }}
        >
          See a demo run
        </Link>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px var(--green); }
          50% { opacity: 0.5; transform: scale(1.3); box-shadow: 0 0 20px var(--green); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
