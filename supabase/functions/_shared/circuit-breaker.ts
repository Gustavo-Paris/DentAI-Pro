/**
 * Circuit breaker with per-isolate state.
 * WARNING: State resets on each Supabase Edge Function cold start.
 * This only protects within a single isolate lifetime (typically one request).
 * For cross-request protection, move state to a database table or Redis.
 */

// Shared circuit breaker factory for AI API clients (Claude, Gemini, etc.)
//
// Usage:
//   const { check, onSuccess, onFailure } = createCircuitBreaker(ClaudeError, "Claude");

import { logger } from "./logger.ts";

/**
 * Thresholds are configurable via environment variables:
 *   CB_FAILURE_THRESHOLD  – failures before opening (default 3)
 *   CB_RESET_TIMEOUT_MS   – ms before half-open probe  (default 30 000)
 *   CB_FAILURE_WINDOW_MS  – sliding window for failures (default 60 000)
 */

const FAILURE_THRESHOLD = parseInt(Deno.env.get('CB_FAILURE_THRESHOLD') || '3', 10);
const RESET_TIMEOUT_MS = parseInt(Deno.env.get('CB_RESET_TIMEOUT_MS') || '30000', 10);
const FAILURE_WINDOW_MS = parseInt(Deno.env.get('CB_FAILURE_WINDOW_MS') || '60000', 10);

interface CircuitBreakerState {
  consecutiveFailures: number;
  state: "closed" | "open" | "half-open";
  openedAt: number;
  failureThreshold: number;
  resetTimeoutMs: number;
  failureWindowMs: number;
  firstFailureAt: number;
}

interface CircuitBreakerErrorConstructor {
  new (message: string, statusCode: number, isRetryable: boolean): Error;
}

export function createCircuitBreaker(
  ErrorClass: CircuitBreakerErrorConstructor,
  label: string,
) {
  const state: CircuitBreakerState = {
    consecutiveFailures: 0,
    state: "closed",
    openedAt: 0,
    failureThreshold: FAILURE_THRESHOLD,
    resetTimeoutMs: RESET_TIMEOUT_MS,
    failureWindowMs: FAILURE_WINDOW_MS,
    firstFailureAt: 0,
  };

  function check(): void {
    const now = Date.now();

    if (state.state === "open") {
      if (now - state.openedAt >= state.resetTimeoutMs) {
        state.state = "half-open";
        logger.log(`Circuit breaker half-open — allowing probe request`);
        return;
      }
      throw new ErrorClass(
        `Servico ${label} temporariamente indisponivel (circuit breaker aberto). Tente novamente em breve.`,
        503,
        true,
      );
    }
    // "closed" and "half-open" allow requests through
  }

  function onSuccess(): void {
    if (state.state !== "closed") {
      logger.log(`Circuit breaker closed — ${label} recovered`);
    }
    state.consecutiveFailures = 0;
    state.firstFailureAt = 0;
    state.state = "closed";
  }

  function onFailure(): void {
    const now = Date.now();

    // Reset window if the first failure is outside the window
    if (
      state.firstFailureAt === 0 ||
      now - state.firstFailureAt > state.failureWindowMs
    ) {
      state.firstFailureAt = now;
      state.consecutiveFailures = 1;
    } else {
      state.consecutiveFailures++;
    }

    if (state.consecutiveFailures >= state.failureThreshold) {
      state.state = "open";
      state.openedAt = now;
      logger.warn(
        `Circuit breaker opened after ${state.consecutiveFailures} consecutive failures`,
      );
    } else if (state.state === "half-open") {
      // Probe failed — re-open
      state.state = "open";
      state.openedAt = now;
      logger.warn("Circuit breaker re-opened — probe request failed");
    }
  }

  return { check, onSuccess, onFailure };
}
