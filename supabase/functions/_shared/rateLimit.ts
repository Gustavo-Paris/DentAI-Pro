/**
 * Rate Limiter for Supabase Edge Functions
 * Uses atomic PostgreSQL RPC to track request counts per user
 *
 * Limits are configurable per function:
 * - AI functions (DSD, photo analysis): 10/min, 50/hour, 200/day
 * - Recommendation functions: 20/min, 100/hour, 500/day
 */

import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { logger } from "./logger.ts";

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
 * Check and update rate limit for a user using atomic RPC.
 *
 * Uses the `check_and_increment_rate_limit` PostgreSQL function which
 * performs INSERT ... ON CONFLICT DO UPDATE atomically, eliminating
 * the race condition from the previous SELECT + UPSERT pattern.
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
    // Single atomic RPC call: increment counters and return updated values
    const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
      p_user_id: userId,
      p_function_name: functionName,
      p_minute_window: minuteStart.toISOString(),
      p_hour_window: hourStart.toISOString(),
      p_day_window: dayStart.toISOString(),
    });

    if (error || !data || data.length === 0) {
      logger.error("Rate limit RPC error:", error);
      // Fail closed: deny on DB error to prevent bypass
      return createDeniedResult(minuteReset, hourReset, dayReset);
    }

    const row = data[0];
    const minuteCount = row.minute_count;
    const hourCount = row.hour_count;
    const dayCount = row.day_count;

    // Check limits against post-increment counts
    const minuteExceeded = minuteCount > config.perMinute;
    const hourExceeded = hourCount > config.perHour;
    const dayExceeded = dayCount > config.perDay;

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
          minute: Math.max(0, config.perMinute - minuteCount),
          hour: Math.max(0, config.perHour - hourCount),
          day: Math.max(0, config.perDay - dayCount),
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
        minute: config.perMinute - minuteCount,
        hour: config.perHour - hourCount,
        day: config.perDay - dayCount,
      },
      resetAt: {
        minute: minuteReset,
        hour: hourReset,
        day: dayReset,
      },
    };
  } catch (error) {
    logger.error("Rate limit error:", error);
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
