'use client';

import { cn } from '@pageshell/core';
import {
  PageIcon,
  PageButton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@pageshell/primitives';
import type { ResolvedViewMode } from '../../hooks/useViewMode';

/**
 * Props for ViewModeToggle component
 */
export interface ViewModeToggleProps {
  /**
   * Current view mode
   */
  viewMode: ResolvedViewMode;

  /**
   * Callback when view mode changes
   */
  onViewModeChange: (mode: ResolvedViewMode) => void;

  /**
   * Whether columns are available for table view
   * If false, table button is disabled
   */
  hasColumns?: boolean;

  /**
   * Whether renderCard is available for cards view
   * If false, cards button is disabled
   */
  hasRenderCard?: boolean;

  /**
   * Whether graphConfig is available for graph view
   * If false, graph button is hidden (not just disabled)
   */
  hasGraphConfig?: boolean;

  /**
   * Custom CSS classes
   */
  className?: string;

  /**
   * Size of the toggle buttons
   * @default 'sm'
   */
  size?: 'sm' | 'default';

  /**
   * Labels for accessibility
   */
  labels?: {
    table?: string;
    cards?: string;
    graph?: string;
  };
}

/**
 * ViewModeToggle - Toggle between table, cards, and graph view
 *
 * Displays toggle buttons allowing users to switch between list views.
 * Graph button only appears when graphConfig is provided.
 * Integrates with ListPage's view mode system.
 *
 * @example
 * ```tsx
 * <ViewModeToggle
 *   viewMode={currentViewMode}
 *   onViewModeChange={setViewMode}
 *   hasColumns={!!columns}
 *   hasRenderCard={!!renderCard}
 *   hasGraphConfig={!!graphConfig}
 * />
 * ```
 */
export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  hasColumns = true,
  hasRenderCard = true,
  hasGraphConfig = false,
  className,
  size = 'sm',
  labels = {
    table: 'View as table',
    cards: 'View as cards',
    graph: 'View as graph',
  },
}: ViewModeToggleProps) {
  const isTableView = viewMode === 'table';
  const isCardsView = viewMode === 'cards';
  const isGraphView = viewMode === 'graph';

  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <TooltipProvider>
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 p-0.5',
          className
        )}
        role="group"
        aria-label="View mode"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <PageButton
              variant="ghost"
              size="icon"
              className={cn(
                buttonSize,
                'rounded-sm',
                isTableView
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onViewModeChange('table')}
              disabled={!hasColumns}
              aria-pressed={isTableView}
              aria-label={labels.table}
            >
              <PageIcon name="layout-list" className={iconSize} />
            </PageButton>
          </TooltipTrigger>
          <TooltipContent>{labels.table}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <PageButton
              variant="ghost"
              size="icon"
              className={cn(
                buttonSize,
                'rounded-sm',
                isCardsView
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onViewModeChange('cards')}
              disabled={!hasRenderCard}
              aria-pressed={isCardsView}
              aria-label={labels.cards}
            >
              <PageIcon name="layout-grid" className={iconSize} />
            </PageButton>
          </TooltipTrigger>
          <TooltipContent>{labels.cards}</TooltipContent>
        </Tooltip>

        {hasGraphConfig && (
          <Tooltip>
            <TooltipTrigger asChild>
              <PageButton
                variant="ghost"
                size="icon"
                className={cn(
                  buttonSize,
                  'rounded-sm',
                  isGraphView
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onViewModeChange('graph')}
                aria-pressed={isGraphView}
                aria-label={labels.graph}
              >
                <PageIcon name="network" className={iconSize} />
              </PageButton>
            </TooltipTrigger>
            <TooltipContent>{labels.graph}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
