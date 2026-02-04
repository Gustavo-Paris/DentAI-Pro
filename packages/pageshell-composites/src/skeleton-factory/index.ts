/**
 * CardSkeletonFactory Module
 *
 * Factory for creating card skeleton loading components.
 *
 * @module skeleton-factory
 */

export {
  createCardSkeleton,
  createCardSkeletonFromPreset,
  // Pre-built skeletons
  BrainstormCardSkeleton,
  CourseCardSkeleton,
  MentorCardSkeleton,
  ServiceCardSkeleton,
  PackageCardSkeleton,
} from './CardSkeletonFactory';

export { CARD_SKELETON_PRESETS, getCardSkeletonPreset } from './presets';

export type {
  CardSkeletonConfig,
  CardSkeletonProps,
  CardSkeletonVariant,
  CardSkeletonPreset,
  CardSkeletonHeaderConfig,
  CardSkeletonContentConfig,
  CardSkeletonFooterConfig,
  CardSkeletonImageConfig,
} from './types';
