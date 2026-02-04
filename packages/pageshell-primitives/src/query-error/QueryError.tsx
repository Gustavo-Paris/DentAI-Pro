'use client';

/**
 * QueryError - Error display for query failures
 *
 * Minimal query error implementation for PageShell components.
 * Used to display errors from tRPC/React Query.
 *
 * @module query-error
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button } from '../button';

// =============================================================================
// Types
// =============================================================================

export interface QueryErrorProps {
  /** The error object from the query */
  error: unknown | null;
  /** Callback to retry the query */
  retry?: () => void;
  /** Custom title */
  title?: string;
  /** Custom message (overrides error.message) */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show error message in development */
  showDevMessage?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Query Error Component
 *
 * Displays an error state for tRPC/React Query queries.
 * Includes a retry button for user recovery.
 *
 * @example
 * ```tsx
 * if (error) {
 *   return <QueryError error={error} retry={refetch} />;
 * }
 * ```
 */
export function QueryError({
  error,
  retry,
  title = 'Erro ao carregar dados',
  message,
  className,
  size = 'md',
  showDevMessage = true,
}: QueryErrorProps) {
  if (!error) return null;

  const errorMessage = (() => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const rawMessage = (error as { message?: unknown }).message;
      if (typeof rawMessage === 'string') return rawMessage;
      if (rawMessage != null) return String(rawMessage);
    }
    return null;
  })();

  const displayMessage =
    message ?? errorMessage ?? 'Ocorreu um erro. Tente novamente.';

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size],
        className
      )}
    >
      <AlertCircle
        className={cn('text-red-500 dark:text-red-400 mb-3', iconSizes[size])}
      />
      <h3
        className={cn(
          'font-medium text-foreground mb-1',
          titleSizes[size]
        )}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {displayMessage}
      </p>

      {/* Show detailed error in development */}
      {showDevMessage && errorMessage && (
        <p className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded mb-4 max-w-md break-all">
          {errorMessage}
        </p>
      )}

      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
