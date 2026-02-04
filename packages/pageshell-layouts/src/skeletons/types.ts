/**
 * Skeleton Types
 */

export interface SkeletonBaseProps {
  className?: string;
}

export interface SkeletonAnimationConfig {
  animate: string;
  animateDelay: (index: number) => string;
}

export const defaultAnimationConfig: SkeletonAnimationConfig = {
  animate: 'animate-fadeIn',
  animateDelay: () => '',
};

export type SkeletonVariant =
  | 'dashboard'
  | 'list'
  | 'cards'
  | 'detail'
  | 'form'
  | 'linearFlow'
  | 'leaderboard';
