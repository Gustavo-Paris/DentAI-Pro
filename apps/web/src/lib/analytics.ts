/**
 * PostHog analytics wrapper.
 *
 * - Reads VITE_POSTHOG_KEY / VITE_POSTHOG_HOST from env
 * - All exports are no-ops when the key is missing (dev / local)
 * - Autocapture is OFF by default (LGPD compliance)
 * - Capturing is opt-out by default; only enabled after cookie consent
 * - posthog-js is **lazy-loaded** via dynamic import to keep the initial bundle small
 */

type PostHogLike = {
  init: (key: string, opts: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  capture: (name: string, props?: Record<string, unknown>) => void;
  reset: () => void;
  opt_in_capturing: () => void;
  opt_out_capturing: () => void;
};

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  'https://us.i.posthog.com';

const isEnabled = (): boolean => Boolean(POSTHOG_KEY);

/** Resolves to the posthog-js default export. Cached after first load. */
let posthogPromise: Promise<PostHogLike> | null = null;

function loadPostHog(): Promise<PostHogLike> {
  if (!posthogPromise) {
    posthogPromise = import('posthog-js').then((m) => m.default as unknown as PostHogLike);
  }
  return posthogPromise;
}

/**
 * Get the posthog instance, loading it lazily if needed.
 * Returns null immediately when the key is missing.
 */
async function getPostHog(): Promise<PostHogLike | null> {
  if (!isEnabled()) return null;
  return loadPostHog();
}

/** Initialise PostHog. Safe to call multiple times; only the first call takes effect. */
export async function initAnalytics(): Promise<void> {
  const posthog = await getPostHog();
  if (!posthog) return;

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
export async function identifyUser(
  userId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const posthog = await getPostHog();
  if (!posthog) return;
  posthog.identify(userId, properties);
}

/** Track an explicit event. */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (!isEnabled()) return;
  // Fire-and-forget — don't block the caller
  void getPostHog().then((posthog) => {
    posthog?.capture(name, properties);
  });
}

/** Reset identity on logout. */
export async function resetAnalytics(): Promise<void> {
  const posthog = await getPostHog();
  if (!posthog) return;
  posthog.reset();
}

/** Opt the current user into capturing (after cookie consent). */
export async function optInCapturing(): Promise<void> {
  const posthog = await getPostHog();
  if (!posthog) return;
  posthog.opt_in_capturing();
}

/** Opt the current user out of capturing (cookie consent rejected). */
export async function optOutCapturing(): Promise<void> {
  const posthog = await getPostHog();
  if (!posthog) return;
  posthog.opt_out_capturing();
}
