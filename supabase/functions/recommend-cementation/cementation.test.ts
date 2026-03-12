/**
 * Tests for recommend-cementation helpers.
 *
 * Covers:
 * - normalizeCeramicType: canonical keys, aliases, accent stripping, unknown types
 * - deriveTreatmentType: zirconia → "coroa", all others → "porcelana"
 * - validateRequest: required fields, FDI tooth notation, ceramicType enum, max teeth
 * - validateHFConcentration: 10% HF corrected to 5% for lithium disilicate,
 *   untouched for non-disilicate ceramics, no false positives on correct 5%
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import {
  normalizeCeramicType,
  deriveTreatmentType,
  validateRequest,
  validateHFConcentration,
  VALID_CERAMIC_TYPES,
} from "./cementation-helpers.ts";

// ==========================================================================
// normalizeCeramicType
// ==========================================================================

Deno.test("normalizeCeramicType — canonical keys pass through unchanged", () => {
  for (const key of VALID_CERAMIC_TYPES) {
    assertEquals(
      normalizeCeramicType(key),
      key,
      `Expected canonical key "${key}" to normalize to itself`,
    );
  }
});

Deno.test("normalizeCeramicType — e.max aliases → dissilicato_de_litio", () => {
  const variants = ["e.max", "emax", "E.MAX", "IPS e.max", "dissilicato de litio", "dissilicato de lítio"];
  for (const v of variants) {
    assertEquals(
      normalizeCeramicType(v),
      "dissilicato_de_litio",
      `Expected "${v}" to map to dissilicato_de_litio`,
    );
  }
});

Deno.test("normalizeCeramicType — leucita / IPS Empress aliases → leucita", () => {
  const variants = ["leucita", "IPS Empress", "Empress", "LEUCITA"];
  for (const v of variants) {
    assertEquals(
      normalizeCeramicType(v),
      "leucita",
      `Expected "${v}" to map to leucita`,
    );
  }
});

Deno.test("normalizeCeramicType — feldspathic aliases → feldspatica", () => {
  const variants = [
    "feldspatica",
    "feldspática",
    "ceramica feldspática",
    "ceramica feldspatica",
    "porcelana feldspática",
    "porcelana feldspatica",
  ];
  for (const v of variants) {
    assertEquals(
      normalizeCeramicType(v),
      "feldspatica",
      `Expected "${v}" to map to feldspatica`,
    );
  }
});

Deno.test("normalizeCeramicType — zirconia aliases → zirconia", () => {
  const variants = ["zirconia", "zircônia", "ZIRCONIA", "Zircônia"];
  for (const v of variants) {
    assertEquals(
      normalizeCeramicType(v),
      "zirconia",
      `Expected "${v}" to map to zirconia`,
    );
  }
});

Deno.test("normalizeCeramicType — reinforced zirconia aliases → zirconia_reforcada", () => {
  const variants = [
    "zirconia reforcada",
    "zircônia reforçada",
    "zirconia reforçada",
    "zircônia reforcada",
    "zirconia_reforcada",
  ];
  for (const v of variants) {
    assertEquals(
      normalizeCeramicType(v),
      "zirconia_reforcada",
      `Expected "${v}" to map to zirconia_reforcada`,
    );
  }
});

Deno.test("normalizeCeramicType — CAD/CAM resin aliases → resina_cad_cam", () => {
  const variants = ["resina cad cam", "resina cad/cam", "cad cam", "cad/cam", "resina_cad_cam"];
  for (const v of variants) {
    assertEquals(
      normalizeCeramicType(v),
      "resina_cad_cam",
      `Expected "${v}" to map to resina_cad_cam`,
    );
  }
});

Deno.test("normalizeCeramicType — unknown ceramic type returns null", () => {
  const unknowns = ["metal", "amalgama", "compômero", "glass ionomer", "", "   "];
  for (const v of unknowns) {
    assertEquals(
      normalizeCeramicType(v),
      null,
      `Expected unknown type "${v}" to return null`,
    );
  }
});

Deno.test("normalizeCeramicType — extra whitespace is trimmed", () => {
  assertEquals(normalizeCeramicType("  e.max  "), "dissilicato_de_litio");
  assertEquals(normalizeCeramicType("  zirconia  "), "zirconia");
});

Deno.test("normalizeCeramicType — case insensitive matching", () => {
  assertEquals(normalizeCeramicType("FELDSPATICA"), "feldspatica");
  assertEquals(normalizeCeramicType("Dissilicato_De_Litio"), "dissilicato_de_litio");
  assertEquals(normalizeCeramicType("LEUCITA"), "leucita");
});

// ==========================================================================
// deriveTreatmentType
// ==========================================================================

Deno.test("deriveTreatmentType — zirconia → coroa", () => {
  assertEquals(deriveTreatmentType("zirconia"), "coroa");
  assertEquals(deriveTreatmentType("ZIRCONIA"), "coroa");
  assertEquals(deriveTreatmentType("zircônia"), "coroa");
});

Deno.test("deriveTreatmentType — reinforced zirconia → coroa", () => {
  assertEquals(deriveTreatmentType("zirconia_reforcada"), "coroa");
  assertEquals(deriveTreatmentType("zircônia reforçada"), "coroa");
});

Deno.test("deriveTreatmentType — lithium disilicate → porcelana", () => {
  assertEquals(deriveTreatmentType("dissilicato_de_litio"), "porcelana");
  assertEquals(deriveTreatmentType("e.max"), "porcelana");
  assertEquals(deriveTreatmentType("emax"), "porcelana");
});

Deno.test("deriveTreatmentType — leucite → porcelana", () => {
  assertEquals(deriveTreatmentType("leucita"), "porcelana");
  assertEquals(deriveTreatmentType("IPS Empress"), "porcelana");
});

Deno.test("deriveTreatmentType — feldspathic → porcelana", () => {
  assertEquals(deriveTreatmentType("feldspatica"), "porcelana");
  assertEquals(deriveTreatmentType("porcelana feldspática"), "porcelana");
});

Deno.test("deriveTreatmentType — CAD/CAM resin → porcelana", () => {
  assertEquals(deriveTreatmentType("resina_cad_cam"), "porcelana");
  assertEquals(deriveTreatmentType("cad/cam"), "porcelana");
});

Deno.test("deriveTreatmentType — unknown type falls back to porcelana", () => {
  // Unknown types can't be zirconia, so must default to porcelana
  assertEquals(deriveTreatmentType("unknown_material"), "porcelana");
});

// ==========================================================================
// validateRequest — missing required fields
// ==========================================================================

const VALID_PAYLOAD = {
  evaluationId: "eval-abc-123",
  teeth: ["11", "12", "21", "22"],
  shade: "A2",
  ceramicType: "dissilicato_de_litio",
  substrate: "esmalte",
};

Deno.test("validateRequest — valid payload returns success with normalized ceramicType", () => {
  const result = validateRequest(VALID_PAYLOAD);
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.data.evaluationId, "eval-abc-123");
  assertEquals(result.data.ceramicType, "dissilicato_de_litio");
  assertEquals(result.data.teeth, ["11", "12", "21", "22"]);
});

Deno.test("validateRequest — ceramicType alias is normalized in returned data", () => {
  const result = validateRequest({ ...VALID_PAYLOAD, ceramicType: "e.max" });
  assertEquals(result.success, true);
  assertEquals(result.data?.ceramicType, "dissilicato_de_litio");
});

Deno.test("validateRequest — null input returns error", () => {
  const result = validateRequest(null);
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("validateRequest — non-object input returns error", () => {
  const result = validateRequest("not an object");
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("validateRequest — missing evaluationId returns error", () => {
  const { evaluationId: _omit, ...rest } = VALID_PAYLOAD;
  const result = validateRequest(rest);
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "avalia");
});

Deno.test("validateRequest — missing teeth returns error", () => {
  const { teeth: _omit, ...rest } = VALID_PAYLOAD;
  const result = validateRequest(rest);
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "Dentes");
});

Deno.test("validateRequest — empty teeth array returns error", () => {
  const result = validateRequest({ ...VALID_PAYLOAD, teeth: [] });
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "Dentes");
});

Deno.test("validateRequest — teeth array exceeding 32 returns error", () => {
  // 33 teeth — more than a full adult dentition
  const tooManyTeeth = Array.from({ length: 33 }, (_, i) => {
    const quad = Math.floor(i / 8) + 1;
    const pos = (i % 8) + 1;
    return `${quad}${pos}`;
  });
  const result = validateRequest({ ...VALID_PAYLOAD, teeth: tooManyTeeth });
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "32");
});

Deno.test("validateRequest — invalid FDI notation (5th quadrant) returns error", () => {
  const result = validateRequest({ ...VALID_PAYLOAD, teeth: ["55"] }); // 5x = primary, rejected
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "inválido");
});

Deno.test("validateRequest — invalid FDI notation (position 9) returns error", () => {
  const result = validateRequest({ ...VALID_PAYLOAD, teeth: ["19"] });
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "inválido");
});

Deno.test("validateRequest — invalid FDI notation (3 digits) returns error", () => {
  const result = validateRequest({ ...VALID_PAYLOAD, teeth: ["123"] });
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "inválido");
});

Deno.test("validateRequest — invalid FDI notation (non-numeric) returns error", () => {
  const result = validateRequest({ ...VALID_PAYLOAD, teeth: ["AA"] });
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "inválido");
});

Deno.test("validateRequest — all valid FDI quadrants and positions accepted", () => {
  // Test representative teeth from each quadrant
  const validTeeth = ["11", "18", "21", "28", "31", "38", "41", "48"];
  const result = validateRequest({ ...VALID_PAYLOAD, teeth: validTeeth });
  assertEquals(result.success, true);
});

Deno.test("validateRequest — missing shade returns error", () => {
  const { shade: _omit, ...rest } = VALID_PAYLOAD;
  const result = validateRequest(rest);
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "Cor");
});

Deno.test("validateRequest — missing substrate returns error", () => {
  const { substrate: _omit, ...rest } = VALID_PAYLOAD;
  const result = validateRequest(rest);
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "Substrato");
});

Deno.test("validateRequest — missing ceramicType returns error", () => {
  const { ceramicType: _omit, ...rest } = VALID_PAYLOAD;
  const result = validateRequest(rest);
  assertEquals(result.success, false);
  assertStringIncludes(result.error!, "ceramicType");
});

Deno.test("validateRequest — invalid ceramicType returns descriptive error listing valid types", () => {
  const result = validateRequest({ ...VALID_PAYLOAD, ceramicType: "metal_fundido" });
  assertEquals(result.success, false);
  assertExists(result.error);
  assertStringIncludes(result.error!, "Tipo cerâmico inválido");
  // Should list the valid types so the client knows what to use
  assertStringIncludes(result.error!, "dissilicato_de_litio");
});

Deno.test("validateRequest — optional fields (substrateCondition, aestheticGoals, dsdContext) are included in data", () => {
  const payload = {
    ...VALID_PAYLOAD,
    substrateCondition: "escurecido",
    aestheticGoals: "clareamento",
    dsdContext: {
      currentIssue: "diastema central",
      proposedChange: "fechamento com facetas",
      observations: ["caso estético alto risco"],
    },
  };
  const result = validateRequest(payload);
  assertEquals(result.success, true);
  assertEquals(result.data?.substrateCondition, "escurecido");
  assertEquals(result.data?.aestheticGoals, "clareamento");
  assertExists(result.data?.dsdContext);
  assertEquals(result.data?.dsdContext?.currentIssue, "diastema central");
});

Deno.test("validateRequest — ceramicType long string is truncated in error message", () => {
  const longInvalidType = "a".repeat(100);
  const result = validateRequest({ ...VALID_PAYLOAD, ceramicType: longInvalidType });
  assertEquals(result.success, false);
  assertExists(result.error);
  // Error message truncates to 50 chars of the input
  assertEquals(result.error!.includes("a".repeat(51)), false, "Error message should not contain >50 chars of input");
});

// ==========================================================================
// validateHFConcentration
// ==========================================================================

function makeProtocolWithHF(
  stepText: string,
  materialText: string,
  existingWarnings: string[] = [],
): Record<string, unknown> {
  return {
    preparation_steps: [],
    ceramic_treatment: [
      { order: 1, step: stepText, material: materialText },
    ],
    tooth_treatment: [],
    finishing: [],
    warnings: existingWarnings,
  };
}

Deno.test("validateHFConcentration — corrects 10% HF to 5% for dissilicato_de_litio", () => {
  const protocol = makeProtocolWithHF(
    "Aplicar ácido HF 10% por 20s",
    "Acido fluorídrico 10%",
  );

  validateHFConcentration(protocol, "dissilicato_de_litio");

  const steps = protocol.ceramic_treatment as Array<{ step: string; material: string }>;
  assertEquals(
    steps[0].step.includes("10%"),
    false,
    "10% must be removed from step text",
  );
  assertEquals(
    steps[0].step.includes("5%"),
    true,
    "5% must be present in corrected step text",
  );
  assertEquals(
    steps[0].material.includes("10%"),
    false,
    "10% must be removed from material text",
  );
  assertEquals(
    steps[0].material.includes("5%"),
    true,
    "5% must be present in corrected material text",
  );
});

Deno.test("validateHFConcentration — adds warning when 10% HF is corrected", () => {
  const protocol = makeProtocolWithHF(
    "HF 10% por 20s",
    "Ácido fluorídrico 10%",
  );

  validateHFConcentration(protocol, "dissilicato_de_litio");

  const warnings = protocol.warnings as string[];
  const hasHFWarning = warnings.some(
    (w) => w.toLowerCase().includes("hf") && w.includes("5%"),
  );
  assertEquals(hasHFWarning, true, "Should add HF safety warning");
});

Deno.test("validateHFConcentration — appends to existing warnings without clobbering them", () => {
  const existingWarning = "Isolar com rubber dam";
  const protocol = makeProtocolWithHF(
    "HF 10% por 20s",
    "Acido HF 10%",
    [existingWarning],
  );

  validateHFConcentration(protocol, "dissilicato_de_litio");

  const warnings = protocol.warnings as string[];
  assertEquals(
    warnings.some((w) => w === existingWarning),
    true,
    "Original warning must be preserved",
  );
  assertEquals(warnings.length >= 2, true, "Should have at least 2 warnings after correction");
});

Deno.test("validateHFConcentration — no correction for e.max alias (matched by regex)", () => {
  // 'e.max' matches the regex /e\.?max|dissilicato|lithium/i
  const protocol = makeProtocolWithHF(
    "Condicionamento com HF 10%",
    "Acido HF 10%",
  );

  validateHFConcentration(protocol, "e.max");

  const steps = protocol.ceramic_treatment as Array<{ step: string; material: string }>;
  assertEquals(
    steps[0].step.includes("5%"),
    true,
    "e.max alias should trigger HF correction too",
  );
});

Deno.test("validateHFConcentration — no change for zirconia (should NOT use HF acid)", () => {
  // Zirconia must NOT be etched with HF — the function should not touch zirconia protocols
  const protocol = makeProtocolWithHF(
    "Jato de alumina 50µm",
    "Partículas de alumina",
  );

  const originalStep = (protocol.ceramic_treatment as Array<{ step: string }>)[0].step;
  validateHFConcentration(protocol, "zirconia");

  const steps = protocol.ceramic_treatment as Array<{ step: string }>;
  assertEquals(
    steps[0].step,
    originalStep,
    "Zirconia protocol step must not be modified",
  );
  const warnings = protocol.warnings as string[];
  assertEquals(warnings.length, 0, "No HF warnings should be added for zirconia");
});

Deno.test("validateHFConcentration — no change for leucita (different HF rules)", () => {
  const protocol = makeProtocolWithHF(
    "Condicionamento com HF 5% por 60s",
    "Acido HF 5%",
  );

  validateHFConcentration(protocol, "leucita");

  const steps = protocol.ceramic_treatment as Array<{ step: string }>;
  assertEquals(
    steps[0].step,
    "Condicionamento com HF 5% por 60s",
    "Leucita protocol must not be modified",
  );
});

Deno.test("validateHFConcentration — correct 5% HF is NOT changed for dissilicato", () => {
  // If AI correctly specified 5%, it must not be altered
  const protocol = makeProtocolWithHF(
    "Condicionamento com HF 5% por 20s",
    "Acido fluorídrico 5%",
  );

  validateHFConcentration(protocol, "dissilicato_de_litio");

  const steps = protocol.ceramic_treatment as Array<{ step: string; material: string }>;
  assertEquals(
    steps[0].step,
    "Condicionamento com HF 5% por 20s",
    "Correct 5% HF must remain unchanged",
  );
  const warnings = protocol.warnings as string[];
  assertEquals(warnings.length, 0, "No warning should be added when HF is already correct");
});

Deno.test("validateHFConcentration — handles missing ceramic_treatment gracefully", () => {
  const protocol: Record<string, unknown> = {
    preparation_steps: [],
    // ceramic_treatment intentionally absent
    warnings: [],
  };

  // Must not throw
  validateHFConcentration(protocol, "dissilicato_de_litio");

  // Protocol is returned unchanged
  assertEquals(protocol.ceramic_treatment, undefined);
});

Deno.test("validateHFConcentration — handles non-array ceramic_treatment gracefully", () => {
  const protocol: Record<string, unknown> = {
    ceramic_treatment: "invalid",
    warnings: [],
  };

  // Must not throw
  validateHFConcentration(protocol, "dissilicato_de_litio");

  assertEquals(protocol.ceramic_treatment, "invalid", "Non-array ceramic_treatment returned unchanged");
});

Deno.test("validateHFConcentration — multiple steps: only the HF step is corrected", () => {
  const protocol: Record<string, unknown> = {
    ceramic_treatment: [
      { order: 1, step: "Limpar com vapor de água", material: "Água destilada" },
      { order: 2, step: "Condicionar com HF 10% por 20s", material: "Acido fluorídrico 10%" },
      { order: 3, step: "Lavar com água corrente por 30s", material: "Água" },
    ],
    warnings: [],
  };

  validateHFConcentration(protocol, "dissilicato_de_litio");

  const steps = protocol.ceramic_treatment as Array<{ step: string; material: string }>;
  // Step 1 and 3 untouched
  assertEquals(steps[0].step, "Limpar com vapor de água");
  assertEquals(steps[2].step, "Lavar com água corrente por 30s");
  // Step 2 corrected
  assertEquals(steps[1].step.includes("5%"), true);
  assertEquals(steps[1].step.includes("10%"), false);
});

Deno.test("validateHFConcentration — returns the protocol object (for chaining)", () => {
  const protocol = makeProtocolWithHF("Aplicar HF 5%", "HF 5%");
  const result = validateHFConcentration(protocol, "dissilicato_de_litio");
  assertEquals(result === protocol, true, "validateHFConcentration should return the same protocol object");
});

// ==========================================================================
// Integration: validateRequest + deriveTreatmentType end-to-end shapes
// ==========================================================================

Deno.test("end-to-end: valid dissilicato request → porcelana treatment type", () => {
  const result = validateRequest({
    evaluationId: "eval-xyz",
    teeth: ["11", "21"],
    shade: "BL1",
    ceramicType: "e.max",
    substrate: "esmalte",
  });

  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.data.ceramicType, "dissilicato_de_litio");
  assertEquals(deriveTreatmentType(result.data.ceramicType), "porcelana");
});

Deno.test("end-to-end: valid zirconia request → coroa treatment type", () => {
  const result = validateRequest({
    evaluationId: "eval-xyz",
    teeth: ["16"],
    shade: "A2",
    ceramicType: "zircônia reforçada",
    substrate: "dentina",
  });

  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.data.ceramicType, "zirconia_reforcada");
  assertEquals(deriveTreatmentType(result.data.ceramicType), "coroa");
});

Deno.test("end-to-end: feldspathic porcelain with DSD context", () => {
  const result = validateRequest({
    evaluationId: "eval-dsd-001",
    teeth: ["11", "12", "21", "22", "13", "23"],
    shade: "BL2",
    ceramicType: "porcelana feldspatica",
    substrate: "esmalte",
    aestheticGoals: "smile design completo",
    dsdContext: {
      currentIssue: "desgaste incisal severo",
      proposedChange: "restauração com facetas",
      observations: ["sorriso gengival", "linha do sorriso invertida"],
    },
  });

  assertEquals(result.success, true);
  assertEquals(result.data?.ceramicType, "feldspatica");
  assertEquals(deriveTreatmentType("feldspatica"), "porcelana");
  assertEquals(result.data?.dsdContext?.observations.length, 2);
});
