/**
 * Tests for rateLimit.ts
 *
 * Covers:
 * - Per-window enforcement (>= not >, exactly N requests allowed)
 * - Different rate limit tiers (AI_HEAVY, AI_LIGHT, STANDARD, REFERRAL)
 * - Allowed result with correct remaining counts
 * - Denied result when minute/hour/day limit is hit
 * - Retry-after uses the most urgent window
 * - DB error → fail-closed (denied, retryAfter=30)
 * - Unexpected throw → fail-closed
 * - createRateLimitResponse produces correct HTTP 429 response
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
  type RateLimitConfig,
} from "./rateLimit.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Supabase client stub whose rpc() returns the supplied data. */
function makeClient(
  rpcReturn: { data: unknown; error: unknown } | null = null,
  shouldThrow = false,
) {
  return {
    rpc: async (..._args: unknown[]) => {
      if (shouldThrow) throw new Error("unexpected network error");
      return rpcReturn ?? { data: null, error: null };
    },
  } as unknown as Parameters<typeof checkRateLimit>[0];
}

/** Config where every tier limit is the same value — useful for boundary tests. */
function uniformConfig(n: number): RateLimitConfig {
  return { perMinute: n, perHour: n, perDay: n };
}

// ---------------------------------------------------------------------------
// RATE_LIMITS preset sanity checks
// ---------------------------------------------------------------------------

Deno.test("RATE_LIMITS.AI_HEAVY has correct limits", () => {
  assertEquals(RATE_LIMITS.AI_HEAVY.perMinute, 10);
  assertEquals(RATE_LIMITS.AI_HEAVY.perHour, 50);
  assertEquals(RATE_LIMITS.AI_HEAVY.perDay, 200);
});

Deno.test("RATE_LIMITS.AI_LIGHT has correct limits", () => {
  assertEquals(RATE_LIMITS.AI_LIGHT.perMinute, 20);
  assertEquals(RATE_LIMITS.AI_LIGHT.perHour, 100);
  assertEquals(RATE_LIMITS.AI_LIGHT.perDay, 500);
});

Deno.test("RATE_LIMITS.STANDARD has correct limits", () => {
  assertEquals(RATE_LIMITS.STANDARD.perMinute, 60);
  assertEquals(RATE_LIMITS.STANDARD.perHour, 500);
  assertEquals(RATE_LIMITS.STANDARD.perDay, 5000);
});

Deno.test("RATE_LIMITS.REFERRAL has correct limits", () => {
  assertEquals(RATE_LIMITS.REFERRAL.perMinute, 5);
  assertEquals(RATE_LIMITS.REFERRAL.perHour, 20);
  assertEquals(RATE_LIMITS.REFERRAL.perDay, 50);
});

// ---------------------------------------------------------------------------
// Allowed path
// ---------------------------------------------------------------------------

Deno.test("allows request when counts are below all limits", async () => {
  const config = { perMinute: 10, perHour: 50, perDay: 200 };
  const client = makeClient({
    data: [{ minute_count: 5, hour_count: 20, day_count: 100 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-1", "analyze-photo", config);

  assertEquals(result.allowed, true);
  assertEquals(result.remaining.minute, 5);
  assertEquals(result.remaining.hour, 30);
  assertEquals(result.remaining.day, 100);
});

Deno.test("remaining counts are correctly calculated when allowed", async () => {
  const config = { perMinute: 20, perHour: 100, perDay: 500 };
  const client = makeClient({
    data: [{ minute_count: 1, hour_count: 1, day_count: 1 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-2", "recommend-resin", config);

  assertEquals(result.allowed, true);
  assertEquals(result.remaining.minute, 19);
  assertEquals(result.remaining.hour, 99);
  assertEquals(result.remaining.day, 499);
});

// ---------------------------------------------------------------------------
// Boundary: >= enforcement (not >)
// P2-58: exactly N requests are allowed; the Nth+1 is denied.
// RPC returns post-increment count, so count=limit means limit has been hit.
// ---------------------------------------------------------------------------

Deno.test("denies when minute count equals perMinute (>= boundary)", async () => {
  const config = uniformConfig(10);
  const client = makeClient({
    data: [{ minute_count: 10, hour_count: 1, day_count: 1 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-3", "analyze-photo", config);

  assertEquals(result.allowed, false);
  assertEquals(result.remaining.minute, 0);
});

Deno.test("allows when minute count equals perMinute minus one (within limit)", async () => {
  const config = uniformConfig(10);
  const client = makeClient({
    data: [{ minute_count: 9, hour_count: 1, day_count: 1 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-4", "analyze-photo", config);

  assertEquals(result.allowed, true);
  assertEquals(result.remaining.minute, 1);
});

Deno.test("denies when hour count equals perHour", async () => {
  const config = { perMinute: 100, perHour: 50, perDay: 1000 };
  const client = makeClient({
    data: [{ minute_count: 1, hour_count: 50, day_count: 10 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-5", "analyze-photo", config);

  assertEquals(result.allowed, false);
  assertEquals(result.remaining.hour, 0);
});

Deno.test("denies when day count equals perDay", async () => {
  const config = { perMinute: 100, perHour: 500, perDay: 200 };
  const client = makeClient({
    data: [{ minute_count: 1, hour_count: 1, day_count: 200 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-6", "analyze-photo", config);

  assertEquals(result.allowed, false);
  assertEquals(result.remaining.day, 0);
});

// ---------------------------------------------------------------------------
// retryAfter logic — most urgent window wins
// ---------------------------------------------------------------------------

Deno.test("retryAfter is positive when minute limit is exceeded", async () => {
  const config = uniformConfig(5);
  const client = makeClient({
    data: [{ minute_count: 5, hour_count: 1, day_count: 1 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-7", "analyze-photo", config);

  assertEquals(result.allowed, false);
  assertExists(result.retryAfter);
  assertEquals(typeof result.retryAfter, "number");
  assertEquals(result.retryAfter > 0, true);
});

Deno.test("retryAfter is longer when day limit is exceeded (day > hour > minute)", async () => {
  const config = { perMinute: 100, perHour: 100, perDay: 1 };
  const client = makeClient({
    data: [{ minute_count: 1, hour_count: 1, day_count: 1 }],
    error: null,
  });

  const resultDay = await checkRateLimit(client, "user-8", "analyze-photo", config);

  const configHour = { perMinute: 100, perHour: 1, perDay: 1000 };
  const clientHour = makeClient({
    data: [{ minute_count: 1, hour_count: 1, day_count: 1 }],
    error: null,
  });
  const resultHour = await checkRateLimit(clientHour, "user-8", "analyze-photo", configHour);

  // Day limit retryAfter should be greater than hour limit retryAfter
  assertEquals(resultDay.allowed, false);
  assertEquals(resultHour.allowed, false);
  assertExists(resultDay.retryAfter);
  assertExists(resultHour.retryAfter);
  assertEquals(resultDay.retryAfter! > resultHour.retryAfter!, true);
});

// ---------------------------------------------------------------------------
// remaining is clamped to 0 when counts exceed limits
// ---------------------------------------------------------------------------

Deno.test("remaining values never go negative (clamped at 0)", async () => {
  const config = uniformConfig(5);
  const client = makeClient({
    data: [{ minute_count: 99, hour_count: 99, day_count: 99 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-9", "analyze-photo", config);

  assertEquals(result.allowed, false);
  assertEquals(result.remaining.minute, 0);
  assertEquals(result.remaining.hour, 0);
  assertEquals(result.remaining.day, 0);
});

// ---------------------------------------------------------------------------
// resetAt timestamps are Date objects
// ---------------------------------------------------------------------------

Deno.test("resetAt contains Date objects for all windows", async () => {
  const config = uniformConfig(10);
  const client = makeClient({
    data: [{ minute_count: 1, hour_count: 1, day_count: 1 }],
    error: null,
  });

  const result = await checkRateLimit(client, "user-10", "fn", config);

  assertEquals(result.resetAt.minute instanceof Date, true);
  assertEquals(result.resetAt.hour instanceof Date, true);
  assertEquals(result.resetAt.day instanceof Date, true);
});

// ---------------------------------------------------------------------------
// Fail-closed: DB error → deny
// ---------------------------------------------------------------------------

Deno.test("fail-closed: DB error returns denied result", async () => {
  const client = makeClient({ data: null, error: { message: "connection failed" } });

  const result = await checkRateLimit(
    client,
    "user-11",
    "analyze-photo",
    RATE_LIMITS.AI_HEAVY,
  );

  assertEquals(result.allowed, false);
  assertEquals(result.remaining.minute, 0);
  assertEquals(result.remaining.hour, 0);
  assertEquals(result.remaining.day, 0);
  assertEquals(result.retryAfter, 30);
});

Deno.test("fail-closed: empty data array returns denied result", async () => {
  const client = makeClient({ data: [], error: null });

  const result = await checkRateLimit(
    client,
    "user-12",
    "analyze-photo",
    RATE_LIMITS.AI_HEAVY,
  );

  assertEquals(result.allowed, false);
  assertEquals(result.retryAfter, 30);
});

Deno.test("fail-closed: RPC throw returns denied result (does not propagate)", async () => {
  const client = makeClient(null, true /* shouldThrow */);

  const result = await checkRateLimit(
    client,
    "user-13",
    "analyze-photo",
    RATE_LIMITS.AI_HEAVY,
  );

  assertEquals(result.allowed, false);
  assertEquals(result.retryAfter, 30);
});

// ---------------------------------------------------------------------------
// createRateLimitResponse
// ---------------------------------------------------------------------------

Deno.test("createRateLimitResponse returns HTTP 429 with correct headers", () => {
  const result = {
    allowed: false,
    remaining: { minute: 0, hour: 5, day: 50 },
    resetAt: {
      minute: new Date(),
      hour: new Date(),
      day: new Date(),
    },
    retryAfter: 45,
  };
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };

  const response = createRateLimitResponse(result, corsHeaders);

  assertEquals(response.status, 429);
  assertEquals(response.headers.get("Retry-After"), "45");
  assertEquals(response.headers.get("X-RateLimit-Remaining-Minute"), "0");
  assertEquals(response.headers.get("X-RateLimit-Remaining-Hour"), "5");
  assertEquals(response.headers.get("X-RateLimit-Remaining-Day"), "50");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Content-Type"), "application/json");
});

Deno.test("createRateLimitResponse body contains expected fields", async () => {
  const result = {
    allowed: false,
    remaining: { minute: 0, hour: 0, day: 0 },
    resetAt: { minute: new Date(), hour: new Date(), day: new Date() },
    retryAfter: 30,
  };

  const response = createRateLimitResponse(result, {});
  const body = await response.json();

  assertEquals(body.error, "Rate limit exceeded");
  assertEquals(body.code, "RATE_LIMITED");
  assertEquals(body.retryAfter, 30);
  assertExists(body.remaining);
});

Deno.test("createRateLimitResponse uses 60 as fallback when retryAfter is missing", () => {
  const result = {
    allowed: false,
    remaining: { minute: 0, hour: 0, day: 0 },
    resetAt: { minute: new Date(), hour: new Date(), day: new Date() },
    // No retryAfter
  };

  const response = createRateLimitResponse(result, {});
  assertEquals(response.headers.get("Retry-After"), "60");
});
