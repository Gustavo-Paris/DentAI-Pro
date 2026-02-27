import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  isValidReferralCode,
  isSelfReferral,
  BONUS_CREDITS,
  REFERRAL_CODE_PATTERN,
} from "./referral-validation.ts";

// ---------------------------------------------------------------------------
// isValidReferralCode
// ---------------------------------------------------------------------------

Deno.test("valid alphanumeric code (4 chars) returns true", () => {
  assertEquals(isValidReferralCode("ABCD"), true);
});

Deno.test("valid code with hyphens returns true", () => {
  assertEquals(isValidReferralCode("REF-CODE-123"), true);
});

Deno.test("code too short (3 chars) returns false", () => {
  assertEquals(isValidReferralCode("ABC"), false);
});

Deno.test("code too long (21 chars) returns false", () => {
  assertEquals(isValidReferralCode("A".repeat(21)), false);
});

Deno.test("code with special chars returns false", () => {
  assertEquals(isValidReferralCode("CODE@#$"), false);
});

Deno.test("undefined / null / empty returns false", () => {
  assertEquals(isValidReferralCode(undefined), false);
  assertEquals(isValidReferralCode(null), false);
  assertEquals(isValidReferralCode(""), false);
  assertEquals(isValidReferralCode("   "), false);
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

Deno.test("BONUS_CREDITS equals 5", () => {
  assertEquals(BONUS_CREDITS, 5);
});

Deno.test("REFERRAL_CODE_PATTERN matches expected format", () => {
  assertEquals(REFERRAL_CODE_PATTERN.test("ABCD"), true);
  assertEquals(REFERRAL_CODE_PATTERN.test("A".repeat(20)), true);
  assertEquals(REFERRAL_CODE_PATTERN.test("AB"), false);
});

// ---------------------------------------------------------------------------
// isSelfReferral
// ---------------------------------------------------------------------------

Deno.test("isSelfReferral returns true when IDs match, false when different", () => {
  const uid = "user-abc-123";
  assertEquals(isSelfReferral(uid, uid), true);
  assertEquals(isSelfReferral(uid, "other-user-456"), false);
});
