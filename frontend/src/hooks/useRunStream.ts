'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Run, PromptVersion, TestCaseResult, WsEvent } from '../../lib/types';
import { isMockMode } from '../../lib/api';

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface UseRunStreamOptions {
  runId: string;
  enabled: boolean;
  initialRun?: Run | null;
}

export interface UseRunStreamResult {
  run: Run | null;
  scoreHistory: { version: number; score: number }[];
  latestVersion: PromptVersion | null;
  testCaseResults: TestCaseResult[];
  isConnected: boolean;
  status: ConnectionStatus;
}

const INITIAL_DELAY_MS = 1000;
const BACKOFF_MULTIPLIER = 2;
const MAX_DELAY_MS = 30_000;
const MAX_RETRIES = 5;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useRunStream({
  runId,
  enabled,
  initialRun = null,
}: UseRunStreamOptions): UseRunStreamResult {
  const [run, setRun] = useState<Run | null>(initialRun ?? null);
  const [scoreHistory, setScoreHistory] = useState<{ version: number; score: number }[]>([]);
  const [latestVersion, setLatestVersion] = useState<PromptVersion | null>(null);
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('closed');

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Keep run ref in sync for use inside callbacks without stale closure
  const runRef = useRef<Run | null>(run);
  runRef.current = run;

  const processEvent = useCallback((event: WsEvent) => {
    if (event.type === 'iteration_end') {
      const { version, score, passed, failed } = event.data as {
        version: number;
        score: number;
        passed: number;
        failed: number;
      };
      const roundedScore = Math.round(score * 100);
      setScoreHistory((prev) => [...prev, { version, score: roundedScore }]);
      setRun((prev) => {
        if (!prev) return prev;
        const matchingVersion = prev.prompt_versions.find((v) => v.version === version) ?? null;
        if (matchingVersion) {
          setLatestVersion(matchingVersion);
        }
        return {
          ...prev,
          best_score: Math.max(prev.best_score, score),
        };
      });
      // Also update latestVersion from run ref if available
      const currentRun = runRef.current;
      if (currentRun) {
        const match = currentRun.prompt_versions.find((v) => v.version === version);
        if (match) setLatestVersion(match);
      }
    } else if (event.type === 'test_case_result') {
      const tc = event.data as unknown as TestCaseResult;
      setTestCaseResults((prev) => [...prev, tc].slice(-200));
    } else if (event.type === 'run_complete' || event.type === 'run_failed') {
      const { status } = event.data as { status: string };
      setRun((prev) =>
        prev ? { ...prev, status: status as Run['status'] } : prev,
      );
      // Close the WebSocket cleanly
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000);
        wsRef.current = null;
      }
      setWsStatus('closed');
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const wsBase = API_BASE.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/ws/run/${runId}`);
    wsRef.current = ws;
    setWsStatus('connecting');

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      retryCountRef.current = 0;
      setWsStatus('open');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WsEvent;
        processEvent(data);
      } catch {
        console.error('[useRunStream] Failed to parse WS message:', event.data);
      }
    };

    ws.onerror = () => {
      setWsStatus('error');
    };

    ws.onclose = (ev) => {
      if (!mountedRef.current) return;
      if (ev.code === 1000) {
        setWsStatus('closed');
        return;
      }
      setWsStatus('closed');
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(
          INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, retryCountRef.current),
          MAX_DELAY_MS,
        );
        retryCountRef.current += 1;
        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      }
    };
  }, [runId, processEvent]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setWsStatus('closed');
      return;
    }

    if (isMockMode()) {
      import('../../lib/mockData').then(({ simulateRunStream }) => {
        if (!mountedRef.current) return;
        const cleanup = simulateRunStream(runId, (event) => {
          processEvent(event);
        });
        // Store cleanup on wsRef as a sentinel (null ws, but we need cleanup)
        retryTimerRef.current = null;
        // Use a local variable captured in the effect cleanup
        (wsRef as unknown as { _mockCleanup?: () => void })._mockCleanup = cleanup;
      });
      return () => {
        mountedRef.current = false;
        const mockCleanup = (wsRef as unknown as { _mockCleanup?: () => void })._mockCleanup;
        if (mockCleanup) {
          mockCleanup();
          (wsRef as unknown as { _mockCleanup?: () => void })._mockCleanup = undefined;
        }
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearRetryTimer();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [enabled, runId, connect, clearRetryTimer, processEvent]);

  // Sync initialRun into state when it changes
  useEffect(() => {
    if (initialRun !== undefined) {
      setRun(initialRun ?? null);
    }
  }, [initialRun]);

  return {
    run,
    scoreHistory,
    latestVersion,
    testCaseResults,
    isConnected: wsStatus === 'open',
    status: wsStatus,
  };
}
