'use client';
// src/components/TestCaseFeed.tsx — Live-scrolling test case result list
import { useEffect, useRef } from 'react';
import type { TestCaseResult } from '../../lib/types';

const MAX_VISIBLE = 50;

interface TestCaseFeedProps {
  results: TestCaseResult[];
  maxVisible?: number;
}

export default function TestCaseFeed({ results, maxVisible = MAX_VISIBLE }: TestCaseFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef<boolean>(true);

  const visible = results.slice(-maxVisible);

  // Track whether user is at the bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      isAtBottom.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll when new results arrive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isAtBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [results.length]);

  if (!visible.length) {
    return (
      <div
        style={{
          padding: '1rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8125rem',
          textAlign: 'center',
        }}
      >
        Waiting for test results…
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes feedFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <div
        ref={containerRef}
        style={{
          overflowY: 'auto',
          maxHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          padding: '0.5rem',
        }}
      >
        {visible.map((tc) => {
          const dotColor = tc.passed ? '#16a34a' : '#dc2626';
          const inputText = tc.input.slice(0, 40) + (tc.input.length > 40 ? '…' : '');
          const expectedText = tc.expected.slice(0, 20);
          const actualText = tc.actual.slice(0, 20);
          const latencyText = tc.latency !== undefined ? `${tc.latency}ms` : '';

          return (
            <div
              key={tc.id}
              data-testid="feed-row"
              className="feed-row"
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '0.5rem',
                alignItems: 'flex-start',
                padding: '0.375rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: tc.passed
                  ? 'rgba(0, 210, 160, 0.06)'
                  : 'rgba(255, 107, 107, 0.06)',
                border: `0.5px solid ${tc.passed ? 'rgba(0,210,160,0.2)' : 'rgba(255,107,107,0.2)'}`,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-sans)',
                animation: 'feedFadeIn 150ms ease',
              }}
            >
              {/* Pass/fail dot */}
              <span
                aria-label={tc.passed ? 'Pass' : 'Fail'}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: dotColor,
                  flexShrink: 0,
                  marginTop: '6px',
                  display: 'inline-block',
                }}
              />
              {/* Input */}
              <span
                style={{
                  flex: '1 1 0',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {inputText}
              </span>
              {/* Expected */}
              <span
                style={{
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {expectedText}
              </span>
              {/* Actual */}
              <span
                style={{
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {actualText}
              </span>
              {/* Latency */}
              {latencyText && (
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {latencyText}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
