/**
 * Referral code validation helpers.
 *
 * Extracted from apply-referral/index.ts so pure-logic rules
 * can be unit-tested without spinning up the full edge function.
 */

/** Bonus credits granted to both referrer and referred user. */
export const BONUS_CREDITS = 5;

/** Allowed referral-code format: 4-20 alphanumeric chars or hyphens. */
export const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9\-]{4,20}$/;

/**
 * Returns `true` when `code` is a non-empty string that matches
 * `REFERRAL_CODE_PATTERN` after trimming whitespace.
 */
export function isValidReferralCode(
  code: string | undefined | null,
): boolean {
  if (code == null) return false;
  const trimmed = code.trim();
  if (trimmed.length === 0) return false;
  return REFERRAL_CODE_PATTERN.test(trimmed);
}

/**
 * Returns `true` when the referrer and the current user are the same person.
 */
export function isSelfReferral(
  referrerUserId: string,
  currentUserId: string,
): boolean {
  return referrerUserId === currentUserId;
}
