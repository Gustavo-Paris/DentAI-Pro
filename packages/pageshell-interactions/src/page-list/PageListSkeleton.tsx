/**
 * PageListSkeleton Component
 *
 * Loading skeleton for PageList.
 *
 * @package @pageshell/interactions
 */

'use client';

import { cn } from '@pageshell/core';
import { variantStyles } from './constants';
import { SkeletonItem } from './components';
import type { PageListSkeletonProps } from './types';

// =============================================================================
// Component
// =============================================================================

export function PageListSkeleton({
  count = 3,
  variant = 'default',
  dividers = true,
  className,
}: PageListSkeletonProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'overflow-hidden',
        variant !== 'card' && 'rounded-lg border border-border',
        styles.container,
        className
      )}
      aria-busy="true"
      aria-label="Loading list"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            dividers && variant !== 'card' && index > 0 && 'border-t border-border'
          )}
        >
          <SkeletonItem variant={variant} />
        </div>
      ))}
    </div>
  );
}
