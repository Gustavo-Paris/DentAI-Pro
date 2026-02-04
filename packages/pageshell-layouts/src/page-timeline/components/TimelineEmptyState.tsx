/**
 * TimelineEmptyState Component
 *
 * Empty state for PageTimeline.
 *
 * @package @pageshell/layouts
 */

'use client';

import { isValidElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import { renderAction } from '../utils';
import type { PageTimelineEmptyState } from '../types';

// =============================================================================
// Component
// =============================================================================

export function TimelineEmptyState({ emptyState }: { emptyState: PageTimelineEmptyState }) {
  const renderIcon = () => {
    if (!emptyState.icon) return null;
    // If it's already a rendered element, use it directly
    if (isValidElement(emptyState.icon)) {
      return emptyState.icon;
    }
    // Otherwise, it's a component reference (function or forwardRef like Lucide icons)
    const IconComponent = emptyState.icon as LucideIcon;
    return <IconComponent className="h-12 w-12" />;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {emptyState.icon && (
        <div className="mb-4 text-muted-foreground">{renderIcon()}</div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{emptyState.title}</h3>
      {emptyState.description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {emptyState.description}
        </p>
      )}
      {emptyState.action && <div className="mt-4">{renderAction(emptyState.action)}</div>}
    </div>
  );
}
