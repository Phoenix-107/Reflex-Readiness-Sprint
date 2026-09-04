import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ordersClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it('builds requests against VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.northstar.example.com');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'item_1', name: 'Espresso Blend' }],
    });
    global.fetch = fetchMock as any;

    const { fetchCatalog } = await import('./ordersClient');
    const result = await fetchCatalog();

    expect(fetchMock).toHaveBeenCalledWith('https://api.northstar.example.com/catalog');
    expect(result).toEqual([{ id: 'item_1', name: 'Espresso Blend' }]);
  });

  it('falls back to /api when VITE_API_BASE_URL is unset', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'item_1', name: 'Espresso Blend' }],
    });
    global.fetch = fetchMock as any;

    const { fetchCatalog } = await import('./ordersClient');
    const result = await fetchCatalog();

    expect(fetchMock).toHaveBeenCalledWith('/api/catalog');
    expect(result).toEqual([{ id: 'item_1', name: 'Espresso Blend' }]);
  });

  it('does not export resetDemo (runtime and type checks)', async () => {
    const ordersClient = await import('./ordersClient');
    expect((ordersClient as Record<string, unknown>).resetDemo).toBeUndefined();
    expect('resetDemo' in ordersClient).toBe(false);

    // Type-level assertion: resetDemo must not exist in typeof ordersClient
    type HasResetDemo = 'resetDemo' extends keyof typeof ordersClient ? true : false;
    const hasResetDemo: HasResetDemo = false;
    expect(hasResetDemo).toBe(false);
  });
});
