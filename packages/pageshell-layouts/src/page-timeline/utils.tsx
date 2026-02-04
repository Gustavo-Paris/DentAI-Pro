/**
 * PageTimeline Utilities
 *
 * @package @pageshell/layouts
 */

import { isValidElement, type ReactNode } from 'react';
import { Button } from '@pageshell/primitives';
import type { PageTimelineGroupBy, TimelineActionConfig, TimelineActionProp } from './types';

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Format date for group header
 */
export function formatGroupDate(date: Date, groupBy: PageTimelineGroupBy): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (groupBy === 'day') {
    if (isToday) return 'Hoje';
    if (isYesterday) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  if (groupBy === 'week') {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;
  }

  if (groupBy === 'month') {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  return '';
}

/**
 * Get group key from date
 */
export function getGroupKey(date: Date, groupBy: PageTimelineGroupBy): string {
  if (groupBy === 'day') {
    return date.toDateString();
  }
  if (groupBy === 'week') {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toDateString();
  }
  if (groupBy === 'month') {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }
  return '';
}

// =============================================================================
// Action Rendering
// =============================================================================

/**
 * Render action helper
 */
export function renderAction(action: TimelineActionProp): ReactNode {
  if (!action) return null;

  // If it's a ReactElement, return as-is
  if (isValidElement(action)) {
    return action;
  }

  // If it's a config object
  const config = action as TimelineActionConfig;
  if (config.label) {
    return (
      <Button
        variant={config.variant ?? 'outline'}
        size="sm"
        onClick={config.onClick}
      >
        {config.label}
      </Button>
    );
  }

  return null;
}
