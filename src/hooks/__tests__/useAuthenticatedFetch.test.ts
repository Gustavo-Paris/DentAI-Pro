import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthenticatedFetch } from '../useAuthenticatedFetch';

// Mock trackTiming
vi.mock('@/lib/webVitals', () => ({
  trackTiming: vi.fn(),
}));

// Mock supabase
const mockInvoke = vi.fn();
const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      refreshSession: () => mockRefreshSession(),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe('useAuthenticatedFetch', () => {
  const futureExpiry = Math.floor(Date.now() / 1000) + 3600; // 1hr from now

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: valid session that doesn't need refresh
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureExpiry } },
      error: null,
    });
  });

  it('should return invokeFunction', () => {
    const { result } = renderHook(() => useAuthenticatedFetch());
    expect(typeof result.current.invokeFunction).toBe('function');
  });

  it('should invoke supabase function and return data', async () => {
    mockInvoke.mockResolvedValue({ data: { result: 'ok' }, error: null });

    const { result } = renderHook(() => useAuthenticatedFetch());
    const response = await result.current.invokeFunction('test-fn', { body: { key: 'val' } });

    expect(response.data).toEqual({ result: 'ok' });
    expect(response.error).toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith('test-fn', {
      body: { key: 'val' },
      headers: undefined,
    });
  });

  it('should return error when no active session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuthenticatedFetch());
    const response = await result.current.invokeFunction('test-fn');

    expect(response.data).toBeNull();
    expect(response.error?.message).toBe('No active session');
  });

  it('should return error when getSession fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Session error'),
    });

    const { result } = renderHook(() => useAuthenticatedFetch());
    const response = await result.current.invokeFunction('test-fn');

    expect(response.data).toBeNull();
    expect(response.error?.message).toBe('Session error');
  });

  it('should proactively refresh session when near expiry', async () => {
    const nearExpiry = Math.floor(Date.now() / 1000) + 30; // 30s from now
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: nearExpiry } },
      error: null,
    });
    mockRefreshSession.mockResolvedValue({ error: null });
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    const { result } = renderHook(() => useAuthenticatedFetch());
    await result.current.invokeFunction('test-fn');

    expect(mockRefreshSession).toHaveBeenCalled();
  });

  it('should retry on 401 after refreshing token', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: new Error('401 Unauthorized') })
      .mockResolvedValueOnce({ data: { retried: true }, error: null });
    mockRefreshSession.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuthenticatedFetch());
    const response = await result.current.invokeFunction('test-fn');

    expect(mockRefreshSession).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledTimes(2);
    expect(response.data).toEqual({ retried: true });
  });

  it('should return original error if refresh after 401 fails', async () => {
    const originalError = new Error('401 Unauthorized');
    mockInvoke.mockResolvedValue({ data: null, error: originalError });
    mockRefreshSession.mockResolvedValue({ error: new Error('Refresh failed') });

    const { result } = renderHook(() => useAuthenticatedFetch());
    const response = await result.current.invokeFunction('test-fn');

    expect(response.error).toBe(originalError);
  });

  it('should track function timing', async () => {
    const { trackTiming } = await import('@/lib/webVitals');
    mockInvoke.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAuthenticatedFetch());
    await result.current.invokeFunction('my-function');

    expect(trackTiming).toHaveBeenCalledWith('edge-fn-my-function', expect.any(Number));
  });

  it('should handle unexpected exceptions', async () => {
    mockGetSession.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuthenticatedFetch());
    const response = await result.current.invokeFunction('test-fn');

    expect(response.data).toBeNull();
    expect(response.error?.message).toBe('Network error');
  });
});
