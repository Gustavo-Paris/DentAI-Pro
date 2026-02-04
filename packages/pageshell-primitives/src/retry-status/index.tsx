/**
 * RetryStatus Components
 *
 * Displays retry status with visual feedback for operations.
 *
 * @package @pageshell/primitives
 */

'use client';

import * as React from 'react';
import { RefreshCw, AlertCircle, Clock, ShieldAlert, Check, X } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button } from '../button';

// =============================================================================
// Types
// =============================================================================

export interface RetryStatusData {
  state: 'idle' | 'pending' | 'success' | 'failed' | 'retrying' | 'circuit_open';
  attempt: number;
  maxAttempts: number;
  lastError?: Error | null;
  nextRetryIn?: number | null;
  isRetrying?: boolean;
  isCircuitOpen?: boolean;
}

export interface RetryStatusProps {
  /** Retry status data */
  status: RetryStatusData;
  /** Callback to manually trigger retry */
  onRetry?: () => void;
  /** Callback to reset circuit breaker */
  onReset?: () => void;
  /** Compact display mode */
  compact?: boolean;
  /** Additional class name */
  className?: string;
}

export interface RetryIndicatorProps {
  /** Current attempt number (0-indexed) */
  attempt: number;
  /** Maximum number of attempts */
  maxAttempts: number;
  /** Time until next retry in ms */
  nextRetryIn?: number | null;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format milliseconds to human readable string
 */
function formatTime(ms: number): string {
  if (ms < 1000) return 'menos de 1s';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get status color based on state
 */
function getStatusColor(state: RetryStatusData['state']): string {
  switch (state) {
    case 'success':
      return 'text-green-400 bg-green-500/10 border-green-500/30';
    case 'failed':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'retrying':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'circuit_open':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'pending':
      return 'text-info bg-info/10 border-info/30';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

/**
 * Get status icon based on state
 */
function getStatusIcon(state: RetryStatusData['state']) {
  switch (state) {
    case 'success':
      return <Check className="h-4 w-4" />;
    case 'failed':
      return <X className="h-4 w-4" />;
    case 'retrying':
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    case 'circuit_open':
      return <ShieldAlert className="h-4 w-4" />;
    case 'pending':
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    default:
      return null;
  }
}

/**
 * Get status message based on state
 */
function getStatusMessage(status: RetryStatusData): string {
  switch (status.state) {
    case 'success':
      return 'Concluido com sucesso';
    case 'failed':
      return `Falhou apos ${status.attempt + 1} tentativa${status.attempt > 0 ? 's' : ''}`;
    case 'retrying':
      return `Tentando novamente... (${status.attempt + 1}/${status.maxAttempts + 1})`;
    case 'circuit_open':
      return 'Servico temporariamente indisponivel';
    case 'pending':
      return 'Processando...';
    default:
      return '';
  }
}

// =============================================================================
// RetryStatus
// =============================================================================

/**
 * RetryStatus Component
 *
 * Displays retry status with visual feedback.
 *
 * @example
 * ```tsx
 * <RetryStatus
 *   status={retryStatus}
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function RetryStatus({
  status,
  onRetry,
  onReset,
  compact = false,
  className,
}: RetryStatusProps) {
  // Don't show anything in idle state
  if (status.state === 'idle') return null;

  // Compact version - just an inline indicator
  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-sm',
          getStatusColor(status.state).split(' ')[0],
          className
        )}
      >
        {getStatusIcon(status.state)}
        {status.isRetrying && (
          <span>
            Tentativa {status.attempt + 1}/{status.maxAttempts + 1}
          </span>
        )}
        {status.nextRetryIn && status.nextRetryIn > 0 && (
          <span className="text-xs opacity-75">
            ({formatTime(status.nextRetryIn)})
          </span>
        )}
      </span>
    );
  }

  // Full version - card with details
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        getStatusColor(status.state),
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon(status.state)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium">{getStatusMessage(status)}</p>

          {/* Error message */}
          {status.lastError && (
            <p className="mt-1 text-sm opacity-75 truncate">
              {status.lastError.message}
            </p>
          )}

          {/* Countdown */}
          {status.nextRetryIn && status.nextRetryIn > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5" />
              <span>Proxima tentativa em {formatTime(status.nextRetryIn)}</span>
            </div>
          )}

          {/* Progress bar for countdown */}
          {status.nextRetryIn && status.nextRetryIn > 0 && (
            <div className="mt-2 h-1 rounded-full bg-current/20 overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-100"
                style={{
                  width: `${Math.max(0, 100 - (status.nextRetryIn / 5000) * 100)}%`,
                }}
              />
            </div>
          )}

          {/* Circuit breaker info */}
          {status.isCircuitOpen && (
            <div className="mt-2 p-2 rounded bg-current/10">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>
                  Muitas falhas consecutivas. Aguarde um momento antes de tentar novamente.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2">
          {status.state === 'failed' && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-current/30"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Tentar novamente
            </Button>
          )}

          {status.isCircuitOpen && onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="border-current/30"
            >
              Resetar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RetryIndicator
// =============================================================================

/**
 * Inline retry indicator for buttons and small spaces
 *
 * @example
 * ```tsx
 * <RetryIndicator attempt={2} maxAttempts={3} nextRetryIn={5000} />
 * ```
 */
export function RetryIndicator({
  attempt,
  maxAttempts,
  nextRetryIn,
  className,
}: RetryIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-amber-400 text-sm',
        className
      )}
    >
      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      <span>
        Tentativa {attempt + 1}/{maxAttempts + 1}
      </span>
      {nextRetryIn && nextRetryIn > 0 && (
        <span className="text-xs opacity-75">
          ({formatTime(nextRetryIn)})
        </span>
      )}
    </span>
  );
}
