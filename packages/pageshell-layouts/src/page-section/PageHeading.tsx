'use client';

/**
 * PageHeading Component
 *
 * Standalone heading component with optional icon and badge.
 * Use this for custom section headings outside of PageSection.
 *
 * @example Basic usage
 * <PageHeading title="Badges Conquistados" icon="trophy" />
 *
 * @example With count badge
 * <PageHeading
 *   title="Badges Conquistados"
 *   icon="trophy"
 *   badge={unlockedBadges.length}
 * />
 */

import { cn } from '@pageshell/core';
import { StatusBadge, resolveIcon } from '@pageshell/primitives';
import { usePageShellContext, iconColorClasses } from '@pageshell/theme';
import type { PageHeadingProps, PageSectionBadge, BadgeVariant } from './types';

/**
 * Normalizes badge prop to value and variant
 */
function normalizeBadge(badge: PageSectionBadge | undefined): { value: string; variant: string } | null {
  if (badge === undefined || badge === null) return null;

  if (typeof badge === 'number' || typeof badge === 'string') {
    return { value: String(badge), variant: 'accent' };
  }

  return { value: String(badge.value), variant: badge.variant ?? 'accent' };
}

/**
 * Size class mappings
 */
const sizeClasses = {
  sm: 'text-base font-medium',
  md: 'text-lg font-semibold',
  lg: 'text-xl font-semibold',
} as const;

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const;

const marginBottomClasses = {
  none: '',
  sm: 'mb-2',
  md: 'mb-4',
  lg: 'mb-6',
} as const;

export function PageHeading({
  title,
  icon,
  iconColor = 'violet',
  badge,
  rightContent,
  size = 'md',
  marginBottom,
  testId,
}: PageHeadingProps) {
  const { theme } = usePageShellContext();
  const Icon = resolveIcon(icon);
  const normalizedBadge = normalizeBadge(badge);
  const colorClass = iconColorClasses[theme][iconColor] ?? iconColor;

  const heading = (
    <h2
      data-testid={testId}
      className={cn(
        'flex items-center gap-2',
        sizeClasses[size],
        'text-foreground'
      )}
    >
      {Icon && (
        <span className={cn(iconSizeClasses[size], colorClass)} aria-hidden="true">
          <Icon className="w-full h-full" />
        </span>
      )}
      {title}
      {normalizedBadge && (
        <StatusBadge
          variant={normalizedBadge.variant as BadgeVariant}
          size="sm"
          className="ml-1"
        >
          {normalizedBadge.value}
        </StatusBadge>
      )}
    </h2>
  );

  const mbClass = marginBottom ? marginBottomClasses[marginBottom] : '';

  if (rightContent) {
    return (
      <div className={cn('flex items-center justify-between', mbClass)}>
        {heading}
        <span className="text-sm text-muted-foreground">{rightContent}</span>
      </div>
    );
  }

  return mbClass ? <div className={mbClass}>{heading}</div> : heading;
}
