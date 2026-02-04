/**
 * ItemCardSkeleton Component
 *
 * Loading skeleton for ItemCard.
 *
 * @module item-card/components/ItemCardSkeleton
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Card, Skeleton } from '@pageshell/primitives';
import { sizeClasses } from '../constants';

export interface ItemCardSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showStatus?: boolean;
  showStats?: boolean;
  className?: string;
}

export function ItemCardSkeleton({
  size = 'md',
  showIcon = true,
  showStatus = true,
  showStats = true,
  className,
}: ItemCardSkeletonProps) {
  const sizes = sizeClasses[size];

  return (
    <Card className={cn(sizes.container, 'animate-pulse', className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        {showIcon && <Skeleton className={cn('rounded-lg', sizes.icon)} />}
        {showStatus && <Skeleton className="h-5 w-16 rounded-full" />}
      </div>

      {/* Title */}
      <Skeleton className="h-5 w-3/4 mb-2" />

      {/* Description */}
      <Skeleton className="h-4 w-full mb-4" />

      {/* Stats */}
      {showStats && (
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </Card>
  );
}

ItemCardSkeleton.displayName = 'ItemCardSkeleton';
