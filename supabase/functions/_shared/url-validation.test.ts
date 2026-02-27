/**
 * Tests for url-validation.ts
 *
 * Covers:
 * - undefined/missing URL returns true (fallback behavior)
 * - Empty string returns false (invalid URL)
 * - Allowed origins pass validation
 * - Disallowed origins are rejected
 * - Origin-spoofing via subdomain prefix is rejected
 * - Malformed URL strings are rejected
 * - Paths and query params on allowed origins still pass
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { isAllowedRedirectUrl } from "./url-validation.ts";

Deno.test("undefined returns true (fallback behavior)", () => {
  assertEquals(isAllowedRedirectUrl(undefined), true);
});

Deno.test("null-ish empty string returns false (invalid URL)", () => {
  assertEquals(isAllowedRedirectUrl(""), false);
});

Deno.test("allowed origin https://tosmile.ai/profile returns true", () => {
  assertEquals(isAllowedRedirectUrl("https://tosmile.ai/profile"), true);
});

Deno.test("allowed origin https://tosmile-ai.vercel.app/checkout returns true", () => {
  assertEquals(
    isAllowedRedirectUrl("https://tosmile-ai.vercel.app/checkout"),
    true,
  );
});

Deno.test("disallowed origin https://evil.com/steal returns false", () => {
  assertEquals(isAllowedRedirectUrl("https://evil.com/steal"), false);
});

Deno.test("disallowed origin with similar prefix https://tosmile.ai.evil.com returns false", () => {
  assertEquals(
    isAllowedRedirectUrl("https://tosmile.ai.evil.com/steal"),
    false,
  );
});

Deno.test("invalid URL string returns false", () => {
  assertEquals(isAllowedRedirectUrl("not-a-valid-url"), false);
});

Deno.test("allowed origin with path and query params returns true", () => {
  assertEquals(
    isAllowedRedirectUrl(
      "https://dentai.pro/profile?tab=assinatura&credits=success",
    ),
    true,
  );
});
