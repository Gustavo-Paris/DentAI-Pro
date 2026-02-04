/**
 * @pageshell/domain
 *
 * Domain-specific UI components for PageShell.
 *
 * Provides specialized components for specific business domains:
 * - courses: Course cards, progress tracking
 * - sessions: Session cards, scheduling display
 * - credits: Credit cards, coin stacks
 * - gamification: Badges, streaks, tier heroes, progress indicators
 * - dashboard: Activity feeds, quick actions, skeletons
 * - mentorship: Mentor sections with credits
 * - profile: Completion rings, profile editing components
 *
 * @example Direct import (recommended for tree-shaking)
 * ```tsx
 * import { PageCourseCard } from '@pageshell/domain/courses';
 * import { PageSessionCard } from '@pageshell/domain/sessions';
 * import { PageCreditCard } from '@pageshell/domain/credits';
 * import { PageBadgeCard, PageStreakCard } from '@pageshell/domain/gamification';
 * import { PageActivityFeed } from '@pageshell/domain/dashboard';
 * import { PageMentorSection } from '@pageshell/domain/mentorship';
 * import { PageCompletionRing } from '@pageshell/domain/profile';
 * ```
 *
 * @example Barrel import (all domain components)
 * ```tsx
 * import { PageCourseCard, PageSessionCard, PageCreditCard, PageBadgeCard, PageCompletionRing } from '@pageshell/domain';
 * ```
 *
 * @packageDocumentation
 */

// Courses (fully migrated)
export * from './courses';

// Sessions (fully migrated)
export * from './sessions';

// Credits (fully migrated)
export * from './credits';

// Gamification (fully migrated)
export * from './gamification';

// Dashboard (fully migrated)
export * from './dashboard';

// Mentorship (fully migrated)
export * from './mentorship';

// Primitives (general-purpose domain primitives)
export * from './primitives';

// Profile (user profile display and editing)
export * from './profile';

// Settings (settings pages and navigation - Deep Consolidation Phase 2)
export * from './settings';
