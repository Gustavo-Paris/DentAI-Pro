'use client';

import { cn } from '@pageshell/core';
import { Skeleton } from './Skeleton';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 max-w-32" />
          ))}
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-4"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4 flex-1",
                  colIndex === 0 ? "max-w-48" : "max-w-24"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
