'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchRuns } from '../../lib/api';
import type { RunSummary } from '../../lib/types';

interface UseRunHistoryResult {
  runs: RunSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRunHistory(): UseRunHistoryResult {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRuns()
      .then((data) => {
        if (!cancelled) setRuns(data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to fetch runs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { runs, loading, error, refetch };
}
