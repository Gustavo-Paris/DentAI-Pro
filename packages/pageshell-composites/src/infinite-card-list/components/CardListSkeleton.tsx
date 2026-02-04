/**
 * CardListSkeleton Component
 *
 * Skeleton placeholder for InfiniteCardList loading state.
 *
 * @module infinite-card-list/components/CardListSkeleton
 */

'use client';

import * as React from 'react';
import { Skeleton } from '@pageshell/primitives';

export interface CardListSkeletonProps {
  count: number;
  cardSkeleton?: React.ReactNode;
  showHeader?: boolean;
}

export function CardListSkeleton({ count, cardSkeleton, showHeader = false }: CardListSkeletonProps) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-[160px]" />
        </div>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {cardSkeleton || (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

CardListSkeleton.displayName = 'CardListSkeleton';
