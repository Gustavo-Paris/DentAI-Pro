/**
 * Retry utility with exponential backoff.
 * Only retries on network/timeout errors — not on 4xx client errors.
 */

import { classifyEdgeFunctionError, isRetryableErrorType } from './edge-function-errors';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

function isRetryableError(error: unknown): boolean {
  return isRetryableErrorType(classifyEdgeFunctionError(error));
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
