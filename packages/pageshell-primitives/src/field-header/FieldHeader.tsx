/**
 * FieldHeader Primitive
 *
 * Header component for form fields and settings sections.
 * Provides consistent styling for icon + label + description pattern.
 *
 * @module field-header
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon, type IconProp } from '../icons';

/**
 * Icon color options
 */
export type FieldHeaderIconColor = 'primary' | 'secondary' | 'accent' | 'muted' | 'violet' | 'emerald' | 'amber' | 'blue';

/**
 * FieldHeader component props
 */
export interface FieldHeaderProps {
  /** Field label/title */
  label: string;
  /** Icon to display before label */
  icon?: IconProp;
  /** Icon color (default: 'secondary') */
  iconColor?: FieldHeaderIconColor;
  /** Description text below label */
  description?: string;
  /** Heading size (default: 'sm') */
  size?: 'xs' | 'sm' | 'md';
  /** Additional content after the label (e.g., badge) */
  trailing?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test ID */
  testId?: string;
}

const iconColorClasses: Record<FieldHeaderIconColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  muted: 'text-muted-foreground',
  violet: 'text-violet-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  blue: 'text-blue-500',
};

const sizeClasses = {
  xs: 'portal-heading-xs',
  sm: 'portal-heading-sm',
  md: 'portal-heading-md',
};

const iconSizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
};

/**
 * FieldHeader - Header for form fields and settings sections
 *
 * @example Basic usage
 * ```tsx
 * <FieldHeader
 *   icon="user"
 *   label="Username"
 *   description="Choose a unique username for your profile"
 * />
 * ```
 *
 * @example With custom icon color
 * ```tsx
 * <FieldHeader
 *   icon="link"
 *   iconColor="accent"
 *   label="Portfolio URL"
 * />
 * ```
 *
 * @example With trailing badge
 * ```tsx
 * <FieldHeader
 *   icon="shield"
 *   label="Security"
 *   trailing={<StatusBadge variant="success">Enabled</StatusBadge>}
 * />
 * ```
 */
export function FieldHeader({
  label,
  icon,
  iconColor = 'secondary',
  description,
  size = 'sm',
  trailing,
  className,
  testId,
}: FieldHeaderProps) {
  const Icon = icon ? resolveIcon(icon) : null;

  return (
    <div className={cn('mb-4', className)} data-testid={testId}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <Icon
            className={cn(iconSizeClasses[size], iconColorClasses[iconColor])}
            aria-hidden="true"
          />
        )}
        <h2 className={cn('portal-heading', sizeClasses[size])}>{label}</h2>
        {trailing}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
