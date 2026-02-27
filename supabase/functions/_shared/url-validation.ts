import { ALLOWED_ORIGINS } from "./allowed-origins.ts";

/**
 * Validates that a redirect URL belongs to an allowed origin.
 * Prevents open-redirect attacks in Stripe checkout/portal sessions.
 *
 * @param url - The URL to validate. If undefined/null, returns true (fallback to origin-based URL).
 * @returns true if the URL is allowed or absent, false otherwise.
 */
export function isAllowedRedirectUrl(url: string | undefined): boolean {
  if (url == null) return true; // fallback to origin-based URL
  try {
    const parsed = new URL(url);
    return ALLOWED_ORIGINS.some((o) => parsed.origin === new URL(o).origin);
  } catch {
    return false;
  }
}
