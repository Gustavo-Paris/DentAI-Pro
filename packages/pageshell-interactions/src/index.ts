/**
 * @pageshell/interactions
 *
 * Interactive UI components for PageShell (Layer 3)
 *
 * Components:
 * - PageModal, PageModalFooter, PageModalTrigger
 * - PageConfirmDialog
 * - PageDrawer
 * - PageFilters
 * - PageSearch
 * - PagePagination, SimplePagination
 * - PageList, PageListSkeleton
 * - PageInfiniteList, PageInfiniteScroll
 * - PageAlert, PageAlertGroup
 * - PageFloatingAction
 * - GenericStatusBadge
 *
 * @packageDocumentation
 */

// =============================================================================
// Modal Components
// =============================================================================
export {
  PageModal,
  PageModalFooter,
  PageModalTrigger,
  type PageModalProps,
  type PageModalFooterProps,
} from './PageModal';

export {
  PageConfirmDialog,
  type PageConfirmDialogProps,
  type ConfirmDialogMutation,
} from './PageConfirmDialog';

// =============================================================================
// Drawer Components
// =============================================================================
export {
  PageDrawer,
  type PageDrawerProps,
  type PageDrawerHeaderProps,
  type PageDrawerBodyProps,
  type PageDrawerFooterProps,
  type DrawerSide,
} from './PageDrawer';

// =============================================================================
// Filter & Search Components
// =============================================================================
export {
  PageFilters,
  type PageFiltersProps,
  type PageFilterOption,
  type PageFilterConfig,
  type PageSortConfig,
} from './PageFilters';

export {
  PageSearch,
  type PageSearchProps,
  type PageSearchVariant,
  type PageSearchFilter,
  type PageSearchFilterOption,
} from './page-search';

// =============================================================================
// Pagination Components
// =============================================================================
export {
  SimplePagination,
  type SimplePaginationProps,
  type SimplePaginationLabels,
} from './SimplePagination';

// =============================================================================
// List Components
// =============================================================================
export {
  PageList,
  PageListItem,
  PageListSkeleton,
  type PageListProps,
  type PageListItemProps,
  type PageListSkeletonProps,
  type PageListVariant,
  type PageListIconColor,
  type PageListBadge,
  type PageListItemAction,
  type PageListAvatar,
  type PageListEmptyState,
  type PageIconVariant,
  type ActionProp,
  type ActionConfig,
} from './page-list';

// Backward compatibility alias
export type { PageListItemProps as PageListItemComponentProps } from './page-list';

// =============================================================================
// Infinite Scroll Components
// =============================================================================
export {
  PageInfiniteList,
  type PageInfiniteListProps,
  type PageInfiniteListEmptyState,
} from './PageInfiniteList';

export {
  PageInfiniteScroll,
  type PageInfiniteScrollProps,
} from './PageInfiniteScroll';

// =============================================================================
// Alert Components
// =============================================================================
export {
  PageAlert,
  PageAlertGroup,
  type PageAlertProps,
  type PageAlertGroupProps,
  type PageAlertVariant,
  type PageAlertAction,
} from './page-alert';

// =============================================================================
// Floating Action Button
// =============================================================================
export {
  PageFloatingAction,
  type PageFloatingActionProps,
  type PageFloatingActionItem,
  type PageFloatingActionPosition,
  type PageFloatingActionVariant,
  type PageFloatingActionSize,
} from './PageFloatingAction';

// =============================================================================
// Wizard Components
// =============================================================================
export {
  PageShellWizard,
  WizardStep,
  WizardProgress,
  WizardNavigation,
  WizardBackground,
  WizardSkeleton,
  WIZARD_TRANSITION_CLASSES,
  type WizardBackgroundVariant,
  type WizardProgressVariant,
  type WizardStepStatus,
  type WizardTransitionDirection,
  type WizardStepConfig,
  type WizardQueryResult,
  type PageShellWizardProps,
  type WizardStepProps,
  type WizardProgressProps,
  type WizardNavigationProps,
  type WizardBackgroundProps,
  type WizardSkeletonProps,
} from './wizard';

// =============================================================================
// Form Components (React Hook Form integration)
// =============================================================================
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  type FormItemProps,
  type FormLabelProps,
  type FormControlProps,
  type FormDescriptionProps,
  type FormMessageProps,
} from './form';

// =============================================================================
// Status Badge Components
// =============================================================================
export {
  GenericStatusBadge,
  defineStatusBadgeConfig,
  type GenericStatusBadgeProps,
  type StatusBadgeConfig,
  type StatusBadgeConfigItem,
} from './status-badge';

// =============================================================================
// Action Button Components (Deep Consolidation - Phase 2)
// =============================================================================
export {
  PageActionButton,
  ACTION_BUTTON_PRESETS,
  // Hooks for localized presets
  createLocalizedPreset,
  useActionButtonPreset,
  useCustomActionButtonStates,
  DEFAULT_PRESET_KEYS,
  type PageActionButtonProps,
  type ActionButtonStates,
  type ActionButtonStateConfig,
  type ActionButtonVariant,
  type ActionButtonPreset,
  type TFunction as ActionButtonTFunction,
  type TranslationFn as ActionButtonTranslationFn,
  type PresetTranslationKeys,
} from './action-button';

// =============================================================================
// Toggle Group Components
// =============================================================================
export {
  PageToggleGroup,
  type PageToggleGroupProps,
  type ToggleOption,
  type ToggleGroupSize,
  type ToggleGroupVariant,
} from './toggle-group';

// =============================================================================
// Hooks
// =============================================================================

export {
  // Clipboard
  useClipboard,
  type UseClipboardOptions,
  type UseClipboardReturn,
  // Modal Form Reset
  useModalFormReset,
  // Streaming Text
  useStreamingText,
  type StreamingTextOptions,
  type StreamingTextResult,
  // Dismissed Alerts
  useDismissedAlerts,
  type DismissableAlert,
  type UseDismissedAlertsOptions,
  type UseDismissedAlertsReturn,
  // Form Draft
  useFormDraft,
  formatLastSaved,
  type UseFormDraftOptions,
  type UseFormDraftReturn,
  type FormatLastSavedLabels,
} from './hooks';
