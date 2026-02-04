'use client';

// =============================================================================
// Debounce utilities
// =============================================================================

export { useDebounce, useDebouncedCallback, useDebouncedValue } from './useDebounce';

// =============================================================================
// Modal state management
// =============================================================================

export { useModal, type UseModalReturn } from './useModal';

// =============================================================================
// List state management (search, filters, sort, pagination)
// =============================================================================

export {
  useListLogic,
  type ListFilterConfig,
  type ListSortConfig,
  type ListPaginationConfig,
  type UseListLogicOptions,
  type ListState,
  type ListQueryParams,
  type UseListLogicReturn,
} from './list';

// =============================================================================
// Form state management (submission, validation, dirty state, auto-save)
// =============================================================================

export {
  useFormLogic,
  type FormStateInput,
  type AutoSaveConfig,
  type UseFormLogicOptions,
  type AutoSaveStatus,
  type NavigationGuardState,
  type UseFormLogicReturn,
} from './useFormLogic';

// =============================================================================
// Form Utilities (extracted reusable hooks)
// =============================================================================

export {
  // Navigation guard types only (hook has Next.js deps, import directly from './form/useNavigationGuard')
  type UseNavigationGuardOptions,
  type UseNavigationGuardReturn,
  // Auto-save (AutoSaveStatus already exported from useFormLogic)
  useAutoSave,
  type UseAutoSaveOptions,
  type UseAutoSaveReturn,
} from './form';

// =============================================================================
// Wizard/stepper state management (navigation, validation, resumable progress)
// =============================================================================

export {
  useWizardLogic,
  useWizardKeyboardNav,
  type StepValidationResult,
  type WizardResumableConfig,
  type UseWizardLogicOptions,
  type UseWizardLogicReturn,
  type UseWizardKeyboardNavOptions,
  type UseWizardKeyboardNavResult,
} from './wizard';

// =============================================================================
// Animation Tokens
// =============================================================================

export {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  ANIMATION_STAGGER,
  PORTAL_MAX_DELAY_INDEX,
  type AnimationDuration,
  type AnimationEasing,
  type AnimationStagger,
} from './animation-tokens';

// =============================================================================
// Accessibility Hooks
// =============================================================================

export { usePrefersReducedMotion } from './usePrefersReducedMotion';

// =============================================================================
// Animation Hooks
// =============================================================================

export {
  useStaggeredAnimation,
  type UseStaggeredAnimationOptions,
  type StaggeredAnimationStyle,
  type UseStaggeredAnimationReturn,
} from './useStaggeredAnimation';

export {
  useDirectionalSlide,
  type SlideDirection,
  type UseDirectionalSlideOptions,
  type DirectionalSlideStyles,
  type UseDirectionalSlideReturn,
} from './useDirectionalSlide';

export {
  usePortalAnimationDelay,
  type UsePortalAnimationDelayOptions,
  type UsePortalAnimationDelayReturn,
} from './usePortalAnimationDelay';

export {
  useAccessibleAnimation,
  type AnimationType,
  type UseAccessibleAnimationOptions,
  type AnimationProps,
  type UseAccessibleAnimationReturn,
} from './useAccessibleAnimation';

// =============================================================================
// Form Modal Hooks
// =============================================================================

export {
  useFormModalFocus,
  type UseFormModalFocusOptions,
  type UseFormModalFocusReturn,
} from './useFormModalFocus';

export {
  useFormModalShortcuts,
  type ShortcutModifier,
  type Shortcut,
  type UseFormModalShortcutsOptions,
} from './useFormModalShortcuts';

export {
  useBottomSheet,
  type UseBottomSheetOptions,
  type UseBottomSheetReturn,
} from './useBottomSheet';

// =============================================================================
// Table State Management
// =============================================================================

export {
  useTableState,
  type UseTableStateOptions,
  type UseTableStateReturn,
} from './useTableState';

// =============================================================================
// Composite Logic Hooks
// =============================================================================

export {
  useCalendarLogic,
  type CalendarViewType,
  type CalendarSlotSelection,
  type CalendarEventStyleConfig,
  type UseCalendarLogicOptions,
  type CalendarEventInternal,
  type CalendarDay,
  type CalendarWeek,
  type CalendarState,
  type UseCalendarLogicReturn,
} from './calendar';

export {
  usePreferencesLogic,
  type IconComponent,
  type PreferenceItemConfig,
  type PreferenceSectionConfig,
  type PreferenceItemState,
  type PreferenceSectionState,
  type UsePreferencesLogicOptions,
  type UsePreferencesLogicReturn,
} from './preferences';

export {
  useAnalyticsLogic,
  type AnalyticsIconComponent,
  type AnalyticsDateRangeConfig,
  type AnalyticsKPIConfig,
  type AnalyticsDateRangeResult,
  type AnalyticsKPIComputed,
  type UseAnalyticsLogicOptions,
  type UseAnalyticsLogicReturn,
} from './analytics';

// =============================================================================
// Media Query Hooks
// =============================================================================

export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  BREAKPOINTS,
  type BreakpointKey,
} from './useMediaQuery';

// =============================================================================
// Event Handler Memoization
// =============================================================================

/**
 * Hooks for memoizing event handlers to prevent unnecessary re-renders.
 * These are especially useful for components that render lists with click handlers.
 */

export {
  useEventCallback,
  type UseEventCallbackReturn,
} from './useEventCallback';

export {
  useHandlerMap,
  type UseHandlerMapReturn,
} from './useHandlerMap';

// =============================================================================
// Storage Hooks
// =============================================================================

export {
  useLocalStorage,
  type UseLocalStorageOptions,
  type UseLocalStorageReturn,
} from './useLocalStorage';

// =============================================================================
// Sidebar Hooks
// =============================================================================

export {
  useSidebarCollapse,
  type SidebarMode,
  type UseSidebarCollapseOptions,
  type UseSidebarCollapseReturn,
} from './useSidebarCollapse';

export {
  useRecentItems,
  type RecentItem,
  type UseRecentItemsOptions,
  type UseRecentItemsReturn,
} from './useRecentItems';

export {
  useSidebarSearch,
  type SearchableNavItem,
  type SearchableNavSection,
  type HighlightSegment,
  type SearchResult,
  type UseSidebarSearchOptions,
  type UseSidebarSearchReturn,
} from './sidebar-search';

export {
  useFavorites,
  type FavoriteItem,
  type UseFavoritesOptions,
  type UseFavoritesReturn,
} from './useFavorites';

export {
  useSidebarSwipe,
  type UseSidebarSwipeOptions,
  type SwipeState,
  type UseSidebarSwipeReturn,
} from './useSidebarSwipe';

// =============================================================================
// Scroll Direction Hooks
// =============================================================================

export {
  useScrollDirection,
  type ScrollDirection,
  type UseScrollDirectionOptions,
  type UseScrollDirectionReturn,
} from './useScrollDirection';

// =============================================================================
// Route-based Collapse Config
// =============================================================================

export {
  useRouteCollapseConfig,
  type UseRouteCollapseConfigOptions,
  type UseRouteCollapseConfigReturn,
} from './useRouteCollapseConfig';

// =============================================================================
// Mobile Header Behavior
// =============================================================================

export {
  useMobileHeaderBehavior,
  type UseMobileHeaderBehaviorOptions,
  type UseMobileHeaderBehaviorReturn,
} from './useMobileHeaderBehavior';

// =============================================================================
// Relative Time Hook
// =============================================================================

export {
  useRelativeTime,
  type UseRelativeTimeOptions,
  type UseRelativeTimeResult,
} from './useRelativeTime';

// =============================================================================
// Interval Hook
// =============================================================================

export { useInterval } from './useInterval';

// =============================================================================
// Service Health Hook
// =============================================================================

export {
  useServiceHealth,
  type ServiceHealthStatus,
  type UseServiceHealthOptions,
  type UseServiceHealthReturn,
} from './useServiceHealth';

// =============================================================================
// Auto-Resize Textarea Hook
// =============================================================================

export {
  useAutoResizeTextarea,
  type UseAutoResizeTextareaOptions,
} from './useAutoResizeTextarea';

// =============================================================================
// Auto-Scroll Hook
// =============================================================================

export {
  useAutoScroll,
  type UseAutoScrollOptions,
} from './useAutoScroll';

// =============================================================================
// Retry Hook (Circuit Breaker Pattern)
// =============================================================================

export {
  useRetry,
  defaultIsRetryable,
  clearCircuitState,
  clearAllCircuitStates,
  NON_RETRYABLE_ERRORS,
  type RetryState,
  type RetryStatus,
  type RetryOptions,
  type UseRetryReturn,
} from './useRetry';

// =============================================================================
// Countdown Hook
// =============================================================================

export {
  useCountdown,
  type UseCountdownOptions,
  type UseCountdownReturn,
} from './useCountdown';

// =============================================================================
// Push Notifications Hook
// =============================================================================

export {
  usePushNotifications,
  type PushNotificationErrorCode,
  type PushNotificationState,
  type UsePushNotificationsReturn,
  type UsePushNotificationsOptions,
} from './usePushNotifications';

// =============================================================================
// SSE Connection Hook
// =============================================================================

export {
  useSSEConnection,
  SSE_CONSOLE_LOGGER,
  type SSEConnectionStatus,
  type SSELogger,
  type UseSSEConnectionOptions,
  type UseSSEConnectionReturn,
} from './useSSEConnection';

