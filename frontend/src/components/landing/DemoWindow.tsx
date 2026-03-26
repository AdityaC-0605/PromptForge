import ScoreRing from '../ScoreRing';
import PromptDiff from '../PromptDiff';

const OLD_PROMPT = `Classify the sentiment of the text.
Return one of: positive, negative, neutral.`;

const NEW_PROMPT = `You are a sentiment analysis expert.
Given the text below, output exactly one word: positive, negative, or neutral.
Do not include any explanation or punctuation — only the label.

Text: {{input}}`;

const REASONING = `> Failure analysis (12 failures):
>   wrong_format   — 7 cases: model returned "Positive." with capital + period
>   wrong_content  — 5 cases: ambiguous texts classified as neutral instead of negative
>
> Rewrite strategy:
>   1. Added explicit persona to anchor tone
>   2. Specified exact output format (single word, no punctuation)
>   3. Added input placeholder to clarify where text goes
>
> Expected improvement: +18–22% on format failures`;

export default function DemoWindow() {
  return (
    <section id="demo" style={{ padding: '2rem 2rem 4rem', maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          background: 'var(--bg-card)',
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.625rem 1rem',
            borderBottom: '0.5px solid var(--border)',
            background: 'var(--bg-surface)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          </div>
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            promptforge — sentiment_classification — iteration 3/10
          </span>
        </div>

        {/* Two-column interior */}
        <div style={{ display: 'flex', minHeight: 360 }}>
          {/* Sidebar — 220px */}
          <div
            style={{
              width: 220,
              flexShrink: 0,
              borderRight: '0.5px solid var(--border)',
              padding: '1.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              background: 'var(--bg-surface)',
            }}
          >
            <ScoreRing score={85} target={95} size={96} />

            {/* Stats table */}
            <table
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                borderCollapse: 'collapse',
              }}
            >
              <tbody>
                {[
                  { label: 'Passed', value: '41', color: '#16a34a' },
                  { label: 'Failed', value: '12', color: '#dc2626' },
                  { label: 'Tokens', value: '2,847', color: 'var(--text-secondary)' },
                ].map(({ label, value, color }) => (
                  <tr key={label}>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>{label}</td>
                    <td style={{ color, textAlign: 'right', padding: '0.25rem 0' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Main area */}
          <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
              Prompt diff — v2 → v3
            </div>

            <PromptDiff oldPrompt={OLD_PROMPT} newPrompt={NEW_PROMPT} showLineNumbers={true} />

            {/* Optimizer reasoning */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border)',
                borderRadius: 6,
                padding: '0.875rem 1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {REASONING}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
