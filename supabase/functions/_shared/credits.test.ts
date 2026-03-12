/**
 * Tests for credits.ts
 *
 * Covers:
 * - checkAndUseCredits: allowed when credits consumed successfully
 * - checkAndUseCredits: denied when use_credits RPC returns false (insufficient credits)
 * - checkAndUseCredits: fail-closed on RPC error
 * - checkAndUseCredits: idempotent (already-consumed operationId is re-allowed)
 * - getCreditInfo: correct available calculation (totalCredits - used)
 * - getCreditInfo: zero available when subscription inactive
 * - getCreditInfo: credits_per_month cast issue (line 103) — plan as object with credits_per_month
 * - refundCredits: returns true on successful refund
 * - refundCredits: returns false on RPC error
 * - refundCredits: idempotent (already-refunded operationId skips RPC)
 * - createInsufficientCreditsResponse: HTTP 402 with correct body
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  checkAndUseCredits,
  refundCredits,
  createInsufficientCreditsResponse,
} from "./credits.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RpcName = "use_credits" | "refund_credits" | "check_and_increment_rate_limit";

interface MockCall {
  rpc?: string;
  table?: string;
  method?: string;
}

/**
 * Build a minimal Supabase client stub.
 * - rpcResults: map from RPC name → return value
 * - tableData: map from table name → return value for select/insert
 * - userId: used to build auth.admin stub
 */
function makeClient({
  rpcResults = {} as Record<RpcName | string, { data: unknown; error: unknown }>,
  tableResults = {} as Record<string, { data: unknown; error: unknown }>,
  alreadyConsumed = false,
  alreadyRefunded = false,
}: {
  rpcResults?: Record<string, { data: unknown; error: unknown }>;
  tableResults?: Record<string, { data: unknown; error: unknown }>;
  alreadyConsumed?: boolean;
  alreadyRefunded?: boolean;
} = {}) {
  const calls: MockCall[] = [];

  const buildChain = (tableName: string) => {
    let _eq1: unknown, _eq2: unknown, _eq3: unknown;
    const chain = {
      select: (_cols: string) => chain,
      eq: (_col: string, _val: unknown) => chain,
      maybeSingle: async () => {
        // Handle idempotency guard tables
        if (tableName === "credit_transactions") {
          // Return existing record for idempotent checks based on mock config
          if (alreadyConsumed) return { data: { id: "tx-1" }, error: null };
          if (alreadyRefunded) return { data: { id: "tx-2" }, error: null };
          return { data: null, error: null };
        }
        if (tableResults[tableName]) return tableResults[tableName];
        // Default subscription for getCreditInfo
        if (tableName === "subscriptions") {
          return {
            data: {
              credits_used_this_month: 10,
              credits_rollover: 5,
              credits_bonus: 0,
              plan_id: "pro",
              status: "active",
              plan: { credits_per_month: 100 },
            },
            error: null,
          };
        }
        if (tableName === "credit_costs") {
          return { data: { credits: 5 }, error: null };
        }
        return { data: null, error: null };
      },
    };
    return chain;
  };

  return {
    _calls: calls,
    rpc: async (name: string, _params?: unknown) => {
      calls.push({ rpc: name });
      if (rpcResults[name]) return rpcResults[name];
      return { data: null, error: null };
    },
    from: (tableName: string) => {
      calls.push({ table: tableName });
      return {
        ...buildChain(tableName),
        insert: async (_data: unknown) => {
          return { data: null, error: null };
        },
      };
    },
    auth: {
      admin: {
        getUserById: async (_id: string) => ({
          data: { user: { email: "test@test.com", user_metadata: { full_name: "Test User" } } },
          error: null,
        }),
      },
    },
  } as unknown as Parameters<typeof checkAndUseCredits>[0];
}

// ---------------------------------------------------------------------------
// checkAndUseCredits — allowed path
// ---------------------------------------------------------------------------

Deno.test("allows request when use_credits RPC returns true (credits consumed)", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: true, error: null } },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, true);
  assertEquals(result.creditsAvailable >= 0, true);
});

Deno.test("allowed result includes creditsCost from credit_costs table", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: true, error: null } },
    tableResults: {
      credit_costs: { data: { credits: 5 }, error: null },
    },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, true);
  assertEquals(result.creditsCost, 5);
});

// ---------------------------------------------------------------------------
// checkAndUseCredits — denied path (insufficient credits)
// ---------------------------------------------------------------------------

Deno.test("denies when use_credits RPC returns false (insufficient credits)", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: false, error: null } },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, false);
});

Deno.test("denied result has non-negative creditsAvailable", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: false, error: null } },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, false);
  assertEquals(result.creditsAvailable >= 0, true);
});

// ---------------------------------------------------------------------------
// checkAndUseCredits — fail-closed on RPC error
// ---------------------------------------------------------------------------

Deno.test("fail-closed: RPC error returns allowed=false, creditsAvailable=0", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: null, error: { message: "DB connection failed" } } },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, false);
  assertEquals(result.creditsAvailable, 0);
  assertEquals(result.creditsCost, 0);
  assertEquals(result.isFreeUser, false);
});

// ---------------------------------------------------------------------------
// checkAndUseCredits — idempotency (operationId already consumed)
// ---------------------------------------------------------------------------

Deno.test("idempotent: already-consumed operationId returns allowed=true without re-charging", async () => {
  const client = makeClient({ alreadyConsumed: true });

  const result = await checkAndUseCredits(
    client,
    "user-1",
    "case_analysis",
    "op-123",
  );

  assertEquals(result.allowed, true);
});

// ---------------------------------------------------------------------------
// getCreditInfo via allowed path (internal function behavior)
// Credits calculation: (plan.credits_per_month + rollover + bonus) - used
// ---------------------------------------------------------------------------

Deno.test("available credits = plan credits + rollover + bonus - used", async () => {
  // plan: 100, rollover: 5, bonus: 0, used: 10 → available = 95
  const client = makeClient({
    rpcResults: { use_credits: { data: true, error: null } },
    tableResults: {
      subscriptions: {
        data: {
          credits_used_this_month: 10,
          credits_rollover: 5,
          credits_bonus: 0,
          plan_id: "pro",
          status: "active",
          plan: { credits_per_month: 100 },
        },
        error: null,
      },
    },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, true);
  assertEquals(result.creditsAvailable, 95);
});

Deno.test("available credits clamped to 0 when used > total", async () => {
  // plan: 10, rollover: 0, bonus: 0, used: 99 → max(0, 10 - 99) = 0
  const client = makeClient({
    rpcResults: { use_credits: { data: true, error: null } },
    tableResults: {
      subscriptions: {
        data: {
          credits_used_this_month: 99,
          credits_rollover: 0,
          credits_bonus: 0,
          plan_id: "pro",
          status: "active",
          plan: { credits_per_month: 10 },
        },
        error: null,
      },
    },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, true);
  assertEquals(result.creditsAvailable, 0);
});

Deno.test("isFreeUser=true when subscription is inactive", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: false, error: null } },
    tableResults: {
      subscriptions: {
        data: {
          credits_used_this_month: 0,
          credits_rollover: 0,
          credits_bonus: 0,
          plan_id: "pro",
          status: "canceled",
          plan: { credits_per_month: 100 },
        },
        error: null,
      },
    },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, false);
  assertEquals(result.isFreeUser, true);
  assertEquals(result.creditsAvailable, 0);
});

Deno.test("isFreeUser=true when plan_id is starter", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: false, error: null } },
    tableResults: {
      subscriptions: {
        data: {
          credits_used_this_month: 0,
          credits_rollover: 0,
          credits_bonus: 0,
          plan_id: "starter",
          status: "active",
          plan: { credits_per_month: 5 },
        },
        error: null,
      },
    },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.isFreeUser, true);
});

// ---------------------------------------------------------------------------
// credits_per_month cast issue (line ~103 in credits.ts)
// The plan column returns nested object: `plan: { credits_per_month: N }`
// The code casts `sub.plan as unknown as { credits_per_month: number } | null`
// We verify this produces correct arithmetic when the cast resolves correctly.
// ---------------------------------------------------------------------------

Deno.test("credits_per_month cast: plan object with credits_per_month computes correctly", async () => {
  // This directly exercises the cast at line ~103:
  //   const plan = sub.plan as unknown as { credits_per_month: number } | null;
  //   const totalCredits = (plan?.credits_per_month || 0) + rollover + bonus
  const client = makeClient({
    rpcResults: { use_credits: { data: true, error: null } },
    tableResults: {
      subscriptions: {
        data: {
          credits_used_this_month: 0,
          credits_rollover: 0,
          credits_bonus: 0,
          plan_id: "pro",
          status: "active",
          plan: { credits_per_month: 200 }, // The nested object Supabase returns
        },
        error: null,
      },
    },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, true);
  assertEquals(result.creditsAvailable, 200); // 200 + 0 + 0 - 0 = 200
});

Deno.test("credits_per_month cast: null plan falls back to 0", async () => {
  const client = makeClient({
    rpcResults: { use_credits: { data: true, error: null } },
    tableResults: {
      subscriptions: {
        data: {
          credits_used_this_month: 0,
          credits_rollover: 10,
          credits_bonus: 5,
          plan_id: "pro",
          status: "active",
          plan: null, // null plan — fallback to 0 + rollover + bonus
        },
        error: null,
      },
    },
  });

  const result = await checkAndUseCredits(client, "user-1", "case_analysis");

  assertEquals(result.allowed, true);
  assertEquals(result.creditsAvailable, 15); // 0 + 10 + 5 - 0 = 15
});

// ---------------------------------------------------------------------------
// refundCredits
// ---------------------------------------------------------------------------

Deno.test("refundCredits: returns true when RPC succeeds", async () => {
  const client = makeClient({
    rpcResults: { refund_credits: { data: true, error: null } },
  });

  const result = await refundCredits(client, "user-1", "case_analysis");

  assertEquals(result, true);
});

Deno.test("refundCredits: returns false when RPC returns error", async () => {
  const client = makeClient({
    rpcResults: { refund_credits: { data: null, error: { message: "DB error" } } },
  });

  const result = await refundCredits(client, "user-1", "case_analysis");

  assertEquals(result, false);
});

Deno.test("refundCredits: returns false when RPC returns falsy data", async () => {
  const client = makeClient({
    rpcResults: { refund_credits: { data: false, error: null } },
  });

  const result = await refundCredits(client, "user-1", "case_analysis");

  assertEquals(result, false);
});

Deno.test("refundCredits: idempotent — already-refunded operationId returns true without RPC", async () => {
  const client = makeClient({ alreadyRefunded: true });

  const result = await refundCredits(client, "user-1", "case_analysis", "op-456");

  assertEquals(result, true);
  // RPC must NOT have been called — idempotent path skips the refund
  const rpcCalls = (client as unknown as { _calls: { rpc?: string }[] })._calls.filter(
    (c) => c.rpc === "refund_credits"
  );
  assertEquals(rpcCalls.length, 0, "refund_credits RPC must not be called for already-refunded operation");
});

Deno.test("refundCredits: with operationId calls RPC when not yet refunded", async () => {
  const client = makeClient({
    rpcResults: { refund_credits: { data: true, error: null } },
    alreadyRefunded: false,
  });

  const result = await refundCredits(client, "user-1", "case_analysis", "op-789");

  assertEquals(result, true);
});

// ---------------------------------------------------------------------------
// createInsufficientCreditsResponse
// ---------------------------------------------------------------------------

Deno.test("createInsufficientCreditsResponse returns HTTP 402", () => {
  const result = {
    allowed: false,
    creditsAvailable: 2,
    creditsCost: 5,
    isFreeUser: false,
  };

  const response = createInsufficientCreditsResponse(result, {});

  assertEquals(response.status, 402);
});

Deno.test("createInsufficientCreditsResponse body has correct fields", async () => {
  const result = {
    allowed: false,
    creditsAvailable: 2,
    creditsCost: 5,
    isFreeUser: true,
  };

  const response = createInsufficientCreditsResponse(result, {
    "Access-Control-Allow-Origin": "*",
  });
  const body = await response.json();

  assertEquals(body.code, "INSUFFICIENT_CREDITS");
  assertEquals(body.credits_available, 2);
  assertEquals(body.credits_required, 5);
  assertEquals(body.is_free_user, true);
  assertEquals(body.upgrade_url, "/pricing");
  assertExists(body.error);
});

Deno.test("createInsufficientCreditsResponse forwards CORS headers", () => {
  const result = {
    allowed: false,
    creditsAvailable: 0,
    creditsCost: 1,
    isFreeUser: false,
  };

  const response = createInsufficientCreditsResponse(result, {
    "Access-Control-Allow-Origin": "https://tosmile-ai.vercel.app",
  });

  assertEquals(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://tosmile-ai.vercel.app",
  );
  assertEquals(response.headers.get("Content-Type"), "application/json");
});
