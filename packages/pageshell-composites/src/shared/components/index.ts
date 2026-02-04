/**
 * Shared Components
 *
 * Reusable state components for PageShell composites.
 *
 * @module shared/components
 * @see Code Quality - Consolidation of duplicated state components
 */

// Empty State
export { GenericEmptyState } from './GenericEmptyState';
export type {
  GenericEmptyStateProps,
  EmptyStateVariant,
  EmptyStateSize,
  AriaLive,
} from './GenericEmptyState';

// Error State
export { GenericErrorState } from './GenericErrorState';
export type {
  GenericErrorStateProps,
  ErrorStateVariant,
  ErrorStateSize,
} from './GenericErrorState';

// Skeleton
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
} from './GenericSkeleton';
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
} from './GenericSkeleton';
