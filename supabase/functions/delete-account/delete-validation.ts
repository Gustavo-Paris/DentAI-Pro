/**
 * Pure validation logic for account deletion.
 * Extracted for testability — no Supabase or network dependencies.
 */

export const CONFIRMATION_PHRASE = "EXCLUIR MINHA CONTA";

/**
 * Validates that the user typed the exact confirmation phrase.
 * Case-sensitive, no trimming — must match exactly.
 */
export function isValidConfirmation(input: string | undefined | null): boolean {
  return input === CONFIRMATION_PHRASE;
}

/**
 * The ordered list of tables/resources to delete.
 * Children first, auth user last.
 */
export const DELETION_ORDER = [
  "evaluation_drafts",
  "session_detected_teeth",
  "shared_links",
  "evaluations",
  "patients",
  "credit_usage",
  "user_inventory",
  "payment_history",
  "subscriptions",
  "storage:clinical-photos",
  "storage:avatars",
  "credit_transactions",
  "credit_pack_purchases",
  "referral_conversions",
  "referral_codes",
  "rate_limits",
  "storage:dsd-simulations",
  "profiles",
  "auth_user",
] as const;

export type DeletionStep = typeof DELETION_ORDER[number];
