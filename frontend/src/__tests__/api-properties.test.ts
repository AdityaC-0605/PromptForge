import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

/**
 * Validates: Requirements 1.2
 * Feature: promptforge-frontend, Property 6: API error propagation
 */
describe('API Property Tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('API client throws on non-2xx responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (status, detail) => {
          const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status,
            statusText: 'Error',
            json: async () => ({ detail }),
          });
          vi.stubGlobal('fetch', mockFetch);

          const { fetchRun } = await import('@/lib/api');
          await expect(fetchRun('test-run-id')).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
