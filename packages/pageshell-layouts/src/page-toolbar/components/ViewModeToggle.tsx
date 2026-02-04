/**
 * ViewModeToggle Component
 *
 * View mode toggle buttons for PageToolbar.
 *
 * @package @pageshell/layouts
 */

'use client';

import { cn, useHandlerMap } from '@pageshell/core';
import { viewModeIcons, viewModeLabels } from '../constants';
import type { PageToolbarViewMode, PageToolbarVariant } from '../types';

// =============================================================================
// Component
// =============================================================================

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  viewModeOptions,
  variant,
}: {
  viewMode: PageToolbarViewMode;
  onViewModeChange: (mode: PageToolbarViewMode) => void;
  viewModeOptions: PageToolbarViewMode[];
  variant: PageToolbarVariant;
}) {
  // Memoized handler for view mode button clicks - stable reference per mode
  const { getHandler: getViewModeHandler } = useHandlerMap(
    (mode: PageToolbarViewMode) => onViewModeChange(mode)
  );

  return (
    <div
      className="flex items-center rounded-md border border-border bg-muted/30 p-0.5"
      role="group"
      aria-label="View mode"
    >
      {viewModeOptions.map((mode) => {
        const Icon = viewModeIcons[mode];
        const isActive = viewMode === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={getViewModeHandler(mode)}
            className={cn(
              'p-1.5 rounded-sm transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              variant === 'compact' && 'p-1'
            )}
            aria-label={viewModeLabels[mode]}
            aria-pressed={isActive}
          >
            <Icon className={cn(variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          </button>
        );
      })}
    </div>
  );
}
