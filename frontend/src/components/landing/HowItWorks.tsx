const STEPS = [
  {
    icon: '📋',
    label: 'Define task',
    description: 'Choose a task type and upload a test dataset with expected outputs.',
  },
  {
    icon: '✏️',
    label: 'Seed prompt',
    description: 'Provide an initial prompt — zero-shot, role-based, or chain-of-thought.',
  },
  {
    icon: '⚙️',
    label: 'Evaluate',
    description: 'The LLM runs your prompt against every test case and records results.',
  },
  {
    icon: '📊',
    label: 'Score + cluster',
    description: 'Failures are scored and grouped by type: format, content, hallucination.',
  },
  {
    icon: '🔁',
    label: 'Rewrite',
    description: 'The optimizer rewrites the prompt to fix the dominant failure cluster.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{ padding: '5rem 2rem', maxWidth: 1040, margin: '0 auto' }}
    >
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
          How it works
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 500,
            color: 'var(--text)',
            letterSpacing: '-0.5px',
          }}
        >
          The optimization loop
        </h2>
      </div>

      {/* Steps row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0,
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        {STEPS.map((step, i) => (
          <div key={step.label} style={{ display: 'contents' }}>
            {/* Step card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '1.25rem 1rem',
                maxWidth: 160,
                flex: '0 0 auto',
              }}
            >
              {/* Icon box */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  marginBottom: '0.75rem',
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text)',
                  marginBottom: '0.375rem',
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                {step.description}
              </div>
            </div>

            {/* Arrow connector — not after last step */}
            {i < STEPS.length - 1 && (
              <div
                key={`arrow-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '1.25rem',
                  color: 'var(--text-muted)',
                  fontSize: '1.125rem',
                  flex: '0 0 auto',
                  alignSelf: 'flex-start',
                  marginTop: '0.75rem',
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
