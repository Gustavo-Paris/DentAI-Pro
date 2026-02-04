/**
 * Shared types and utilities for PageShell composites
 *
 * @module shared
 */

export type {
  // Router
  RouterAdapter,
  // Theme
  PageShellTheme,
  ThemeConfig,
  // Query
  CompositeQueryResult,
  // Base
  CompositeBaseProps,
  // Columns
  ValueFormat,
  ColumnConfig,
  // Filters
  FilterOption,
  FilterConfig,
  // Row Actions
  RowActionConfirm,
  RowActionConfig,
  RowActionsConfig,
  // Bulk Actions
  BulkActionConfig,
  BulkActionsConfig,
  // Stats
  StatConfig,
  // Pagination
  PaginationType,
  PaginationConfig,
  OffsetPaginationState,
  OffsetPaginationHandlers,
  OffsetPaginationConfig,
  // Shared Actions (Code Quality consolidation)
  ActionConfig,
  BaseStateProps,
  BaseEmptyStateProps,
  BaseErrorStateProps,
  // Empty State
  EmptyStateConfig,
  // Header Action
  HeaderActionConfig,
  // Form
  FormFieldType,
  FormFieldConfig,
  FormFieldOption,
  // Sections
  SectionConfig,
  // Tabs
  TabConfig,
  // Wizard
  WizardStepConfig,
  // Unified Field Types (for table + card consistency)
  ValueType,
  ValueEnum,
  ValueEnumOption,
  BadgeStyleConfig,
  CardSlot,
  FieldTableConfig,
  FieldCardConfig,
  FieldConfig,
  CardLayoutVariant,
  CardLayoutConfig,
  FieldsBySlot,
  ResolvedFieldValue,
  // ARIA Label Types (i18n for accessibility - ADR-0062)
  CommonAriaLabels,
  SplitPanelAriaLabels,
  DetailPageAriaLabels,
  CalendarAriaLabels,
  AnalyticsAriaLabels,
  WizardAriaLabels,
  ListAriaLabels,
  DashboardAriaLabels,
  SettingsAriaLabels,
  FormAriaLabels,
  // Skeleton Labels (ARIA accessibility)
  SkeletonLabels,
} from './types';

// ARIA Label defaults and resolvers (ADR-0062)
export {
  DEFAULT_COMMON_ARIA_LABELS,
  resolveCommonAriaLabels,
  DEFAULT_SPLIT_PANEL_ARIA_LABELS,
  resolveSplitPanelAriaLabels,
  DEFAULT_DETAIL_PAGE_ARIA_LABELS,
  resolveDetailPageAriaLabels,
  DEFAULT_CALENDAR_ARIA_LABELS,
  resolveCalendarAriaLabels,
  DEFAULT_ANALYTICS_ARIA_LABELS,
  resolveAnalyticsAriaLabels,
  DEFAULT_WIZARD_ARIA_LABELS,
  resolveWizardAriaLabels,
  DEFAULT_LIST_ARIA_LABELS,
  resolveListAriaLabels,
  DEFAULT_DASHBOARD_ARIA_LABELS,
  resolveDashboardAriaLabels,
  DEFAULT_SETTINGS_ARIA_LABELS,
  resolveSettingsAriaLabels,
  DEFAULT_FORM_ARIA_LABELS,
  resolveFormAriaLabels,
  // Skeleton labels (ARIA accessibility)
  DEFAULT_SKELETON_LABELS,
  resolveSkeletonLabels,
} from './types';

// Utility functions
export { getErrorMessage, resolveDescription } from './types';
export {
  // Common utilities
  cn,
  extractArrayFromData,
  extractTotalFromData,
  defaultKeyExtractor,
  // Label utilities
  createLabelResolver,
  // Deprecation utilities (runtime warnings)
  warnDeprecated,
  warnDeprecatedProp,
  wrapDeprecatedComposite,
} from './utils';

// Layout wrapper
export { PageLayout } from './PageLayout';
export type { PageLayoutProps, ContainerVariant } from './PageLayout';

// Generic State Components (Code Quality consolidation)
export {
  GenericEmptyState,
  GenericErrorState,
  GenericSkeleton,
  PresetSkeleton,
  // Skeleton building blocks (core)
  HeaderSkeleton,
  FiltersSkeleton,
  PaginationSkeleton,
  TableSkeleton,
  CardSkeleton,
  FormFieldSkeleton,
  StatCardSkeleton,
  // Skeleton building blocks (additional)
  SectionSkeleton,
  ModuleCardSkeleton,
  TabsSkeleton,
  ListItemSkeleton,
  CalendarGridSkeleton,
} from './components';
export type {
  GenericEmptyStateProps,
  EmptyStateVariant,
  EmptyStateSize,
  AriaLive,
  GenericErrorStateProps,
  ErrorStateVariant,
  ErrorStateSize,
  GenericSkeletonProps,
  SkeletonPattern,
  ListSkeletonProps,
  CardGridSkeletonProps,
  FormSkeletonProps,
  StatsSkeletonProps,
  CustomSkeletonProps,
  // Preset skeleton types
  SkeletonPreset,
  PresetSkeletonProps,
  DetailPagePresetProps,
  DashboardPagePresetProps,
  ConfigPagePresetProps,
  CalendarPagePresetProps,
  SplitPanelPresetProps,
  TabbedListPresetProps,
} from './components';

// Shared Defaults (Code Quality consolidation)
export {
  COMPOSITE_DEFAULTS,
  EMPTY_STATE_DEFAULTS,
  ERROR_STATE_DEFAULTS,
  FORM_DEFAULTS,
  LIST_DEFAULTS,
  CARD_LIST_DEFAULTS,
  SKELETON_DEFAULTS,
  PAGINATION_DEFAULTS,
  DIALOG_DEFAULTS,
} from './defaults';

// Shared Styles (Code Quality consolidation)
export {
  CONTAINER_CLASSES,
  CARD_CONTAINER_CLASSES,
  HEADER_SECTION_CLASSES,
  CONTENT_SECTION_CLASSES,
  PAGE_CONTAINER_CLASSES,
} from './styles';

// Shared Hooks (Code Quality consolidation)
export {
  useConfirmDialog,
  type ConfirmDialogConfig,
  type ConfirmDialogState,
  type UseConfirmDialogReturn,
} from './hooks';
