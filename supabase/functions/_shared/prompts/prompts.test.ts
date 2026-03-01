/**
 * Regression tests for prompt definitions.
 *
 * These tests verify:
 * 1. Structural integrity — every prompt has required fields
 * 2. Model configuration — valid model IDs, correct providers
 * 3. Clinical rules — key clinical strings that MUST exist in prompts
 * 4. Cross-prompt consistency — shared rules present where required
 * 5. Parameter injection — prompts assemble correctly with params
 */

import {
  assertEquals,
  assertExists,
  assert,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import { listPrompts, getPrompt } from "./registry.ts";
import type { PromptDefinition } from "./types.ts";

// ---------------------------------------------------------------------------
// Valid model & provider combinations
// ---------------------------------------------------------------------------

const VALID_MODELS: Record<string, string> = {
  "gemini-3.1-pro-preview": "gemini",
  "gemini-3-pro-image-preview": "gemini",
  "gemini-3.1-flash-image-preview": "gemini",
  "gemini-2.0-flash": "gemini",
  "claude-sonnet-4-6": "claude",
  "claude-haiku-4-5-20251001": "claude",
};

// ---------------------------------------------------------------------------
// 1. Structural integrity
// ---------------------------------------------------------------------------

Deno.test("All prompts have required metadata fields", () => {
  const prompts = listPrompts();
  assert(prompts.length >= 4, `Expected at least 4 prompts, got ${prompts.length}`);

  for (const p of prompts) {
    assertExists(p.id, `Prompt missing id`);
    assertExists(p.name, `${p.id}: missing name`);
    assertExists(p.description, `${p.id}: missing description`);
    assertExists(p.model, `${p.id}: missing model`);
    assertExists(p.mode, `${p.id}: missing mode`);
    assertExists(p.provider, `${p.id}: missing provider`);
    assertEquals(typeof p.temperature, "number", `${p.id}: temperature must be number`);
    assertEquals(typeof p.maxTokens, "number", `${p.id}: maxTokens must be number`);
    assertEquals(typeof p.system, "function", `${p.id}: system must be function`);
    assertEquals(typeof p.user, "function", `${p.id}: user must be function`);
  }
});

Deno.test("All prompt IDs are unique", () => {
  const prompts = listPrompts();
  const ids = prompts.map((p) => p.id);
  const unique = new Set(ids);
  assertEquals(ids.length, unique.size, `Duplicate prompt IDs found: ${ids}`);
});

Deno.test("getPrompt retrieves each registered prompt", () => {
  const expectedIds = [
    "analyze-dental-photo",
    "recommend-resin",
    "dsd-simulation",
    "recommend-cementation",
  ];
  for (const id of expectedIds) {
    const p = getPrompt(id);
    assertEquals(p.id, id, `getPrompt('${id}') returned wrong id`);
  }
});

// ---------------------------------------------------------------------------
// 2. Model configuration
// ---------------------------------------------------------------------------

Deno.test("All prompts use valid model IDs", () => {
  for (const p of listPrompts()) {
    assert(
      p.model in VALID_MODELS,
      `${p.id}: unknown model "${p.model}". Valid: ${Object.keys(VALID_MODELS).join(", ")}`,
    );
  }
});

Deno.test("Provider matches model vendor", () => {
  for (const p of listPrompts()) {
    const expectedProvider = VALID_MODELS[p.model];
    assertEquals(
      p.provider,
      expectedProvider,
      `${p.id}: model "${p.model}" should have provider "${expectedProvider}", got "${p.provider}"`,
    );
  }
});

Deno.test("Temperature in valid range [0.0, 1.0]", () => {
  for (const p of listPrompts()) {
    assert(p.temperature >= 0.0, `${p.id}: temperature ${p.temperature} < 0`);
    assert(p.temperature <= 1.0, `${p.id}: temperature ${p.temperature} > 1`);
  }
});

Deno.test("MaxTokens in reasonable range", () => {
  for (const p of listPrompts()) {
    assert(p.maxTokens >= 100, `${p.id}: maxTokens ${p.maxTokens} too low`);
    assert(p.maxTokens <= 16384, `${p.id}: maxTokens ${p.maxTokens} too high`);
  }
});

// ---------------------------------------------------------------------------
// 3. Specific model assignments (regression guards)
// ---------------------------------------------------------------------------

Deno.test("analyze-dental-photo uses Gemini 3.1 Pro", () => {
  const p = getPrompt("analyze-dental-photo");
  assertEquals(p.model, "gemini-3.1-pro-preview");
  assertEquals(p.provider, "gemini");
  assertEquals(p.mode, "vision-tools");
  assertEquals(p.temperature, 0.0);
});

Deno.test("recommend-resin uses Claude Sonnet 4.6", () => {
  const p = getPrompt("recommend-resin");
  assertEquals(p.model, "claude-sonnet-4-6");
  assertEquals(p.provider, "claude");
  assertEquals(p.temperature, 0.0);
});

Deno.test("dsd-simulation uses Nano Banana 2 (primary)", () => {
  const p = getPrompt("dsd-simulation");
  assertEquals(p.model, "gemini-3.1-flash-image-preview");
  assertEquals(p.provider, "gemini");
  assertEquals(p.mode, "image-edit");
});

Deno.test("recommend-cementation uses Claude Haiku", () => {
  const p = getPrompt("recommend-cementation");
  assertEquals(p.model, "claude-haiku-4-5-20251001");
  assertEquals(p.provider, "claude");
});

// ---------------------------------------------------------------------------
// 4. Clinical rules in prompts (regression for key rules)
// ---------------------------------------------------------------------------

Deno.test("analyze-dental-photo: contains visagism rules", () => {
  const p = getPrompt("analyze-dental-photo");
  const system = p.system({});
  assertStringIncludes(system, "visagismo", "Must contain visagism guidance");
  assertStringIncludes(system, "FORMATO FACIAL", "Must include face shape rules");
});

Deno.test("analyze-dental-photo: contains conservative treatment hierarchy", () => {
  const p = getPrompt("analyze-dental-photo");
  const system = p.system({});
  assertStringIncludes(system, "resina", "Must include resin as treatment option");
  assertStringIncludes(system, "porcelana", "Must include porcelain as treatment option");
});

Deno.test("analyze-dental-photo: contains FDI notation rules", () => {
  const p = getPrompt("analyze-dental-photo");
  const system = p.system({});
  // Must mention FDI tooth numbering ranges
  assertStringIncludes(system, "11", "Must reference FDI anterior teeth");
  assertStringIncludes(system, "31", "Must reference FDI lower teeth");
});

Deno.test("analyze-dental-photo: contains lower teeth visibility rule", () => {
  const p = getPrompt("analyze-dental-photo");
  const system = p.system({});
  // Lower teeth should only be reported if clearly visible
  assert(
    system.includes("31") && (system.includes("inferior") || system.includes("lower")),
    "Must have lower teeth visibility guidance",
  );
});

Deno.test("recommend-resin: static system prompt contains diastema verification", () => {
  const p = getPrompt("recommend-resin");
  const system = p.system({} as never);
  // The static system prompt always references diastema in final verification rules
  assertStringIncludes(system, "Diastema", "Must reference diastema in verification rules");
  assertStringIncludes(system, "Fechamento", "Must reference fechamento de diastema");
});

Deno.test("recommend-resin: BL shades prohibited as dentina/corpo", () => {
  const p = getPrompt("recommend-resin");
  const system = p.system({} as never);
  assert(
    system.includes("BL1") && system.includes("BL2") && system.includes("BL3"),
    "Must reference BL shades",
  );
  assert(
    system.toLowerCase().includes("proibido") || system.toLowerCase().includes("nunca"),
    "Must prohibit BL as corpo/dentina",
  );
});

Deno.test("recommend-resin: contains efeitos incisais guidance", () => {
  const p = getPrompt("recommend-resin");
  const system = p.system({} as never);
  assertStringIncludes(system, "Efeitos Incisais", "Must contain efeitos incisais section");
});

Deno.test("recommend-resin: contains recontorno section", () => {
  const p = getPrompt("recommend-resin");
  const system = p.system({} as never);
  assertStringIncludes(system, "RECONTORNO", "Must have recontorno protocol");
});

Deno.test("dsd-simulation: contains lip preservation rule", () => {
  const p = getPrompt("dsd-simulation");
  const system = p.system({
    layerType: "restorations-only",
    whiteningLevel: "natural",
    colorInstruction: "- Clareamento natural",
    whiteningIntensity: "NATURAL",
    caseType: "standard",
    faceShape: "oval",
    toothShapeRecommendation: "ovoide",
    smileArc: "consonante",
  } as never);
  assert(
    system.includes("LÁBIO") || system.includes("lábio") ||
    system.includes("labio") || system.includes("LABIO"),
    "Must contain lip preservation in simulation prompt",
  );
});

Deno.test("dsd-simulation: contains pixel preservation rules", () => {
  const p = getPrompt("dsd-simulation");
  const system = p.system({
    layerType: "restorations-only",
    whiteningLevel: "natural",
    colorInstruction: "- Clareamento natural",
    whiteningIntensity: "NATURAL",
    caseType: "standard",
    faceShape: "oval",
    toothShapeRecommendation: "ovoide",
    smileArc: "consonante",
  } as never);
  assert(
    system.includes("pixel") || system.includes("PIXEL") || system.includes("PRESERV"),
    "Must contain pixel-level preservation guidance",
  );
});

Deno.test("recommend-cementation: contains HF concentration rules", () => {
  const p = getPrompt("recommend-cementation");
  const system = p.system({} as never);
  assertStringIncludes(system, "HF", "Must reference hydrofluoric acid");
  assertStringIncludes(system, "5%", "Must specify 5% concentration");
});

Deno.test("recommend-cementation: contains contralateral consistency", () => {
  const p = getPrompt("recommend-cementation");
  const system = p.system({} as never);
  assert(
    system.toLowerCase().includes("contralateral") || system.toLowerCase().includes("mesmo"),
    "Must enforce contralateral consistency",
  );
});

// ---------------------------------------------------------------------------
// 5. Unified prompt tests (analyze-dental-photo contains clinical + aesthetic)
// ---------------------------------------------------------------------------

Deno.test("unified prompt contains clinical AND aesthetic rules", () => {
  const prompt = getPrompt("analyze-dental-photo");
  const system = prompt.system({});

  // Clinical rules present
  assert(system.includes("Classe I") || system.includes("Classe II") || system.includes("Classe III"), "Missing Black classification");
  assert(system.includes("substrato") || system.includes("Substrato") || system.includes("SUBSTRATO"), "Missing substrate analysis");

  // Aesthetic rules present
  assert(system.includes("proporção") || system.includes("PROPORÇÃO") || system.includes("Proporção"), "Missing proportion analysis");
  assert(system.includes("homólog") || system.includes("HOMÓLOG") || system.includes("Homólog"), "Missing homolog comparison");
  assert(system.includes("gengivoplastia") || system.includes("GENGIVOPLASTIA") || system.includes("Gengivoplastia"), "Missing gengivoplasty rules");
});

Deno.test("unified prompt accepts additionalContext param", () => {
  const prompt = getPrompt("analyze-dental-photo");
  const user = prompt.user({ imageType: "intraoral", additionalContext: "TEST_CONTEXT" });
  assert(user.includes("TEST_CONTEXT"), "additionalContext not injected into user prompt");
});

Deno.test("unified prompt contains smile line classification", () => {
  const prompt = getPrompt("analyze-dental-photo");
  const system = prompt.system({});

  // Must include smile line definitions (previously in separate dsd-analysis and smile-line-classifier)
  assert(
    system.includes("alta") && system.includes("baixa"),
    "Must define smile line classifications (alta/baixa)",
  );
  assert(
    system.includes("gengiv") || system.includes("GENGIV"),
    "Must reference gingival tissue in smile line rules",
  );
});

Deno.test("unified prompt contains conservative gengivoplasty bias for média", () => {
  const prompt = getPrompt("analyze-dental-photo");
  const system = prompt.system({});

  // Must have conservative guidance for média smile line gengivoplasty (previously in dsd-analysis)
  assert(
    system.includes("média") || system.includes("media") || system.includes("MEDIA"),
    "Must reference média smile line",
  );
});

Deno.test("unified prompt contains lip preservation rule", () => {
  const prompt = getPrompt("analyze-dental-photo");
  const system = prompt.system({});

  assert(
    system.toLowerCase().includes("lábio") || system.toLowerCase().includes("labio") || system.toLowerCase().includes("lip"),
    "Must contain lip preservation guidance (previously in dsd-analysis)",
  );
});

// ---------------------------------------------------------------------------
// 6. Cross-prompt consistency
// ---------------------------------------------------------------------------

Deno.test("Clinical temperature is 0.0 for deterministic outputs", () => {
  const deterministicPrompts = [
    "analyze-dental-photo",
    "recommend-resin",
    "recommend-cementation",
  ];
  for (const id of deterministicPrompts) {
    const p = getPrompt(id);
    assertEquals(p.temperature, 0.0, `${id} should have temperature 0.0 for deterministic clinical output`);
  }
});

Deno.test("Vision prompts have adequate maxTokens for their complexity", () => {
  const p = getPrompt("analyze-dental-photo");
  assert(p.maxTokens >= 2000, "Photo analysis needs at least 2000 tokens for multi-tooth output");
});

// ---------------------------------------------------------------------------
// 7. Removed prompts are no longer registered
// ---------------------------------------------------------------------------

Deno.test("dsd-analysis prompt is no longer registered", () => {
  let threw = false;
  try {
    getPrompt("dsd-analysis");
  } catch {
    threw = true;
  }
  assert(threw, "getPrompt('dsd-analysis') should throw — prompt was removed");
});

Deno.test("smile-line-classifier prompt is no longer registered", () => {
  let threw = false;
  try {
    getPrompt("smile-line-classifier");
  } catch {
    threw = true;
  }
  assert(threw, "getPrompt('smile-line-classifier') should throw — prompt was removed");
});
