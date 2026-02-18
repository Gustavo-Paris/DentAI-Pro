import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry } from '../retry';

// ---------------------------------------------------------------------------
// isRetryableError is NOT exported, so we test it indirectly through withRetry.
// We also test withRetry's behaviour directly.
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// isRetryableError — tested indirectly via withRetry
// ---------------------------------------------------------------------------

describe('isRetryableError (via withRetry)', () => {
  // Helper: withRetry should retry on retryable errors, not on non-retryable ones.
  // We set maxRetries=1 so the function is called at most twice.

  it('should retry on TypeError with "fetch" in message (network error)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 1, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on error with message containing "429"', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Rate limit 429'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 1, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on error with message containing "500"', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Server error 500'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 1, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on error with status 400 (client error)', async () => {
    const error = Object.assign(new Error('Bad request'), { status: 400 });
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 100 }))
      .rejects.toThrow('Bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should NOT retry on error with status 401 (unauthorized)', async () => {
    const error = Object.assign(new Error('Unauthorized'), { status: 401 });
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 100 }))
      .rejects.toThrow('Unauthorized');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should NOT retry on error with code INSUFFICIENT_CREDITS', async () => {
    const error = Object.assign(new Error('No credits'), { code: 'INSUFFICIENT_CREDITS' });
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 100 }))
      .rejects.toThrow('No credits');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on error with message containing "edge function"', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('edge function returned an error'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 1, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on AbortError (DOMException with "aborted" in message)', async () => {
    // The source checks msg.includes('aborted'), and DOMException message
    // "The operation was aborted" contains "aborted", so it IS retryable.
    const error = new DOMException('The operation was aborted', 'AbortError');
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(fn, { maxRetries: 1, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on error with message containing "network"', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError when attempting to fetch'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 1, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on error with code RATE_LIMITED', async () => {
    const error = Object.assign(new Error('Rate limited'), { code: 'RATE_LIMITED' });
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 1, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on error with code PAYMENT_REQUIRED', async () => {
    const error = Object.assign(new Error('Payment required'), { code: 'PAYMENT_REQUIRED' });
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 100 }))
      .rejects.toThrow('Payment required');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// withRetry — direct behaviour tests
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  it('should return result on first attempt success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry up to maxRetries on retryable errors', async () => {
    const networkError = new TypeError('Failed to fetch');
    const fn = vi.fn().mockImplementation(async () => { throw networkError; });

    const promise = withRetry(fn, { maxRetries: 2, baseDelay: 100 })
      .catch((e: Error) => e);

    // Advance through all retry delays
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;
    expect(result).toBeInstanceOf(TypeError);
    expect(result.message).toBe('Failed to fetch');
    // Called 3 times: initial + 2 retries
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should succeed on second attempt after retryable error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(fn, { maxRetries: 2, baseDelay: 100 });
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call onRetry callback with attempt number and error', async () => {
    const onRetry = vi.fn();
    const error = new TypeError('Failed to fetch');
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 2, baseDelay: 100, onRetry });
    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, error);
  });

  it('should use exponential backoff for delays', async () => {
    const error = new TypeError('Failed to fetch');
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxRetries: 2, baseDelay: 1000 });

    // First retry after 1000ms (1000 * 2^0)
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry after 2000ms (1000 * 2^1)
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should default to maxRetries=2 and baseDelay=2000', async () => {
    const error = new TypeError('Failed to fetch');
    const fn = vi.fn().mockImplementation(async () => { throw error; });

    const promise = withRetry(fn).catch((e: Error) => e);

    // Advance through all retry delays (2000 + 4000 = 6000)
    await vi.advanceTimersByTimeAsync(7000);

    const result = await promise;
    expect(result).toBeInstanceOf(TypeError);
    expect(result.message).toBe('Failed to fetch');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should not retry non-retryable errors even with retries remaining', async () => {
    const fn = vi.fn().mockRejectedValue(
      Object.assign(new Error('Not found'), { status: 404 }),
    );

    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 100 }))
      .rejects.toThrow('Not found');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
