/**
 * SplitPanelPage Types
 *
 * Type definitions for the SplitPanelPage composite.
 *
 * @module split-panel/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  EmptyStateConfig,
  SplitPanelAriaLabels,
} from '../shared/types';

// =============================================================================
// List Config
// =============================================================================

/**
 * List panel configuration
 */
export interface SplitPanelListConfig<TItem> {
  /** Data query */
  query: CompositeQueryResult<TItem[]>;
  /** Extract unique key from item */
  keyExtractor?: (item: TItem) => string;
  /** Render list item */
  renderItem: (item: TItem, isSelected: boolean) => ReactNode;
  /** Optional header */
  header?: ReactNode;
  /** Optional footer */
  footer?: ReactNode;
  /** Panel width */
  width?: 'sm' | 'md' | 'lg';
  /** Empty state config */
  emptyState?: EmptyStateConfig;
  /** Skeleton rows to show */
  skeletonRows?: number;
  /** Item href (for navigation) */
  itemHref?: string | ((item: TItem) => string);
}

// =============================================================================
// Main Config
// =============================================================================

/**
 * Main panel configuration
 */
export interface SplitPanelMainConfig<TDetail> {
  /** Data query for selected item */
  query?: CompositeQueryResult<TDetail>;
  /** Render main content */
  render: (data: TDetail | undefined) => ReactNode;
  /** Empty state when no selection */
  emptyState?: EmptyStateConfig;
  /** Custom skeleton */
  skeleton?: ReactNode;
}

// =============================================================================
// Context Config
// =============================================================================

/**
 * Context panel configuration
 */
export interface SplitPanelContextConfig<TDetail> {
  /** Enable context panel */
  enabled: boolean;
  /** Panel title */
  title?: string;
  /** Panel width */
  width?: 'sm' | 'md' | 'lg';
  /** Allow collapse */
  collapsible?: boolean;
  /** Start collapsed */
  defaultCollapsed?: boolean;
  /** Show only when detail is loaded */
  showOnlyWithDetail?: boolean;
  /** Render context content */
  render: (data: TDetail | undefined) => ReactNode;
}

// =============================================================================
// Slots
// =============================================================================

/**
 * SplitPanelPage slots for customization
 */
export interface SplitPanelPageSlots<TItem = unknown, TDetail = unknown> {
  /** Custom header */
  header?:
    | ReactNode
    | ((data: { items: TItem[]; detail: TDetail | undefined }) => ReactNode);
  /** Content before the split panels */
  beforePanels?: ReactNode;
  /** Content after the split panels */
  afterPanels?: ReactNode;
  /** Footer content */
  footer?:
    | ReactNode
    | ((data: { items: TItem[]; detail: TDetail | undefined }) => ReactNode);
}

// =============================================================================
// SplitPanelPage Props
// =============================================================================

/**
 * SplitPanelPage component props
 *
 * @template TItem - The item type in the list panel
 * @template TDetail - The detail type in the main panel
 */
export interface SplitPanelPageProps<TItem, TDetail = unknown>
  extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Page icon - accepts string name or ComponentType */
  icon?: IconProp;

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  /**
   * Currently selected item ID
   */
  selectedId: string | null;

  /**
   * Selection handler
   */
  onSelect: (id: string | null) => void;

  // ---------------------------------------------------------------------------
  // Panels
  // ---------------------------------------------------------------------------

  /**
   * List panel configuration
   */
  list: SplitPanelListConfig<TItem>;

  /**
   * Main panel configuration
   */
  main: SplitPanelMainConfig<TDetail>;

  /**
   * Context panel configuration (optional right panel)
   */
  context?: SplitPanelContextConfig<TDetail>;

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  /**
   * Minimum height
   * @default "600px"
   */
  minHeight?: string;

  /**
   * Stack panels on mobile
   * @default true
   */
  stackOnMobile?: boolean;

  /**
   * Mobile breakpoint in px
   * @default 768
   */
  mobileBreakpoint?: number;

  /**
   * Container variant for width control
   * @default 'shell' (full width)
   */
  containerVariant?: 'shell' | 'card';

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: SplitPanelPageSlots<TItem, TDetail>;

  // ---------------------------------------------------------------------------
  // i18n
  // ---------------------------------------------------------------------------

  /**
   * ARIA labels for accessibility i18n
   */
  ariaLabels?: SplitPanelAriaLabels;
}
