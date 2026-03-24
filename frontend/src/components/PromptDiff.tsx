'use client';
// src/components/PromptDiff.tsx — LCS-based line-by-line diff renderer

export interface DiffOp {
  type: 'add' | 'remove' | 'equal';
  line: string;
}

function computeDiff(oldPrompt: string, newPrompt: string): DiffOp[] {
  const oldLines = oldPrompt.split('\n');
  const newLines = newPrompt.split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce DiffOp[]
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: 'equal', line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', line: newLines[j - 1] });
      j--;
    } else {
      ops.push({ type: 'remove', line: oldLines[i - 1] });
      i--;
    }
  }
  ops.reverse();
  return ops;
}

interface PromptDiffProps {
  oldPrompt: string;
  newPrompt: string;
  showLineNumbers?: boolean;
}

export default function PromptDiff({ oldPrompt, newPrompt, showLineNumbers = true }: PromptDiffProps) {
  if (oldPrompt === '' && newPrompt === '') {
    return (
      <div
        style={{
          padding: '1rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8125rem',
        }}
      >
        No diff available.
      </div>
    );
  }

  const ops = computeDiff(oldPrompt, newPrompt);

  // Track line numbers for old and new sides
  let oldLineNum = 0;
  let newLineNum = 0;

  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-surface)',
        overflowY: 'auto',
        maxHeight: '400px',
      }}
    >
      {ops.map((op, i) => {
        let className: string;
        let prefix: string;
        let rowStyle: React.CSSProperties;

        if (op.type === 'add') {
          className = 'diff-added';
          prefix = '+';
          rowStyle = { background: '#f0fdf4', color: '#15803d' };
          newLineNum++;
        } else if (op.type === 'remove') {
          className = 'diff-removed';
          prefix = '-';
          rowStyle = { background: '#fef2f2', color: '#b91c1c' };
          oldLineNum++;
        } else {
          className = 'diff-unchanged';
          prefix = ' ';
          rowStyle = {};
          oldLineNum++;
          newLineNum++;
        }

        const lineNum = op.type === 'add' ? newLineNum : oldLineNum;

        return (
          <div
            key={i}
            className={className}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              ...rowStyle,
            }}
          >
            {showLineNumbers && (
              <span
                style={{
                  minWidth: '3rem',
                  textAlign: 'right',
                  paddingRight: '0.75rem',
                  paddingLeft: '0.5rem',
                  color: 'var(--text-muted)',
                  userSelect: 'none',
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {lineNum}
              </span>
            )}
            <span
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flex: 1,
              }}
            >
              {prefix}{op.line}
            </span>
          </div>
        );
      })}
    </div>
  );
}
