'use client';

/**
 * Compact Variant Factory
 *
 * Utility for creating compact/minimal variants of components.
 * Reduces boilerplate when creating size variations.
 *
 * @module utils/compact-variant
 */

import * as React from 'react';
import type { ComponentType } from 'react';

/**
 * Props that typically support size variations
 */
export interface SizeableProps {
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Creates a compact variant of a component with preset props
 *
 * @param Component - The base component to wrap
 * @param defaultProps - Props to apply by default
 * @returns A new component with the default props pre-applied
 *
 * @example
 * ```tsx
 * // Create a compact follow button
 * export const FollowButtonCompact = createCompactVariant(FollowButton, {
 *   size: 'sm',
 *   showIcon: false,
 * });
 *
 * // Usage
 * <FollowButtonCompact userId="123" />
 * // Equivalent to <FollowButton userId="123" size="sm" showIcon={false} />
 * ```
 */
export function createCompactVariant<P extends object>(
  Component: ComponentType<P>,
  defaultProps: Partial<P>
): ComponentType<Partial<P>> {
  function CompactComponent(props: Partial<P>) {
    const mergedProps = { ...defaultProps, ...props } as P;
    return <Component {...mergedProps} />;
  }

  // Set display name for debugging
  const baseName =
    (Component as { displayName?: string }).displayName ||
    Component.name ||
    'Component';
  CompactComponent.displayName = `${baseName}Compact`;

  return CompactComponent;
}

/**
 * Standard compact preset for buttons and action components
 */
export const COMPACT_BUTTON_DEFAULTS: Partial<SizeableProps> = {
  size: 'sm',
  showIcon: false,
};

/**
 * Standard minimal preset (even smaller than compact)
 */
export const MINIMAL_BUTTON_DEFAULTS: Partial<SizeableProps> = {
  size: 'sm',
  showIcon: false,
};

/**
 * Creates a component factory for multiple size variants
 *
 * @param Component - The base component
 * @returns Object with size variant components
 *
 * @example
 * ```tsx
 * const FollowButtonVariants = createSizeVariants(FollowButton);
 *
 * // Now you can use:
 * <FollowButtonVariants.Compact userId="123" />
 * <FollowButtonVariants.Minimal userId="123" />
 * ```
 */
export function createSizeVariants<P extends SizeableProps>(
  Component: ComponentType<P>
): {
  Base: ComponentType<P>;
  Compact: ComponentType<Partial<P>>;
  Minimal: ComponentType<Partial<P>>;
} {
  return {
    Base: Component,
    Compact: createCompactVariant(Component, COMPACT_BUTTON_DEFAULTS as Partial<P>),
    Minimal: createCompactVariant(Component, MINIMAL_BUTTON_DEFAULTS as Partial<P>),
  };
}
