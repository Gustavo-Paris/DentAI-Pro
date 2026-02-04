/**
 * Error Fallback Utilities
 *
 * Utilities for resolving and rendering error fallbacks in PageShell.
 *
 * @module lib/error-fallback
 */

import type { ReactNode } from 'react';

/**
 * Error fallback configuration
 */
export interface ErrorFallbackConfig {
  /** Custom render function */
  render?: (error: Error, retry?: () => void) => ReactNode;
  /** Hide retry button */
  hideRetry?: boolean;
  /** Custom retry label */
  retryLabel?: string;
}

/**
 * Result of resolving an errorFallback prop
 */
export interface ResolvedErrorFallback {
  /** Whether to use custom rendering */
  hasCustomRender: boolean;
  /** Custom render function (if provided) */
  render?: (error: Error, retry?: () => void) => ReactNode;
  /** Static fallback content (if provided) */
  content?: ReactNode;
  /** Whether to hide retry button */
  hideRetry: boolean;
  /** Custom retry label */
  retryLabel: string;
}

/**
 * Resolve errorFallback prop to a consistent format
 */
export function resolveErrorFallback(
  errorFallback: ReactNode | ErrorFallbackConfig | undefined
): ResolvedErrorFallback {
  // Default case - no custom error handling
  if (errorFallback === undefined || errorFallback === null) {
    return {
      hasCustomRender: false,
      hideRetry: false,
      retryLabel: 'Tentar novamente',
    };
  }

  // Check if it's an ErrorFallbackConfig object
  if (
    typeof errorFallback === 'object' &&
    errorFallback !== null &&
    !('$$typeof' in errorFallback) && // Not a React element
    ('render' in errorFallback || 'hideRetry' in errorFallback || 'retryLabel' in errorFallback)
  ) {
    const config = errorFallback as ErrorFallbackConfig;
    return {
      hasCustomRender: !!config.render,
      render: config.render,
      hideRetry: config.hideRetry ?? false,
      retryLabel: config.retryLabel ?? 'Tentar novamente',
    };
  }

  // Static ReactNode content
  return {
    hasCustomRender: false,
    content: errorFallback as ReactNode,
    hideRetry: false,
    retryLabel: 'Tentar novamente',
  };
}

/**
 * Render error with resolved fallback
 */
export function renderErrorFallback(
  resolved: ResolvedErrorFallback,
  error: Error,
  retry?: () => void,
  defaultRender?: (error: Error, retry?: () => void) => ReactNode
): ReactNode {
  // Custom render function
  if (resolved.hasCustomRender && resolved.render) {
    return resolved.render(error, retry);
  }

  // Static content
  if (resolved.content !== undefined) {
    return resolved.content;
  }

  // Default render (usually QueryError)
  if (defaultRender) {
    return defaultRender(error, resolved.hideRetry ? undefined : retry);
  }

  // Fallback to null if no default provided
  return null;
}
