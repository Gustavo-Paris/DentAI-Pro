/**
 * Retry utility with exponential backoff.
 * Only retries on network/timeout errors — not on 4xx client errors.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message?.includes('fetch')) return true;

  const err = error as { message?: string; code?: string; status?: number };

  // Don't retry client errors (4xx)
  if (err.status && err.status >= 400 && err.status < 500) return false;
  if (err.code === 'INSUFFICIENT_CREDITS' || err.code === 'PAYMENT_REQUIRED') return false;

  const msg = (err.message || '').toLowerCase();
  if (
    msg.includes('failed to fetch') ||
    msg.includes('failed to send a request') ||
    msg.includes('networkerror') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('aborted') ||
    msg.includes('edge function') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  ) {
    return true;
  }

  // 429 rate limit — retryable (might succeed after backoff)
  if (msg.includes('429') || err.code === 'RATE_LIMITED') return true;

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 2;
  const baseDelay = options?.baseDelay ?? 2000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = baseDelay * Math.pow(2, attempt);
        options?.onRetry?.(attempt + 1, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}
