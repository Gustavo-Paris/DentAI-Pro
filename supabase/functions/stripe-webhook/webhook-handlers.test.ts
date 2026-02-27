/**
 * Tests for webhook-handlers.ts
 *
 * Covers all 7 handler functions with mock Supabase and Stripe clients.
 * Pattern: Deno std assertions, fluent-chain mock Supabase, test builders.
 */

import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import {
  resolveInternalPlanId,
  handleCheckoutCompleted,
  handleSubscriptionUpdate,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoiceFailed,
  handleCreditPackPurchase,
} from "./webhook-handlers.ts";

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

type MockRow = Record<string, unknown>;

interface MockTableConfig {
  selectData?: MockRow | MockRow[] | null;
  upsertError?: { message: string } | null;
  updateError?: { message: string } | null;
  insertError?: { message: string } | null;
  rpcError?: { message: string } | null;
}

/**
 * Creates a mock Supabase client with configurable table responses.
 * Tables not configured return null by default.
 */
function createMockSupabase(tables: Record<string, MockTableConfig> = {}) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = [];

  const supabase = {
    _calls: calls,
    from: (table: string) => {
      const config = tables[table] || {};
      return {
        select: (_cols: string) => ({
          eq: (_col: string, _val: unknown) => ({
            maybeSingle: () => {
              calls.push({ table, method: "select.eq.maybeSingle", args: [_col, _val] });
              return Promise.resolve({ data: config.selectData ?? null });
            },
            single: () => {
              calls.push({ table, method: "select.eq.single", args: [_col, _val] });
              return Promise.resolve({ data: config.selectData ?? null, error: config.selectData ? null : { message: "not found" } });
            },
          }),
        }),
        upsert: (_data: unknown, _opts?: unknown) => {
          calls.push({ table, method: "upsert", args: [_data, _opts] });
          return Promise.resolve({ error: config.upsertError ?? null });
        },
        update: (_data: unknown) => ({
          eq: (_col: string, _val: unknown) => {
            calls.push({ table, method: "update.eq", args: [_data, _col, _val] });
            return Promise.resolve({ error: config.updateError ?? null });
          },
        }),
        insert: (_data: unknown) => {
          calls.push({ table, method: "insert", args: [_data] });
          return Promise.resolve({ error: config.insertError ?? null });
        },
      };
    },
    rpc: (fn: string, params: unknown) => {
      calls.push({ table: `rpc:${fn}`, method: "rpc", args: [params] });
      return Promise.resolve({ error: tables._rpc?.rpcError ?? null });
    },
    auth: {
      admin: {
        getUserById: (_id: string) => Promise.resolve({
          data: { user: { email: "test@example.com" } },
        }),
      },
    },
  };

  // deno-lint-ignore no-explicit-any
  return supabase as any;
}

/** Creates a mock Stripe client for subscription retrieval. */
function createMockStripe(subOverrides: Record<string, unknown> = {}) {
  return {
    subscriptions: {
      retrieve: (_id: string) => Promise.resolve({
        metadata: { supabase_user_id: "user-123" },
        items: { data: [{ price: { id: "price_abc" } }] },
        status: "active",
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
        cancel_at_period_end: false,
        trial_start: null,
        trial_end: null,
        ...subOverrides,
      }),
    },
    // deno-lint-ignore no-explicit-any
  } as any;
}

// ---------------------------------------------------------------------------
// Test builders
// ---------------------------------------------------------------------------

function makeCheckoutSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_123",
    customer: "cus_test_123",
    subscription: "sub_test_123",
    mode: "subscription",
    metadata: {},
    amount_total: 2990,
    ...overrides,
    // deno-lint-ignore no-explicit-any
  } as any;
}

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_test_123",
    customer: "cus_test_123",
    metadata: { supabase_user_id: "user-123" },
    items: { data: [{ price: { id: "price_abc" } }] },
    status: "active",
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    cancel_at_period_end: false,
    canceled_at: null,
    ...overrides,
    // deno-lint-ignore no-explicit-any
  } as any;
}

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv_test_123",
    customer: "cus_test_123",
    amount_paid: 2990,
    amount_due: 2990,
    currency: "brl",
    payment_intent: "pi_test_123",
    hosted_invoice_url: "https://stripe.com/invoice/test",
    invoice_pdf: "https://stripe.com/invoice/test.pdf",
    description: null,
    lines: { data: [{ description: "Assinatura Premium" }] },
    ...overrides,
    // deno-lint-ignore no-explicit-any
  } as any;
}

// ==========================================================================
// resolveInternalPlanId
// ==========================================================================

Deno.test("resolveInternalPlanId returns plan ID when mapping exists", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_premium" } },
  });

  const planId = await resolveInternalPlanId(supabase, "price_abc");
  assertEquals(planId, "plan_premium");
});

Deno.test("resolveInternalPlanId falls back to price ID when no mapping", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: null },
  });

  const planId = await resolveInternalPlanId(supabase, "price_unknown");
  assertEquals(planId, "price_unknown");
});

Deno.test("resolveInternalPlanId falls back when data.id is empty string", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "" } },
  });

  const planId = await resolveInternalPlanId(supabase, "price_xyz");
  assertEquals(planId, "price_xyz");
});

// ==========================================================================
// handleCheckoutCompleted — subscription flow
// ==========================================================================

Deno.test("handleCheckoutCompleted inserts new subscription when none exists", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_premium" } },
    subscriptions: { selectData: null },
  });
  const stripe = createMockStripe();

  await handleCheckoutCompleted(supabase, makeCheckoutSession(), stripe);

  // Should have called insert (not update) since no existing subscription
  const insertCall = supabase._calls.find(
    (c: { table: string; method: string }) => c.table === "subscriptions" && c.method === "insert",
  );
  assertEquals(insertCall !== undefined, true, "Should insert new subscription");
});

Deno.test("handleCheckoutCompleted updates existing subscription", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_premium" } },
    subscriptions: { selectData: { id: "sub-row-id" } },
  });
  const stripe = createMockStripe();

  await handleCheckoutCompleted(supabase, makeCheckoutSession(), stripe);

  const updateCall = supabase._calls.find(
    (c: { table: string; method: string }) => c.table === "subscriptions" && c.method === "update.eq",
  );
  assertEquals(updateCall !== undefined, true, "Should update existing subscription");
});

Deno.test("handleCheckoutCompleted resolves user from customer ID when metadata missing", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_free" } },
    subscriptions: { selectData: { user_id: "user-fallback" } },
  });
  const stripe = createMockStripe({ metadata: {} });

  // Should not throw — resolves user from customer lookup
  await handleCheckoutCompleted(supabase, makeCheckoutSession(), stripe);
});

Deno.test("handleCheckoutCompleted returns early for missing user and no existing sub", async () => {
  // Create custom supabase that returns null for BOTH subscription lookups
  const calls: Array<{ table: string; method: string }> = [];
  const supabase = {
    _calls: calls,
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          maybeSingle: () => {
            calls.push({ table, method: "select.eq.maybeSingle" });
            return Promise.resolve({ data: null });
          },
        }),
      }),
    }),
    // deno-lint-ignore no-explicit-any
  } as any;
  const stripe = createMockStripe({ metadata: {} });

  // Should return early without throwing
  await handleCheckoutCompleted(supabase, makeCheckoutSession(), stripe);
});

Deno.test("handleCheckoutCompleted throws on DB insert error", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_premium" } },
    subscriptions: { selectData: null, insertError: { message: "DB connection failed" } },
  });
  const stripe = createMockStripe();

  await assertRejects(
    () => handleCheckoutCompleted(supabase, makeCheckoutSession(), stripe),
    Error,
    "DB error",
  );
});

Deno.test("handleCheckoutCompleted delegates credit pack to handleCreditPackPurchase", async () => {
  const supabase = createMockSupabase({
    credit_packs: { selectData: { credits: 10 } },
  });
  const stripe = createMockStripe();

  const session = makeCheckoutSession({
    mode: "payment",
    metadata: { type: "credit_pack", supabase_user_id: "user-123", pack_id: "pack-1", credits: "10" },
  });

  // Should process as credit pack (not subscription)
  await handleCheckoutCompleted(supabase, session, stripe);

  const rpcCall = supabase._calls.find(
    (c: { table: string }) => c.table === "rpc:add_bonus_credits",
  );
  assertEquals(rpcCall !== undefined, true, "Should call add_bonus_credits for credit pack");
});

// ==========================================================================
// handleSubscriptionUpdate
// ==========================================================================

Deno.test("handleSubscriptionUpdate upserts subscription data", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_premium" } },
  });

  await handleSubscriptionUpdate(supabase, makeSubscription());

  const upsertCall = supabase._calls.find(
    (c: { table: string; method: string }) => c.table === "subscriptions" && c.method === "upsert",
  );
  assertEquals(upsertCall !== undefined, true, "Should upsert subscription");
});

Deno.test("handleSubscriptionUpdate resolves user from customer ID", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_free" } },
    subscriptions: { selectData: { user_id: "user-456" } },
  });

  const sub = makeSubscription({ metadata: {} });
  await handleSubscriptionUpdate(supabase, sub);
});

Deno.test("handleSubscriptionUpdate throws on DB upsert error", async () => {
  const supabase = createMockSupabase({
    subscription_plans: { selectData: { id: "plan_premium" } },
    subscriptions: { upsertError: { message: "Conflict" } },
  });

  await assertRejects(
    () => handleSubscriptionUpdate(supabase, makeSubscription()),
    Error,
    "DB error",
  );
});

// ==========================================================================
// handleSubscriptionDeleted
// ==========================================================================

Deno.test("handleSubscriptionDeleted marks subscription as canceled", async () => {
  const supabase = createMockSupabase();

  await handleSubscriptionDeleted(supabase, makeSubscription());

  const updateCall = supabase._calls.find(
    (c: { table: string; method: string }) => c.table === "subscriptions" && c.method === "update.eq",
  );
  assertEquals(updateCall !== undefined, true, "Should update subscription to canceled");
});

Deno.test("handleSubscriptionDeleted throws on DB error", async () => {
  const supabase = createMockSupabase({
    subscriptions: { updateError: { message: "Table locked" } },
  });

  await assertRejects(
    () => handleSubscriptionDeleted(supabase, makeSubscription()),
    Error,
    "DB error",
  );
});

// ==========================================================================
// handleInvoicePaid
// ==========================================================================

Deno.test("handleInvoicePaid records payment and sends email", async () => {
  const supabase = createMockSupabase({
    subscriptions: { selectData: { user_id: "user-123", id: "sub-row-id" } },
    profiles: { selectData: { full_name: "Test User" } },
  });

  await handleInvoicePaid(supabase, makeInvoice());

  const upsertCall = supabase._calls.find(
    (c: { table: string; method: string }) => c.table === "payment_history" && c.method === "upsert",
  );
  assertEquals(upsertCall !== undefined, true, "Should upsert payment history");
});

Deno.test("handleInvoicePaid returns early when no subscription found", async () => {
  const supabase = createMockSupabase({
    subscriptions: { selectData: null },
  });

  // Should not throw
  await handleInvoicePaid(supabase, makeInvoice());
});

// ==========================================================================
// handleInvoiceFailed
// ==========================================================================

Deno.test("handleInvoiceFailed records failed payment and updates status", async () => {
  const supabase = createMockSupabase({
    subscriptions: { selectData: { user_id: "user-123", id: "sub-row-id" } },
    profiles: { selectData: { full_name: "Test User" } },
  });

  await handleInvoiceFailed(supabase, makeInvoice());

  const historyCall = supabase._calls.find(
    (c: { table: string; method: string }) => c.table === "payment_history" && c.method === "upsert",
  );
  assertEquals(historyCall !== undefined, true, "Should record failed payment");

  const statusCall = supabase._calls.find(
    (c: { table: string; method: string }) => c.table === "subscriptions" && c.method === "update.eq",
  );
  assertEquals(statusCall !== undefined, true, "Should update subscription to past_due");
});

Deno.test("handleInvoiceFailed returns early when no subscription found", async () => {
  const supabase = createMockSupabase({
    subscriptions: { selectData: null },
  });

  await handleInvoiceFailed(supabase, makeInvoice());
});

// ==========================================================================
// handleCreditPackPurchase
// ==========================================================================

Deno.test("handleCreditPackPurchase uses DB credits over metadata", async () => {
  const supabase = createMockSupabase({
    credit_packs: { selectData: { credits: 20 } },
  });

  const session = makeCheckoutSession({
    mode: "payment",
    metadata: {
      type: "credit_pack",
      supabase_user_id: "user-123",
      pack_id: "pack-premium",
      credits: "10", // metadata says 10, DB says 20
    },
  });

  await handleCreditPackPurchase(supabase, session);

  // Should have called add_bonus_credits with 20 (DB value), not 10 (metadata)
  const rpcCall = supabase._calls.find(
    (c: { table: string }) => c.table === "rpc:add_bonus_credits",
  );
  assertEquals(rpcCall !== undefined, true, "Should call RPC");
  // deno-lint-ignore no-explicit-any
  assertEquals((rpcCall as any).args[0].p_credits, 20, "Should use DB credits (20), not metadata (10)");
});

Deno.test("handleCreditPackPurchase falls back to metadata when DB fails", async () => {
  // Custom supabase where credit_packs.select.eq.single returns error
  const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
  const supabase = {
    _calls: calls,
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          single: () => {
            calls.push({ table, method: "select.eq.single", args: [_col, _val] });
            return Promise.resolve({ data: null, error: { message: "connection timeout" } });
          },
        }),
      }),
      upsert: (_data: unknown, _opts?: unknown) => {
        calls.push({ table, method: "upsert", args: [_data] });
        return Promise.resolve({ error: null });
      },
    }),
    rpc: (fn: string, params: unknown) => {
      calls.push({ table: `rpc:${fn}`, method: "rpc", args: [params] });
      return Promise.resolve({ error: null });
    },
    // deno-lint-ignore no-explicit-any
  } as any;

  const session = makeCheckoutSession({
    mode: "payment",
    metadata: {
      type: "credit_pack",
      supabase_user_id: "user-123",
      pack_id: "pack-1",
      credits: "15",
    },
  });

  await handleCreditPackPurchase(supabase, session);

  const rpcCall = calls.find((c) => c.table === "rpc:add_bonus_credits");
  assertEquals(rpcCall !== undefined, true, "Should call RPC with fallback credits");
  // deno-lint-ignore no-explicit-any
  assertEquals((rpcCall as any).args[0].p_credits, 15, "Should use metadata credits (15) as fallback");
});

Deno.test("handleCreditPackPurchase returns early when metadata missing", async () => {
  const supabase = createMockSupabase();

  const session = makeCheckoutSession({
    mode: "payment",
    metadata: { type: "credit_pack" }, // missing user_id and pack_id
  });

  // Should not throw
  await handleCreditPackPurchase(supabase, session);

  const rpcCall = supabase._calls.find(
    (c: { table: string }) => c.table === "rpc:add_bonus_credits",
  );
  assertEquals(rpcCall, undefined, "Should NOT call RPC when metadata is missing");
});

Deno.test("handleCreditPackPurchase returns early when DB fails and metadata credits invalid", async () => {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
  const supabase = {
    _calls: calls,
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          single: () => {
            calls.push({ table, method: "select.eq.single", args: [_col, _val] });
            return Promise.resolve({ data: null, error: { message: "not found" } });
          },
        }),
      }),
    }),
    rpc: (_fn: string, _params: unknown) => {
      calls.push({ table: `rpc:${_fn}`, method: "rpc", args: [_params] });
      return Promise.resolve({ error: null });
    },
    // deno-lint-ignore no-explicit-any
  } as any;

  const session = makeCheckoutSession({
    mode: "payment",
    metadata: {
      type: "credit_pack",
      supabase_user_id: "user-123",
      pack_id: "pack-1",
      credits: "invalid", // not a number
    },
  });

  await handleCreditPackPurchase(supabase, session);

  const rpcCall = calls.find((c) => c.table === "rpc:add_bonus_credits");
  assertEquals(rpcCall, undefined, "Should NOT call RPC when credits are invalid");
});
