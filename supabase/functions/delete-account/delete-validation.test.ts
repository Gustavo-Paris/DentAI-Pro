/**
 * Tests for delete-validation.ts
 *
 * Covers confirmation phrase validation and deletion order integrity.
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import {
  CONFIRMATION_PHRASE,
  isValidConfirmation,
  DELETION_ORDER,
} from "./delete-validation.ts";

// ==========================================================================
// isValidConfirmation
// ==========================================================================

Deno.test("exact confirmation phrase returns true", () => {
  assertEquals(isValidConfirmation("EXCLUIR MINHA CONTA"), true);
});

Deno.test("lowercase confirmation phrase returns false", () => {
  assertEquals(isValidConfirmation("excluir minha conta"), false);
});

Deno.test("undefined confirmation returns false", () => {
  assertEquals(isValidConfirmation(undefined), false);
});

Deno.test("null confirmation returns false", () => {
  assertEquals(isValidConfirmation(null), false);
});

Deno.test("empty string confirmation returns false", () => {
  assertEquals(isValidConfirmation(""), false);
});

// ==========================================================================
// DELETION_ORDER integrity
// ==========================================================================

Deno.test("DELETION_ORDER has auth_user as last step", () => {
  const lastStep = DELETION_ORDER[DELETION_ORDER.length - 1];
  assertEquals(lastStep, "auth_user", "Auth user must be deleted last");
});

Deno.test("DELETION_ORDER has 19 steps", () => {
  assertEquals(DELETION_ORDER.length, 19);
});

Deno.test("DELETION_ORDER has profiles before auth_user", () => {
  const profilesIdx = DELETION_ORDER.indexOf("profiles");
  const authIdx = DELETION_ORDER.indexOf("auth_user");
  assertExists(profilesIdx >= 0, "profiles must be in deletion order");
  assertEquals(profilesIdx < authIdx, true, "profiles must come before auth_user");
});

Deno.test("DELETION_ORDER has evaluations before patients (FK dependency)", () => {
  const evalsIdx = DELETION_ORDER.indexOf("evaluations");
  const patientsIdx = DELETION_ORDER.indexOf("patients");
  assertEquals(evalsIdx < patientsIdx, true, "evaluations must be deleted before patients");
});

Deno.test("CONFIRMATION_PHRASE is EXCLUIR MINHA CONTA", () => {
  assertEquals(CONFIRMATION_PHRASE, "EXCLUIR MINHA CONTA");
});
