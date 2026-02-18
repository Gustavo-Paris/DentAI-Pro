// Shared circuit breaker factory for AI API clients (Claude, Gemini, etc.)
//
// Usage:
//   const { check, onSuccess, onFailure } = createCircuitBreaker(ClaudeError, "Claude");

import { logger } from "./logger.ts";

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
    failureThreshold: 3,
    resetTimeoutMs: 30_000,
    failureWindowMs: 60_000,
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
