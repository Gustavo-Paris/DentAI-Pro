/**
 * ConfigPage Skeleton
 *
 * Loading skeleton for ConfigPage.
 * Thin wrapper around PresetSkeleton for backward compatibility.
 *
 * @module config/components/ConfigPageSkeleton
 */

'use client';

import * as React from 'react';
import { PresetSkeleton } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface ConfigPageSkeletonProps {
  /** Number of config sections */
  sectionCount?: number;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ConfigPageSkeleton - Loading skeleton for ConfigPage composite.
 *
 * @example
 * ```tsx
 * <ConfigPageSkeleton sectionCount={3} />
 * ```
 */
export const ConfigPageSkeleton = React.memo(function ConfigPageSkeleton({
  sectionCount = 3,
  className,
}: ConfigPageSkeletonProps = {}) {
  return (
    <PresetSkeleton
      preset="configPage"
      sectionCount={sectionCount}
      className={className}
    />
  );
});

ConfigPageSkeleton.displayName = 'ConfigPageSkeleton';
