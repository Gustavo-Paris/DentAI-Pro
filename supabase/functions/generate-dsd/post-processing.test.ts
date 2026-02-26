/**
 * Tests for generate-dsd/post-processing.ts
 *
 * Covers the most critical edge cases that have caused production bugs:
 * - shouldStripGingivo logic: when to strip gengivoplasty
 * - Gengivoplasty preservation for "média" smile line when DSD explicitly recommends it
 * - Lower teeth filter for DSD
 * - Invalid FDI tooth numbers stripped
 * - Visagismo removed when no face photo
 * - Treatment indication consistency fixes
 * - Overbite warning
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import { applyPostProcessingSafetyNets } from "./post-processing.ts";
import type { DSDAnalysis, AdditionalPhotos } from "./types.ts";

// ---------------------------------------------------------------------------
// Helper: build a minimal DSDAnalysis
// ---------------------------------------------------------------------------

interface SuggestionInput {
  tooth: string;
  current_issue: string;
  proposed_change: string;
  treatment_indication?: string;
}

function makeAnalysis(overrides: Partial<DSDAnalysis> & { suggestions?: SuggestionInput[] } = {}): DSDAnalysis {
  return {
    facial_midline: overrides.facial_midline ?? "centrada",
    dental_midline: overrides.dental_midline ?? "alinhada",
    smile_line: overrides.smile_line ?? "alta",
    buccal_corridor: overrides.buccal_corridor ?? "adequado",
    occlusal_plane: overrides.occlusal_plane ?? "nivelado",
    golden_ratio_compliance: overrides.golden_ratio_compliance ?? 85,
    symmetry_score: overrides.symmetry_score ?? 90,
    suggestions: (overrides.suggestions ?? []) as DSDAnalysis["suggestions"],
    observations: overrides.observations ?? [],
    confidence: overrides.confidence ?? "alta",
    face_shape: overrides.face_shape,
    perceived_temperament: overrides.perceived_temperament,
    recommended_tooth_shape: overrides.recommended_tooth_shape,
    visagism_notes: overrides.visagism_notes,
    lip_thickness: overrides.lip_thickness,
    overbite_suspicion: overrides.overbite_suspicion,
    smile_arc: overrides.smile_arc,
  };
}

// ==========================================================================
// Test: shouldStripGingivo logic
// ==========================================================================

Deno.test("Gengivoplasty stripped for 'baixa' smile line", () => {
  const analysis = makeAnalysis({
    smile_line: "baixa",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Excesso gengival",
        proposed_change: "Gengivoplastia para melhorar proporção",
        treatment_indication: "gengivoplastia",
      },
      {
        tooth: "21",
        current_issue: "Desgaste incisal",
        proposed_change: "Aumento incisal com resina",
        treatment_indication: "resina",
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  // Gengivoplasty should be stripped for baixa smile line
  assertEquals(analysis.suggestions.length, 1, "Gengivoplasty suggestion should be stripped for baixa");
  assertEquals(analysis.suggestions[0].tooth, "21", "Resina suggestion should remain");
});

Deno.test("Gengivoplasty preserved for 'alta' smile line", () => {
  const analysis = makeAnalysis({
    smile_line: "alta",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Excesso gengival",
        proposed_change: "Gengivoplastia para melhorar proporção",
        treatment_indication: "gengivoplastia",
      },
      {
        tooth: "21",
        current_issue: "Desgaste incisal",
        proposed_change: "Resina para aumento",
        treatment_indication: "resina",
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(analysis.suggestions.length, 2, "Both suggestions should remain for alta smile line");
});

Deno.test("Gengivoplasty preserved for 'média' smile line (trust AI)", () => {
  const analysis = makeAnalysis({
    smile_line: "média",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Assimetria gengival com 21",
        proposed_change: "Gengivoplastia para equalizar margem gengival",
        treatment_indication: "gengivoplastia",
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(
    analysis.suggestions.length,
    1,
    "Gengivoplasty should be preserved for média smile line — AI analysis trusted",
  );
  assertEquals(analysis.suggestions[0].tooth, "11");
});

// ==========================================================================
// Test: Lower teeth filter for DSD
// ==========================================================================

Deno.test("Lower teeth suggestions stripped when upper arch predominant", () => {
  const analysis = makeAnalysis({
    suggestions: [
      { tooth: "11", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "12", current_issue: "Diastema", proposed_change: "Fechamento" },
      { tooth: "21", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "31", current_issue: "Desgaste", proposed_change: "Resina" }, // lower — should be removed
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(analysis.suggestions.length, 3, "Lower tooth 31 should be stripped");
  const hasLower = analysis.suggestions.some(s => parseInt(s.tooth) >= 31);
  assertEquals(hasLower, false, "No lower teeth should remain");

  const hasLowerObs = analysis.observations.some(o => o.includes("inferiores"));
  assertEquals(hasLowerObs, true, "Should add observation about removed lower teeth");
});

Deno.test("Lower teeth preserved when lower arch is predominant", () => {
  const analysis = makeAnalysis({
    suggestions: [
      { tooth: "31", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "32", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "41", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "11", current_issue: "Desgaste", proposed_change: "Resina" }, // minority upper
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  // 3 lower > 1 upper → condition is `upper >= lower` → 1 >= 3 is false → keep all
  assertEquals(analysis.suggestions.length, 4, "All teeth should remain when lower is predominant");
});

Deno.test("Lower teeth stripped when counts are equal (upper >= lower)", () => {
  const analysis = makeAnalysis({
    suggestions: [
      { tooth: "11", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "21", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "31", current_issue: "Desgaste", proposed_change: "Resina" },
      { tooth: "41", current_issue: "Desgaste", proposed_change: "Resina" },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  // The DSD code uses `>=` (upperSuggestions.length >= lowerSuggestions.length)
  // 2 >= 2 is true → lower teeth are stripped
  assertEquals(analysis.suggestions.length, 2, "Lower teeth stripped when counts are equal");
  const hasLower = analysis.suggestions.some(s => parseInt(s.tooth) >= 31);
  assertEquals(hasLower, false, "No lower teeth when counts equal — DSD uses >=");
});

// ==========================================================================
// Test: Invalid FDI tooth numbers stripped
// ==========================================================================

Deno.test("Invalid FDI tooth numbers are stripped", () => {
  const analysis = makeAnalysis({
    suggestions: [
      { tooth: "11", current_issue: "OK", proposed_change: "Resina" },
      { tooth: "99", current_issue: "Invalid", proposed_change: "Resina" },  // invalid
      { tooth: "0", current_issue: "Invalid", proposed_change: "Resina" },   // invalid
      { tooth: "abc", current_issue: "Invalid", proposed_change: "Resina" }, // invalid
      { tooth: "51", current_issue: "Invalid", proposed_change: "Resina" },  // invalid (quadrant 5)
      { tooth: "19", current_issue: "Invalid", proposed_change: "Resina" },  // invalid (position 9)
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(analysis.suggestions.length, 1, "Only valid FDI tooth should remain");
  assertEquals(analysis.suggestions[0].tooth, "11");
});

Deno.test("All valid FDI numbers pass through", () => {
  const validTeeth = ["11", "12", "13", "14", "15", "16", "17", "18",
                      "21", "22", "23", "24", "25", "26", "27", "28",
                      "31", "32", "33", "34", "35", "36", "37", "38",
                      "41", "42", "43", "44", "45", "46", "47", "48"];

  const analysis = makeAnalysis({
    suggestions: validTeeth.map(t => ({
      tooth: t,
      current_issue: "Test",
      proposed_change: "Test",
    })),
  });

  applyPostProcessingSafetyNets(analysis);

  // Lower teeth filter may remove some, but the FDI validation itself should pass all
  // Since we have 16 upper and 16 lower (equal), upper >= lower is true → lower stripped
  // So we expect 16 upper teeth
  assertEquals(analysis.suggestions.length, 16, "All 16 upper FDI teeth should pass validation");
});

// ==========================================================================
// Test: Visagismo removed when no face photo
// ==========================================================================

Deno.test("Visagismo reset when no face photo provided", () => {
  const analysis = makeAnalysis({
    face_shape: "quadrado",
    perceived_temperament: "colérico",
    recommended_tooth_shape: "quadrado",
    visagism_notes: "Formato quadrado indica dentes retangulares",
    observations: [
      "Formato facial: quadrado",
      "Temperamento percebido: colérico",
      "Desgaste incisal observado",
    ],
  });

  // No face photo
  applyPostProcessingSafetyNets(analysis, { face: undefined });

  assertEquals(analysis.face_shape, "oval", "Face shape should be reset to neutral default");
  assertEquals(analysis.perceived_temperament, "fleumático", "Temperament should be reset to neutral default");
  assertEquals(analysis.recommended_tooth_shape, "natural", "Tooth shape should be reset to neutral");
  assertStringIncludes(
    analysis.visagism_notes!,
    "foto da face completa",
    "Visagism notes should explain face photo is needed",
  );

  // Visagismo-specific observations should be removed
  const hasVisagismObs = analysis.observations.some(o =>
    o.toLowerCase().startsWith("formato facial") || o.toLowerCase().startsWith("temperamento percebido"),
  );
  assertEquals(hasVisagismObs, false, "Visagismo observations should be removed");

  // Non-visagismo observation should remain
  const hasDesgasteObs = analysis.observations.some(o => o.includes("Desgaste incisal"));
  assertEquals(hasDesgasteObs, true, "Non-visagismo observations should remain");

  // Should add explanation observation
  const hasExplanation = analysis.observations.some(o => o.includes("Análise de visagismo não realizada"));
  assertEquals(hasExplanation, true, "Should add explanation about missing face photo");
});

Deno.test("Visagismo preserved when face photo provided", () => {
  const analysis = makeAnalysis({
    face_shape: "quadrado",
    perceived_temperament: "colérico",
    recommended_tooth_shape: "quadrado",
    visagism_notes: "Real analysis notes",
  });

  applyPostProcessingSafetyNets(analysis, { face: "base64facedata" });

  assertEquals(analysis.face_shape, "quadrado", "Face shape should be preserved with face photo");
  assertEquals(analysis.perceived_temperament, "colérico", "Temperament should be preserved");
});

Deno.test("No visagismo data — no changes when no face photo (no-op)", () => {
  const analysis = makeAnalysis({
    // face_shape is undefined → hadVisagism check should be false
    face_shape: undefined,
    perceived_temperament: undefined,
  });

  applyPostProcessingSafetyNets(analysis, { face: undefined });

  // Should not add visagismo explanation observation when there was no visagismo data to begin with
  const hasExplanation = analysis.observations.some(o => o.includes("visagismo não realizada"));
  assertEquals(hasExplanation, false, "Should NOT add visagismo explanation when no visagismo data existed");
});

// ==========================================================================
// Test: Treatment indication consistency fixes
// ==========================================================================

Deno.test("Incisal increase with gengivoplastia treatment fixed to resina", () => {
  const analysis = makeAnalysis({
    suggestions: [
      {
        tooth: "11",
        current_issue: "Borda incisal desgastada",
        proposed_change: "Aumento incisal com resina",
        treatment_indication: "gengivoplastia", // wrong
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(
    analysis.suggestions[0].treatment_indication,
    "resina",
    "Incisal increase should be resina, not gengivoplastia",
  );
});

Deno.test("Root exposure with gengivoplastia treatment fixed to recobrimento_radicular", () => {
  const analysis = makeAnalysis({
    suggestions: [
      {
        tooth: "13",
        current_issue: "Recessão gengival com raiz exposta",
        proposed_change: "Recobrimento radicular",
        treatment_indication: "gengivoplastia", // wrong
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(
    analysis.suggestions[0].treatment_indication,
    "recobrimento_radicular",
    "Root exposure should be recobrimento_radicular, not gengivoplastia",
  );
});

Deno.test("Encaminhamento for gengivoplastia fixed to gengivoplastia", () => {
  const analysis = makeAnalysis({
    suggestions: [
      {
        tooth: "22",
        current_issue: "Excesso gengival",
        proposed_change: "Gengivoplastia para melhorar proporção",
        treatment_indication: "encaminhamento", // should be gengivoplastia
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(
    analysis.suggestions[0].treatment_indication,
    "gengivoplastia",
    "Encaminhamento for gengivoplastia content should be fixed to gengivoplastia",
  );
});

Deno.test("Encaminhamento for recobrimento radicular fixed to recobrimento_radicular", () => {
  const analysis = makeAnalysis({
    suggestions: [
      {
        tooth: "33",
        current_issue: "Recobrimento radicular necessário",
        proposed_change: "Enxerto gengival",
        treatment_indication: "encaminhamento", // should be recobrimento_radicular
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(
    analysis.suggestions[0].treatment_indication,
    "recobrimento_radicular",
    "Encaminhamento for recobrimento content should be fixed",
  );
});

Deno.test("Tooth increase (aumento) with gengivoplastia fixed to resina (Case 6)", () => {
  const analysis = makeAnalysis({
    suggestions: [
      {
        tooth: "11",
        current_issue: "Dente curto",
        proposed_change: "Acréscimo incisal para maior comprimento",
        treatment_indication: "gengivoplastia", // wrong — tooth needs to get bigger, not gum removal
      },
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(
    analysis.suggestions[0].treatment_indication,
    "resina",
    "Tooth increase (acréscimo) should be resina, not gengivoplastia",
  );
});

// ==========================================================================
// Test: Overbite warning
// ==========================================================================

Deno.test("Overbite warning added when suspicion=sim with gengivoplastia", () => {
  const analysis = makeAnalysis({
    overbite_suspicion: "sim",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Excesso gengival",
        proposed_change: "Gengivoplastia",
        treatment_indication: "gengivoplastia",
      },
    ],
    observations: [],
  });

  applyPostProcessingSafetyNets(analysis);

  const hasOverbiteWarning = analysis.observations.some(o =>
    o.toLowerCase().includes("sobremordida"),
  );
  assertEquals(hasOverbiteWarning, true, "Should add overbite warning");
});

Deno.test("Overbite warning NOT added when no gengivoplastia suggestion", () => {
  const analysis = makeAnalysis({
    overbite_suspicion: "sim",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Desgaste",
        proposed_change: "Resina",
        treatment_indication: "resina",
      },
    ],
    observations: [],
  });

  applyPostProcessingSafetyNets(analysis);

  const hasOverbiteWarning = analysis.observations.some(o =>
    o.toLowerCase().includes("sobremordida"),
  );
  assertEquals(hasOverbiteWarning, false, "Should NOT add overbite warning without gengivoplastia");
});

Deno.test("Overbite warning NOT duplicated if already present", () => {
  const analysis = makeAnalysis({
    overbite_suspicion: "sim",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Excesso gengival",
        proposed_change: "Gengivoplastia",
        treatment_indication: "gengivoplastia",
      },
    ],
    observations: ["ATENÇÃO: Suspeita de sobremordida profunda — já existente"],
  });

  applyPostProcessingSafetyNets(analysis);

  const overbiteWarnings = analysis.observations.filter(o =>
    o.toLowerCase().includes("sobremordida"),
  );
  assertEquals(overbiteWarnings.length, 1, "Should NOT duplicate overbite warning");
});

// ==========================================================================
// Test: DSD gengivoplasty observation (safety net #6)
// ==========================================================================

Deno.test("Gengivoplasty observation added when DSD suggests gingival treatment (non-baixa)", () => {
  const analysis = makeAnalysis({
    smile_line: "alta",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Excesso gengival",
        proposed_change: "Gengivoplastia para melhorar proporção",
        treatment_indication: "gengivoplastia",
      },
    ],
    observations: [],
  });

  applyPostProcessingSafetyNets(analysis);

  const hasGingivoObs = analysis.observations.some(o =>
    o.toLowerCase().includes("gengivoplastia") && o.toLowerCase().includes("suger"),
  );
  assertEquals(hasGingivoObs, true, "Should add gengivoplasty observation");
});

Deno.test("Gengivoplasty observation NOT added for baixa smile line (already stripped)", () => {
  const analysis = makeAnalysis({
    smile_line: "baixa",
    suggestions: [
      {
        tooth: "11",
        current_issue: "Excesso gengival",
        proposed_change: "Gengivoplastia",
        treatment_indication: "gengivoplastia",
      },
    ],
    observations: [],
  });

  applyPostProcessingSafetyNets(analysis);

  // The gengivoplasty suggestion gets stripped (baixa smile line),
  // so the observation check should find no gingival treatment
  const hasGingivoObs = analysis.observations.some(o =>
    o.toLowerCase().includes("gengivoplastia") && o.toLowerCase().includes("suger"),
  );
  assertEquals(hasGingivoObs, false, "Should NOT add gengivoplasty observation for baixa (suggestions already stripped)");
});

// ==========================================================================
// Test: Empty suggestions array
// ==========================================================================

Deno.test("Empty suggestions array passes through cleanly", () => {
  const analysis = makeAnalysis({
    suggestions: [],
    observations: [],
  });

  applyPostProcessingSafetyNets(analysis);

  assertEquals(analysis.suggestions.length, 0);
  // Should not crash or add spurious warnings
});

// ==========================================================================
// Test: Mixed valid/invalid FDI with lower teeth filter interaction
// ==========================================================================

Deno.test("Invalid FDI stripped before lower teeth filter", () => {
  const analysis = makeAnalysis({
    suggestions: [
      { tooth: "11", current_issue: "OK", proposed_change: "Resina" },
      { tooth: "99", current_issue: "Invalid", proposed_change: "Bad" },  // invalid FDI
      { tooth: "31", current_issue: "Lower", proposed_change: "Resina" }, // valid but lower
    ],
  });

  applyPostProcessingSafetyNets(analysis);

  // 99 stripped by FDI validation → 1 upper (11), 1 lower (31)
  // upper >= lower (1 >= 1) → lower stripped
  assertEquals(analysis.suggestions.length, 1, "Only tooth 11 should remain");
  assertEquals(analysis.suggestions[0].tooth, "11");
});
