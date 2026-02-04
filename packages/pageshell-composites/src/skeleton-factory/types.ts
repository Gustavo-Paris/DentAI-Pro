/**
 * CardSkeletonFactory Types
 *
 * @module skeleton-factory/types
 */

/**
 * Card skeleton variant types
 */
export type CardSkeletonVariant = 'compact' | 'editorial' | 'avatar' | 'custom';

/**
 * Header section configuration
 */
export interface CardSkeletonHeaderConfig {
  /** Show icon placeholder */
  icon?: boolean;
  /** Icon size ('sm' | 'md' | 'lg') */
  iconSize?: 'sm' | 'md' | 'lg';
  /** Number of text lines in header */
  lines?: number;
  /** Width percentages for each line */
  lineWidths?: string[];
  /** Show badge placeholder */
  badge?: boolean;
}

/**
 * Content section configuration
 */
export interface CardSkeletonContentConfig {
  /** Number of content lines */
  lines?: number;
  /** Width percentages for each line */
  widths?: string[];
  /** Gap between lines */
  gap?: 'tight' | 'normal' | 'loose';
}

/**
 * Footer section configuration
 */
export interface CardSkeletonFooterConfig {
  /** Show action button placeholder */
  showAction?: boolean;
  /** Action button width */
  actionWidth?: string;
  /** Show price/stats section */
  showStats?: boolean;
  /** Number of stat items */
  statCount?: number;
}

/**
 * Image section configuration (for editorial cards)
 */
export interface CardSkeletonImageConfig {
  /** Aspect ratio */
  aspectRatio?: string;
  /** Show overlay badge */
  showBadge?: boolean;
}

/**
 * Complete card skeleton configuration
 */
export interface CardSkeletonConfig {
  /** Card variant */
  variant: CardSkeletonVariant;
  /** Header configuration */
  header?: CardSkeletonHeaderConfig;
  /** Content configuration */
  content?: CardSkeletonContentConfig;
  /** Footer configuration */
  footer?: CardSkeletonFooterConfig;
  /** Image configuration (editorial variant) */
  image?: CardSkeletonImageConfig;
  /** Whether the skeleton is responsive */
  responsive?: boolean;
  /** Animation delay in ms for staggered loading */
  animationDelay?: number;
}

/**
 * Props for CardSkeletonFactory output components
 */
export interface CardSkeletonProps {
  /** Animation delay index for staggered animations */
  index?: number;
  /** Additional className */
  className?: string;
}

/**
 * Preset configuration type
 */
export type CardSkeletonPreset =
  | 'brainstorm'
  | 'course'
  | 'mentor'
  | 'service'
  | 'package';
