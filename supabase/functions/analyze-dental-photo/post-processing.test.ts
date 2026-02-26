/**
 * Tests for analyze-dental-photo/post-processing.ts
 *
 * Covers the most critical edge cases that have caused production bugs:
 * - Diastema confidence safety net (confidence <65% strips diastema)
 * - Diastema bilateral rule (central incisors 11/21 require both)
 * - Multi-tooth diastema override (>=3 teeth bypasses safety net)
 * - Lower teeth filter (31-48 stripped when upper arch predominant)
 * - Valid findings pass through unchanged
 * - Primary tooth fix when filtered out
 * - Deduplication of repeated tooth numbers
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import { processAnalysisResult } from "./post-processing.ts";
import type { PhotoAnalysisResult, DetectedTooth } from "./types.ts";

// ---------------------------------------------------------------------------
// Helper: build a minimal PhotoAnalysisResult
// ---------------------------------------------------------------------------

function makeTooth(overrides: Partial<DetectedTooth> & { tooth: string }): DetectedTooth {
  return {
    tooth: overrides.tooth,
    tooth_region: overrides.tooth_region ?? null,
    cavity_class: overrides.cavity_class ?? null,
    restoration_size: overrides.restoration_size ?? null,
    substrate: overrides.substrate ?? null,
    substrate_condition: overrides.substrate_condition ?? null,
    enamel_condition: overrides.enamel_condition ?? null,
    depth: overrides.depth ?? null,
    priority: overrides.priority ?? "média",
    notes: overrides.notes ?? null,
    treatment_indication: overrides.treatment_indication ?? "resina",
    indication_reason: overrides.indication_reason ?? undefined,
  };
}

function makeAnalysis(overrides: Partial<PhotoAnalysisResult> = {}): PhotoAnalysisResult {
  return {
    detected: overrides.detected ?? true,
    confidence: overrides.confidence ?? 90,
    detected_teeth: overrides.detected_teeth ?? [],
    primary_tooth: overrides.primary_tooth ?? null,
    vita_shade: overrides.vita_shade ?? null,
    observations: overrides.observations ?? [],
    warnings: overrides.warnings ?? [],
    treatment_indication: overrides.treatment_indication ?? "resina",
  };
}

// ==========================================================================
// Test: Diastema confidence safety net — confidence <65% strips diastema
// ==========================================================================

Deno.test("Diastema stripped when overall confidence < 65% (single tooth)", () => {
  const analysis = makeAnalysis({
    confidence: 50,
    detected_teeth: [
      makeTooth({
        tooth: "11",
        indication_reason: "Diastema mesial entre 11 e 21",
        cavity_class: "Fechamento de Diastema",
      }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth.length, 0, "Diastema tooth should be stripped at confidence <65%");
  const hasWarning = result.warnings.some((w: string) => w.includes("Diastema"));
  assertEquals(hasWarning, true, "Should add warning about stripped diastema");
});

Deno.test("Diastema preserved when overall confidence >= 65%", () => {
  const analysis = makeAnalysis({
    confidence: 70,
    detected_teeth: [
      makeTooth({
        tooth: "11",
        indication_reason: "Diastema mesial",
        cavity_class: "Fechamento de Diastema",
      }),
      makeTooth({
        tooth: "21",
        indication_reason: "Diastema mesial",
        cavity_class: "Fechamento de Diastema",
      }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  // Both should survive (bilateral central diastema with confidence >= 65%)
  assertEquals(result.detected_teeth.length, 2, "Diastema should be preserved at confidence >= 65%");
});

// ==========================================================================
// Test: Diastema bilateral rule — 11/21 require both diagnosed
// ==========================================================================

Deno.test("Central incisor diastema stripped when only tooth 11 diagnosed (confidence >= 65%)", () => {
  const analysis = makeAnalysis({
    confidence: 75,
    detected_teeth: [
      makeTooth({
        tooth: "11",
        indication_reason: "Diastema mesial",
        cavity_class: "Fechamento de Diastema",
      }),
      // 21 is NOT diagnosed with diastema
      makeTooth({
        tooth: "21",
        indication_reason: "Desgaste incisal",
      }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  // Tooth 11 should be stripped (unilateral central diastema = suspicious)
  const tooth11 = result.detected_teeth.find((t: DetectedTooth) => t.tooth === "11");
  assertEquals(tooth11, undefined, "Tooth 11 should be stripped — unilateral central diastema");

  // Tooth 21 should remain (it's not a diastema diagnosis)
  const tooth21 = result.detected_teeth.find((t: DetectedTooth) => t.tooth === "21");
  assertExists(tooth21, "Tooth 21 should remain — not a diastema diagnosis");
});

Deno.test("Central incisor diastema preserved when both 11 and 21 diagnosed", () => {
  const analysis = makeAnalysis({
    confidence: 75,
    detected_teeth: [
      makeTooth({
        tooth: "11",
        indication_reason: "Diastema entre 11 e 21",
        cavity_class: "Fechamento de Diastema",
      }),
      makeTooth({
        tooth: "21",
        notes: "Diastema mesial com 11",
        cavity_class: "Fechamento de Diastema",
      }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth.length, 2, "Both 11 and 21 should be preserved (bilateral diastema)");
});

// ==========================================================================
// Test: Multi-tooth diastema override (>=3 teeth bypasses safety net)
// ==========================================================================

Deno.test("3+ diastema teeth bypass safety net even at very low confidence", () => {
  const analysis = makeAnalysis({
    confidence: 30, // Very low confidence
    detected_teeth: [
      makeTooth({
        tooth: "11",
        indication_reason: "Diastema",
        cavity_class: "Fechamento de Diastema",
      }),
      makeTooth({
        tooth: "12",
        notes: "Diastema lateral",
        cavity_class: "Fechamento de Diastema",
      }),
      makeTooth({
        tooth: "21",
        indication_reason: "Diastema mesial",
        cavity_class: "Fechamento de Diastema",
      }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  // All 3 diastema teeth should survive — overwhelming evidence (Rule 0)
  assertEquals(
    result.detected_teeth.length,
    3,
    "All 3 diastema teeth should survive — Rule 0: overwhelming evidence",
  );
});

Deno.test("5 diastema teeth bypass safety net (generalized spacing)", () => {
  const analysis = makeAnalysis({
    confidence: 20, // Extremely low confidence
    detected_teeth: [
      makeTooth({ tooth: "11", indication_reason: "Diastema", cavity_class: "Fechamento de Diastema" }),
      makeTooth({ tooth: "12", notes: "Diastema", cavity_class: "Fechamento de Diastema" }),
      makeTooth({ tooth: "21", indication_reason: "Diastema", cavity_class: "Fechamento de Diastema" }),
      makeTooth({ tooth: "22", notes: "Diastema", cavity_class: "Fechamento de Diastema" }),
      makeTooth({ tooth: "13", indication_reason: "Diastema", cavity_class: "Fechamento de Diastema" }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth.length, 5, "All 5 diastema teeth should survive");
});

// ==========================================================================
// Test: Lower teeth filter — 31-48 stripped when upper arch predominant
// ==========================================================================

Deno.test("Lower teeth stripped when upper arch is predominant", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({ tooth: "11", priority: "alta" }),
      makeTooth({ tooth: "12" }),
      makeTooth({ tooth: "21" }),
      makeTooth({ tooth: "31" }), // lower — should be removed
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  // 3 upper > 1 lower → lower teeth stripped
  assertEquals(result.detected_teeth.length, 3, "Lower teeth should be stripped");
  const hasLower = result.detected_teeth.some((t: DetectedTooth) => parseInt(t.tooth) >= 31);
  assertEquals(hasLower, false, "No lower teeth should remain");

  const hasLowerWarning = result.warnings.some((w: string) => w.includes("inferiores"));
  assertEquals(hasLowerWarning, true, "Should add warning about removed lower teeth");
});

Deno.test("Lower teeth NOT stripped when lower arch is predominant", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({ tooth: "31" }),
      makeTooth({ tooth: "32" }),
      makeTooth({ tooth: "41" }),
      makeTooth({ tooth: "11" }), // minority upper
    ],
    primary_tooth: "31",
  });

  const result = processAnalysisResult(analysis);

  // 3 lower > 1 upper → upper teeth stripped (opposite direction)
  // Actually the code checks `upperTeeth.length > lowerTeeth.length`, so when lower > upper, nothing is stripped
  // Let's verify all teeth remain when lower is predominant
  // Wait — re-reading the code: if upper > lower, lower is removed. If lower > upper, the condition is false, so nothing is removed.
  // But if lower > upper, upperTeeth.length (1) > lowerTeeth.length (3) is false, so nothing happens
  assertEquals(result.detected_teeth.length, 4, "All teeth should remain when lower arch is predominant");
});

Deno.test("Lower teeth NOT stripped when counts are equal", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({ tooth: "11" }),
      makeTooth({ tooth: "21" }),
      makeTooth({ tooth: "31" }),
      makeTooth({ tooth: "41" }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  // Equal counts: 2 upper, 2 lower → condition is `upper > lower` which is false → keep all
  assertEquals(result.detected_teeth.length, 4, "All teeth should remain when counts are equal");
});

// ==========================================================================
// Test: Valid findings pass through unchanged
// ==========================================================================

Deno.test("Valid upper teeth pass through without modification", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({
        tooth: "11",
        priority: "alta",
        cavity_class: "Classe III",
        treatment_indication: "resina",
        indication_reason: "Cárie mesial",
      }),
      makeTooth({
        tooth: "22",
        priority: "média",
        cavity_class: "Classe IV",
        treatment_indication: "resina",
      }),
    ],
    primary_tooth: "11",
    vita_shade: "A2",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth.length, 2, "Both teeth should pass through");
  assertEquals(result.detected_teeth[0].tooth, "11");
  assertEquals(result.detected_teeth[0].cavity_class, "Classe III");
  assertEquals(result.vita_shade, "A2");
  assertEquals(result.primary_tooth, "11");
});

Deno.test("Empty teeth array produces empty result", () => {
  const analysis = makeAnalysis({
    confidence: 50,
    detected_teeth: [],
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth.length, 0);
  assertEquals(result.primary_tooth, null);
});

// ==========================================================================
// Test: Primary tooth fix when filtered out
// ==========================================================================

Deno.test("Primary tooth reassigned when it was a filtered lower tooth", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({ tooth: "11", priority: "média" }),
      makeTooth({ tooth: "21", priority: "alta" }),
      makeTooth({ tooth: "31", priority: "alta" }), // will be filtered
    ],
    primary_tooth: "31", // was lower, will be removed
  });

  const result = processAnalysisResult(analysis);

  // 31 was the primary tooth but got removed → should be reassigned
  assertEquals(result.primary_tooth !== "31", true, "Primary should not be a removed lower tooth");
  assertExists(result.primary_tooth, "Primary tooth should be reassigned");
  // The first tooth after sorting by priority (alta > média) should be the new primary
  assertEquals(result.primary_tooth, result.detected_teeth[0].tooth);
});

// ==========================================================================
// Test: Deduplication
// ==========================================================================

Deno.test("Duplicate tooth numbers are deduplicated (keep first)", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({ tooth: "11", indication_reason: "First occurrence", priority: "alta" }),
      makeTooth({ tooth: "11", indication_reason: "Second occurrence", priority: "média" }),
      makeTooth({ tooth: "21" }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  const tooth11s = result.detected_teeth.filter((t: DetectedTooth) => t.tooth === "11");
  assertEquals(tooth11s.length, 1, "Only one instance of tooth 11 should remain");
  assertEquals(tooth11s[0].indication_reason, "First occurrence", "First occurrence should be kept");
});

// ==========================================================================
// Test: Priority sorting
// ==========================================================================

Deno.test("Teeth are sorted by priority: alta > média > baixa", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({ tooth: "11", priority: "baixa" }),
      makeTooth({ tooth: "12", priority: "alta" }),
      makeTooth({ tooth: "13", priority: "média" }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth[0].tooth, "12", "alta should be first");
  assertEquals(result.detected_teeth[1].tooth, "13", "média should be second");
  assertEquals(result.detected_teeth[2].tooth, "11", "baixa should be last");
});

// ==========================================================================
// Test: Black classification removal for aesthetic cases
// ==========================================================================

Deno.test("Black classification removed for aesthetic treatment (faceta)", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({
        tooth: "11",
        cavity_class: "Classe III",
        treatment_indication: "porcelana",
        indication_reason: "Faceta de porcelana indicada",
      }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth[0].cavity_class, null, "Black classification should be removed for faceta");
});

Deno.test("Black classification preserved for restorative treatment", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({
        tooth: "36",
        cavity_class: "Classe II",
        treatment_indication: "resina",
        indication_reason: "Cárie mesial",
      }),
    ],
    primary_tooth: "36",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth[0].cavity_class, "Classe II", "Black classification should be preserved for restorative");
});

// ==========================================================================
// Test: Diastema bilateral exception at low confidence
// ==========================================================================

Deno.test("Bilateral central diastema preserved at low confidence (exception)", () => {
  const analysis = makeAnalysis({
    confidence: 40, // Below 65% threshold
    detected_teeth: [
      makeTooth({
        tooth: "11",
        indication_reason: "Diastema central",
        cavity_class: "Fechamento de Diastema",
      }),
      makeTooth({
        tooth: "21",
        notes: "Diastema mesial com 11",
        cavity_class: "Fechamento de Diastema",
      }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  // Bilateral central (11+21) is an exception to Rule 1 — should be preserved
  assertEquals(result.detected_teeth.length, 2, "Bilateral central diastema should be preserved even at low confidence");
});

// ==========================================================================
// Test: Adjacent pair diastema exception at low confidence
// ==========================================================================

Deno.test("Adjacent pair diastema (12+13) preserved at low confidence (exception)", () => {
  const analysis = makeAnalysis({
    confidence: 40, // Below 65% threshold
    detected_teeth: [
      makeTooth({
        tooth: "12",
        indication_reason: "Diastema lateral",
        cavity_class: "Fechamento de Diastema",
      }),
      makeTooth({
        tooth: "13",
        notes: "Diastema com 12",
        cavity_class: "Fechamento de Diastema",
      }),
    ],
    primary_tooth: "12",
  });

  const result = processAnalysisResult(analysis);

  // Adjacent pair (12+13) is an exception to Rule 1 — should be preserved
  assertEquals(result.detected_teeth.length, 2, "Adjacent pair diastema should be preserved even at low confidence");
});

// ==========================================================================
// Test: Treatment indication normalization
// ==========================================================================

Deno.test("English treatment indication is normalized to Portuguese", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({
        tooth: "11",
        treatment_indication: "resin" as unknown as DetectedTooth["treatment_indication"],
      }),
    ],
    treatment_indication: "porcelain" as unknown as PhotoAnalysisResult["treatment_indication"],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  assertEquals(result.detected_teeth[0].treatment_indication, "resina", "English 'resin' should normalize to 'resina'");
  assertEquals(result.treatment_indication, "porcelana", "English 'porcelain' should normalize to 'porcelana'");
});

// ==========================================================================
// Test: Multiple warnings
// ==========================================================================

Deno.test("Multiple teeth detected adds selection warning", () => {
  const analysis = makeAnalysis({
    confidence: 90,
    detected_teeth: [
      makeTooth({ tooth: "11" }),
      makeTooth({ tooth: "21" }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  const hasMultiWarning = result.warnings.some((w: string) => w.includes("2 dentes"));
  assertEquals(hasMultiWarning, true, "Should warn about multiple teeth detected");
});

Deno.test("Single tooth at low confidence adds reanalisar warning", () => {
  const analysis = makeAnalysis({
    confidence: 70,
    detected_teeth: [
      makeTooth({ tooth: "11" }),
    ],
    primary_tooth: "11",
  });

  const result = processAnalysisResult(analysis);

  const hasReanalyzeWarning = result.warnings.some((w: string) => w.includes("Reanalisar"));
  assertEquals(hasReanalyzeWarning, true, "Should suggest reanalyze for single tooth at low confidence");
});
