/**
 * PageShell Composites - Shared Types
 *
 * Re-exports all domain-specific type modules for backward compatibility.
 * Import from here or directly from domain files.
 *
 * @module shared/types
 */

// =============================================================================
// Router Types
// =============================================================================
export type { RouterAdapter } from './router.types';

// =============================================================================
// Theme Types
// =============================================================================
export type { PageShellTheme, ThemeConfig } from './theme.types';

// =============================================================================
// Query Types
// =============================================================================
export type { CompositeQueryResult } from './query.types';
export { getErrorMessage, resolveDescription } from './query.types';

// =============================================================================
// Base Types
// =============================================================================
export type { CompositeBaseProps, ContainerWrapperVariant, ContainerVariant } from './base.types';

// =============================================================================
// Column Types
// =============================================================================
export type { ValueFormat, ColumnConfig } from './column.types';

// =============================================================================
// Filter Types
// =============================================================================
export type { FilterOption, FilterConfig, CardFilterRenderMode } from './filter.types';

// =============================================================================
// Action Types
// =============================================================================
export type {
  RowActionConfirm,
  RowActionConfig,
  RowActionsConfig,
  BulkActionConfig,
  BulkActionsConfig,
} from './action.types';

// =============================================================================
// Unified Action Types (ListPage Unified API)
// =============================================================================
export type {
  UnifiedActionConfirm,
  UnifiedActionConfig,
  UnifiedActionsConfig,
  ActionVisibility,
} from './unified-action.types';

// =============================================================================
// Unified Sort Types (ListPage Unified API)
// =============================================================================
export type {
  SortDirection,
  UnifiedSortOption,
  UnifiedSortConfig,
} from './unified-sort.types';

// =============================================================================
// Stat Types
// =============================================================================
export type { StatConfig } from './stat.types';

// =============================================================================
// Pagination Types
// =============================================================================
export type {
  PaginationType,
  PaginationConfig,
  OffsetPaginationState,
  OffsetPaginationHandlers,
  OffsetPaginationConfig,
} from './pagination.types';

// =============================================================================
// State Types
// =============================================================================
export type {
  ActionConfig,
  BaseStateProps,
  BaseEmptyStateProps,
  BaseErrorStateProps,
  EmptyStateConfig,
} from './state.types';

// =============================================================================
// Header Types
// =============================================================================
export type { HeaderActionConfig } from './header.types';

// =============================================================================
// Form Field Types
// =============================================================================
export type { FormFieldType, FormFieldConfig, FormFieldOption } from './form-field.types';

// =============================================================================
// Section Types
// =============================================================================
export type { SectionConfig, TabConfig, WizardStepConfig } from './section.types';

// =============================================================================
// Field Types (Unified field configuration for table + card views)
// =============================================================================
export type {
  ValueType,
  ValueEnum,
  ValueEnumOption,
  CardSlot,
  FieldTableConfig,
  FieldCardConfig,
  FieldConfig,
  CardLayoutVariant,
  CardLayoutConfig,
  FieldsBySlot,
  ResolvedFieldValue,
  // ADR-0058: New types for ListPageCard evolution
  TagsOverflowConfig,
  BadgeStyleConfig,
  CollapsibleConfig,
  FooterActionConfig,
  SkeletonVariant,
  // ADR-0059: Native card enhancements
  MediaConfig,
  ProgressConfig,
  FooterActionProp,
} from './field.types';

// =============================================================================
// Label Types (i18n)
// =============================================================================
export type {
  // Shared labels
  ActionLabels,
  LoadingLabels,
  ErrorLabels,
  // List Page labels
  SearchLabels,
  PaginationLabels,
  SelectionLabels,
  NavigationLabels,
  EmptyStateLabels,
  ListPageLabels,
  // Composite-specific labels
  FormLabels,
  DetailPageLabels,
  WizardLabels,
  ConfigLabels,
  InfiniteCardListLabels,
  CalendarLabels,
  ExtractionLabels,
  LinearFlowLabels,
  CardSettingsLabels,
  SplitPanelLabels,
  // Skeleton labels (ARIA accessibility)
  SkeletonLabels,
} from './labels.types';
export {
  // Shared defaults
  DEFAULT_ACTION_LABELS,
  DEFAULT_LOADING_LABELS,
  DEFAULT_ERROR_LABELS,
  // ListPage
  DEFAULT_LIST_PAGE_LABELS,
  resolveLabels,
  // Form
  DEFAULT_FORM_LABELS,
  resolveFormLabels,
  // Detail
  DEFAULT_DETAIL_PAGE_LABELS,
  resolveDetailPageLabels,
  // Wizard
  DEFAULT_WIZARD_LABELS,
  resolveWizardLabels,
  // Config
  DEFAULT_CONFIG_LABELS,
  resolveConfigLabels,
  // Infinite Card List
  DEFAULT_INFINITE_CARD_LIST_LABELS,
  resolveInfiniteCardListLabels,
  // Calendar
  DEFAULT_CALENDAR_LABELS,
  resolveCalendarLabels,
  // Extraction
  DEFAULT_EXTRACTION_LABELS,
  resolveExtractionLabels,
  // Linear Flow
  DEFAULT_LINEAR_FLOW_LABELS,
  resolveLinearFlowLabels,
  // Card Settings
  DEFAULT_CARD_SETTINGS_LABELS,
  resolveCardSettingsLabels,
  // Split Panel
  DEFAULT_SPLIT_PANEL_LABELS,
  resolveSplitPanelLabels,
  // Skeleton (ARIA accessibility)
  DEFAULT_SKELETON_LABELS,
  resolveSkeletonLabels,
} from './labels.types';

// =============================================================================
// ARIA Label Types (i18n for accessibility)
// =============================================================================
export type {
  // Common ARIA labels
  CommonAriaLabels,
  // Composite-specific ARIA labels
  SplitPanelAriaLabels,
  DetailPageAriaLabels,
  CalendarAriaLabels,
  AnalyticsAriaLabels,
  WizardAriaLabels,
  ListAriaLabels,
  DashboardAriaLabels,
  SettingsAriaLabels,
  FormAriaLabels,
} from './aria-labels.types';
export {
  // Common ARIA defaults
  DEFAULT_COMMON_ARIA_LABELS,
  resolveCommonAriaLabels,
  // Split Panel ARIA
  DEFAULT_SPLIT_PANEL_ARIA_LABELS,
  resolveSplitPanelAriaLabels,
  // Detail Page ARIA
  DEFAULT_DETAIL_PAGE_ARIA_LABELS,
  resolveDetailPageAriaLabels,
  // Calendar ARIA
  DEFAULT_CALENDAR_ARIA_LABELS,
  resolveCalendarAriaLabels,
  // Analytics ARIA
  DEFAULT_ANALYTICS_ARIA_LABELS,
  resolveAnalyticsAriaLabels,
  // Wizard ARIA
  DEFAULT_WIZARD_ARIA_LABELS,
  resolveWizardAriaLabels,
  // List ARIA
  DEFAULT_LIST_ARIA_LABELS,
  resolveListAriaLabels,
  // Dashboard ARIA
  DEFAULT_DASHBOARD_ARIA_LABELS,
  resolveDashboardAriaLabels,
  // Settings ARIA
  DEFAULT_SETTINGS_ARIA_LABELS,
  resolveSettingsAriaLabels,
  // Form ARIA
  DEFAULT_FORM_ARIA_LABELS,
  resolveFormAriaLabels,
} from './aria-labels.types';
