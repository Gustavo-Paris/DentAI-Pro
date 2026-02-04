/**
 * Unified Field Configuration Types
 *
 * Defines field configuration that works for both table and card views.
 * Inspired by Ant Design ProComponents valueType/valueEnum pattern.
 *
 * @module shared/types/field
 */

import type { ReactNode } from 'react';

// =============================================================================
// Value Types (automatic formatting)
// =============================================================================

/**
 * Value type determines automatic formatting
 */
export type ValueType =
  | 'text'           // Plain text (default)
  | 'number'         // Formatted number
  | 'currency'       // Currency (R$ 1.234,56)
  | 'percent'        // Percentage (75%)
  | 'date'           // Date (01/01/2026)
  | 'dateTime'       // Date + time
  | 'relativeTime'   // Relative (há 5 dias)
  | 'boolean'        // Yes/No
  | 'badge'          // Status badge with colors
  | 'tag'            // Single tag
  | 'tags'           // Multiple tags
  | 'avatar'         // Avatar image
  | 'image'          // Image
  | 'link'           // Clickable link
  | 'email'          // Email link
  | 'phone'          // Phone link
  | 'progress'       // Progress bar
  | 'rating'         // Star rating
  | 'custom';        // Custom render

// =============================================================================
// Value Enum (for badge/select fields)
// =============================================================================

/**
 * Single enum option configuration
 */
export interface ValueEnumOption {
  /** Display text */
  text: string;
  /** Status variant for badges */
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Color (alternative to status) */
  color?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Value enum mapping (value -> display config)
 */
export type ValueEnum = Record<string, ValueEnumOption | string>;

// =============================================================================
// Card Slots
// =============================================================================

/**
 * Card slot determines where field appears in card layout
 */
export type CardSlot =
  | 'title'          // Card title (primary text)
  | 'subtitle'       // Card subtitle
  | 'description'    // Card description
  | 'badge'          // Status badge (top right)
  | 'avatar'         // Avatar/image slot
  | 'meta'           // Metadata row (icons + text)
  | 'footer'         // Footer area
  | 'action'         // Action area
  | 'collapsible'    // Collapsible content section (ADR-0058)
  | 'media'          // Media slot for thumbnails (ADR-0059)
  | 'content'        // Content slot for progress bars etc (ADR-0059)
  | 'hidden';        // Don't show in card

// =============================================================================
// Field Configuration
// =============================================================================

/**
 * Table-specific field configuration
 */
export interface FieldTableConfig {
  /** Column width */
  width?: string | number;
  /** Sortable */
  sortable?: boolean;
  /** Hidden on mobile */
  hiddenOnMobile?: boolean;
  /** Fixed position */
  fixed?: 'left' | 'right';
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom cell className */
  className?: string;
  /** Max lines for text truncation (applies line-clamp in table) */
  maxLines?: number;
}

// =============================================================================
// Card Feature Configurations (ADR-0058)
// =============================================================================

/**
 * Tags overflow configuration
 * @see ADR-0058 - ListPageCard Feature Evolution
 */
export interface TagsOverflowConfig {
  /** Max visible tags before "+N" */
  maxVisible: number;
  /** Show remaining tags in tooltip (default: true) */
  showTooltip?: boolean;
}

/**
 * Custom badge style configuration
 * Allows dynamic styling per value (e.g., different colors for different statuses)
 * @see ADR-0058 - ListPageCard Feature Evolution
 */
export interface BadgeStyleConfig {
  /** Background class (e.g., 'bg-emerald-500/10') */
  bgClass?: string;
  /** Text class (e.g., 'text-emerald-400') */
  textClass?: string;
  /** Border class (e.g., 'border-emerald-500/20') */
  borderClass?: string;
  /** Icon (emoji like '🌟' or icon name like 'star') */
  icon?: string;
}

/**
 * Collapsible content configuration
 * @see ADR-0058 - ListPageCard Feature Evolution
 */
export interface CollapsibleConfig {
  /** Label shown when content is collapsed (click to expand) */
  openLabel: string;
  /** Label shown when content is expanded (click to collapse) */
  closeLabel: string;
  /** Start with content expanded */
  defaultOpen?: boolean;
  /** Icon when collapsed (default: 'chevron-down') */
  openIcon?: string;
  /** Icon when expanded (default: 'chevron-up') */
  closeIcon?: string;
}

/**
 * Media slot configuration for image thumbnails
 * @see ADR-0059 - ListPage Native Card Enhancements
 */
export interface MediaConfig {
  /** Aspect ratio: 'video' (16:9), 'square', '4/3', '3/2', 'auto' */
  aspectRatio?: 'video' | 'square' | '4/3' | '3/2' | '16/9' | 'auto';

  /** Enable hover zoom effect (default: false) */
  hoverZoom?: boolean;

  /** Object fit: 'cover' (default), 'contain', 'fill' */
  objectFit?: 'cover' | 'contain' | 'fill';

  /** Border radius: 'none', 'sm', 'md', 'lg', 'top' (default) */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'top';

  /** Overlay badge on media (uses badge slot field) */
  badgeOverlay?: boolean;

  /** Badge overlay position */
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

  /** Fallback when no image: 'icon', 'none' (default) */
  fallback?: 'icon' | 'none';

  /** Fallback icon name (when fallback is 'icon') */
  fallbackIcon?: string;
}

/**
 * Progress bar configuration
 * @see ADR-0059 - ListPage Native Card Enhancements
 */
export interface ProgressConfig {
  /** Show label above progress bar (default: true) */
  showLabel?: boolean;

  /** Label text (overrides field.label) */
  label?: string;

  /** Show value percentage (default: true) */
  showValue?: boolean;

  /** Progress bar height: 'xs', 'sm' (default), 'md' */
  size?: 'xs' | 'sm' | 'md';
}

/**
 * Card-specific field configuration
 */
export interface FieldCardConfig<TRow = unknown> {
  /** Card slot to render in */
  slot?: CardSlot;
  /** Icon to show with value (for meta slot) */
  icon?: string;
  /** Custom className */
  className?: string;
  /** Truncate text */
  truncate?: boolean | number;
  /** Hide label, show only value */
  hideLabel?: boolean;

  // ==========================================================================
  // ADR-0058: New Features
  // ==========================================================================

  /**
   * Tags overflow configuration (for valueType: 'tags')
   * Shows max N tags with "+X" overflow indicator
   * @see ADR-0058
   */
  tagsOverflow?: TagsOverflowConfig;

  /**
   * Custom badge styling per value (for valueType: 'badge')
   * Enables custom bgClass/textClass instead of default StatusBadge
   * @see ADR-0058
   */
  badgeStyle?: (value: unknown, item: TRow) => BadgeStyleConfig | undefined;

  /**
   * Collapsible content configuration (for cardSlot: 'collapsible')
   * @see ADR-0058
   */
  collapsible?: CollapsibleConfig;

  // ==========================================================================
  // ADR-0059: Native Card Enhancements
  // ==========================================================================

  /**
   * Media configuration (for cardSlot: 'media')
   * Enables thumbnail images with aspect ratio, hover zoom, and badge overlay
   * @see ADR-0059
   */
  media?: MediaConfig;

  /**
   * Progress bar configuration (for valueType: 'progress')
   * @see ADR-0059
   */
  progress?: ProgressConfig;

  /**
   * Conditional rendering - return false to hide field in card view
   * @see ADR-0059
   *
   * @example
   * ```tsx
   * showWhen: (item) => item.status !== 'published'
   * ```
   */
  showWhen?: (item: TRow) => boolean;
}

/**
 * Unified field configuration
 *
 * @example Basic text field
 * ```tsx
 * { key: 'name', label: 'Nome' }
 * ```
 *
 * @example Status badge field
 * ```tsx
 * {
 *   key: 'status',
 *   label: 'Status',
 *   valueType: 'badge',
 *   valueEnum: {
 *     draft: { text: 'Rascunho', status: 'default' },
 *     active: { text: 'Ativo', status: 'success' },
 *   },
 *   cardSlot: 'badge',
 * }
 * ```
 *
 * @example Date field
 * ```tsx
 * {
 *   key: 'updatedAt',
 *   label: 'Atualizado',
 *   valueType: 'relativeTime',
 *   cardSlot: 'footer',
 *   tableConfig: { sortable: true },
 * }
 * ```
 */
/**
 * Skeleton variant for conditional skeleton rendering
 * @see ADR-0058
 */
export type SkeletonVariant = 'text' | 'badge' | 'avatar' | 'tags' | 'title' | 'description';

export interface FieldConfig<TRow = Record<string, unknown>> {
  /** Field key (supports dot notation: 'user.name') */
  key: string;

  /** Display label */
  label?: string;

  /** Test ID for automated testing */
  testId?: string;

  /** Value type for automatic formatting */
  valueType?: ValueType;

  /** Value enum for badge/select fields */
  valueEnum?: ValueEnum;

  /** Card slot (shorthand for cardConfig.slot) */
  cardSlot?: CardSlot;

  /** Table-specific configuration */
  tableConfig?: FieldTableConfig;

  /** Card-specific configuration */
  cardConfig?: FieldCardConfig<TRow>;

  /** Custom render function (overrides valueType) */
  render?: (row: TRow, value: unknown) => ReactNode;

  /** Custom render for card view only */
  renderCard?: (row: TRow, value: unknown) => ReactNode;

  /** Custom render for table view only */
  renderTable?: (row: TRow, value: unknown) => ReactNode;

  /** Hide this field entirely */
  hidden?: boolean | ((row: TRow) => boolean);

  /** Tooltip text */
  tooltip?: string;

  /** Copy button */
  copyable?: boolean;

  /** Ellipsis for long text */
  ellipsis?: boolean | { rows?: number };

  // ==========================================================================
  // ADR-0058: New Features
  // ==========================================================================

  /**
   * Show skeleton instead of value when condition is true
   * Useful for fields that load asynchronously (e.g., AI extraction)
   * @see ADR-0058
   *
   * @example
   * ```tsx
   * showSkeletonWhen: (item) =>
   *   item.extractionStatus === 'extracting' && !item.title
   * ```
   */
  showSkeletonWhen?: (row: TRow) => boolean;

  /**
   * Skeleton variant for this field (auto-inferred if not provided)
   * @see ADR-0058
   */
  skeletonVariant?: SkeletonVariant;
}

// =============================================================================
// Card Layout Configuration
// =============================================================================

/**
 * Predefined card layout variants
 */
export type CardLayoutVariant =
  | 'standard'      // Title, description, meta, footer
  | 'compact'       // Title + badge only
  | 'media'         // Image/avatar prominent
  | 'horizontal'    // Side-by-side layout
  | 'detailed';     // All fields visible

/**
 * Footer action button configuration
 * @see ADR-0058 - ListPageCard Feature Evolution
 * @see ADR-0059 - Added href support and made onClick optional
 */
export interface FooterActionConfig<TRow = unknown> {
  /** Button label */
  label: string;
  /** Icon name (from PageIcon registry) */
  icon?: string;
  /** Click handler (optional if href is provided) */
  onClick?: (item: TRow) => void;
  /**
   * Navigation href (alternative to onClick)
   * Can be string with :key placeholders or function
   * @see ADR-0059
   */
  href?: string | ((item: TRow) => string);
  /** Disable condition */
  disabledWhen?: (item: TRow) => boolean;
  /** Show condition (default: always show) */
  showWhen?: (item: TRow) => boolean;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
  /** Custom className */
  className?: string;
}

/**
 * Footer action can be static config OR function returning config per item
 * @see ADR-0059 - ListPage Native Card Enhancements
 *
 * @example Static config
 * ```tsx
 * footerAction: {
 *   label: 'Preview',
 *   icon: 'eye',
 *   href: '/courses/:id/preview',
 * }
 * ```
 *
 * @example Dynamic per-item config
 * ```tsx
 * footerAction: (item) => item.status === 'draft'
 *   ? { label: 'Complete', icon: 'sparkles', href: `/courses/${item.id}` }
 *   : { label: 'Preview', icon: 'eye', href: `/courses/${item.id}/preview` }
 * ```
 */
export type FooterActionProp<TRow = unknown> =
  | FooterActionConfig<TRow>
  | ((item: TRow) => FooterActionConfig<TRow> | null | undefined);

/**
 * Card layout configuration
 */
export interface CardLayoutConfig<TRow = unknown> {
  /** Predefined layout variant */
  variant?: CardLayoutVariant;

  /** Show card actions menu */
  showActions?: boolean;

  /** Card click behavior */
  clickable?: boolean;

  /** Hover effect */
  hoverable?: boolean;

  /** Custom card className */
  className?: string;

  /** Avatar/image size */
  avatarSize?: 'sm' | 'md' | 'lg';

  /** Badge position */
  badgePosition?: 'top-right' | 'top-left' | 'inline';

  // ==========================================================================
  // ADR-0058 & ADR-0059: Footer Action
  // ==========================================================================

  /**
   * Footer action button (appears alongside footer fields)
   * Can be static config or function returning config per item
   * @see ADR-0058 - Initial feature
   * @see ADR-0059 - Added function form and href support
   *
   * @example Static config
   * ```tsx
   * footerAction: {
   *   label: 'Create Brainstorm',
   *   icon: 'arrow-right',
   *   onClick: (item) => convertMutation.mutate({ id: item.id }),
   * }
   * ```
   *
   * @example Dynamic per-item config
   * ```tsx
   * footerAction: (item) => item.status === 'draft'
   *   ? { label: 'Complete', icon: 'sparkles', href: `/courses/${item.id}` }
   *   : { label: 'Preview', icon: 'eye', href: `/courses/${item.id}/preview` }
   * ```
   */
  footerAction?: FooterActionProp<TRow>;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extract card slot fields from field config array
 */
export type FieldsBySlot<TRow = Record<string, unknown>> = {
  [K in CardSlot]?: FieldConfig<TRow>[];
};

/**
 * Resolved field value with formatting applied
 */
export interface ResolvedFieldValue {
  /** Raw value */
  raw: unknown;
  /** Formatted display value */
  formatted: string | ReactNode;
  /** Value enum option (if applicable) */
  enumOption?: ValueEnumOption;
}
