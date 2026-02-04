'use client';

/**
 * UsageCardEmpty Component
 *
 * Empty state for usage/analytics cards.
 * Can be used independently or as part of BaseUsageCard.
 *
 * @module base-usage-card
 */

import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { UsageCardEmptyProps } from './types';

/**
 * UsageCardEmpty - Empty state with icon and messaging
 *
 * @example
 * ```tsx
 * <UsageCardEmpty
 *   icon="inbox"
 *   title="No data yet"
 *   description="Start using the API to see your usage stats"
 * />
 * ```
 */
export function UsageCardEmpty({
  icon,
  iconName,
  title,
  description,
  subtitle,
  className,
}: UsageCardEmptyProps) {
  // Support both `icon` and legacy `iconName` prop
  const resolvedIcon = icon ?? iconName;
  // Support both `description` and legacy `subtitle` prop
  const resolvedDescription = description ?? subtitle;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 text-center',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center mb-3">
        {resolvedIcon && <PageIcon name={resolvedIcon} className="h-6 w-6 text-muted-foreground" />}
      </div>
      <p className="text-foreground font-medium">{title}</p>
      {resolvedDescription && (
        <span className="text-sm text-muted-foreground mt-1">{resolvedDescription}</span>
      )}
    </div>
  );
}

UsageCardEmpty.displayName = 'UsageCardEmpty';
