/**
 * Icon Types
 *
 * @module icons/types
 */

import type { ComponentType } from 'react';
import type { iconRegistry } from './registry';

/**
 * Valid icon names from the registry
 */
export type IconName = keyof typeof iconRegistry;

/**
 * Icon prop type - accepts string name or ComponentType
 * Note: Accepts any string for backward compatibility with bridge icon names
 */
export type IconProp = IconName | string | ComponentType<{ className?: string }>;
