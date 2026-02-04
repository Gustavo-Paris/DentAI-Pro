/**
 * Query Result Types
 *
 * Unified query result interface compatible with tRPC, React Query, SWR, Apollo.
 *
 * @module shared/types/query
 */

// =============================================================================
// Query Result Interface
// =============================================================================

/**
 * Unified query result interface.
 * Compatible with tRPC, React Query, SWR, and Apollo.
 */
export type CompositeQueryResult<TData = unknown> = {
  data: TData | undefined;
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => unknown;
  isFetching?: boolean;
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Safely extract error message from unknown error type.
 * Compatible with Error, tRPC errors, and plain objects.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Resolve description that can be string or function.
 * If function, calls it with data and returns result.
 */
export function resolveDescription(
  description: string | ((data: unknown) => string) | undefined,
  data?: unknown
): string | undefined {
  if (!description) return undefined;
  if (typeof description === 'function') {
    return description(data);
  }
  return description;
}
