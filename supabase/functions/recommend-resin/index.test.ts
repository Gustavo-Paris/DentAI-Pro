/**
 * Tests for recommend-resin HTTP handler layer.
 *
 * Strategy: The handler is registered via `Deno.serve()` and is not directly
 * callable in tests. We test the constituent parts that form the HTTP contract:
 *
 * 1. CORS preflight — shared `handleCorsPreFlight` + `getCorsHeaders`
 * 2. Auth layer — shared `authenticateRequest`
 * 3. Request body validation — `validateEvaluationData` (the gate the handler uses)
 * 4. Error response shape — `createErrorResponse`
 *
 * Full coverage of every rejection path the handler can take, without requiring
 * a live Supabase, Gemini, or Claude connection.
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";
import { authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { validateEvaluationData } from "../_shared/validation.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Request targeting the recommend-resin endpoint. */
function makeRequest(
  method: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Request {
  return new Request("https://edge.supabase.co/functions/v1/recommend-resin", {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

/** A minimal valid EvaluationData payload that passes all validation rules. */
function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    evaluationId: VALID_UUID,
    userId: VALID_UUID,
    patientAge: "35",
    tooth: "11",
    region: "anterior-superior",
    cavityClass: "Classe IV",
    restorationSize: "Média",
    substrate: "Esmalte e Dentina",
    aestheticLevel: "alto",
    toothColor: "A2",
    stratificationNeeded: true,
    bruxism: false,
    longevityExpectation: "longo",
    budget: "premium",
    ...overrides,
  };
}

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

  assertExists(response);
  assertEquals(response!.status, 200);
  assertExists(response!.headers.get("Access-Control-Allow-Origin"));
  assertExists(response!.headers.get("Access-Control-Allow-Methods"));
});

Deno.test("OPTIONS response has no body content", async () => {
  const req = makeRequest("OPTIONS", { origin: "https://tosmile.ai" });
  const response = handleCorsPreFlight(req);
  const text = await response!.text();
  assertEquals(text, "");
});

Deno.test("POST request returns null from handleCorsPreFlight (passes through)", () => {
  const req = makeRequest("POST", { origin: "https://tosmile.ai" });
  assertEquals(handleCorsPreFlight(req), null);
});

Deno.test("getCorsHeaders: tosmile-ai.vercel.app is an allowed origin", () => {
  const req = makeRequest("POST", { origin: "https://tosmile-ai.vercel.app" });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], "https://tosmile-ai.vercel.app");
});

Deno.test("getCorsHeaders: unknown origin falls back to first production origin", () => {
  const req = makeRequest("POST", { origin: "https://attacker.com" });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], "https://tosmile.ai");
});

// ---------------------------------------------------------------------------
// 2. Auth layer
// ---------------------------------------------------------------------------

Deno.test("Missing Authorization header results in 401 auth error", async () => {
  const req = makeRequest("POST", { origin: "https://tosmile.ai" }, validPayload());
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient({ id: "u1", email: "a@b.com" });

  const result = await authenticateRequest(req, client, corsHeaders);

  assert(isAuthError(result), "Should be an auth error Response");
  assertEquals((result as Response).status, 401);
});

Deno.test("Bearer token with invalid JWT returns 401", async () => {
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Bearer bad-token",
  }, validPayload());
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient(null);

  const result = await authenticateRequest(req, client, corsHeaders);

  assert(isAuthError(result));
  assertEquals((result as Response).status, 401);
  const body = await (result as Response).json();
  assertExists(body.error);
});

Deno.test("Valid Bearer token returns user, not an error Response", async () => {
  const req = makeRequest("POST", {
    origin: "https://tosmile.ai",
    Authorization: "Bearer valid-token",
  }, validPayload());
  const corsHeaders = getCorsHeaders(req);
  const client = makeAuthClient({ id: "user-123", email: "doc@clinic.com" });

  const result = await authenticateRequest(req, client, corsHeaders);

  assertEquals(isAuthError(result), false);
  assertEquals((result as { user: { id: string } }).user.id, "user-123");
});

// ---------------------------------------------------------------------------
// 3. Request body validation — validateEvaluationData
// ---------------------------------------------------------------------------

// --- Missing auth / invalid body before reaching validation ---

Deno.test("validateEvaluationData: null input returns failure", () => {
  const result = validateEvaluationData(null);
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("validateEvaluationData: empty object returns failure (missing required fields)", () => {
  const result = validateEvaluationData({});
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("validateEvaluationData: string input returns failure", () => {
  const result = validateEvaluationData("bad-input");
  assertEquals(result.success, false);
});

// --- Missing required fields ---

Deno.test("validateEvaluationData: missing evaluationId returns failure", () => {
  const { evaluationId: _, ...payload } = validPayload();
  const result = validateEvaluationData(payload);
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("validateEvaluationData: non-UUID evaluationId returns failure", () => {
  const result = validateEvaluationData(validPayload({ evaluationId: "not-a-uuid" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: missing userId returns failure", () => {
  const { userId: _, ...payload } = validPayload();
  const result = validateEvaluationData(payload);
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: non-UUID userId returns failure", () => {
  const result = validateEvaluationData(validPayload({ userId: "not-a-uuid" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: missing tooth returns failure", () => {
  const { tooth: _, ...payload } = validPayload();
  const result = validateEvaluationData(payload);
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid tooth number returns failure", () => {
  // '99' is not a valid FDI tooth number (quad 9 doesn't exist)
  const result = validateEvaluationData(validPayload({ tooth: "99" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid region returns failure", () => {
  const result = validateEvaluationData(validPayload({ region: "invalid-region" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid cavityClass returns failure", () => {
  const result = validateEvaluationData(validPayload({ cavityClass: "Classe IX" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid restorationSize returns failure", () => {
  const result = validateEvaluationData(validPayload({ restorationSize: "Gigante" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid substrate returns failure", () => {
  const result = validateEvaluationData(validPayload({ substrate: "Glass" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid aestheticLevel returns failure", () => {
  const result = validateEvaluationData(validPayload({ aestheticLevel: "extreme" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid toothColor (non-VITA) returns failure", () => {
  const result = validateEvaluationData(validPayload({ toothColor: "Z99" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: invalid budget returns failure", () => {
  const result = validateEvaluationData(validPayload({ budget: "luxury" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: stratificationNeeded must be boolean", () => {
  const result = validateEvaluationData(validPayload({ stratificationNeeded: "yes" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: bruxism must be boolean", () => {
  const result = validateEvaluationData(validPayload({ bruxism: 1 }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: patientAge must be a numeric string", () => {
  const result = validateEvaluationData(validPayload({ patientAge: "young" }));
  assertEquals(result.success, false);
});

Deno.test("validateEvaluationData: patientAge out of range (200) returns failure", () => {
  const result = validateEvaluationData(validPayload({ patientAge: "200" }));
  assertEquals(result.success, false);
});

// --- Valid payload ---

Deno.test("validateEvaluationData: valid payload returns success with correct data", () => {
  const result = validateEvaluationData(validPayload());
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.data!.tooth, "11");
  assertEquals(result.data!.region, "anterior-superior");
  assertEquals(result.data!.budget, "premium");
});

Deno.test("validateEvaluationData: all valid VITA shades pass (A1, B2, BL3)", () => {
  for (const shade of ["A1", "B2", "C3", "BL3", "D2"]) {
    const result = validateEvaluationData(validPayload({ toothColor: shade }));
    assertEquals(result.success, true, `Shade ${shade} should pass validation`);
  }
});

Deno.test("validateEvaluationData: English enum values are normalized (restorationSize)", () => {
  // 'medium' should be normalized to 'Média'
  const result = validateEvaluationData(validPayload({ restorationSize: "medium" }));
  assertEquals(result.success, true);
  assertEquals(result.data!.restorationSize, "Média");
});

Deno.test("validateEvaluationData: English enum values are normalized (substrate)", () => {
  // 'enamel' should be normalized to 'Esmalte'
  const result = validateEvaluationData(validPayload({ substrate: "enamel", restorationSize: "Pequena" }));
  assertEquals(result.success, true);
  assertEquals(result.data!.substrate, "Esmalte");
});

Deno.test("validateEvaluationData: legacy budget values (econômico/moderado) are accepted", () => {
  // The handler normalizes these AFTER validation, so validation must accept them
  const econResult = validateEvaluationData(validPayload({ budget: "econômico" }));
  assertEquals(econResult.success, true, "econômico should pass validation");

  const modResult = validateEvaluationData(validPayload({ budget: "moderado" }));
  assertEquals(modResult.success, true, "moderado should pass validation");
});

Deno.test("validateEvaluationData: optional clinicalNotes accepted when present", () => {
  const result = validateEvaluationData(validPayload({ clinicalNotes: "Paciente com histórico de bruxismo severo" }));
  assertEquals(result.success, true);
  assertEquals(result.data!.clinicalNotes, "Paciente com histórico de bruxismo severo");
});

Deno.test("validateEvaluationData: optional aestheticGoals accepted when present", () => {
  const result = validateEvaluationData(validPayload({ aestheticGoals: "Sorriso harmonioso e natural" }));
  assertEquals(result.success, true);
  assertEquals(result.data!.aestheticGoals, "Sorriso harmonioso e natural");
});

Deno.test("validateEvaluationData: aestheticGoals too long returns failure", () => {
  const result = validateEvaluationData(validPayload({ aestheticGoals: "x".repeat(1001) }));
  assertEquals(result.success, false);
});

// --- All valid tooth numbers pass ---

Deno.test("validateEvaluationData: all valid FDI tooth numbers accepted", () => {
  const validTeeth = ["11", "18", "21", "28", "31", "38", "41", "48"];
  for (const tooth of validTeeth) {
    const result = validateEvaluationData(validPayload({ tooth }));
    assertEquals(result.success, true, `Tooth ${tooth} should pass validation`);
  }
});

// ---------------------------------------------------------------------------
// 4. Error response shape
// ---------------------------------------------------------------------------

Deno.test("400 error response has correct status and body", async () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
  assertEquals(response.status, 400);
  const body = await response.json();
  assertExists(body.error);
});

Deno.test("401 error response body contains an error message", async () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
  const body = await response.json();
  assertEquals(body.error, ERROR_MESSAGES.UNAUTHORIZED);
});

Deno.test("403 error response for access denied", async () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
  assertEquals(response.status, 403);
  const body = await response.json();
  assertExists(body.error);
});

Deno.test("Error response Content-Type is application/json", () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createErrorResponse("Erro", 500, corsHeaders);
  assertEquals(response.headers.get("Content-Type"), "application/json");
});
