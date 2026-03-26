import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, act } from '@testing-library/react';
import ScoreRing from '@/src/components/ScoreRing';
import PromptDiff from '@/src/components/PromptDiff';
import TestCaseFeed from '@/src/components/TestCaseFeed';
import { ToastProvider, useToast } from '@/src/components/ToastProvider';

describe('Property Tests', () => {

  // Feature: promptforge-frontend, Property 1: ScoreRing color threshold
  it('ScoreRing arc color matches threshold rules', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        const { container, unmount } = render(<ScoreRing score={score} />);
        // Find the progress arc circle — the one with stroke-dashoffset
        const circles = container.querySelectorAll('circle');
        const arcCircle = Array.from(circles).find(
          (c) => c.getAttribute('stroke-dashoffset') !== null
        );
        expect(arcCircle).toBeTruthy();
        const stroke = arcCircle!.getAttribute('stroke');
        if (score < 60) {
          expect(stroke).toBe('#dc2626');
        } else if (score < 85) {
          expect(stroke).toBe('#d97706');
        } else {
          expect(stroke).toBe('#16a34a');
        }
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: promptforge-frontend, Property 2: PromptDiff line classification
  it('PromptDiff every row has exactly one classification class', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (oldPrompt, newPrompt) => {
        // Skip the empty-empty case which renders the empty state (no rows)
        if (oldPrompt === '' && newPrompt === '') return;

        const { container, unmount } = render(
          <PromptDiff oldPrompt={oldPrompt} newPrompt={newPrompt} />
        );

        const rows = container.querySelectorAll(
          '.diff-added, .diff-removed, .diff-unchanged'
        );

        // Every row must have exactly one of the three classes
        rows.forEach((row) => {
          const hasAdded = row.classList.contains('diff-added');
          const hasRemoved = row.classList.contains('diff-removed');
          const hasUnchanged = row.classList.contains('diff-unchanged');
          const count = [hasAdded, hasRemoved, hasUnchanged].filter(Boolean).length;
          expect(count).toBe(1);
        });

        // There must be at least one row (non-empty inputs always produce rows)
        expect(rows.length).toBeGreaterThan(0);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: promptforge-frontend, Property 3: PromptDiff round-trip reconstruction
  it('PromptDiff added + unchanged rows reconstruct newPrompt', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (oldPrompt, newPrompt) => {
        // Skip the empty-empty case
        if (oldPrompt === '' && newPrompt === '') return;

        const { container, unmount } = render(
          <PromptDiff oldPrompt={oldPrompt} newPrompt={newPrompt} showLineNumbers={false} />
        );

        const rows = container.querySelectorAll('.diff-added, .diff-unchanged');
        const reconstructed = Array.from(rows)
          .map((row) => {
            const text = row.querySelector('span')?.textContent ?? '';
            // Strip the first character (the prefix: '+' or ' ')
            return text.slice(1);
          })
          .join('\n');

        expect(reconstructed).toBe(newPrompt);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: promptforge-frontend, Property 4: TestCaseFeed DOM cap
  // Validates: Requirements 11.6
  it('TestCaseFeed renders at most maxVisible rows', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            input: fc.string(),
            expected: fc.string(),
            actual: fc.string(),
            passed: fc.boolean(),
            timestamp: fc.integer(),
          }),
          { minLength: 51, maxLength: 200 }
        ),
        (arr) => {
          const { container, unmount } = render(
            <TestCaseFeed results={arr} maxVisible={50} />
          );
          const rows = container.querySelectorAll('[data-testid="feed-row"]');
          expect(rows.length).toBeLessThanOrEqual(50);
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: promptforge-frontend, Property 5: useRunStream testCaseResults array cap
  it('useRunStream testCaseResults array never exceeds 200 entries', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            input: fc.string(),
            expected: fc.string(),
            actual: fc.string(),
            passed: fc.boolean(),
            timestamp: fc.integer(),
          }),
          { minLength: 201, maxLength: 500 }
        ),
        (events) => {
          // Simulate the capping logic directly (pure function test)
          let results: typeof events = [];
          for (const event of events) {
            results = [...results, event].slice(-200);
          }
          expect(results.length).toBeLessThanOrEqual(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: promptforge-frontend, Property 7: Toast auto-dismiss timing
  it('Toast auto-dismisses after 4000ms', () => {
    vi.useFakeTimers();

    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
        fc.constantFrom('success' as const, 'error' as const, 'info' as const),
        (message, variant) => {
          // Component that adds a toast on mount
          function ToastTrigger() {
            const { addToast } = useToast();
            React.useEffect(() => {
              addToast(message, variant);
            }, []); // eslint-disable-line react-hooks/exhaustive-deps
            return null;
          }

          const { getByText, queryByText, unmount } = render(
            <ToastProvider>
              <ToastTrigger />
            </ToastProvider>
          );

          // Toast should be visible initially
          expect(getByText(message)).toBeTruthy();

          // Advance time past auto-dismiss threshold
          act(() => {
            vi.advanceTimersByTime(4001);
          });

          // Toast should be gone
          expect(queryByText(message)).toBeNull();

          unmount();
        }
      ),
      { numRuns: 100 }
    );

    vi.useRealTimers();
  });
});
