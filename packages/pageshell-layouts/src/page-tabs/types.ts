/**
 * PageTabs Types
 *
 * @package @pageshell/layouts
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export type PageTabsVariant = 'pills' | 'underline' | 'boxed';
export type PageTabsOrientation = 'horizontal' | 'vertical';
export type PageTabsSize = 'sm' | 'md' | 'lg';

export interface PageTabProps {
  /** Unique tab identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Tab icon */
  icon?: IconProp;
  /** Badge count or text */
  badge?: string | number;
  /** Badge variant */
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Disabled state */
  disabled?: boolean;
  /** Tab content */
  children: ReactNode;
}

export interface PageTabsProps {
  /** Default active tab (uncontrolled) */
  defaultTab?: string;
  /** Active tab (controlled) */
  value?: string;
  /** Tab change handler */
  onChange?: (tabId: string) => void;
  /** Tab definitions */
  children: ReactNode;
  /** Visual variant */
  variant?: PageTabsVariant;
  /** Tab orientation */
  orientation?: PageTabsOrientation;
  /** Tab size */
  size?: PageTabsSize;
  /** Full width tabs */
  fullWidth?: boolean;
  /** Enable content animation */
  animated?: boolean;
  /** Lazy load tab content (only render when visited) */
  lazy?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Tab list CSS classes */
  tabListClassName?: string;
  /** Content CSS classes */
  contentClassName?: string;
}

export interface TabDefinition {
  id: string;
  label: string;
  icon?: IconProp;
  badge?: string | number;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  disabled?: boolean;
  content: ReactNode;
}
