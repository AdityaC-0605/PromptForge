'use client';

import { useState, useEffect } from 'react';
import { fetchRun } from '../../lib/api';
import type { PromptVersion } from '../../lib/types';

interface UsePromptVersionsResult {
  versions: PromptVersion[];
  loading: boolean;
  error: string | null;
}

export function usePromptVersions(runId: string): UsePromptVersionsResult {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRun(runId)
      .then((run) => {
        if (!cancelled) setVersions(run.prompt_versions);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : 'Failed to fetch prompt versions',
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [runId]);

  return { versions, loading, error };
}
