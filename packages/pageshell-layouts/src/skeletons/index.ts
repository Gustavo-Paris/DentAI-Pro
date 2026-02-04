/**
 * Skeleton Components
 */

// Skeleton Components
export { DashboardSkeleton, type DashboardSkeletonProps } from './DashboardSkeleton';
export { LinearFlowSkeleton, type LinearFlowSkeletonProps } from './LinearFlowSkeleton';
export { PageListSkeleton, ListSkeleton, type PageListSkeletonProps } from './PageListSkeleton';
export { CardGridSkeleton, type CardGridSkeletonProps } from './CardGridSkeleton';
export { PageLeaderboardSkeleton, type PageLeaderboardSkeletonProps } from './LeaderboardSkeleton';
export { WizardSkeleton } from './WizardSkeleton';

// Skeleton Presets
export {
  SkeletonPreset,
  getSkeletonPreset,
  type SkeletonConfig,
  type DashboardSkeletonConfig,
  type ListSkeletonConfig,
  type CardGridSkeletonConfig,
  type DetailSkeletonConfig,
  type FormSkeletonConfig,
  type LinearFlowSkeletonConfig,
  type LeaderboardSkeletonConfig,
} from './SkeletonPresets';

// Base Types
export {
  type SkeletonBaseProps,
  type SkeletonAnimationConfig,
  type SkeletonVariant,
  defaultAnimationConfig,
} from './types';
