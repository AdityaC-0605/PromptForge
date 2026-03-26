'use client';

import { useState } from 'react';
import type { PromptVersion } from '../../lib/types';
import { formatDate, formatScore } from '../../lib/utils';
import { useToast } from './ToastProvider';
import PromptDiff from './PromptDiff';

interface PromptVersionBrowserProps {
  versions: PromptVersion[];
  bestVersion: number;
  runId: string;
}

function scoreColor(score: number): string {
  const pct = score * 100;
  if (pct >= 95) return '#16a34a';
  if (pct >= 70) return '#d97706';
  return '#dc2626';
}

function parseFailureSummary(summary: string): { type: string; count: number }[] {
  if (!summary) return [];
  return summary
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colonIdx = part.lastIndexOf(':');
      if (colonIdx === -1) return null;
      const type = part.slice(0, colonIdx).trim();
      const count = parseInt(part.slice(colonIdx + 1).trim(), 10);
      if (!type || isNaN(count)) return null;
      return { type, count };
    })
    .filter((x): x is { type: string; count: number } => x !== null);
}

export default function PromptVersionBrowser({
  versions,
  bestVersion,
  runId,
}: PromptVersionBrowserProps) {
  const [selectedVersion, setSelectedVersion] = useState<number>(
    bestVersion ?? versions[0]?.version ?? 1,
  );
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [failuresExpanded, setFailuresExpanded] = useState(false);
  const { addToast } = useToast();

  const current = versions.find((v) => v.version === selectedVersion);
  const compareWith = compareVersion !== null
    ? versions.find((v) => v.version === compareVersion)
    : null;

  const lines = current?.prompt_text.split('\n') ?? [];
  const tokenCount = current ? current.prompt_text.split(' ').length : 0;
  const failureCases = current ? parseFailureSummary(current.failure_summary) : [];

  async function handleCopy() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.prompt_text);
      addToast('Prompt copied to clipboard', 'success');
    } catch {
      addToast('Failed to copy prompt', 'error');
    }
  }

  function handleExport() {
    if (!current) return;
    const blob = new Blob([current.prompt_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-v${current.version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
      {/* Tab strip */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {versions.map((v) => {
          const isActive = v.version === selectedVersion;
          const isBest = v.version === bestVersion;
          return (
            <button
              key={v.version}
              onClick={() => {
                setSelectedVersion(v.version);
                setCompareVersion(null);
              }}
              style={{
                flexShrink: 0,
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                background: isActive ? 'rgba(108, 92, 231, 0.12)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.1s, color 0.1s',
                whiteSpace: 'nowrap',
              }}
            >
              v{v.version}{isBest ? ' *' : ''}
            </button>
          );
        })}
      </div>

      {current && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left panel: code block */}
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              border: '1px solid rgba(195, 232, 141, 0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.625rem 1rem',
                borderBottom: '1px solid rgba(195, 232, 141, 0.1)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#c3e88d', opacity: 0.7 }}>
                prompt-v{current.version}.txt
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#c3e88d', opacity: 0.5 }}>
                {lines.length} lines · ~{tokenCount} tokens
              </span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '0 1rem',
                    minHeight: '1.5rem',
                  }}
                >
                  <span
                    style={{
                      minWidth: '2.5rem',
                      textAlign: 'right',
                      paddingRight: '1rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8125rem',
                      color: 'rgba(195, 232, 141, 0.3)',
                      userSelect: 'none',
                      flexShrink: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8125rem',
                      color: '#c3e88d',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      flex: 1,
                      lineHeight: 1.6,
                    }}
                  >
                    {line || ' '}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: metadata + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Metadata card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>
                Version {current.version} Metadata
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {/* Score */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Score</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: scoreColor(current.score),
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                    }}
                  >
                    {formatScore(current.score)}
                  </span>
                </div>
                {/* Iteration */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Iteration</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{current.version}</span>
                </div>
                {/* Timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Timestamp</span>
                  <span style={{ fontSize: '0.8125rem' }}>{formatDate(current.timestamp)}</span>
                </div>
                {/* Failures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Failures</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: current.failed > 0 ? '#dc2626' : 'var(--text)' }}>
                    {current.failed}
                  </span>
                </div>
                {/* Token count */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>~Tokens</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{tokenCount}</span>
                </div>
              </div>
            </div>

            {/* Failure cases */}
            {failureCases.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setFailuresExpanded((x) => !x)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  <span>Failure Cases</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {failuresExpanded ? '▲' : '▼'}
                  </span>
                </button>
                {failuresExpanded && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderTop: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem 1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Type</th>
                        <th style={{ padding: '0.5rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failureCases.map((fc) => (
                        <tr key={fc.type} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem 1.25rem', fontFamily: 'var(--font-mono)' }}>{fc.type}</td>
                          <td style={{ padding: '0.5rem 1.25rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#dc2626' }}>{fc.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Optimizer reasoning */}
            {current.optimizer_reasoning && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Optimizer Reasoning</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {current.optimizer_reasoning}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent)',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Use this prompt
              </button>
              <button
                onClick={handleExport}
                style={{
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Export (.txt)
              </button>
            </div>

            {/* Compare control */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
              }}
            >
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Compare with
              </label>
              <select
                value={compareVersion ?? ''}
                onChange={(e) => setCompareVersion(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">— select version —</option>
                {versions
                  .filter((v) => v.version !== selectedVersion)
                  .map((v) => (
                    <option key={v.version} value={v.version}>
                      v{v.version} ({formatScore(v.score)})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Diff panel */}
      {compareWith && current && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
            Diff: v{compareWith.version} → v{current.version}
          </h3>
          <PromptDiff
            oldPrompt={compareWith.prompt_text}
            newPrompt={current.prompt_text}
          />
        </div>
      )}
    </div>
  );
}
