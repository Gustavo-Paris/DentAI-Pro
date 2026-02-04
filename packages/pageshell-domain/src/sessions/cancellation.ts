/**
 * Cancellation Presets - Reusable configurations for session cancellation
 *
 * These presets provide standardized cancellation reasons for different user roles.
 * The reasons are presentation-only - business logic for eligibility should remain
 * in the application layer.
 *
 * @example Using with CancelSessionModal
 * ```tsx
 * import { STUDENT_CANCELLATION_REASONS, MENTOR_CANCELLATION_REASONS } from '@pageshell/domain/sessions';
 *
 * const reasons = userRole === "mentor"
 *   ? MENTOR_CANCELLATION_REASONS
 *   : STUDENT_CANCELLATION_REASONS;
 * ```
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Cancellation reason identifiers matching backend enum
 */
export type CancellationReasonId =
  | 'schedule_conflict'
  | 'emergency'
  | 'change_of_plans'
  | 'mentor_unavailable'
  | 'student_request'
  | 'no_show'
  | 'other';

/**
 * Cancellation reason option for select/radio components
 */
export interface CancellationReasonOption {
  /** Unique identifier matching backend */
  value: CancellationReasonId;
  /** Display label */
  label: string;
  /** Optional description for additional context */
  description?: string;
}

// =============================================================================
// Student Cancellation Reasons
// =============================================================================

/**
 * Cancellation reasons available to students
 */
export const STUDENT_CANCELLATION_REASONS: readonly CancellationReasonOption[] = [
  {
    value: 'schedule_conflict',
    label: 'Conflito de agenda',
    description: 'Outro compromisso surgiu',
  },
  {
    value: 'emergency',
    label: 'Emergência',
    description: 'Situação urgente imprevista',
  },
  {
    value: 'change_of_plans',
    label: 'Mudança de planos',
    description: 'Não poderei participar',
  },
  {
    value: 'other',
    label: 'Outro motivo',
    description: 'Especifique nos detalhes',
  },
] as const;

// =============================================================================
// Mentor Cancellation Reasons
// =============================================================================

/**
 * Cancellation reasons available to mentors
 */
export const MENTOR_CANCELLATION_REASONS: readonly CancellationReasonOption[] = [
  {
    value: 'schedule_conflict',
    label: 'Conflito de agenda',
    description: 'Outro compromisso surgiu',
  },
  {
    value: 'emergency',
    label: 'Emergência',
    description: 'Situação urgente imprevista',
  },
  {
    value: 'mentor_unavailable',
    label: 'Indisponível',
    description: 'Não poderei realizar a sessão',
  },
  {
    value: 'other',
    label: 'Outro motivo',
    description: 'Especifique nos detalhes',
  },
] as const;

// =============================================================================
// Admin Cancellation Reasons
// =============================================================================

/**
 * Cancellation reasons available to admins (all options)
 */
export const ADMIN_CANCELLATION_REASONS: readonly CancellationReasonOption[] = [
  {
    value: 'schedule_conflict',
    label: 'Conflito de agenda',
    description: 'Compromisso conflitante',
  },
  {
    value: 'emergency',
    label: 'Emergência',
    description: 'Situação urgente',
  },
  {
    value: 'mentor_unavailable',
    label: 'Mentor indisponível',
    description: 'Mentor não pode realizar',
  },
  {
    value: 'student_request',
    label: 'Solicitação do aluno',
    description: 'Aluno solicitou cancelamento',
  },
  {
    value: 'no_show',
    label: 'Não compareceu',
    description: 'Participante não apareceu',
  },
  {
    value: 'other',
    label: 'Outro motivo',
    description: 'Especifique nos detalhes',
  },
] as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get cancellation reasons by user role
 */
export function getCancellationReasonsByRole(
  role: 'student' | 'mentor' | 'admin'
): readonly CancellationReasonOption[] {
  switch (role) {
    case 'admin':
      return ADMIN_CANCELLATION_REASONS;
    case 'mentor':
      return MENTOR_CANCELLATION_REASONS;
    case 'student':
    default:
      return STUDENT_CANCELLATION_REASONS;
  }
}

/**
 * Get label for a cancellation reason
 */
export function getCancellationReasonLabel(reasonId: CancellationReasonId): string {
  const allReasons = [
    ...STUDENT_CANCELLATION_REASONS,
    ...MENTOR_CANCELLATION_REASONS,
    ...ADMIN_CANCELLATION_REASONS,
  ];
  return allReasons.find((r) => r.value === reasonId)?.label ?? reasonId;
}
