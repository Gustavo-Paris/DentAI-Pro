/**
 * Shared edge function error classification.
 * Consolidates the duplicated error-type detection scattered across
 * usePhotoAnalysis, useDSDStep, useWizardSubmit, and retry.ts.
 */

export type EdgeFunctionErrorType =
  | 'rate_limited'
  | 'insufficient_credits'
  | 'connection'
  | 'server'
  | 'resource_limit'
  | 'no_data'
  | 'unknown';

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

/**
 * Classifies an edge function error into a known category.
 * Checks structured `code`/`status` fields first (preferred),
 * then falls back to message string matching.
 */
export function classifyEdgeFunctionError(error: unknown): EdgeFunctionErrorType {
  const err = error as ErrorLike;
  const code = err.code ?? '';
  const status = err.status ?? 0;
  const msg = (err.message ?? '').toLowerCase();

  // Rate limited
  if (code === 'RATE_LIMITED' || status === 429 || msg.includes('429')) {
    return 'rate_limited';
  }

  // Insufficient credits / payment required
  if (
    code === 'INSUFFICIENT_CREDITS' ||
    code === 'PAYMENT_REQUIRED' ||
    status === 402 ||
    msg.includes('402')
  ) {
    return 'insufficient_credits';
  }

  // Resource / compute limit (Gemini WORKER_LIMIT, etc.)
  if (status === 546 || msg.includes('546') || msg.includes('compute resources')) {
    return 'resource_limit';
  }

  // No data returned
  if (msg.includes('não retornou dados') || msg.includes('no data')) {
    return 'no_data';
  }

  // Connection / network errors
  if (
    (error instanceof TypeError && msg.includes('fetch')) ||
    msg.includes('failed to fetch') ||
    msg.includes('failed to send a request') ||
    msg.includes('networkerror') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('aborted')
  ) {
    return 'connection';
  }

  // Server errors
  if (
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('edge function')
  ) {
    return 'server';
  }

  return 'unknown';
}

/** Whether an error of this type is safe to retry with backoff. */
export function isRetryableErrorType(type: EdgeFunctionErrorType): boolean {
  return type === 'rate_limited' || type === 'connection' || type === 'server' || type === 'resource_limit';
}
