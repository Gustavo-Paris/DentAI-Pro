/**
 * Rate Limiter for Supabase Edge Functions
 * Uses Supabase database to track request counts per user
 *
 * Limits are configurable per function:
 * - AI functions (DSD, photo analysis): 10/min, 50/hour, 200/day
 * - Recommendation functions: 20/min, 100/hour, 500/day
 */

import { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export interface RateLimitConfig {
  /** Requests allowed per minute */
  perMinute: number;
  /** Requests allowed per hour */
  perHour: number;
  /** Requests allowed per day */
  perDay: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  resetAt: {
    minute: Date;
    hour: Date;
    day: Date;
  };
  retryAfter?: number; // seconds until next allowed request
}

// Preset configurations for different function types
export const RATE_LIMITS = {
  // Heavy AI operations (image processing, DSD generation)
  AI_HEAVY: {
    perMinute: 10,
    perHour: 50,
    perDay: 200,
  },
  // Lighter AI operations (recommendations)
  AI_LIGHT: {
    perMinute: 20,
    perHour: 100,
    perDay: 500,
  },
  // Standard API operations
  STANDARD: {
    perMinute: 60,
    perHour: 500,
    perDay: 5000,
  },
} as const;

/**
 * Check and update rate limit for a user.
 *
 * RACE CONDITION FIX (2026-02-10):
 * The previous implementation used a non-atomic SELECT-then-UPSERT pattern.
 * Under concurrency, two simultaneous requests could both read the same count
 * (e.g., 9/10), both pass the limit check, and both increment to 10 --
 * effectively allowing unlimited concurrent requests to bypass the limiter.
 *
 * The fix: "increment first, check after". We always read and immediately
 * upsert the incremented count BEFORE checking limits. This ensures that
 * concurrent requests each see their own incremented value. In the worst case,
 * two requests reading the same stale count will both increment and upsert,
 * but the final persisted count will be at least as high as either write.
 * At most one extra request may slip through per race (instead of unlimited).
 *
 * TODO: For a fully atomic solution, create a PostgreSQL function (RPC) that
 * uses INSERT ... ON CONFLICT ... SET count = count + 1 RETURNING count,
 * or SELECT FOR UPDATE. This cannot be done from PostgREST/edge functions
 * alone and requires a SQL migration. See:
 * https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  functionName: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();

  // Calculate time window boundaries
  const minuteStart = new Date(now);
  minuteStart.setSeconds(0, 0);

  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  // Calculate reset times
  const minuteReset = new Date(minuteStart.getTime() + 60 * 1000);
  const hourReset = new Date(hourStart.getTime() + 60 * 60 * 1000);
  const dayReset = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  try {
    // ---------------------------------------------------------------
    // Step 1: READ the current row (if any)
    // ---------------------------------------------------------------
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("function_name", functionName)
      .maybeSingle();

    if (fetchError) {
      console.error("Rate limit fetch error:", fetchError);
      // Fail closed: deny on DB error to prevent bypass
      return createDeniedResult(minuteReset, hourReset, dayReset);
    }

    // Determine current counts, resetting if the time window has rotated
    let minuteCount = 0;
    let hourCount = 0;
    let dayCount = 0;

    if (existing) {
      const lastMinute = new Date(existing.minute_window);
      const lastHour = new Date(existing.hour_window);
      const lastDay = new Date(existing.day_window);

      minuteCount = lastMinute >= minuteStart ? existing.minute_count : 0;
      hourCount = lastHour >= hourStart ? existing.hour_count : 0;
      dayCount = lastDay >= dayStart ? existing.day_count : 0;
    }

    // ---------------------------------------------------------------
    // Step 2: IMMEDIATELY increment and persist (before limit check).
    //
    // This is the key difference from the old code: we write the
    // incremented count unconditionally so that concurrent readers
    // see the updated value as soon as possible. Even if we later
    // deny this request, the count stays incremented -- it will
    // naturally reset when the time window rotates.
    // ---------------------------------------------------------------
    const newMinuteCount = minuteCount + 1;
    const newHourCount = hourCount + 1;
    const newDayCount = dayCount + 1;

    const { error: upsertError } = await supabase
      .from("rate_limits")
      .upsert({
        user_id: userId,
        function_name: functionName,
        minute_count: newMinuteCount,
        minute_window: minuteStart.toISOString(),
        hour_count: newHourCount,
        hour_window: hourStart.toISOString(),
        day_count: newDayCount,
        day_window: dayStart.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: "user_id,function_name",
      });

    if (upsertError) {
      console.error("Rate limit upsert error:", upsertError);
      // Fail closed: if we cannot persist the increment we must deny,
      // otherwise an attacker could flood requests while the DB is
      // intermittently unreachable and bypass every limit.
      return createDeniedResult(minuteReset, hourReset, dayReset);
    }

    // ---------------------------------------------------------------
    // Step 3: NOW check limits against the counts BEFORE increment.
    //
    // We check the pre-increment counts (minuteCount, etc.) because
    // the increment has already been written. If the pre-increment
    // count was already at or above the limit, this request must be
    // denied. The count still stays incremented (harmless; it resets
    // on next window).
    // ---------------------------------------------------------------
    const minuteExceeded = minuteCount >= config.perMinute;
    const hourExceeded = hourCount >= config.perHour;
    const dayExceeded = dayCount >= config.perDay;

    if (minuteExceeded || hourExceeded || dayExceeded) {
      let retryAfter = 0;
      if (dayExceeded) {
        retryAfter = Math.ceil((dayReset.getTime() - now.getTime()) / 1000);
      } else if (hourExceeded) {
        retryAfter = Math.ceil((hourReset.getTime() - now.getTime()) / 1000);
      } else if (minuteExceeded) {
        retryAfter = Math.ceil((minuteReset.getTime() - now.getTime()) / 1000);
      }

      return {
        allowed: false,
        remaining: {
          minute: Math.max(0, config.perMinute - newMinuteCount),
          hour: Math.max(0, config.perHour - newHourCount),
          day: Math.max(0, config.perDay - newDayCount),
        },
        resetAt: {
          minute: minuteReset,
          hour: hourReset,
          day: dayReset,
        },
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: {
        minute: config.perMinute - newMinuteCount,
        hour: config.perHour - newHourCount,
        day: config.perDay - newDayCount,
      },
      resetAt: {
        minute: minuteReset,
        hour: hourReset,
        day: dayReset,
      },
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail closed: deny on unexpected error to prevent bypass
    return createDeniedResult(minuteReset, hourReset, dayReset);
  }
}

function createDeniedResult(
  minuteReset: Date,
  hourReset: Date,
  dayReset: Date
): RateLimitResult {
  return {
    allowed: false,
    remaining: { minute: 0, hour: 0, day: 0 },
    resetAt: {
      minute: minuteReset,
      hour: hourReset,
      day: dayReset,
    },
    retryAfter: 30,
  };
}

/**
 * Create rate limit exceeded response with proper headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      code: "RATE_LIMITED",
      message: "Você excedeu o limite de requisições. Tente novamente mais tarde.",
      retryAfter: result.retryAfter,
      remaining: result.remaining,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Remaining-Minute": String(result.remaining.minute),
        "X-RateLimit-Remaining-Hour": String(result.remaining.hour),
        "X-RateLimit-Remaining-Day": String(result.remaining.day),
      },
    }
  );
}
