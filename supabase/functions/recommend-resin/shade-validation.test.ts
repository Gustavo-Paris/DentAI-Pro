/**
 * Tests for shade-validation.ts
 *
 * Covers the most critical edge cases that have caused production bugs:
 * - BL1/BL2/BL3 prohibited as Dentina/Corpo shades
 * - WB hard fallback when shade catalog returns empty
 * - Efeitos Incisais injection for anterior aesthetic cases
 * - Valid shades pass through unchanged
 * - Non-anterior teeth don't get Efeitos Incisais injection
 * - Minimum layer count validation
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import {
  validateAndFixProtocolLayers,
  validateMinimumLayerCount,
} from "./shade-validation.ts";

// ---------------------------------------------------------------------------
// Mock Supabase client factory
// ---------------------------------------------------------------------------

/**
 * Creates a mock Supabase client that returns the given catalog rows.
 * Simulates the `.from("resin_catalog").select(...).or(...)` chain.
 */
function createMockSupabase(
  catalogRows: Array<{ shade: string; type: string; product_line: string }> = [],
) {
  return {
    from: (_table: string) => ({
      select: (_cols: string) => ({
        or: (_filter: string) => Promise.resolve({ data: catalogRows }),
      }),
    }),
  };
}

/** Creates a mock Supabase client that returns null (simulating empty catalog). */
function createEmptySupabase() {
  return {
    from: (_table: string) => ({
      select: (_cols: string) => ({
        or: (_filter: string) => Promise.resolve({ data: null }),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Helper: build a minimal recommendation object
// ---------------------------------------------------------------------------

interface LayerInput {
  order?: number;
  name: string;
  resin_brand: string;
  shade: string;
  thickness?: string;
  purpose?: string;
  technique?: string;
  optional?: boolean;
}

function makeRecommendation(layers: LayerInput[], extras?: {
  checklist?: string[];
  alerts?: string[];
  warnings?: string[];
}) {
  return {
    protocol: {
      layers: layers.map((l, i) => ({
        order: l.order ?? i + 1,
        name: l.name,
        resin_brand: l.resin_brand,
        shade: l.shade,
        thickness: l.thickness ?? "0.5mm",
        purpose: l.purpose ?? "test",
        technique: l.technique ?? "test",
        ...(l.optional !== undefined ? { optional: l.optional } : {}),
      })),
      checklist: extras?.checklist ?? ["Step 1"],
      alerts: extras?.alerts ?? [],
      warnings: extras?.warnings ?? [],
      confidence: "alta",
      alternative: { resin: "test", shade: "A1", technique: "test", tradeoff: "test" },
    },
  };
}

// Standard Z350 catalog rows for tests
const Z350_CATALOG: Array<{ shade: string; type: string; product_line: string }> = [
  { shade: "A1", type: "universal", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "A2", type: "universal", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "A3", type: "universal", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "WB", type: "body", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "WE", type: "esmalte", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "A1E", type: "esmalte", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "CT", type: "esmalte translucido", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "DA1", type: "dentina", product_line: "3M ESPE - Filtek Z350 XT" },
  { shade: "DA2", type: "dentina", product_line: "3M ESPE - Filtek Z350 XT" },
];

// Harmonize catalog rows
const HARMONIZE_CATALOG: Array<{ shade: string; type: string; product_line: string }> = [
  { shade: "A1", type: "universal", product_line: "Kerr - Harmonize" },
  { shade: "XLE", type: "esmalte", product_line: "Kerr - Harmonize" },
];

// Empress catalog rows
const EMPRESS_CATALOG: Array<{ shade: string; type: string; product_line: string }> = [
  { shade: "BL-L", type: "esmalte", product_line: "Ivoclar - IPS Empress Direct" },
  { shade: "A1", type: "dentina", product_line: "Ivoclar - IPS Empress Direct" },
];

// Combined catalog for multi-brand tests
const FULL_CATALOG = [...Z350_CATALOG, ...HARMONIZE_CATALOG, ...EMPRESS_CATALOG];

// ==========================================================================
// Test: BL1/BL2/BL3 PROHIBITED as Dentina/Corpo shades
// ==========================================================================

Deno.test("BL1 as dentina/corpo is replaced with WB from catalog", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "BL1" },
    { name: "Esmalte Vestibular", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(Z350_CATALOG),
    tooth: "11",
    cavityClass: "Classe IV",
  });

  // BL1 is an enamel shade and must be replaced on a dentina layer
  const dentinaLayer = rec.protocol.layers.find(l => l.name === "Dentina");
  assertExists(dentinaLayer, "Dentina layer should exist");
  // BL1 should NOT survive — must be replaced by a body shade (WB preferred)
  assertEquals(dentinaLayer.shade !== "BL1", true, "BL1 must not remain as dentina shade");
  // Check that an alert was generated
  const hasAlert = rec.protocol.alerts.some(
    (a: string) => a.toLowerCase().includes("esmalte") && a.toLowerCase().includes("corpo"),
  );
  assertEquals(hasAlert, true, "Should have an alert about enamel shade used as corpo");
});

Deno.test("BL2 as corpo is replaced with WB from catalog", async () => {
  const rec = makeRecommendation([
    { name: "Corpo", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "BL2" },
    { name: "Esmalte", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(Z350_CATALOG),
  });

  const corpoLayer = rec.protocol.layers.find(l => l.name === "Corpo");
  assertExists(corpoLayer);
  assertEquals(corpoLayer.shade !== "BL2", true, "BL2 must not remain as corpo shade");
});

Deno.test("BL3 as body layer is replaced", async () => {
  const rec = makeRecommendation([
    { name: "Body", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "BL3" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(Z350_CATALOG),
  });

  const bodyLayer = rec.protocol.layers.find(l => l.name === "Body");
  assertExists(bodyLayer);
  assertEquals(bodyLayer.shade !== "BL3", true, "BL3 must not remain as body shade");
});

// ==========================================================================
// Test: WB hard fallback when shade catalog returns empty
// ==========================================================================

Deno.test("BL2 as dentina falls back to WB when catalog is empty (null)", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "BL2" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createEmptySupabase(),
  });

  const dentinaLayer = rec.protocol.layers.find(l => l.name === "Dentina");
  assertExists(dentinaLayer);
  assertEquals(dentinaLayer.shade, "WB", "Should hard fallback to WB when catalog is empty");
});

Deno.test("BL1 as dentina falls back to WB when catalog has no body rows", async () => {
  // Catalog exists but has NO body/dentina/universal rows for this product line
  const emptyBodyCatalog = [
    { shade: "WE", type: "esmalte", product_line: "3M ESPE - Filtek Z350 XT" },
    { shade: "CT", type: "esmalte translucido", product_line: "3M ESPE - Filtek Z350 XT" },
  ];

  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "BL1" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(emptyBodyCatalog),
  });

  const dentinaLayer = rec.protocol.layers.find(l => l.name === "Dentina");
  assertExists(dentinaLayer);
  assertEquals(dentinaLayer.shade, "WB", "Should hard fallback to WB when no body rows in catalog");
});

// ==========================================================================
// Test: Efeitos Incisais injection for anterior aesthetic cases
// ==========================================================================

Deno.test("Efeitos Incisais injected for anterior aesthetic case when missing", async () => {
  // 3 layers but none is Efeitos Incisais
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Translucidez", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "CT" },
    { name: "Esmalte Vestibular Final", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(FULL_CATALOG),
    tooth: "11",             // anterior
    cavityClass: "Classe IV", // aesthetic
  });

  // Should now have 4 layers (Efeitos Incisais injected before Esmalte Vestibular Final)
  assertEquals(rec.protocol.layers.length, 4, "Should inject Efeitos Incisais layer");

  const efeitosLayer = rec.protocol.layers.find(
    (l: { name?: string }) => l.name === "Efeitos Incisais",
  );
  assertExists(efeitosLayer, "Efeitos Incisais layer must exist");
  assertEquals(efeitosLayer.optional, true, "Efeitos Incisais should be marked optional");

  // Verify it's inserted before Esmalte Vestibular Final
  const efeitosIdx = rec.protocol.layers.findIndex(
    (l: { name?: string }) => l.name === "Efeitos Incisais",
  );
  const esmalteIdx = rec.protocol.layers.findIndex(
    (l: { name?: string }) => (l.name || "").toLowerCase().includes("esmalte vestibular"),
  );
  assertEquals(efeitosIdx < esmalteIdx, true, "Efeitos Incisais must come before Esmalte Vestibular Final");

  // Check alert was generated
  const hasEfeitosAlert = rec.protocol.alerts.some(
    (a: string) => a.toLowerCase().includes("efeitos incisais"),
  );
  assertEquals(hasEfeitosAlert, true, "Should have alert about Efeitos Incisais injection");
});

Deno.test("Efeitos Incisais NOT injected when already present", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Efeitos Incisais (corante)", resin_brand: "Ivoclar - Empress Direct Color", shade: "White" },
    { name: "Esmalte Vestibular Final", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(FULL_CATALOG),
    tooth: "11",
    cavityClass: "Classe IV",
  });

  const efeitosLayers = rec.protocol.layers.filter(
    (l: { name?: string }) => (l.name || "").toLowerCase().includes("efeito"),
  );
  assertEquals(efeitosLayers.length, 1, "Should NOT duplicate Efeitos Incisais when already present");
});

Deno.test("Efeitos Incisais injected for faceta direta (aesthetic class)", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Translucidez", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "CT" },
    { name: "Esmalte Final", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(FULL_CATALOG),
    tooth: "21",
    cavityClass: "Faceta Direta",
  });

  const hasEfeitos = rec.protocol.layers.some(
    (l: { name?: string }) => l.name === "Efeitos Incisais",
  );
  assertEquals(hasEfeitos, true, "Should inject Efeitos Incisais for faceta direta");
});

// ==========================================================================
// Test: Non-anterior teeth don't get Efeitos Incisais injection
// ==========================================================================

Deno.test("Efeitos Incisais NOT injected for posterior tooth", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Translucidez", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "CT" },
    { name: "Esmalte", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "A1E" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(FULL_CATALOG),
    tooth: "36",              // posterior (molar)
    cavityClass: "Classe II",
  });

  const hasEfeitos = rec.protocol.layers.some(
    (l: { name?: string }) => l.name === "Efeitos Incisais",
  );
  assertEquals(hasEfeitos, false, "Should NOT inject Efeitos Incisais for posterior teeth");
});

Deno.test("Efeitos Incisais NOT injected for premolar", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Translucidez", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "CT" },
    { name: "Esmalte", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "A1E" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(FULL_CATALOG),
    tooth: "14",              // premolar (position 4)
    cavityClass: "Classe III",
  });

  const hasEfeitos = rec.protocol.layers.some(
    (l: { name?: string }) => l.name === "Efeitos Incisais",
  );
  assertEquals(hasEfeitos, false, "Should NOT inject Efeitos Incisais for premolars (non-anterior)");
});

// ==========================================================================
// Test: Valid shades pass through unchanged
// ==========================================================================

Deno.test("Valid shades in catalog pass through without modification", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Esmalte", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(Z350_CATALOG),
  });

  assertEquals(rec.protocol.layers[0].shade, "DA1", "Valid dentina shade should pass through");
  assertEquals(rec.protocol.layers[1].shade, "WE", "Valid enamel shade should pass through");
  assertEquals(rec.protocol.alerts.length, 0, "No alerts for valid shades");
});

Deno.test("Protocol with no layers returns early without error", async () => {
  const rec = { protocol: undefined } as unknown as ReturnType<typeof makeRecommendation>;

  // Should not throw
  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(),
  });

  // No crash = pass
  assertEquals(true, true);
});

// ==========================================================================
// Test: Z350 BL shade enforcement
// ==========================================================================

Deno.test("Z350 BL1 shade on enamel layer is replaced", async () => {
  const rec = makeRecommendation([
    { name: "Esmalte", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "BL1" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(Z350_CATALOG),
  });

  const esmalteLayer = rec.protocol.layers.find(l => l.name === "Esmalte");
  assertExists(esmalteLayer);
  assertEquals(esmalteLayer.shade !== "BL1", true, "BL1 must not remain on Z350 enamel layer");
});

// ==========================================================================
// Test: WT→CT auto-correction for Z350
// ==========================================================================

Deno.test("Z350 WT shade is auto-corrected to CT", async () => {
  const rec = makeRecommendation([
    { name: "Translucidez", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WT" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(Z350_CATALOG),
  });

  const layer = rec.protocol.layers[0];
  assertEquals(layer.shade, "CT", "Z350 WT should be auto-corrected to CT");
});

// ==========================================================================
// Test: Checklist sync with shade replacements
// ==========================================================================

Deno.test("Checklist text is updated when shades are replaced", async () => {
  const rec = makeRecommendation(
    [{ name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "BL2" }],
    { checklist: ["Aplicar BL2 na camada de dentina"] },
  );

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(Z350_CATALOG),
  });

  const checklistItem = rec.protocol.checklist[0];
  assertEquals(
    checklistItem.includes("BL2"),
    false,
    "BL2 in checklist should be replaced with the corrected shade",
  );
});

// ==========================================================================
// Test: validateMinimumLayerCount
// ==========================================================================

Deno.test("Anterior aesthetic case with <3 layers produces warning", () => {
  const warning = validateMinimumLayerCount(
    [{ name: "Dentina" }, { name: "Esmalte" }], // only 2 layers
    { tooth: "11", cavityClass: "Classe IV" },
  );
  assertExists(warning, "Should produce warning for 2-layer anterior aesthetic");
  assertStringIncludes(warning, "3", "Warning should mention minimum 3 layers");
});

Deno.test("Anterior aesthetic case with 3+ layers produces no warning", () => {
  const warning = validateMinimumLayerCount(
    [{ name: "Dentina" }, { name: "Translucidez" }, { name: "Esmalte" }],
    { tooth: "21", cavityClass: "Classe III" },
  );
  assertEquals(warning, null, "No warning for 3+ layer anterior aesthetic");
});

Deno.test("Posterior case with 2 layers produces no warning", () => {
  const warning = validateMinimumLayerCount(
    [{ name: "Dentina" }, { name: "Esmalte" }],
    { tooth: "36", cavityClass: "Classe II" },
  );
  assertEquals(warning, null, "No warning for 2-layer posterior");
});

Deno.test("Posterior case with 1 layer produces warning", () => {
  const warning = validateMinimumLayerCount(
    [{ name: "Dentina" }],
    { tooth: "46", cavityClass: "Classe I" },
  );
  assertExists(warning, "Should produce warning for 1-layer posterior");
  assertStringIncludes(warning, "2", "Warning should mention minimum 2 layers");
});

Deno.test("Null/undefined layers returns null", () => {
  assertEquals(validateMinimumLayerCount(null as unknown as unknown[], { tooth: "11", cavityClass: "Classe IV" }), null);
  assertEquals(validateMinimumLayerCount(undefined as unknown as unknown[], { tooth: "11", cavityClass: "Classe IV" }), null);
});

// ==========================================================================
// Test: Efeitos Incisais NOT injected when less than 3 layers (guard)
// ==========================================================================

Deno.test("Efeitos Incisais NOT injected for anterior aesthetic with <3 layers", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Esmalte", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(FULL_CATALOG),
    tooth: "11",
    cavityClass: "Classe IV",
  });

  // Only 2 layers — the guard `layers.length >= 3` prevents injection
  const hasEfeitos = rec.protocol.layers.some(
    (l: { name?: string }) => l.name === "Efeitos Incisais",
  );
  assertEquals(hasEfeitos, false, "Should NOT inject Efeitos Incisais when protocol has <3 layers");
});

// ==========================================================================
// Test: Layer order re-numbering after Efeitos Incisais injection
// ==========================================================================

Deno.test("Layer orders are re-numbered after Efeitos Incisais injection", async () => {
  const rec = makeRecommendation([
    { name: "Dentina", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "DA1" },
    { name: "Translucidez", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "CT" },
    { name: "Esmalte Vestibular Final", resin_brand: "3M ESPE - Filtek Z350 XT", shade: "WE" },
  ]);

  await validateAndFixProtocolLayers({
    recommendation: rec,
    aestheticGoals: undefined,
    supabase: createMockSupabase(FULL_CATALOG),
    tooth: "21",
    cavityClass: "Fechamento de Diastema",
  });

  // Should have 4 layers now
  assertEquals(rec.protocol.layers.length, 4);

  // Check sequential ordering
  for (let i = 0; i < rec.protocol.layers.length; i++) {
    assertEquals(
      rec.protocol.layers[i].order,
      i + 1,
      `Layer ${i} should have order ${i + 1}, got ${rec.protocol.layers[i].order}`,
    );
  }
});
