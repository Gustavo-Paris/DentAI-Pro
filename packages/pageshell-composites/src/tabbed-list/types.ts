/**
 * TabbedListPage Types
 *
 * Type definitions for the TabbedListPage composite.
 *
 * @module tabbed-list/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  ContainerWrapperVariant,
  EmptyStateConfig,
} from '../shared/types';

// =============================================================================
// Tab Configuration
// =============================================================================

/**
 * Tab configuration for TabbedListPage
 */
export interface TabbedListTab<TItem> {
  /** Unique tab identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Tab icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Filter function (if not provided, shows all items) */
  filter?: (item: TItem) => boolean;
  /** Badge variant */
  badgeVariant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'destructive'
    | 'success'
    | 'warning';
  /** Show badge with count */
  showBadge?: boolean;
}

// =============================================================================
// Group Configuration
// =============================================================================

/**
 * Group configuration for TabbedListPage
 */
export interface TabbedListGroupConfig<TItem> {
  /** Group items by key */
  groupBy: (item: TItem) => string;
  /** Group labels map */
  groupLabels?: Record<string, string>;
  /** Group order */
  groupOrder?: string[];
}

// =============================================================================
// Slots Configuration
// =============================================================================

/**
 * Slots for TabbedListPage customization
 */
export interface TabbedListSlots<TData> {
  /** Custom header content */
  header?: ReactNode | ((data: TData) => ReactNode);
  /** Content before tabs */
  beforeTabs?: ReactNode;
  /** Content after tabs */
  afterTabs?: ReactNode;
  /** Content before list */
  beforeList?: ReactNode;
  /** Content after list */
  afterList?: ReactNode;
  /** Footer content */
  footer?: ReactNode | ((data: TData) => ReactNode);
}

// =============================================================================
// TabbedListPage Props
// =============================================================================

/**
 * TabbedListPage component props
 *
 * @template TData - The query data type
 * @template TItem - The item type in the list
 */
export interface TabbedListPageProps<
  TData = unknown,
  TItem = Record<string, unknown>,
> extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;
  /** Page label (above title) */
  label?: string;

  // ---------------------------------------------------------------------------
  // Data Source
  // ---------------------------------------------------------------------------

  /**
   * Query result (tRPC, React Query, SWR compatible)
   */
  query: CompositeQueryResult<TData>;

  /**
   * Extract items from query data
   * @default Auto-detect from data[] or data.items
   */
  getItems?: (data: TData) => TItem[];

  /**
   * Key extractor for list rendering
   * @default (item) => item.id
   */
  keyExtractor?: (item: TItem) => string;

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  /**
   * Tab configurations
   */
  tabs: TabbedListTab<TItem>[];

  /**
   * Default tab ID
   */
  defaultTab?: string;

  /**
   * Controlled active tab
   */
  activeTab?: string;

  /**
   * Tab change handler
   */
  onTabChange?: (tabId: string) => void;

  /**
   * Tab list className
   */
  tabListClassName?: string;

  // ---------------------------------------------------------------------------
  // Grouping
  // ---------------------------------------------------------------------------

  /**
   * Group items by key
   */
  groupBy?: (item: TItem) => string;

  /**
   * Group labels map
   */
  groupLabels?: Record<string, string>;

  /**
   * Group order
   */
  groupOrder?: string[];

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /**
   * Render list item
   */
  renderItem: (item: TItem, index: number) => ReactNode;

  /**
   * Render group header
   */
  renderGroupHeader?: (
    groupKey: string,
    label: string,
    items: TItem[]
  ) => ReactNode;

  /**
   * Item href for navigation (supports :param interpolation)
   */
  itemHref?: string | ((item: TItem) => string);

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------

  /**
   * Header action button
   */
  headerAction?: ReactNode | ((data: TData) => ReactNode);

  // ---------------------------------------------------------------------------
  // Empty States
  // ---------------------------------------------------------------------------

  /**
   * Empty state configuration (no data)
   */
  emptyState?: EmptyStateConfig;

  /**
   * Empty state for filtered results
   */
  emptyFilteredState?: {
    title: string;
    description?: string;
    icon?: ReactNode;
  };

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  /**
   * Custom skeleton component
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  /**
   * Container variant - controls wrapper styling
   * - 'shell': Matches PageShell layout (default per ADR-0102)
   * - 'card': Card-like container with background
   * @default 'shell'
   */
  containerVariant?: ContainerWrapperVariant;

  /**
   * Wrap items in Card
   */
  wrapInCard?: boolean;

  /**
   * Card variant
   */
  cardVariant?: 'default' | 'outline';

  /**
   * List className
   */
  listClassName?: string;

  /**
   * Group className
   */
  groupClassName?: string;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides for customization
   */
  slots?: TabbedListSlots<TData>;
}

