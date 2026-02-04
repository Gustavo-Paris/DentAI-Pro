/**
 * CalendarPage Skeleton
 *
 * Loading skeleton for CalendarPage composite.
 * Thin wrapper around PresetSkeleton for backward compatibility.
 *
 * @module calendar/components/CalendarSkeleton
 */

'use client';

import * as React from 'react';
import { PresetSkeleton } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface CalendarSkeletonProps {
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * CalendarSkeleton - Loading skeleton for CalendarPage composite.
 *
 * @example
 * ```tsx
 * <CalendarSkeleton />
 * ```
 */
export function CalendarSkeleton({ className }: CalendarSkeletonProps = {}) {
  return <PresetSkeleton preset="calendarPage" className={className} />;
}

CalendarSkeleton.displayName = 'CalendarSkeleton';
