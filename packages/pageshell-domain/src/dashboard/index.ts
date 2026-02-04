/**
 * Dashboard Domain Components
 *
 * Components specific to dashboard pages (student, creator, admin).
 */

// Onboarding components
export { PageOnboardingChecklist } from './PageOnboardingChecklist';
export type { PageOnboardingChecklistProps, PageOnboardingChecklistItem } from './PageOnboardingChecklist';

// Activity components
export { PageActivityFeed } from './PageActivityFeed';
export type { PageActivityFeedProps, PageActivityFeedItem } from './PageActivityFeed';

// Next steps
export { PageNextSteps } from './PageNextSteps';
export type { PageNextStepsProps, PageNextStepItem } from './PageNextSteps';

// Alert banner
export { PageAlertBanner } from './PageAlertBanner';
export type { PageAlertBannerProps, PageAlertBannerAction, PageAlertBannerVariant } from './PageAlertBanner';

// Quick actions
export { PageQuickActionsGrid } from './PageQuickActionsGrid';
export type { PageQuickActionsGridProps, PageQuickActionItem } from './PageQuickActionsGrid';

// Recommended courses
export { PageRecommendedCourses } from './PageRecommendedCourses';
export type { PageRecommendedCoursesProps, RecommendedCourse } from './PageRecommendedCourses';

// Skeletons
export { PageStudentDashboardSkeleton } from './PageStudentDashboardSkeleton';
export type { PageStudentDashboardSkeletonProps } from './PageStudentDashboardSkeleton';

export { PageMCPSetupSkeleton } from './PageMCPSetupSkeleton';
export type { PageMCPSetupSkeletonProps } from './PageMCPSetupSkeleton';
