/**
 * PageSection & PageHeading Types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Section Badge Types
// =============================================================================

/** Badge variant */
export type BadgeVariant = 'accent' | 'primary' | 'success' | 'warning' | 'destructive' | 'default';

/**
 * Section badge - simplified badge for section headings
 * Can be a count (number) or full badge config
 */
export type PageSectionBadge =
  | number
  | string
  | { value: number | string; variant?: BadgeVariant };

// =============================================================================
// Icon Color Types
// =============================================================================

export type IconColor = 'violet' | 'emerald' | 'amber' | 'blue' | 'cyan' | 'rose' | 'muted';

// =============================================================================
// Heading Types
// =============================================================================

/** Heading size variants */
export type HeadingSize = 'sm' | 'md' | 'lg';

/** Spacing variants for margins */
export type MarginBottom = 'none' | 'sm' | 'md' | 'lg';

export interface PageHeadingProps {
  /** Heading text (required) */
  title: string;
  /** Icon variant (e.g., 'trophy', 'star', 'book') */
  icon?: IconProp;
  /** Icon color variant */
  iconColor?: IconColor;
  /**
   * Badge to display after title
   * @example badge={5}
   * @example badge={{ value: 5, variant: 'accent' }}
   */
  badge?: PageSectionBadge;
  /** Content to display on the right side (e.g., "Page 1 of 5") */
  rightContent?: ReactNode;
  /** Heading size */
  size?: HeadingSize;
  /** Bottom margin spacing */
  marginBottom?: MarginBottom;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Section Types
// =============================================================================

/** Gap variants for content spacing */
export type ContentGap = 'none' | 'xs' | 'sm' | 'md' | 'lg';

export interface PageSectionProps {
  /** Section title */
  title?: string;
  /** Section description/subtitle */
  description?: string;
  /** Icon variant (e.g., 'settings', 'book', 'dashboard') */
  icon?: IconProp;
  /** Icon color variant */
  iconColor?: IconColor;
  /**
   * Badge to display after title (count or status indicator)
   * @example badge={5} // Shows "5"
   * @example badge={{ value: 5, variant: 'accent' }}
   */
  badge?: PageSectionBadge;
  /** Trailing content (action buttons, etc.) */
  trailing?: ReactNode;
  /** Section content */
  children: ReactNode;
  /** Gap between content items (wraps children in flex container) */
  contentGap?: ContentGap;
  /** Animation delay index (0-5) */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Accessible label (used when title is not provided) */
  ariaLabel?: string;
}
