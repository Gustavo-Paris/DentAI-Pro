/**
 * DashboardPageSkeleton Component
 *
 * Loading skeleton for DashboardPage composite.
 * Thin wrapper around PresetSkeleton for backward compatibility.
 *
 * Uses differentiated animations:
 * - shimmer: For stat cards and module cards (data-heavy content)
 * - pulse: For title/header text and buttons (simpler elements)
 *
 * @module dashboard/components/DashboardPageSkeleton
 */

'use client';

import * as React from 'react';
import { PresetSkeleton } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface DashboardPageSkeletonProps {
  /** Number of stat cards */
  statsCount?: number;
  /** Number of module cards */
  modulesCount?: number;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DashboardPageSkeleton - Loading skeleton for DashboardPage composite.
 *
 * @example
 * ```tsx
 * <DashboardPageSkeleton statsCount={4} modulesCount={6} />
 * ```
 */
export function DashboardPageSkeleton({
  statsCount = 4,
  modulesCount = 6,
  className,
}: DashboardPageSkeletonProps) {
  return (
    <PresetSkeleton
      preset="dashboardPage"
      statsCount={statsCount}
      modulesCount={modulesCount}
      className={className}
    />
  );
}

DashboardPageSkeleton.displayName = 'DashboardPageSkeleton';
