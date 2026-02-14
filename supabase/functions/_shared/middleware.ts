import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "./cors.ts";
import { logger } from "./logger.ts";

// Types
import type { SupabaseClient, User } from "jsr:@supabase/supabase-js@2";

/** Create a Supabase client with service role key */
export function getSupabaseClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

/** Validate auth header and return user, or error Response */
export async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient,
  corsHeaders: Record<string, string>
): Promise<{ user: User } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
  }

  // Check if user has been soft-deleted (Supabase sets deleted_at but doesn't revoke JWTs)
  // deno-lint-ignore no-explicit-any
  const userAny = user as any;
  if (userAny.deleted_at) {
    logger.warn("Deleted user attempted access", { userId: user.id, deletedAt: userAny.deleted_at });
    return createErrorResponse("Conta excluída", 401, corsHeaders);
  }

  // Check if user is banned (banned_until in the future means active ban)
  if (userAny.banned_until) {
    const bannedUntil = new Date(userAny.banned_until);
    if (bannedUntil > new Date()) {
      logger.warn("Banned user attempted access", { userId: user.id, bannedUntil: userAny.banned_until });
      return createErrorResponse("Conta suspensa", 403, corsHeaders);
    }
  }

  return { user };
}

/** Check if auth result is an error Response */
export function isAuthError(result: { user: User } | Response): result is Response {
  return result instanceof Response;
}

/** Wrap handler with CORS preflight + error boundary */
export function withErrorBoundary(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);
    const preflight = handleCorsPreFlight(req);
    if (preflight) return preflight;
    try {
      return await handler(req);
    } catch (error) {
      logger.error("Unhandled error:", error);
      return createErrorResponse("Erro interno do servidor", 500, corsHeaders);
    }
  };
}
