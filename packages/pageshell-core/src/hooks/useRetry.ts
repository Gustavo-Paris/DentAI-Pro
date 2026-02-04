/**
 * useRetry Hook
 *
 * Provides retry logic with exponential backoff and circuit breaker pattern.
 * Used for handling transient failures in API calls and mutations.
 *
 * Features:
 * - Configurable retry count and delays
 * - Exponential backoff
 * - Circuit breaker to prevent cascading failures
 * - UI state for showing retry progress
 *
 * @packageDocumentation
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export type RetryState = 'idle' | 'pending' | 'retrying' | 'success' | 'failed' | 'circuit_open';

export interface RetryStatus {
  /** Current state of the retry operation */
  state: RetryState;
  /** Current attempt number (0-indexed) */
  attempt: number;
  /** Maximum number of attempts allowed */
  maxAttempts: number;
  /** Last error encountered, if any */
  lastError: Error | null;
  /** Whether currently in a retry attempt (not first attempt) */
  isRetrying: boolean;
  /** Whether the circuit breaker is open */
  isCircuitOpen: boolean;
  /** Milliseconds until next retry, if waiting */
  nextRetryIn: number | null;
}

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in ms (default: 30000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Circuit breaker failure threshold (default: 5) */
  failureThreshold?: number;
  /** Circuit breaker recovery time in ms (default: 60000) */
  recoveryTime?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
  /** Callback when retry starts */
  onRetryStart?: (attempt: number) => void;
  /** Callback when retry fails */
  onRetryFail?: (attempt: number, error: Error) => void;
  /** Callback when all retries exhausted */
  onRetriesExhausted?: (error: Error) => void;
  /** Callback when circuit opens */
  onCircuitOpen?: () => void;
}

export interface UseRetryReturn<T> {
  /** Execute the function with retry logic */
  execute: (fn: () => Promise<T>) => Promise<T>;
  /** Current retry status */
  status: RetryStatus;
  /** Reset the retry state */
  reset: () => void;
  /** Manually open the circuit breaker */
  openCircuit: () => void;
  /** Manually close the circuit breaker */
  closeCircuit: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  failureThreshold: 5,
  recoveryTime: 60000,
  isRetryable: () => true,
  onRetryStart: () => {},
  onRetryFail: () => {},
  onRetriesExhausted: () => {},
  onCircuitOpen: () => {},
};

/** Error codes that should not be retried (typically client errors) */
export const NON_RETRYABLE_ERRORS = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'BAD_REQUEST',
  'CONFLICT',
  'VALIDATION_ERROR',
] as const;

/**
 * Default function to determine if an error is retryable.
 * Network errors and server errors (5xx) are retryable.
 * Client errors (4xx) are not retryable.
 */
export function defaultIsRetryable(error: Error): boolean {
  // Check for tRPC error codes
  const errorAny = error as { data?: { code?: string }; code?: string };
  const code = errorAny.data?.code || errorAny.code;

  if (code && (NON_RETRYABLE_ERRORS as readonly string[]).includes(code)) {
    return false;
  }

  // Check for network errors (always retryable)
  const message = error.message.toLowerCase();
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('socket')
  ) {
    return true;
  }

  // Check for server errors (5xx)
  if (message.includes('internal server error') || message.includes('500')) {
    return true;
  }

  return true; // Default to retryable
}

// =============================================================================
// Circuit Breaker State (shared across hook instances by key)
// =============================================================================

interface CircuitState {
  failures: number;
  isOpen: boolean;
  lastFailureTime: number;
}

const circuitStates = new Map<string, CircuitState>();

function getCircuitState(key: string): CircuitState {
  if (!circuitStates.has(key)) {
    circuitStates.set(key, { failures: 0, isOpen: false, lastFailureTime: 0 });
  }
  return circuitStates.get(key)!;
}

/**
 * Clear circuit breaker state for a specific key.
 * Useful for testing or manual reset.
 */
export function clearCircuitState(key: string): void {
  circuitStates.delete(key);
}

/**
 * Clear all circuit breaker states.
 * Useful for testing.
 */
export function clearAllCircuitStates(): void {
  circuitStates.clear();
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing retries with circuit breaker pattern.
 *
 * @param key - Unique key for this retry instance (used for circuit breaker state sharing)
 * @param options - Retry configuration options
 *
 * @example
 * ```tsx
 * const { execute, status, reset } = useRetry('api-call', {
 *   maxAttempts: 3,
 *   initialDelay: 1000,
 *   onRetriesExhausted: (error) => toast.error('Failed after 3 attempts'),
 * });
 *
 * const handleSubmit = async () => {
 *   try {
 *     const result = await execute(() => api.submitData(data));
 *     toast.success('Submitted!');
 *   } catch (error) {
 *     // Error already handled by retry logic
 *   }
 * };
 *
 * // Show retry UI
 * {status.isRetrying && (
 *   <p>Retrying in {Math.ceil(status.nextRetryIn / 1000)}s...</p>
 * )}
 * ```
 */
export function useRetry<T = unknown>(
  key: string,
  options: RetryOptions = {}
): UseRetryReturn<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Merge default isRetryable with custom one
  const isRetryable = (error: Error): boolean => {
    if (!defaultIsRetryable(error)) return false;
    return opts.isRetryable(error);
  };

  // State
  const [status, setStatus] = useState<RetryStatus>({
    state: 'idle',
    attempt: 0,
    maxAttempts: opts.maxAttempts,
    lastError: null,
    isRetrying: false,
    isCircuitOpen: false,
    nextRetryIn: null,
  });

  // Refs for cleanup
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  /**
   * Calculate delay with exponential backoff
   */
  const getDelay = useCallback((attempt: number): number => {
    const delay = opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt);
    return Math.min(delay, opts.maxDelay);
  }, [opts.initialDelay, opts.backoffMultiplier, opts.maxDelay]);

  /**
   * Check if circuit breaker should allow request
   */
  const canMakeRequest = useCallback((): boolean => {
    const circuit = getCircuitState(key);

    if (!circuit.isOpen) return true;

    // Check if recovery time has passed
    const now = Date.now();
    if (now - circuit.lastFailureTime >= opts.recoveryTime) {
      circuit.isOpen = false;
      circuit.failures = 0;
      setStatus(prev => ({ ...prev, isCircuitOpen: false }));
      return true;
    }

    return false;
  }, [key, opts.recoveryTime]);

  /**
   * Record a failure for circuit breaker
   */
  const recordFailure = useCallback(() => {
    const circuit = getCircuitState(key);
    circuit.failures += 1;
    circuit.lastFailureTime = Date.now();

    if (circuit.failures >= opts.failureThreshold) {
      circuit.isOpen = true;
      setStatus(prev => ({ ...prev, isCircuitOpen: true, state: 'circuit_open' }));
      opts.onCircuitOpen();
    }
  }, [key, opts]);

  /**
   * Reset failure count on success
   */
  const recordSuccess = useCallback(() => {
    const circuit = getCircuitState(key);
    circuit.failures = 0;
    circuit.isOpen = false;
    circuit.lastFailureTime = 0;
  }, [key]);

  /**
   * Execute function with retry logic
   */
  const execute = useCallback(async (fn: () => Promise<T>): Promise<T> => {
    // Check circuit breaker
    if (!canMakeRequest()) {
      const error = new Error('Circuit breaker is open. Please wait before retrying.');
      setStatus(prev => ({
        ...prev,
        state: 'circuit_open',
        lastError: error,
        isCircuitOpen: true,
      }));
      throw error;
    }

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= opts.maxAttempts; attempt++) {
      try {
        // Update status
        setStatus(prev => ({
          ...prev,
          state: attempt === 0 ? 'pending' : 'retrying',
          attempt,
          isRetrying: attempt > 0,
          nextRetryIn: null,
        }));

        if (attempt > 0) {
          opts.onRetryStart(attempt);
        }

        // Execute the function
        const result = await fn();

        // Success!
        recordSuccess();
        setStatus(prev => ({
          ...prev,
          state: 'success',
          lastError: null,
          isRetrying: false,
        }));

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should abort
        if (abortControllerRef.current?.signal.aborted) {
          throw lastError;
        }

        // Record failure for circuit breaker
        recordFailure();

        // Check if error is retryable
        if (!isRetryable(lastError)) {
          setStatus(prev => ({
            ...prev,
            state: 'failed',
            lastError,
            isRetrying: false,
          }));
          throw lastError;
        }

        // Notify of retry failure
        opts.onRetryFail(attempt, lastError);

        // Check if we have more attempts
        if (attempt >= opts.maxAttempts) {
          break;
        }

        // Calculate delay and wait
        const delay = getDelay(attempt);

        // Update status with countdown
        setStatus(prev => ({
          ...prev,
          lastError,
          nextRetryIn: delay,
        }));

        // Start countdown interval
        let remaining = delay;
        countdownIntervalRef.current = setInterval(() => {
          remaining -= 100;
          if (remaining > 0) {
            setStatus(prev => ({ ...prev, nextRetryIn: remaining }));
          }
        }, 100);

        // Wait for delay
        await new Promise<void>((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(() => {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            resolve();
          }, delay);

          // Handle abort
          abortControllerRef.current?.signal.addEventListener('abort', () => {
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            reject(new Error('Retry aborted'));
          });
        });
      }
    }

    // All retries exhausted
    opts.onRetriesExhausted(lastError!);
    setStatus(prev => ({
      ...prev,
      state: 'failed',
      lastError,
      isRetrying: false,
      nextRetryIn: null,
    }));

    throw lastError;
  }, [opts, canMakeRequest, recordSuccess, recordFailure, getDelay, isRetryable]);

  /**
   * Reset retry state
   */
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setStatus({
      state: 'idle',
      attempt: 0,
      maxAttempts: opts.maxAttempts,
      lastError: null,
      isRetrying: false,
      isCircuitOpen: false,
      nextRetryIn: null,
    });
  }, [opts.maxAttempts]);

  /**
   * Manually open circuit breaker
   */
  const openCircuit = useCallback(() => {
    const circuit = getCircuitState(key);
    circuit.isOpen = true;
    circuit.lastFailureTime = Date.now();
    setStatus(prev => ({ ...prev, isCircuitOpen: true, state: 'circuit_open' }));
  }, [key]);

  /**
   * Manually close circuit breaker
   */
  const closeCircuit = useCallback(() => {
    const circuit = getCircuitState(key);
    circuit.isOpen = false;
    circuit.failures = 0;
    circuit.lastFailureTime = 0;
    setStatus(prev => ({ ...prev, isCircuitOpen: false }));
  }, [key]);

  return {
    execute,
    status,
    reset,
    openCircuit,
    closeCircuit,
  };
}

export default useRetry;
