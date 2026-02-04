'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '../page-icon';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../tooltip';
import type { HealthIndicatorProps, HealthStatus, HealthStatusConfig } from './types';

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<HealthStatus, HealthStatusConfig> = {
  healthy: {
    icon: 'check-circle',
    dotColor: 'bg-success',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    pulse: true,
  },
  degraded: {
    icon: 'alert-triangle',
    dotColor: 'bg-warning',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
    pulse: false,
  },
  offline: {
    icon: 'x-circle',
    dotColor: 'bg-destructive',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    pulse: false,
  },
  unknown: {
    icon: 'help-circle',
    dotColor: 'bg-muted-foreground',
    bgColor: 'bg-card',
    textColor: 'text-muted-foreground',
    pulse: false,
  },
  checking: {
    icon: 'loader',
    dotColor: 'bg-muted-foreground',
    bgColor: 'bg-card',
    textColor: 'text-muted-foreground',
    pulse: false,
  },
};

// =============================================================================
// Size Configuration
// =============================================================================

const SIZE_CLASSES = {
  sm: {
    container: 'px-2 py-1 min-h-[32px] text-xs',
    dot: 'h-1.5 w-1.5',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-2.5 py-1.5 min-h-[44px] text-xs',
    dot: 'h-2 w-2',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    container: 'px-3 py-2 min-h-[48px] text-sm',
    dot: 'h-2.5 w-2.5',
    icon: 'w-4 h-4',
  },
};

// =============================================================================
// HealthIndicator Component
// =============================================================================

/**
 * HealthIndicator
 *
 * Animated health/service status indicator with pulsing dot.
 * Use for displaying service health, API status, or connection state.
 *
 * @example Basic usage
 * ```tsx
 * <HealthIndicator status="healthy" label="API" />
 * ```
 *
 * @example With timestamp
 * ```tsx
 * <HealthIndicator
 *   status="healthy"
 *   label="Ana"
 *   lastChecked={new Date()}
 *   showTimestamp
 * />
 * ```
 *
 * @example Clickable with tooltip
 * ```tsx
 * <HealthIndicator
 *   status="offline"
 *   label="Service"
 *   tooltip="Click to refresh status"
 *   onClick={handleRefresh}
 * />
 * ```
 */
export function HealthIndicator({
  status,
  label,
  lastChecked,
  showLabel = true,
  showTimestamp = false,
  pulse = true,
  size = 'md',
  className,
  onClick,
  tooltip,
  'aria-label': ariaLabel,
}: HealthIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = SIZE_CLASSES[size];

  // Format last checked time
  const formatLastChecked = React.useCallback(() => {
    if (!lastChecked) return null;

    const date = typeof lastChecked === 'string' ? new Date(lastChecked) : lastChecked;
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 120) return '1 min ago';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, [lastChecked]);

  // Determine if we should pulse
  const shouldPulse = pulse && config.pulse && status === 'healthy';

  // Build the indicator content
  const indicatorContent = (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg font-medium transition-colors',
        config.bgColor,
        config.textColor,
        sizeClasses.container,
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel ?? `${label ?? 'Service'} status: ${status}`}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Pulsing dot */}
      <span className="relative flex">
        {shouldPulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.dotColor
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', config.dotColor, sizeClasses.dot)} />
      </span>

      {/* Status icon for non-healthy states */}
      {status === 'checking' && (
        <PageIcon name="loader" className={cn(sizeClasses.icon, 'animate-spin')} />
      )}

      {/* Label */}
      {showLabel && label && <span className="hidden sm:inline">{label}</span>}

      {/* Timestamp */}
      {showTimestamp && lastChecked && (
        <span className="text-muted-foreground/70 text-[10px]">{formatLastChecked()}</span>
      )}
    </div>
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicatorContent}</TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return indicatorContent;
}
