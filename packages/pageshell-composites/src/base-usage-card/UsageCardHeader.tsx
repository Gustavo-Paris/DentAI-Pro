'use client';

/**
 * UsageCardHeader Component
 *
 * Standalone header component for usage/analytics cards.
 * Can be used independently or as part of BaseUsageCard.
 *
 * @module base-usage-card
 */

import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { UsageCardHeaderProps } from './types';

/**
 * UsageCardHeader - Header with icon, title, and optional right content
 *
 * @example
 * ```tsx
 * <UsageCardHeader
 *   icon="dollar-sign"
 *   title="Usage Status"
 *   subtitle="Monitor your API usage"
 *   headerRight={<Badge>Active</Badge>}
 * />
 * ```
 */
export function UsageCardHeader({
  icon,
  iconName,
  title,
  subtitle,
  headerRight,
  headerClassName,
  iconClassName,
  titleClassName,
  subtitleClassName,
}: UsageCardHeaderProps) {
  // Support both `icon` and legacy `iconName` prop
  const resolvedIcon = icon ?? iconName;

  return (
    <div className={cn('flex items-center gap-3', headerClassName)}>
      <div
        className={cn(
          'w-10 h-10 rounded-[10px] flex items-center justify-center',
          'bg-primary/10',
          iconClassName
        )}
      >
        {resolvedIcon && <PageIcon name={resolvedIcon} className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn('font-semibold text-foreground', titleClassName)}>
          {title}
        </h3>
        <p className={cn('text-sm text-muted-foreground', subtitleClassName)}>
          {subtitle}
        </p>
      </div>
      {headerRight}
    </div>
  );
}

UsageCardHeader.displayName = 'UsageCardHeader';
