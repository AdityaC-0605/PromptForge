'use client';

import { use } from 'react';
import { usePromptVersions } from '@/src/hooks/usePromptVersions';
import PromptVersionBrowser from '@/src/components/PromptVersionBrowser';

export default function PromptBrowserPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const { versions, loading, error } = usePromptVersions(runId);

  const bestVersion = versions.length > 0
    ? [...versions].sort((a, b) => b.score - a.score)[0].version
    : 1;

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading prompt versions...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--red)' }}>
        Error: {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No prompt versions found.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text)',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '1.5rem' }}>
        Prompt Browser{' '}
        <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>(Run {runId})</span>
      </h1>
      <PromptVersionBrowser
        versions={versions}
        bestVersion={bestVersion}
        runId={runId}
      />
    </div>
  );
}
