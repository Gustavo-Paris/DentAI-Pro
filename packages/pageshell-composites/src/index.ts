/**
 * @pageshell/composites
 *
 * Declarative page composites built on PageShell primitives.
 * Provides high-level, configuration-driven components for common page patterns.
 *
 * @example
 * ```tsx
 * import { ListPage, FormModal, DetailPage, DashboardPage } from '@pageshell/composites';
 *
 * // Or import from subpaths for better tree-shaking
 * import { ListPage } from '@pageshell/composites/list';
 * import { FormModal } from '@pageshell/composites/form';
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// List Composite (with viewMode support - ADR-0051)
// =============================================================================
export { ListPage } from './list';
export type {
  ListPageProps,
  ListState,
  ListStateActions,
  ListPageUseQuery,
  ListPageProcedure,
  // Card mode types (ADR-0051)
  CardActionConfig,
  CardActionsConfig,
  CardActionConfirm,
  CardSectionConfig,
  CardSortConfig,
  CardSortOption,
  CardFilterConfig,
  CardFilterOption,
  CardSkeletonConfig,
  CardStatsSectionConfig,
  CardStatsCard,
  CardStatsTrend,
  EmptySearchStateConfig,
  ListPageSlots,
} from './list';

// ViewMode types and hook (ADR-0051)
export {
  useViewMode,
  type ViewMode,
  type ResolvedViewMode,
  type UseViewModeOptions,
  type UseViewModeResult,
} from './list';

// =============================================================================
// Infinite Card List Composite
// =============================================================================
export { InfiniteCardList } from './infinite-card-list';
export type {
  InfiniteCardListProps,
  InfinitePage,
  InfiniteQueryResult,
  InfiniteSortOption,
  InfiniteSortConfig,
  InfiniteFilterOption,
  InfiniteFilterConfig,
  InfiniteSkeletonConfig,
} from './infinite-card-list';

// =============================================================================
// Tabbed List Composite
// =============================================================================
export { TabbedListPage } from './tabbed-list';
export type {
  TabbedListPageProps,
  TabbedListTab,
  TabbedListGroupConfig,
  TabbedListSlots,
} from './tabbed-list';

// =============================================================================
// Form Composites
// =============================================================================
export { FormPage, FormModal, FormField } from './form';
export { formPageDefaults, formModalDefaults } from './form';
export type {
  FormPageProps,
  FormPageSlots,
  FormModalProps,
  FormFieldProps,
  MutationLike,
} from './form';

// =============================================================================
// Sectioned Form Composite
// =============================================================================
export { SectionedFormPage, sectionedFormPageDefaults } from './sectioned-form';
export type {
  SectionedFormPageProps,
  SectionedFormSectionConfig,
  SectionedFormFieldConfig,
  SectionedFormFieldType,
  SectionedFormFieldOption,
  SectionedFormAlertConfig,
  SectionedFormMutation,
  SectionedFormPageSlots,
  SectionedFormLabels,
  SectionBadgeConfig,
} from './sectioned-form';

// =============================================================================
// Detail Composite
// =============================================================================
export { DetailPage } from './detail';
export { detailPageDefaults } from './detail';
export type {
  DetailPageProps,
  DetailPageBadge,
  DetailPageSlots,
  FooterActionVariant,
  FooterActionConfig,
  QuickActionConfig,
} from './detail';

// =============================================================================
// Dashboard Composite
// =============================================================================
export { DashboardPage } from './dashboard';
export { dashboardPageDefaults } from './dashboard';
export type {
  DashboardPageProps,
  DashboardPageSlots,
  ModuleConfig,
  QuickActionConfig as DashboardQuickActionConfig,
  BreakdownCardConfig,
  BreakdownCardItem,
} from './dashboard';

// =============================================================================
// Settings Composite
// =============================================================================
export { SettingsPage } from './settings';
export type {
  SettingsPageProps,
  SettingsSectionConfig,
  FormFieldLayout,
} from './settings';

// =============================================================================
// Card Settings Composite
// =============================================================================
export { CardSettingsPage, cardSettingsPageDefaults } from './card-settings';
export type {
  CardSettingsPageProps,
  CardSettingsPageSlots,
  CardSettingsSectionConfig,
  CardSettingsItem,
  CardSettingsBreadcrumb,
} from './card-settings';

// =============================================================================
// Config Composite
// =============================================================================
export { ConfigPage } from './config';
export type {
  ConfigPageProps,
  ConfigFieldType,
  ConfigItem,
  ConfigCategory,
  ConfigFieldProps,
  ConfigFieldComponents,
  ConfigActionConfig,
  ConfigEmptyState,
  ConfigHistoryConfig,
} from './config';

// =============================================================================
// Preferences Composite
// =============================================================================
export { PreferencesPage } from './preferences';
export type {
  PreferencesPageProps,
  PreferenceSection,
  PreferenceItem,
  PreferencesPageSlots,
  SemanticIconColor,
} from './preferences';

// =============================================================================
// Help Center Composite
// =============================================================================
export { HelpCenterPage, helpCenterPageDefaults, helpCenterAriaDefaults } from './help-center';
export type {
  HelpCenterPageProps,
  HelpCenterQuickLinkConfig,
  HelpCenterFAQSection,
  HelpCenterFAQItem,
  HelpCenterArticleConfig,
  HelpCenterContactConfig,
  HelpCenterHeroConfig,
  HelpCenterPageSlots,
  HelpCenterLabels,
  HelpCenterAriaLabels,
  QuickLinkVariant,
  FAQCategory as HelpCenterFAQCategory,
} from './help-center';

// =============================================================================
// Split Panel Composite
// =============================================================================
export { SplitPanelPage } from './split-panel';
export type {
  SplitPanelPageProps,
  SplitPanelListConfig,
  SplitPanelMainConfig,
  SplitPanelContextConfig,
  SplitPanelPageSlots,
} from './split-panel';

// =============================================================================
// Analytics Composite
// =============================================================================
export { AnalyticsPage } from './analytics';
export type {
  AnalyticsPageProps,
  AnalyticsDateRange,
  DateRangeResult,
  AnalyticsKPI,
  AnalyticsChartSlot,
  AnalyticsPageSlots,
} from './analytics';

// =============================================================================
// Calendar Composite
// =============================================================================
export { CalendarPage } from './calendar';
export type {
  CalendarPageProps,
  CalendarView,
  CalendarEventStyle,
  CalendarSlotInfo,
  CalendarEventModalConfig,
  CalendarSlotModalConfig,
  CalendarPageSlots,
} from './calendar';

// =============================================================================
// Linear Flow Composite
// =============================================================================
export { LinearFlowPage } from './linear-flow';
export type {
  LinearFlowPageProps,
  StepConfig,
  StepStatus,
  LinearFlowPageSlots,
} from './linear-flow';

// =============================================================================
// Progressive Extraction Composite
// =============================================================================
export { ProgressiveExtractionPage, progressiveExtractionPageDefaults } from './progressive-extraction';
export type {
  ProgressiveExtractionPageProps,
  ExtractionField,
  ExtractionFieldVariant,
  InputPhaseConfig,
  ExtractionPhaseConfig,
  FooterAction,
  CompleteActionConfig,
  ScoreConfig,
  ProgressiveExtractionPageSlots,
} from './progressive-extraction';

// =============================================================================
// Wizard Composites
// =============================================================================
export { WizardPage, EnhancedWizardPage } from './wizard';
export { WizardBackground, WizardSidePanel } from './wizard';
export { FormFieldsRenderer, FormFieldRendererSingle } from './wizard';
export type { WizardBackgroundVariant, WizardSidePanelProps } from './wizard';
export {
  wizardPageDefaults,
  enhancedWizardPageDefaults,
  interpolateHref,
  loadWizardProgress,
  saveWizardProgress,
  clearWizardProgress,
} from './wizard';
export type {
  // Simple WizardPage
  WizardPageProps,
  WizardPageSlots,
  WizardResumableConfig,
  WizardSidePanelConfig,
  SidePanelWidth,
  // EnhancedWizardPage
  EnhancedWizardPageProps,
  EnhancedWizardPageSlots,
  EnhancedWizardStepConfig,
  WizardAIChatConfig,
  WizardChatMessage,
  WizardEnhancedResumableConfig,
  WizardEnhancedSidePanelConfig,
  // Wizard form field types (prefixed to avoid conflicts with FormModal types)
  WizardFormField,
  WizardFormFieldType,
  WizardFormFieldLayout,
  WizardFormFieldBase,
  WizardFormFieldText,
  WizardFormFieldNumber,
  WizardFormFieldCurrency,
  WizardFormFieldTextarea,
  WizardFormFieldSelect,
  WizardFormFieldSelectOption,
  WizardFormFieldRadio,
  WizardFormFieldCheckbox,
  WizardFormFieldSwitch,
  WizardFormFieldCustom,
} from './wizard';

// =============================================================================
// Shared Types
// =============================================================================
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
  // Unified Field Types (for table + card consistency - ADR-0051)
  ValueType,
  ValueEnum,
  ValueEnumOption,
  CardSlot,
  FieldTableConfig,
  FieldCardConfig,
  FieldConfig,
  CardLayoutVariant,
  CardLayoutConfig,
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
} from './shared';

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
} from './shared';

// Deprecation utilities (runtime warnings for development)
export { warnDeprecated, warnDeprecatedProp, wrapDeprecatedComposite } from './shared';

// =============================================================================
// Skeleton Components (Code Quality - consolidation of duplicated skeletons)
// =============================================================================
export {
  GenericSkeleton,
  PresetSkeleton,
  // Core building blocks
  HeaderSkeleton,
  FiltersSkeleton,
  PaginationSkeleton,
  TableSkeleton,
  CardSkeleton,
  FormFieldSkeleton,
  StatCardSkeleton,
  // Additional building blocks
  SectionSkeleton,
  ModuleCardSkeleton,
  TabsSkeleton,
  ListItemSkeleton,
  CalendarGridSkeleton,
} from './shared';
export type {
  GenericSkeletonProps,
  SkeletonPattern,
  ListSkeletonProps,
  CardGridSkeletonProps,
  FormSkeletonProps,
  StatsSkeletonProps,
  CustomSkeletonProps,
  // Preset types
  SkeletonPreset,
  PresetSkeletonProps,
  DetailPagePresetProps,
  DashboardPagePresetProps,
  ConfigPagePresetProps,
  CalendarPagePresetProps,
  SplitPanelPresetProps,
  TabbedListPresetProps,
} from './shared';

// =============================================================================
// State Components (Code Quality - consolidation of duplicated state components)
// =============================================================================
export { GenericEmptyState, GenericErrorState } from './shared';
export type {
  GenericEmptyStateProps,
  EmptyStateVariant,
  EmptyStateSize,
  AriaLive,
  GenericErrorStateProps,
  ErrorStateVariant,
  ErrorStateSize,
} from './shared';

// =============================================================================
// ItemCard Component (Card Consolidation - Phase 3)
// =============================================================================
export { ItemCard } from './item-card';
export type {
  ItemCardProps,
  ItemCardHeaderProps,
  ItemCardTitleProps,
  ItemCardDescriptionProps,
  ItemCardStatsProps,
  ItemCardFooterProps,
  ItemCardActionsProps,
  ItemCardAction,
  ItemCardMenuAction,
  ItemCardStat,
  ItemCardStatus,
} from './item-card';
export { formatRelativeTime } from './item-card';

// =============================================================================
// PageMetricCard Component (Deep Consolidation - Phase 2)
// =============================================================================
export { PageMetricCard, PageMetricGrid } from './metric-card';
export type {
  PageMetricCardProps,
  PageMetricGridProps,
  PageMetricCardSkeletonProps,
  MetricCardColor,
  MetricCardStatus,
  MetricCardTrend,
} from './metric-card';

// =============================================================================
// CardSkeletonFactory (Deep Consolidation - Phase 4)
// =============================================================================
export {
  createCardSkeleton,
  createCardSkeletonFromPreset,
  // Pre-built skeletons
  BrainstormCardSkeleton,
  CourseCardSkeleton,
  MentorCardSkeleton,
  ServiceCardSkeleton,
  PackageCardSkeleton,
  // Presets
  CARD_SKELETON_PRESETS,
  getCardSkeletonPreset,
} from './skeleton-factory';
export type {
  CardSkeletonConfig as SkeletonFactoryConfig,
  CardSkeletonProps as SkeletonFactoryProps,
  CardSkeletonVariant,
  CardSkeletonPreset,
  CardSkeletonHeaderConfig,
  CardSkeletonContentConfig,
  CardSkeletonFooterConfig,
  CardSkeletonImageConfig,
} from './skeleton-factory';

// =============================================================================
// BaseUsageCard (Deep Consolidation - Phase 4)
// =============================================================================
export { BaseUsageCard, UsageCardHeader, UsageCardEmpty } from './base-usage-card';
export type {
  BaseUsageCardProps,
  UsageCardHeaderProps,
  UsageCardEmptyProps,
  UsageCardHeaderConfig,
  UsageCardEmptyConfig,
} from './base-usage-card';

// =============================================================================
// ItemCardSections (Deep Consolidation - Phase 4)
// =============================================================================
export {
  PricingSection,
  MetricsSection,
  StatusToggleSection,
  SavingsDisplay,
} from './item-card-sections';
export type {
  PricingSectionProps,
  MetricsSectionProps,
  MetricItem,
  StatusToggleSectionProps,
  SavingsDisplayProps,
  CurrencyConfig,
} from './item-card-sections';

// =============================================================================
// Card Helpers (Deep Consolidation - Phase 5)
// =============================================================================
export {
  DeleteConfirmDialog,
  InlineDeleteButton,
  CardActionButtons,
  useDeleteDialog,
} from './card-helpers';
export type {
  DeleteConfirmDialogProps,
  InlineDeleteButtonProps,
  CardActionButtonsProps,
  UseDeleteDialogReturn,
} from './card-helpers';
