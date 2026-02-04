'use client';

import { cn } from '@pageshell/core/utils';

export interface LoadingProgressBarProps {
  /** Whether to show the loading bar */
  isLoading: boolean;
}

/**
 * LoadingProgressBar - Top progress indicator during loading.
 *
 * @internal Used by PageShellCore
 */
export function LoadingProgressBar({ isLoading }: LoadingProgressBarProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-50 h-1 overflow-hidden bg-transparent">
      <div
        className={cn(
          'h-full bg-primary',
          'animate-[progress_1.5s_ease-in-out_infinite]'
        )}
        style={{ width: '30%' }}
      />
    </div>
  );
}
