/** Default expiration time (in seconds) for Supabase signed URLs. */
export const SIGNED_URL_EXPIRY_SECONDS = 3600;

/** React Query staleTime presets (in milliseconds). */
export const QUERY_STALE_TIMES = {
  /** 30 seconds — frequently changing data (lists, sessions). */
  SHORT: 30 * 1000,
  /** 1 minute — moderately changing data (profiles, wizard). */
  MEDIUM: 60 * 1000,
  /** 5 minutes — slowly changing data (dashboard stats). */
  LONG: 5 * 60 * 1000,
  /** 10 minutes — rarely changing data (inventory categories). */
  EXTENDED: 10 * 60 * 1000,
  /** 1 hour — nearly static data (subscriptions, landing). */
  VERY_LONG: 60 * 60 * 1000,
} as const;

/** Bonus credits awarded to both referrer and referred user on successful referral. */
export const BONUS_CREDITS = 5;

/** setTimeout / retry delay presets (in milliseconds). */
export const TIMING = {
  /** Supabase fetch abort timeout (auth, db, storage). */
  API_TIMEOUT: 55_000,
  /** Longer timeout for edge function invocations (AI calls). */
  FUNCTION_TIMEOUT: 150_000,
  /** Brief UI delay after wizard submit. */
  WIZARD_SUBMIT_DELAY: 800,
  /** Retry delay for DSD photo processing. */
  DSD_RETRY_DELAY: 2_000,
} as const;
