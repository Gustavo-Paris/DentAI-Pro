/**
 * PageTimeline Types
 *
 * @package @pageshell/layouts
 */

import type { ReactNode, ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

/** Timeline variant */
export type PageTimelineVariant = 'default' | 'compact' | 'detailed';

/** Date grouping options */
export type PageTimelineGroupBy = 'day' | 'week' | 'month' | 'none';

/** Icon color variants */
export type PageTimelineIconColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

/** Avatar configuration */
export interface PageTimelineAvatar {
  src?: string;
  alt: string;
  fallback?: string;
}

/** Action configuration */
export interface TimelineActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'primary' | 'outline' | 'ghost';
}

/** Action prop - config or ReactNode */
export type TimelineActionProp = TimelineActionConfig | ReactNode;

/**
 * Empty state configuration
 */
export interface PageTimelineEmptyState {
  title: string;
  description?: string;
  icon?: LucideIcon | ReactElement;
  /** Optional action - config object or ReactNode */
  action?: TimelineActionProp;
}

/**
 * PageTimeline component props
 */
export interface PageTimelineProps<T> {
  /** Timeline items */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Key extractor function */
  keyExtractor?: (item: T, index: number) => string;
  /** Date extractor for grouping */
  dateExtractor?: (item: T) => Date;

  // Grouping
  /** Group items by date */
  groupBy?: PageTimelineGroupBy;

  // Layout
  /** Visual variant */
  variant?: PageTimelineVariant;
  /** Enable animations */
  animated?: boolean;
  /** Maximum animation delay index */
  maxAnimationDelay?: number;

  // Load more
  /** Has more items to load */
  hasMore?: boolean;
  /** Loading more state */
  isLoadingMore?: boolean;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Load more button text */
  loadMoreText?: string;

  // States
  /** Loading state */
  isLoading?: boolean;
  /** Custom skeleton */
  skeleton?: ReactNode;
  /** Number of skeleton items */
  skeletonCount?: number;
  /** Empty state configuration */
  emptyState?: PageTimelineEmptyState;

  // Accessibility
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageTimeline.Item component props
 */
export interface PageTimelineItemProps {
  /** Item icon */
  icon?: LucideIcon;
  /** Icon color variant */
  iconColor?: PageTimelineIconColor;
  /** Item avatar (alternative to icon) */
  avatar?: PageTimelineAvatar;
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** Timestamp */
  timestamp: string | Date;
  /** Additional content */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}
