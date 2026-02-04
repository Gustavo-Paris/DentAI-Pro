/**
 * EnumStatusBadge Component
 *
 * A badge component that displays status based on enum values.
 * Uses a lookup table pattern for configuring icons, labels, and colors.
 *
 * @module enum-badge
 *
 * @example Basic usage with config
 * ```tsx
 * const TIER_CONFIG = defineEnumBadgeConfig({
 *   guided: { label: 'Guided', icon: 'book-open', variant: 'success' },
 *   challenging: { label: 'Challenging', icon: 'flame', variant: 'warning' },
 * });
 *
 * <EnumStatusBadge value="guided" config={TIER_CONFIG} />
 * ```
 *
 * @example With description tooltip
 * ```tsx
 * const STATUS_CONFIG = defineEnumBadgeConfig({
 *   active: {
 *     label: 'Active',
 *     icon: 'check-circle',
 *     variant: 'success',
 *     description: 'Currently active and running'
 *   },
 *   paused: {
 *     label: 'Paused',
 *     icon: 'pause-circle',
 *     variant: 'warning',
 *     description: 'Temporarily paused'
 *   },
 * });
 *
 * <EnumStatusBadge
 *   value={status}
 *   config={STATUS_CONFIG}
 *   showDescription
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { memo } from 'react';
import { cn } from '@pageshell/core';
import { Badge } from '../badge';
import { PageIcon } from '../page-icon';
import type { EnumStatusBadgeProps } from './types';

// Variant color classes (must match StatusBadge variants)
const variantColorClasses = {
  default: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  destructive: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    border: 'border-rose-500/20',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
  },
  muted: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  accent: {
    bg: 'bg-accent/10',
    text: 'text-accent-foreground',
    border: 'border-accent/20',
  },
  outline: {
    bg: 'bg-transparent',
    text: 'text-foreground',
    border: 'border-border',
  },
};

function EnumStatusBadgeComponent<T extends string>({
  value,
  config,
  showDescription = false,
  size = 'md',
  className,
  showIcon = true,
}: EnumStatusBadgeProps<T>) {
  const itemConfig = config[value];

  if (!itemConfig) {
    // Fallback for unknown values
    return (
      <Badge
        variant="outline"
        className={cn(
          'inline-flex items-center gap-1.5 font-medium',
          size === 'sm' ? 'text-xs' : 'text-sm',
          className
        )}
      >
        {value}
      </Badge>
    );
  }

  const { label, icon, IconComponent, variant, description } = itemConfig;
  const colors = variantColorClasses[variant] || variantColorClasses.default;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        colors.bg,
        colors.text,
        colors.border,
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}
    >
      {showIcon && IconComponent && <IconComponent className={iconSize} />}
      {showIcon && !IconComponent && icon && (
        <PageIcon name={icon} className={iconSize} />
      )}
      <span>{label}</span>
    </Badge>
  );

  // Wrap with tooltip if description is provided and showDescription is true
  if (showDescription && description) {
    return (
      <span title={description}>
        {badge}
      </span>
    );
  }

  return badge;
}

// Memoize the component
export const EnumStatusBadge = memo(EnumStatusBadgeComponent) as typeof EnumStatusBadgeComponent & {
  displayName?: string;
};

EnumStatusBadge.displayName = 'EnumStatusBadge';
