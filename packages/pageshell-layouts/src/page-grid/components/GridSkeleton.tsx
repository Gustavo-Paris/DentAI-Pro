/**
 * GridSkeleton Component
 *
 * Loading skeleton for PageGrid.
 *
 * @package @pageshell/layouts
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { animationClasses } from '../constants';
import type { PageGridAnimation } from '../types';

// =============================================================================
// Component
// =============================================================================

export function GridSkeleton({
  count,
  skeleton,
  animated,
  animation,
  maxDelay,
  config,
  itemClassName,
}: {
  count: number;
  skeleton: ReactNode;
  animated: boolean;
  animation: PageGridAnimation;
  maxDelay: number;
  config: { animate: string; animateDelay: (index: number) => string };
  itemClassName?: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`skeleton-${index}`}
          role="listitem"
          aria-hidden="true"
          className={cn(
            animated && animation !== 'none' && animationClasses[animation],
            animated && config.animateDelay(Math.min(index + 1, maxDelay)),
            itemClassName
          )}
        >
          {skeleton}
        </div>
      ))}
    </>
  );
}
