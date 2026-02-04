'use client';

/**
 * PageSystemInfo Component
 *
 * A footer component for displaying system information like version,
 * tech stack, and status indicators. Commonly used in admin dashboards.
 *
 * @example Basic usage
 * ```tsx
 * <PageSystemInfo
 *   version="2.4.0"
 *   status={{ label: 'OK', color: 'bg-emerald-500' }}
 * />
 * ```
 *
 * @example With tech stack
 * ```tsx
 * <PageSystemInfo
 *   version="2.4.0"
 *   techStack="Next.js 15 + tRPC + Drizzle"
 *   status={{ label: 'Operacional', color: 'bg-emerald-500' }}
 * />
 * ```
 *
 * @example With custom left/right content
 * ```tsx
 * <PageSystemInfo
 *   version="2.4.0"
 *   left={<span>Custom info</span>}
 *   right={<Button size="sm">Settings</Button>}
 * />
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { Card } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

/**
 * Status indicator configuration
 */
export interface SystemInfoStatus {
  /** Status label text */
  label: string;

  /** Status indicator color class (e.g., 'bg-emerald-500') */
  color: string;
}

/**
 * PageSystemInfo component props
 */
export interface PageSystemInfoProps {
  /** Version string (will be prefixed with 'v') */
  version: string;

  /** Tech stack description */
  techStack?: string;

  /** Status indicator */
  status?: SystemInfoStatus;

  /** Custom left content (replaces version + techStack) */
  left?: ReactNode;

  /** Custom right content (replaces status) */
  right?: ReactNode;

  /** Animation delay index (1-5) */
  animationDelay?: number;

  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// PageSystemInfo Component
// =============================================================================

export function PageSystemInfo({
  version,
  techStack,
  status,
  left,
  right,
  animationDelay = 5,
  className,
}: PageSystemInfoProps) {
  return (
    <Card
      role="contentinfo"
      aria-label="System information"
      className={cn(
        'p-4 bg-card portal-animate-in',
        `portal-animate-in-delay-${animationDelay}`,
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        {/* Left section: version + tech stack */}
        {left ?? (
          <div className="flex items-center gap-4">
            <span className="portal-mono font-medium">v{version}</span>
            {techStack && (
              <>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">{techStack}</span>
              </>
            )}
          </div>
        )}

        {/* Right section: status indicator */}
        {right ?? (
          status && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', status.color)} aria-hidden="true" />
                <span>{status.label}</span>
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  );
}

PageSystemInfo.displayName = 'PageSystemInfo';
