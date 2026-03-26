const FEATURED = {
  title: 'Failure clustering — the core insight',
  description:
    'Most prompt optimizers just rewrite blindly. PromptForge first groups failures by type, then targets the dominant cluster — so each rewrite fixes the most impactful problem first.',
  tags: ['wrong_format', 'wrong_content', 'hallucination', 'refusal'],
};

const CARDS = [
  {
    title: 'Audit trail',
    description:
      'Every run stores the full prompt history, optimizer reasoning, and test case results — exportable as JSON.',
  },
  {
    title: 'LLM-as-judge',
    description:
      'Use a second LLM call to evaluate open-ended outputs where exact-match scoring falls short.',
  },
  {
    title: 'Early stopping',
    description:
      'Set an accuracy target and the optimizer halts the moment it is reached — no wasted iterations.',
  },
  {
    title: 'Human override',
    description:
      'Pause any run mid-iteration, edit the prompt manually, then resume automated optimization.',
  },
];

export default function Features() {
  return (
    <section
      id="features"
      style={{ padding: '5rem 2rem', background: 'var(--bg-surface)' }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Section label + heading */}
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
            Features
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 500,
              color: 'var(--text)',
              letterSpacing: '-0.5px',
            }}
          >
            Everything you need
          </h2>
        </div>

        {/* 2-column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.25rem',
          }}
        >
          {/* Featured card — full width */}
          <div
            style={{
              gridColumn: '1 / -1',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius, 8px)',
              padding: '2rem',
              background: 'var(--bg-card)',
            }}
          >
            <h3
              style={{
                fontSize: '1.0625rem',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '0.75rem',
              }}
            >
              {FEATURED.title}
            </h3>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                marginBottom: '1.25rem',
              }}
            >
              {FEATURED.description}
            </p>
            {/* Tag pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {FEATURED.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6875rem',
                    padding: '0.25rem 0.625rem',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Remaining 4 cards */}
          {CARDS.map((card) => (
            <div
              key={card.title}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius, 8px)',
                padding: '1.5rem',
                background: 'var(--bg-card)',
              }}
            >
              <h3
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: 'var(--text)',
                  marginBottom: '0.5rem',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
