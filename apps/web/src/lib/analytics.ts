/**
 * PostHog analytics wrapper.
 *
 * - Reads VITE_POSTHOG_KEY / VITE_POSTHOG_HOST from env
 * - All exports are no-ops when the key is missing (dev / local)
 * - Autocapture is OFF by default (LGPD compliance)
 * - Capturing is opt-out by default; only enabled after cookie consent
 */
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  'https://us.i.posthog.com';

const isEnabled = (): boolean => Boolean(POSTHOG_KEY);

/** Initialise PostHog. Safe to call multiple times; only the first call takes effect. */
export function initAnalytics(): void {
  if (!isEnabled()) return;

  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    persistence: 'localStorage+cookie',
    opt_out_capturing_by_default: true,
  });
}

/** Identify the logged-in user. */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>,
): void {
  if (!isEnabled()) return;
  posthog.identify(userId, properties);
}

/** Track an explicit event. */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (!isEnabled()) return;
  posthog.capture(name, properties);
}

/** Reset identity on logout. */
export function resetAnalytics(): void {
  if (!isEnabled()) return;
  posthog.reset();
}

/** Opt the current user into capturing (after cookie consent). */
export function optInCapturing(): void {
  if (!isEnabled()) return;
  posthog.opt_in_capturing();
}

/** Opt the current user out of capturing (cookie consent rejected). */
export function optOutCapturing(): void {
  if (!isEnabled()) return;
  posthog.opt_out_capturing();
}
