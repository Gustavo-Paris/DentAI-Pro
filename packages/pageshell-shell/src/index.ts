/**
 * @pageshell/shell
 *
 * PageShell facade and query handling components.
 * Provides the main PageShell component with variants for different use cases.
 *
 * @example
 * ```tsx
 * import { PageShellCore } from '@pageshell/shell';
 *
 * // Static page (no data fetching)
 * <PageShellCore.Static title="Settings" theme="admin">
 *   <SettingsForm />
 * </PageShellCore.Static>
 *
 * // Page with query
 * <PageShellCore
 *   title="Dashboard"
 *   theme="creator"
 *   query={dashboardQuery}
 *   skeleton={<DashboardSkeleton />}
 * >
 *   {(data) => <DashboardContent data={data} />}
 * </PageShellCore>
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Types
// =============================================================================
export type {
  // Query
  QueryResult,
  // Breadcrumb
  PageBreadcrumb,
  // Header
  PageHeaderMeta,
  PageHeaderSize,
  PageHeaderAlign,
  // Empty State
  PageEmptyState,
  // Badge
  BadgeVariant,
  PageBadge,
  // Quick Action
  QuickActionBadge,
  QuickAction,
  // Action
  ActionVariant,
  ActionSize,
  ActionConfig,
  ActionProp,
  // Header Action
  PageHeaderActionVariant,
  PageHeaderActionSize,
  PageHeaderActionConfig,
  PageHeaderAction,
  // Skeleton
  SkeletonVariant,
  SkeletonConfig,
  // PageShell Props
  PageShellProps,
  PageShellStaticProps,
  PageShellMultiProps,
  PageShellErrorFallbackConfig,
  // LinearFlow
  PageShellLinearFlowProps,
  WizardBackgroundVariant,
} from './types';

// =============================================================================
// Error Fallback Utilities
// =============================================================================
export {
  resolveErrorFallback,
  renderErrorFallback,
  type ErrorFallbackConfig,
  type ResolvedErrorFallback,
} from './lib/error-fallback';

// =============================================================================
// Context (re-exported from @pageshell/theme)
// =============================================================================
export {
  PageShellProvider,
  usePageShellContext,
  usePageShellContextOptional,
  WizardStepProvider,
  useWizardStepContext,
  themeConfigs,
  getThemeConfig,
  iconColorClasses,
  type PageShellTheme,
  type PageShellSpacing,
  type ThemeConfig,
  type PageShellContextValue,
  type PageShellProviderProps,
  type WizardStepContextValue,
  type WizardStepProviderProps,
} from './context';

// =============================================================================
// Skeletons (re-exported from @pageshell/layouts)
// =============================================================================
export {
  DashboardSkeleton,
  LinearFlowSkeleton,
  PageListSkeleton,
  ListSkeleton,
  CardGridSkeleton,
  PageLeaderboardSkeleton,
  WizardSkeleton,
  SkeletonPreset,
  getSkeletonPreset,
  type DashboardSkeletonProps,
  type LinearFlowSkeletonProps,
  type PageListSkeletonProps,
  type CardGridSkeletonProps,
  type PageLeaderboardSkeletonProps,
  type SkeletonBaseProps,
  type SkeletonAnimationConfig,
  defaultAnimationConfig,
} from './skeletons';

// =============================================================================
// PageShell Components (local)
// =============================================================================
export { PageShell } from './PageShell';
export { PageShellCore } from './PageShellCore';
export { PageShellLinearFlow } from './PageShellLinearFlow';

// Re-export extended props types from PageShellCore
export type {
  PageShellExtendedProps,
  PageShellStaticExtendedProps,
  PageShellMultiExtendedProps,
  BreadcrumbItem,
  ContainerVariant,
} from './PageShellCore';

// =============================================================================
// Form Field Renderer (from @pageshell/composites)
// =============================================================================
export { FormFieldsRenderer } from '@pageshell/composites';

// =============================================================================
// Form Field Types
// =============================================================================
export type {
  FormField,
  FormFieldOption,
  FormFieldValidation,
  FormSection,
  FormSectionBadge,
  FormFieldType,
  FormFieldBase,
  FormFieldText,
  FormFieldPasswordStrength,
  FormFieldNumber,
  FormFieldCurrency,
  FormFieldTextarea,
  FormFieldSelect,
  FormFieldCombobox,
  FormFieldRadio,
  FormFieldCheckbox,
  FormFieldSwitch,
  FormFieldDate,
  FormFieldDateTime,
  FormFieldTime,
  FormFieldFile,
  FormFieldCustom,
  FormFieldRating,
  FormFieldTags,
  FormFieldRichText,
  FormFieldLayout,
  FieldNames,
} from './form-types';
