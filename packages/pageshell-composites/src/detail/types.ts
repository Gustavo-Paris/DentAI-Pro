/**
 * DetailPage Types
 *
 * Type definitions for detail/view page composites.
 *
 * @module detail/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  SectionConfig,
  TabConfig,
  HeaderActionConfig,
  DetailPageLabels,
} from '../shared/types';

// =============================================================================
// Badge
// =============================================================================

/**
 * Badge configuration for DetailPage header.
 * Supports both `text` and `label` for compatibility.
 */
export type DetailPageBadge = {
  /** Badge variant */
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
} & (
  | { text: string; label?: string }
  | { text?: string; label: string }
);

// =============================================================================
// Footer Action
// =============================================================================

/**
 * Footer action button variant
 */
export type FooterActionVariant = 'default' | 'outline' | 'destructive' | 'ghost' | 'primary';

/**
 * Footer action configuration
 */
export interface FooterActionConfig<T = unknown> {
  /** Button label */
  label: string;
  /** Button icon */
  icon?: IconProp;
  /** Button variant */
  variant?: FooterActionVariant;
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Condition to show action */
  showWhen?: (data: T) => boolean;
}

// =============================================================================
// Quick Action
// =============================================================================

/**
 * Quick action configuration
 */
export interface QuickActionConfig {
  /** Action label */
  label: string;
  /** Action icon */
  icon?: IconProp;
  /** Click handler or href */
  onClick?: () => void;
  href?: string;
  /** Variant */
  variant?: 'default' | 'outline' | 'ghost';
}

// =============================================================================
// Slots
// =============================================================================

/**
 * DetailPage slots for granular customization
 */
export interface DetailPageSlots<T = unknown> {
  /** Custom header content */
  header?: ReactNode | ((data: T) => ReactNode);
  /** Content before quick actions */
  beforeQuickActions?: ReactNode;
  /** Content after quick actions */
  afterQuickActions?: ReactNode;
  /** Content before tabs/sections */
  beforeContent?: ReactNode;
  /** Content after tabs/sections */
  afterContent?: ReactNode;
  /** Content before footer actions */
  beforeFooter?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
}

// =============================================================================
// DetailPage Props
// =============================================================================

/**
 * Props for the DetailPage composite
 */
export interface DetailPageProps<TData = unknown> extends Omit<CompositeBaseProps, 'title' | 'description'> {
  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------

  /**
   * Page title - can be a string or function that receives data
   */
  title: string | ((data: TData) => string);

  /**
   * Page description - can be a string or function
   */
  description?: string | ((data: TData) => string);

  /**
   * Label above title
   */
  label?: string;

  /**
   * Badge in header
   */
  badge?: DetailPageBadge | ((data: TData) => DetailPageBadge);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Back button href
   */
  backHref?: string;

  /**
   * Back button label.
   * If not provided, uses labels.back (defaults to 'Back').
   */
  backLabel?: string;

  /**
   * Breadcrumbs
   */
  breadcrumbs?: Array<{ label: string; href?: string }>;

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  /**
   * Query result for data fetching
   */
  query: CompositeQueryResult<TData>;

  /**
   * Custom skeleton for loading state
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // Content Structure
  // ---------------------------------------------------------------------------

  /**
   * Sections to display
   */
  sections?: SectionConfig[];

  /**
   * Tabs for tabbed layout (takes precedence over sections)
   */
  tabs?: TabConfig[];

  /**
   * Default active tab ID
   */
  defaultTab?: string;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Header action button
   */
  headerAction?: HeaderActionConfig | ReactNode;

  /**
   * Header actions (multiple)
   */
  headerActions?: HeaderActionConfig[];

  /**
   * Quick actions
   */
  quickActions?: QuickActionConfig[];

  /**
   * Footer actions
   */
  footerActions?: FooterActionConfig<TData>[];

  /**
   * Make footer actions sticky on mobile
   * @default false
   */
  stickyFooter?: boolean;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: DetailPageSlots<TData>;

  // ---------------------------------------------------------------------------
  // Children
  // ---------------------------------------------------------------------------

  /**
   * Content render function (alternative to sections/tabs)
   */
  children?: (data: TData) => ReactNode;

  // ---------------------------------------------------------------------------
  // i18n Labels
  // ---------------------------------------------------------------------------

  /**
   * i18n labels for DetailPage.
   * All labels have English defaults.
   */
  labels?: DetailPageLabels;
}
