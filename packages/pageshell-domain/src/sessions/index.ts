/**
 * Sessions Domain Components
 *
 * Components specific to session/meeting display and management.
 */

export { PageSessionCard } from './PageSessionCard';
export type {
  PageSessionCardProps,
  PageSessionCardVariant,
  PageSessionCardStatus,
  PageSessionCardStatusConfig,
  PageSessionCardAction,
  PageSessionCardActionId,
  PageSessionCardUpcomingVariant,
  PageSessionCardUpcomingConfig,
} from './PageSessionCard';

// Backward compatibility aliases
export type { PageSessionCardUpcomingConfig as UpcomingConfig } from './PageSessionCard';
export type { PageSessionCardUpcomingVariant as UpcomingVariant } from './PageSessionCard';

export { PageSessionCardSkeleton } from './PageSessionCardSkeleton';
export type { PageSessionCardSkeletonProps } from './PageSessionCardSkeleton';

export { PageNextSessionCard } from './PageNextSessionCard';
export type {
  PageNextSessionCardProps,
  PageNextSessionCardVariant,
  PageNextSessionCardEmphasis,
} from './PageNextSessionCard';

// Session Presets
export {
  SESSION_STATUS_PRESET,
  SESSION_ACTION_PRESET,
  createSessionAction,
  createSessionActions,
  type SessionActionId,
} from './presets';

// Cancellation Presets
export {
  STUDENT_CANCELLATION_REASONS,
  MENTOR_CANCELLATION_REASONS,
  ADMIN_CANCELLATION_REASONS,
  getCancellationReasonsByRole,
  getCancellationReasonLabel,
  type CancellationReasonId,
  type CancellationReasonOption,
} from './cancellation';
