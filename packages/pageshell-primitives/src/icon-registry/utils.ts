/**
 * Icon Utilities
 *
 * @module icons/utils
 */

import type { ComponentType } from 'react';
import { iconRegistry } from './registry';
import type { IconName, IconProp } from './types';

/**
 * Resolve an icon prop to a ComponentType.
 * Accepts either a string name or a ComponentType directly.
 *
 * @param icon - Icon name string or ComponentType
 * @returns The resolved ComponentType, or undefined if not found
 *
 * @example
 * ```tsx
 * const Icon = resolveIcon('sparkles');
 * // or
 * const Icon = resolveIcon(MyCustomIcon);
 * ```
 */
export function resolveIcon(
  icon: IconProp | undefined
): ComponentType<{ className?: string }> | undefined {
  if (!icon) return undefined;

  if (typeof icon === 'string') {
    return iconRegistry[icon as IconName];
  }

  return icon;
}

/**
 * Check if a string is a valid icon name
 */
export function isValidIconName(name: string): name is IconName {
  return name in iconRegistry;
}

/**
 * Get all available icon names
 */
export function getIconNames(): IconName[] {
  return Object.keys(iconRegistry) as IconName[];
}

/**
 * Type guard to check if an icon prop is a variant string (from the registry).
 * Unlike isValidIconName, this accepts the full IconProp type (string | ComponentType).
 */
export function isIconVariant(icon: IconProp): icon is IconName {
  return typeof icon === 'string' && icon in iconRegistry;
}

/**
 * Get all available icon variants.
 * @deprecated Use getIconNames() instead - this is an alias for backward compatibility.
 */
export function getAvailableIcons(): IconName[] {
  return Object.keys(iconRegistry) as IconName[];
}
