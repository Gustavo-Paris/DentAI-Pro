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
 * Check and update rate limit for a user
 * Uses upsert with conflict resolution for atomic updates
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
    // Get or create rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("function_name", functionName)
      .maybeSingle();

    if (fetchError) {
      console.error("Rate limit fetch error:", fetchError);
      // On error, allow the request but log it
      return createAllowedResult(config, minuteReset, hourReset, dayReset);
    }

    let minuteCount = 0;
    let hourCount = 0;
    let dayCount = 0;

    if (existing) {
      // Reset counts if windows have passed
      const lastMinute = new Date(existing.minute_window);
      const lastHour = new Date(existing.hour_window);
      const lastDay = new Date(existing.day_window);

      minuteCount = lastMinute >= minuteStart ? existing.minute_count : 0;
      hourCount = lastHour >= hourStart ? existing.hour_count : 0;
      dayCount = lastDay >= dayStart ? existing.day_count : 0;
    }

    // Check limits
    const minuteExceeded = minuteCount >= config.perMinute;
    const hourExceeded = hourCount >= config.perHour;
    const dayExceeded = dayCount >= config.perDay;

    if (minuteExceeded || hourExceeded || dayExceeded) {
      // Calculate retry after
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

    // Increment counts
    const newMinuteCount = minuteCount + 1;
    const newHourCount = hourCount + 1;
    const newDayCount = dayCount + 1;

    // Upsert the record
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
      // On error, still allow but log
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
    // On unexpected error, allow the request
    return createAllowedResult(config, minuteReset, hourReset, dayReset);
  }
}

function createAllowedResult(
  config: RateLimitConfig,
  minuteReset: Date,
  hourReset: Date,
  dayReset: Date
): RateLimitResult {
  return {
    allowed: true,
    remaining: {
      minute: config.perMinute - 1,
      hour: config.perHour - 1,
      day: config.perDay - 1,
    },
    resetAt: {
      minute: minuteReset,
      hour: hourReset,
      day: dayReset,
    },
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
