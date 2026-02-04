/**
 * DashboardPage Types
 *
 * Type definitions for dashboard page composites.
 *
 * @module dashboard/types
 */

import type { ReactNode, ComponentType } from 'react';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  StatConfig,
  HeaderActionConfig,
  DashboardAriaLabels,
} from '../shared/types';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Module Configuration
// =============================================================================

/**
 * Dashboard module card configuration
 */
export interface ModuleConfig {
  /** Module ID */
  id: string;
  /** Module title */
  title: string;
  /** Module description */
  description?: string;
  /** Module icon */
  icon?: IconProp;
  /** Link href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Badge to show (e.g., notification count) */
  badge?: string | number;
  /** Whether module is disabled */
  disabled?: boolean;
  /** Visual variant for styling */
  variant?: 'default' | 'primary' | 'accent';
  /** Custom render function */
  render?: (data: unknown) => ReactNode;
}

// =============================================================================
// Quick Action Configuration
// =============================================================================

/**
 * Dashboard quick action configuration
 */
export interface QuickActionConfig {
  /** Action label */
  label: string;
  /** Action icon */
  icon?: IconProp;
  /** Link href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether action is featured (larger, primary color) */
  featured?: boolean;
  /** Variant style */
  variant?: 'default' | 'outline' | 'ghost';
}

// =============================================================================
// Breakdown Card Configuration
// =============================================================================

/**
 * Breakdown card item
 */
export interface BreakdownCardItem {
  /** Item label */
  label: string;
  /** Item value */
  value: number;
  /** Item color */
  color?: string;
}

/**
 * Dashboard breakdown card configuration
 */
export interface BreakdownCardConfig {
  /** Card ID */
  id: string;
  /** Card title */
  title: string;
  /** Data key to read from query data */
  dataKey?: string;
  /** Static items (alternative to dataKey) */
  items?: BreakdownCardItem[];
  /** Show percentages */
  showPercentage?: boolean;
}

// =============================================================================
// Hero Configuration
// =============================================================================

/**
 * Inline stat for hero section
 */
export interface HeroInlineStat {
  /** Stat icon */
  icon: IconProp;
  /** Key in data to get the value */
  valueKey: string;
  /** Stat label */
  label: string;
  /** Visual variant */
  variant?: 'default' | 'warning' | 'info' | 'success';
  /** Custom value formatter */
  format?: (value: unknown) => string | number;
}

/**
 * Hero section configuration with progress ring.
 * Uses the 'progress' variant of PageHero with PageCompletionRing.
 */
export interface HeroConfig {
  // Note: variant is always 'progress' for DashboardHero as it uses PageCompletionRing
  /** Title - can be string or function that receives (value, max) */
  title: string | ((value: number, max: number) => string);
  /** Subtitle - can be string or function that receives (value, max) */
  subtitle?: string | ((value: number, max: number) => string);
  /** Key in data for the current value */
  valueKey: string;
  /** Key in data for the maximum value */
  maxKey: string;
  /** Inline stats to display in hero */
  inlineStats?: HeroInlineStat[];
  /** Label for the progress ring */
  ringLabel?: string;
  /** Size of the progress ring */
  ringSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Style variant for the hero (matches PageHero styleVariant) */
  styleVariant?: 'achievements' | 'progress' | 'badges';
}

// =============================================================================
// Weekly Chart Configuration
// =============================================================================

/**
 * Bar configuration for weekly chart
 */
export interface WeeklyChartBarConfig {
  /** Key for day name in data item */
  dayKey?: string;
  /** Key for value in data item */
  valueKey?: string;
  /** Key for label in data item */
  labelKey?: string;
}

/**
 * Weekly activity chart configuration
 */
export interface WeeklyChartConfig {
  /** Section title */
  title: string;
  /** Key in data for the chart data array */
  dataKey: string;
  /** Bar configuration */
  bars?: WeeklyChartBarConfig;
  /** Whether to show total */
  showTotal?: boolean;
  /** Key in data for the total (if not calculated) */
  totalKey?: string;
  /** Label for the total */
  totalLabel?: string;
  /** Badge text (e.g., "This week") */
  badge?: string;
}

// =============================================================================
// Goals Configuration
// =============================================================================

/**
 * Individual goal configuration
 */
export interface GoalConfig {
  /** Unique ID */
  id: string;
  /** Goal title */
  title: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'streak' | 'accent';
  /** Key in data for the current value */
  valueKey: string;
  /** Key in data for the maximum value (or a static number as string) */
  maxKey?: string;
  /** Custom value formatter */
  format?: (value: number, max?: number) => string;
  /** Status text - can be string or function */
  status?: string | ((value: number, max: number) => string);
}

/**
 * Goals section configuration
 */
export interface GoalsConfig {
  /** Section title */
  title?: string;
  /** Icon for section header */
  icon?: IconProp;
  /** List of goals */
  items: GoalConfig[];
  /** Responsive column configuration */
  columns?: { sm?: number; md?: number; lg?: number };
}

// =============================================================================
// Dashboard Tab Configuration
// =============================================================================

/**
 * Dashboard tab configuration for tabbed dashboards
 */
export interface DashboardTab {
  /** Unique tab ID */
  id: string;
  /** Tab label */
  label: string;
  /** Tab icon */
  icon?: IconProp;
  /** Tab content */
  content: ReactNode;
}

// =============================================================================
// Multi-Query Support
// =============================================================================

/**
 * Multi-query configuration for dashboards with multiple data sources
 */
export type MultiQueryConfig<TQueries extends Record<string, unknown>> = {
  [K in keyof TQueries]: CompositeQueryResult<TQueries[K]>;
};

// =============================================================================
// Dashboard Slots
// =============================================================================

/**
 * DashboardPage slots for granular customization.
 * All slots support both static ReactNode and function (data) => ReactNode.
 */
export interface DashboardPageSlots<TData = unknown> {
  /** Custom header content (before header) */
  header?: ReactNode | ((data: TData) => ReactNode);
  /** Content after header (works in both tabbed and standard modes) */
  afterHeader?: ReactNode | ((data: TData) => ReactNode);
  /** Content after tabs (only rendered in tabbed mode) */
  afterTabs?: ReactNode | ((data: TData) => ReactNode);
  /** Content before stats */
  beforeStats?: ReactNode | ((data: TData) => ReactNode);
  /** Custom stats section */
  stats?: ReactNode | ((data: TData) => ReactNode);
  /** Content after stats */
  afterStats?: ReactNode | ((data: TData) => ReactNode);
  /** Content before breakdown cards */
  beforeBreakdown?: ReactNode | ((data: TData) => ReactNode);
  /** Custom breakdown section */
  breakdown?: ReactNode | ((data: TData) => ReactNode);
  /** Content after breakdown cards */
  afterBreakdown?: ReactNode | ((data: TData) => ReactNode);
  /** Content before modules */
  beforeModules?: ReactNode | ((data: TData) => ReactNode);
  /** Custom modules section */
  modules?: ReactNode | ((data: TData) => ReactNode);
  /** Content after modules */
  afterModules?: ReactNode | ((data: TData) => ReactNode);
  /** Footer content */
  footer?: ReactNode | ((data: TData) => ReactNode);
}

// =============================================================================
// DashboardPage Props
// =============================================================================

/**
 * Props for the DashboardPage composite
 */
export interface DashboardPageProps<
  TData = unknown,
  TQueries extends Record<string, unknown> = Record<string, unknown>,
> extends CompositeBaseProps {
  /**
   * Single query result for data fetching.
   */
  query?: CompositeQueryResult<TData>;

  /**
   * Multiple queries for dashboards with multiple data sources.
   * Each query is accessible via its key as prefix in valueKey paths.
   * Example: queries={{ main: mainQuery, weekly: weeklyQuery }}
   * Access: valueKey="main.stats.totalHours"
   */
  queries?: MultiQueryConfig<TQueries>;

  /**
   * Label displayed above the title.
   */
  label?: string;

  /**
   * Hero section configuration with progress ring.
   */
  hero?: HeroConfig;

  /**
   * Weekly activity chart configuration.
   */
  weeklyChart?: WeeklyChartConfig;

  /**
   * Goals section configuration.
   */
  goals?: GoalsConfig;

  /**
   * Stats to display at top.
   */
  stats?: StatConfig[];

  /**
   * Primary dashboard modules.
   */
  modules?: ModuleConfig[];

  /**
   * Secondary/smaller modules.
   */
  secondaryModules?: ModuleConfig[];

  /**
   * Quick action buttons.
   */
  quickActions?: QuickActionConfig[];

  /**
   * Breakdown cards with progress bars.
   */
  breakdownCards?: BreakdownCardConfig[];

  /**
   * Header action content (right side of header).
   */
  headerAction?: ReactNode;

  /**
   * Header actions array.
   */
  headerActions?: HeaderActionConfig[];

  /**
   * Date range configuration.
   */
  dateRange?: {
    start: Date;
    end: Date;
    onChange?: (start: Date, end: Date) => void;
    presets?: Array<{ label: string; start: Date; end: Date }>;
  };

  /**
   * Tabs configuration for tabbed dashboards.
   * When provided, renders content inside tabs instead of default layout.
   */
  tabs?: DashboardTab[];

  /**
   * Default tab ID when using tabs.
   * @default First tab's ID
   */
  defaultTab?: string;

  /**
   * Slot overrides for customization.
   */
  slots?: DashboardPageSlots<TData>;

  /**
   * Custom skeleton for loading state.
   */
  skeleton?: ReactNode;

  /**
   * Static content or render function.
   */
  children?: ReactNode | ((data: TData) => ReactNode);

  /**
   * Render function for data-driven content.
   */
  renderContent?: (data: TData) => ReactNode;

  /**
   * i18n-aware ARIA labels for accessibility.
   * Overrides default English labels with localized versions.
   * @see ADR-0062
   */
  ariaLabels?: DashboardAriaLabels;
}
