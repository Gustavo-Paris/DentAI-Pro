/**
 * Session Presets - Reusable configurations for session cards
 *
 * These presets provide standardized labels, icons, and variants for session-related
 * UI components. They define PRESENTATION only - business logic (e.g., when actions
 * are available) should remain in the application layer.
 *
 * @example Using status preset
 * ```tsx
 * import { SESSION_STATUS_PRESET } from '@pageshell/domain/sessions';
 *
 * <PageSessionCard
 *   statusConfig={SESSION_STATUS_PRESET}
 *   ...
 * />
 * ```
 *
 * @example Using action preset with app-layer logic
 * ```tsx
 * import { SESSION_ACTION_PRESET } from '@pageshell/domain/sessions';
 * import { getAvailableActions } from '@/lib/session-actions'; // App logic
 *
 * const availableActions = getAvailableActions(session); // App determines WHEN
 * const actions = availableActions.map(a => ({
 *   id: a.action,
 *   ...SESSION_ACTION_PRESET[a.action], // Preset provides HOW to render
 *   enabled: a.enabled,
 * }));
 * ```
 */

import type { PageSessionCardStatusConfig, PageSessionCardAction } from './PageSessionCard';

// =============================================================================
// Session Status Preset
// =============================================================================

/**
 * Standard status labels and variants for session cards.
 *
 * Covers all common session statuses across student, mentor, and admin views.
 */
export const SESSION_STATUS_PRESET: Record<string, PageSessionCardStatusConfig> = {
  // Active/positive states
  scheduled: { label: 'Agendada', variant: 'warning' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  in_progress: { label: 'Em andamento', variant: 'info' },
  completed: { label: 'Concluída', variant: 'default' },

  // Negative states
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  no_show: { label: 'Não compareceu', variant: 'destructive' },

  // Pending states (for mentor/admin views)
  pending_confirmation: { label: 'Aguardando confirmação', variant: 'warning' },
  pending_payment: { label: 'Aguardando pagamento', variant: 'warning' },

  // Rescheduled
  rescheduled: { label: 'Reagendada', variant: 'info' },
} as const;

// =============================================================================
// Session Action Preset
// =============================================================================

/**
 * Action IDs available for sessions.
 */
export type SessionActionId =
  | 'join'
  | 'cancel'
  | 'reschedule'
  | 'review'
  | 'viewDetails'
  | 'confirm'
  | 'decline'
  | 'message';

/**
 * Standard action configurations for session cards.
 *
 * Defines label, icon, and visual variant for each action.
 * Application layer determines WHEN each action is available.
 */
export const SESSION_ACTION_PRESET: Record<
  SessionActionId,
  Omit<PageSessionCardAction, 'id' | 'enabled'>
> = {
  // Primary actions
  join: {
    label: 'Entrar',
    icon: 'video',
    variant: 'default',
    primary: true,
  },
  cancel: {
    label: 'Cancel',
    icon: 'x',
    variant: 'destructive',
    primary: true,
  },

  // Secondary actions
  reschedule: {
    label: 'Reagendar',
    icon: 'calendar-clock',
    variant: 'outline',
    primary: false,
  },
  review: {
    label: 'Avaliar',
    icon: 'star',
    variant: 'secondary',
    primary: false,
  },
  viewDetails: {
    label: 'Ver Detalhes',
    icon: 'eye',
    variant: 'ghost',
    primary: false,
  },

  // Mentor-specific actions
  confirm: {
    label: 'Confirmar',
    icon: 'video',
    variant: 'default',
    primary: true,
  },
  decline: {
    label: 'Recusar',
    icon: 'x',
    variant: 'destructive',
    primary: false,
  },
  message: {
    label: 'Enviar Mensagem',
    icon: 'eye',
    variant: 'outline',
    primary: false,
  },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a PageSessionCardAction from preset + enabled state.
 *
 * @param actionId - The action identifier
 * @param enabled - Whether the action is currently available
 * @returns Full action config for PageSessionCard
 *
 * @example
 * ```tsx
 * const actions = availableActions.map(a =>
 *   createSessionAction(a.action, a.enabled)
 * );
 * ```
 */
export function createSessionAction(
  actionId: SessionActionId,
  enabled: boolean = true
): PageSessionCardAction {
  const preset = SESSION_ACTION_PRESET[actionId];
  return {
    id: actionId,
    ...preset,
    enabled,
  };
}

/**
 * Creates multiple PageSessionCardActions from a list of action info.
 *
 * @param actions - Array of { action, enabled, warning? } objects
 * @returns Array of full action configs for PageSessionCard
 *
 * @example
 * ```tsx
 * import { getAvailableActions } from '@/lib/session-actions';
 * import { createSessionActions } from '@pageshell/domain/sessions';
 *
 * const availableActions = getAvailableActions(session);
 * const actions = createSessionActions(availableActions);
 * ```
 */
export function createSessionActions(
  actions: Array<{ action: SessionActionId; enabled: boolean }>
): PageSessionCardAction[] {
  return actions.map(({ action, enabled }) => createSessionAction(action, enabled));
}
