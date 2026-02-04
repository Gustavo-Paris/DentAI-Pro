/**
 * PageGrid Types
 *
 * @package @pageshell/layouts
 */

import type { ReactNode, ReactElement, ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export type PageGridColumns = 1 | 2 | 3 | 4 | 5 | 6;
export type PageGridGap = 2 | 3 | 4 | 5 | 6 | 8;

/**
 * Animation variant for grid items
 * - 'fade': Simple fade in (default)
 * - 'slide-up': Fade in with upward slide motion
 * - 'scale': Fade in with subtle scale effect
 * - 'none': No animation
 */
export type PageGridAnimation = 'fade' | 'slide-up' | 'scale' | 'none';

export interface PageGridResponsive {
  /** Columns at sm breakpoint (640px) */
  sm?: PageGridColumns;
  /** Columns at md breakpoint (768px) */
  md?: PageGridColumns;
  /** Columns at lg breakpoint (1024px) */
  lg?: PageGridColumns;
  /** Columns at xl breakpoint (1280px) */
  xl?: PageGridColumns;
  /** Columns at 2xl breakpoint (1536px) */
  '2xl'?: PageGridColumns;
}

/** Action config for empty state */
export interface PageGridActionConfig {
  /** Button label */
  label: string;
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  /** Icon variant */
  icon?: IconProp;
  /** Navigation href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

/** Action prop - config object, array, or ReactNode */
export type PageGridActionProp = PageGridActionConfig | PageGridActionConfig[] | ReactNode;

/**
 * Empty state configuration
 */
export interface PageGridEmptyState {
  /** Empty state title */
  title: string;
  /** Empty state description */
  description?: string;
  /** Optional icon - accepts Lucide icon component or React element */
  icon?: LucideIcon | ReactElement;
  /** Optional action - config object or ReactNode */
  action?: PageGridActionProp;
}

export interface PageGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Number of columns (fixed) */
  columns?: PageGridColumns;
  /** Responsive column configuration */
  responsive?: PageGridResponsive;
  /** Enable auto-fit columns based on minItemWidth */
  autoFit?: boolean;
  /** Minimum item width for auto-fit (in pixels) */
  minItemWidth?: number;
  /** Gap between items */
  gap?: PageGridGap;
  /** Enable staggered animation */
  animated?: boolean;
  /** Animation variant */
  animation?: PageGridAnimation;
  /** Maximum animation delay index (prevents too long delays) */
  maxAnimationDelay?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Number of skeleton items to show when loading */
  skeletonCount?: number;
  /** Skeleton component to render when loading */
  skeleton?: ReactNode;
  /** Empty state configuration */
  emptyState?: PageGridEmptyState;
  /** Custom key extractor function */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Enable column spanning for asymmetric layouts */
  allowColSpan?: boolean;
  /** Function to determine col-span for each item (requires allowColSpan=true) */
  getColSpan?: (item: T, index: number) => number;
  /** Additional CSS classes for the grid container */
  className?: string;
  /** Additional CSS classes for each item wrapper */
  itemClassName?: string;
  /** Accessible label for the grid (recommended for screen readers) */
  ariaLabel?: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom Link component for framework-agnostic routing */
  LinkComponent?: ComponentType<{
    href: string;
    children: ReactNode;
    className?: string;
  }>;
}
