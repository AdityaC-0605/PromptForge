import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTasks, isMockMode } from '@/lib/api';

describe('api.ts', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    // Clear mock search param if any
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('reads NEXT_PUBLIC_API_URL and calls correct endpoint', async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = 'http://test-api';
    const mockRes = new Response(JSON.stringify([]), { status: 200, statusText: 'OK' });
    (global.fetch as any).mockResolvedValueOnce(mockRes);

    const { fetchTasks } = await import('@/lib/api');
    await fetchTasks();

    expect(global.fetch).toHaveBeenCalledWith('http://test-api/api/tasks');
  });

  it('throws on non-2xx response', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://test-api';
    const mockRes = new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404, statusText: 'Not Found' });
    (global.fetch as any).mockResolvedValueOnce(mockRes);

    await expect(fetchTasks()).rejects.toThrow('Not Found');
  });

  it('returns mock data when mock=true', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?mock=true' },
      writable: true
    });
    
    expect(isMockMode()).toBe(true);

    const data = await fetchTasks();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(data.length).toBeGreaterThan(0); // Mock data should exist
  });
});
