/**
 * Tests for analyze-dental-photo HTTP handler layer.
 *
 * Strategy: Since the handler is registered via `Deno.serve()` and cannot be
 * imported as a callable function, we test the constituent parts that form the
 * HTTP contract:
 *
 * 1. CORS preflight — `handleCorsPreFlight` + `getCorsHeaders`
 * 2. Request validation — `validateImageRequest`
 * 3. Auth layer — `authenticateRequest` + `isAuthError`
 * 4. Error response shape — `createErrorResponse`
 *
 * This covers every gate the real handler evaluates before touching the AI
 * client, giving us full coverage of the HTTP handler layer without requiring
 * a live Supabase or Gemini connection.
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";
import { authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { validateImageRequest } from "./validation.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Request with the given method, headers, and body. */
function makeRequest(
  method: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Request {
  return new Request("https://edge.supabase.co/functions/v1/analyze-dental-photo", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Minimal valid JPEG base64 — just the magic bytes (0xFF 0xD8 0xFF) padded to
 * pass the format check. Not a real image; magic-byte validation only checks
 * the first 12 bytes.
 */
const JPEG_MAGIC = btoa("\xFF\xD8\xFF\xE0" + "A".repeat(12)); // JPEG magic + padding

/**
 * Build a Supabase client stub that resolves `auth.getUser` with the given user
 * (or returns an error when `user` is null).
 */
function makeAuthClient(user: { id: string; email: string } | null) {
  return {
    auth: {
      getUser: (_token: string) =>
        Promise.resolve(
          user
            ? { data: { user }, error: null }
            : { data: { user: null }, error: { message: "invalid token" } },
        ),
    },
  // deno-lint-ignore no-explicit-any
  } as any;
}

// ---------------------------------------------------------------------------
// 1. CORS preflight
// ---------------------------------------------------------------------------

Deno.test("OPTIONS request returns 200 with CORS headers", () => {
  const req = makeRequest("OPTIONS", { origin: "https://tosmile.ai" });
  const response = handleCorsPreFlight(req);

  assertExists(response, "OPTIONS should return a Response, not null");
  assertEquals(response!.status, 200);
  assertExists(response!.headers.get("Access-Control-Allow-Origin"));
  assertExists(response!.headers.get("Access-Control-Allow-Methods"));
  assertExists(response!.headers.get("Access-Control-Allow-Headers"));
});

Deno.test("OPTIONS response has null body (no content)", async () => {
  const req = makeRequest("OPTIONS", { origin: "https://tosmile.ai" });
  const response = handleCorsPreFlight(req);
  const text = await response!.text();
  assertEquals(text, "");
});

Deno.test("Non-OPTIONS request returns null from handleCorsPreFlight", () => {
  const req = makeRequest("POST", { origin: "https://tosmile.ai" });
  const result = handleCorsPreFlight(req);
  assertEquals(result, null);
});

Deno.test("getCorsHeaders returns allowed origin for known production origin", () => {
  const req = makeRequest("POST", { origin: "https://tosmile.ai" });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], "https://tosmile.ai");
});

Deno.test("getCorsHeaders returns fallback origin for unknown origin", () => {
  const req = makeRequest("POST", { origin: "https://evil.com" });
  const headers = getCorsHeaders(req);
  // For disallowed origins the first production origin is used (browser will block)
  assertEquals(headers["Access-Control-Allow-Origin"], "https://tosmile.ai");
});

Deno.test("getCorsHeaders includes Vary: Origin for cache correctness", () => {
  const req = makeRequest("POST", { origin: "https://tosmile.ai" });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Vary"], "Origin");
});

// ---------------------------------------------------------------------------
// 2. Request body validation — validateImageRequest
// ---------------------------------------------------------------------------

Deno.test("validateImageRequest: null input returns failure", () => {
  const result = validateImageRequest(null);
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("validateImageRequest: non-object input returns failure", () => {
  const result = validateImageRequest("not-an-object");
  assertEquals(result.success, false);
});

Deno.test("validateImageRequest: missing imageBase64 returns failure", () => {
  const result = validateImageRequest({ imageType: "intraoral" });
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("validateImageRequest: imageBase64 must be a string", () => {
  const result = validateImageRequest({ imageBase64: 12345 });
  assertEquals(result.success, false);
});

Deno.test("validateImageRequest: valid imageBase64 string returns success", () => {
  const result = validateImageRequest({ imageBase64: JPEG_MAGIC });
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.data!.imageBase64, JPEG_MAGIC);
});

Deno.test("validateImageRequest: defaults imageType to 'intraoral' when absent", () => {
  const result = validateImageRequest({ imageBase64: JPEG_MAGIC });
  assertEquals(result.success, true);
  assertEquals(result.data!.imageType, "intraoral");
});

Deno.test("validateImageRequest: valid imageType is preserved", () => {
  const result = validateImageRequest({ imageBase64: JPEG_MAGIC, imageType: "frontal_smile" });
  assertEquals(result.success, true);
  assertEquals(result.data!.imageType, "frontal_smile");
});

Deno.test("validateImageRequest: invalid imageType falls back to 'intraoral'", () => {
  const result = validateImageRequest({ imageBase64: JPEG_MAGIC, imageType: "invalid-type" });
  assertEquals(result.success, true);
  // invalid type gets coerced to default
  assertEquals(result.data!.imageType, "intraoral");
});

Deno.test("validateImageRequest: additionalPhotos with valid face photo is accepted", () => {
  const result = validateImageRequest({
    imageBase64: JPEG_MAGIC,
    additionalPhotos: { face: "data:image/jpeg;base64,abc123" },
  });
  assertEquals(result.success, true);
  assertExists(result.data!.additionalPhotos?.face);
});

Deno.test("validateImageRequest: additionalPhotos with empty strings is discarded", () => {
  const result = validateImageRequest({
    imageBase64: JPEG_MAGIC,
    additionalPhotos: { face: "", smile45: "" },
  });
  assertEquals(result.success, true);
  assertEquals(result.data!.additionalPhotos, undefined);
});

Deno.test("validateImageRequest: valid whiteningLevel preference is accepted", () => {
  const result = validateImageRequest({
    imageBase64: JPEG_MAGIC,
    patientPreferences: { whiteningLevel: "white" },
  });
  assertEquals(result.success, true);
  assertEquals(result.data!.patientPreferences?.whiteningLevel, "white");
});

Deno.test("validateImageRequest: invalid whiteningLevel discards preferences", () => {
  const result = validateImageRequest({
    imageBase64: JPEG_MAGIC,
    patientPreferences: { whiteningLevel: "ultra-white" },
  });
  assertEquals(result.success, true);
  // invalid preference discarded
  assertEquals(result.data!.patientPreferences, undefined);
});

// ---------------------------------------------------------------------------
// 3. Auth layer — authenticateRequest
// ---------------------------------------------------------------------------

Deno.test("authenticateRequest: missing Authorization header returns 401 Response", async () => {
  const req = makeRequest("POST", { origin: "https://tosmile.ai" });
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient({ id: "user-1", email: "test@test.com" });

  const result = await authenticateRequest(req, client, corsHeaders);

  assert(result instanceof Response, "Should return a Response when auth header is missing");
  assertEquals((result as Response).status, 401);
});

Deno.test("authenticateRequest: non-Bearer Authorization returns 401 Response", async () => {
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Basic dXNlcjpwYXNz",
  });
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient({ id: "user-1", email: "test@test.com" });

  const result = await authenticateRequest(req, client, corsHeaders);

  assert(result instanceof Response);
  assertEquals((result as Response).status, 401);
});

Deno.test("authenticateRequest: invalid token (getUser returns error) returns 401", async () => {
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Bearer invalid-jwt-token",
  });
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient(null); // null = error path

  const result = await authenticateRequest(req, client, corsHeaders);

  assert(result instanceof Response);
  assertEquals((result as Response).status, 401);
  const body = await (result as Response).json();
  assertExists(body.error);
});

Deno.test("authenticateRequest: valid token returns user object (not Response)", async () => {
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Bearer valid-jwt-token",
  });
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient({ id: "user-123", email: "dentist@clinic.com" });

  const result = await authenticateRequest(req, client, corsHeaders);

  assert(!(result instanceof Response), "Valid auth should not return a Response");
  assertEquals((result as { user: { id: string } }).user.id, "user-123");
});

Deno.test("isAuthError: Response is identified as auth error", async () => {
  const req = makeRequest("POST", { origin: "https://tosmile.ai" });
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient(null);

  const result = await authenticateRequest(req, client, corsHeaders);
  assertEquals(isAuthError(result), true);
});

Deno.test("isAuthError: user object is NOT identified as auth error", async () => {
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Bearer valid-jwt-token",
  });
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient({ id: "user-1", email: "test@test.com" });

  const result = await authenticateRequest(req, client, corsHeaders);
  assertEquals(isAuthError(result), false);
});

// ---------------------------------------------------------------------------
// 4. Error response shape — createErrorResponse
// ---------------------------------------------------------------------------

Deno.test("createErrorResponse returns correct status code", () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse("Não autorizado", 401, corsHeaders);
  assertEquals(response.status, 401);
});

Deno.test("createErrorResponse body has 'error' field", async () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse("Dados inválidos", 400, corsHeaders);
  const body = await response.json();
  assertExists(body.error);
  assertEquals(body.error, "Dados inválidos");
});

Deno.test("createErrorResponse includes optional code field when provided", async () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse("Rate limited", 429, corsHeaders, "RATE_LIMITED");
  const body = await response.json();
  assertEquals(body.code, "RATE_LIMITED");
});

Deno.test("createErrorResponse omits code field when not provided", async () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse("Erro", 500, corsHeaders);
  const body = await response.json();
  assertEquals("code" in body, false);
});

Deno.test("createErrorResponse includes requestId when provided", async () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse("Erro", 500, corsHeaders, undefined, "req-abc123");
  const body = await response.json();
  assertEquals(body.requestId, "req-abc123");
});

Deno.test("createErrorResponse sets Content-Type to application/json", () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse("Erro", 400, corsHeaders);
  assertEquals(response.headers.get("Content-Type"), "application/json");
});

Deno.test("createErrorResponse forwards CORS headers", () => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://tosmile.ai",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  const response = createErrorResponse("Erro", 400, corsHeaders);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "https://tosmile.ai");
});

// ---------------------------------------------------------------------------
// 5. ERROR_MESSAGES constants — guard against accidental renames
// ---------------------------------------------------------------------------

Deno.test("ERROR_MESSAGES contains expected constant keys", () => {
  assertExists(ERROR_MESSAGES.UNAUTHORIZED);
  assertExists(ERROR_MESSAGES.INVALID_REQUEST);
  assertExists(ERROR_MESSAGES.IMAGE_INVALID);
  assertExists(ERROR_MESSAGES.IMAGE_TOO_LARGE);
  assertExists(ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED);
  assertExists(ERROR_MESSAGES.ANALYSIS_FAILED);
  assertExists(ERROR_MESSAGES.AI_ERROR);
  assertExists(ERROR_MESSAGES.RATE_LIMITED);
});

// ---------------------------------------------------------------------------
// 6. Auth header deleted/banned user guards
// ---------------------------------------------------------------------------

Deno.test("authenticateRequest: deleted user (deleted_at set) returns 401", async () => {
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Bearer valid-token",
  });
  const corsHeaders = getCorsHeaders(req);

  // Simulate a user with deleted_at field set (Supabase soft-delete)
  const deletedUser = {
    id: "user-deleted",
    email: "deleted@clinic.com",
    deleted_at: "2026-01-01T00:00:00Z",
  };
  const client = {
    auth: {
      getUser: (_token: string) =>
        Promise.resolve({ data: { user: deletedUser }, error: null }),
    },
  // deno-lint-ignore no-explicit-any
  } as any;

  const result = await authenticateRequest(req, client, corsHeaders);
  assert(result instanceof Response);
  assertEquals((result as Response).status, 401);
});

Deno.test("authenticateRequest: banned user (banned_until in future) returns 403", async () => {
  const futureDate = new Date(Date.now() + 86400_000).toISOString(); // 1 day from now
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Bearer valid-token",
  });
  const corsHeaders = getCorsHeaders(req);

  const bannedUser = {
    id: "user-banned",
    email: "banned@clinic.com",
    banned_until: futureDate,
  };
  const client = {
    auth: {
      getUser: (_token: string) =>
        Promise.resolve({ data: { user: bannedUser }, error: null }),
    },
  // deno-lint-ignore no-explicit-any
  } as any;

  const result = await authenticateRequest(req, client, corsHeaders);
  assert(result instanceof Response);
  assertEquals((result as Response).status, 403);
});
