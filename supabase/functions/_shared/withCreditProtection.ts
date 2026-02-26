/**
 * Higher-Order Function that encapsulates the credit consumption + refund-on-error pattern.
 *
 * Every AI edge function follows the same pattern:
 * 1. Do work (auth, validation, AI calls)
 * 2. Consume credits after AI succeeds
 * 3. If anything throws after credits are consumed, refund them
 *
 * This HOF extracts the boilerplate: the 3 mutable variables (`creditsConsumed`,
 * `supabaseForRefund`, `userIdForRefund`) and the try/catch refund logic.
 *
 * Usage:
 * ```ts
 * const result = await withCreditProtection(
 *   { supabase, userId, operation: "case_analysis", operationId: reqId },
 *   async (credits) => {
 *     // ... do AI work ...
 *     credits.consume();   // marks credits as consumed (calls checkAndUseCredits)
 *     // ... post-processing ...
 *     return someResponse;
 *   }
 * );
 * ```
 */

import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { checkAndUseCredits, refundCredits, createInsufficientCreditsResponse, type CreditCheckResult } from "./credits.ts";
import { logger } from "./logger.ts";

export interface CreditProtectionContext {
  /** Supabase service role client */
  supabase: SupabaseClient;
  /** Authenticated user ID */
  userId: string;
  /** Credit operation name (e.g. "case_analysis", "dsd_simulation") */
  operation: string;
  /** Request ID for idempotency (operationId passed to checkAndUseCredits/refundCredits) */
  operationId: string;
  /** CORS headers for error responses */
  corsHeaders: Record<string, string>;
}

export interface CreditTracker {
  /**
   * Consume credits for the operation. Returns the CreditCheckResult.
   * If credits are insufficient, returns a 402 Response that the callback
   * should return immediately.
   *
   * @returns CreditCheckResult if credits were consumed, or a Response (402) if insufficient
   */
  consume(): Promise<CreditCheckResult | Response>;

  /** Returns the number of times consume() was called successfully */
  getConsumed(): number;
}

/**
 * Wraps a callback with automatic credit refund on error.
 *
 * - On success: credits stay consumed, returns the callback's return value
 * - On error (throw): automatically refunds all consumed credits, then re-throws
 *
 * The callback receives a `CreditTracker` to consume credits at the right moment.
 * Credits should be consumed AFTER the expensive work (AI call) succeeds but
 * BEFORE post-processing that might throw.
 */
export async function withCreditProtection<T>(
  ctx: CreditProtectionContext,
  callback: (credits: CreditTracker) => Promise<T>,
): Promise<T> {
  let consumed = 0;

  const tracker: CreditTracker = {
    async consume() {
      const result = await checkAndUseCredits(
        ctx.supabase,
        ctx.userId,
        ctx.operation,
        ctx.operationId,
      );

      if (!result.allowed) {
        logger.warn(`Insufficient credits for user ${ctx.userId} on ${ctx.operation}`);
        return createInsufficientCreditsResponse(result, ctx.corsHeaders);
      }

      consumed++;
      return result;
    },

    getConsumed() {
      return consumed;
    },
  };

  try {
    return await callback(tracker);
  } catch (error) {
    // Refund all consumed credits on unexpected errors
    if (consumed > 0) {
      for (let i = 0; i < consumed; i++) {
        await refundCredits(ctx.supabase, ctx.userId, ctx.operation, ctx.operationId);
      }
      logger.log(
        `[${ctx.operationId}] Refunded ${consumed} ${ctx.operation} credit(s) for user ${ctx.userId} due to error`,
      );
    }
    throw error;
  }
}

/**
 * Type guard to check if a consume() result is an insufficient-credits Response.
 * Use this in the callback to early-return the 402 response.
 */
export function isInsufficientCreditsResponse(
  result: CreditCheckResult | Response,
): result is Response {
  return result instanceof Response;
}
