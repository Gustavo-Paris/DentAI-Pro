/**
 * Zod schemas for runtime validation of AI (Gemini) responses.
 *
 * These schemas mirror the TypeScript interfaces defined in each edge function
 * but add runtime validation so that malformed AI output is caught early
 * instead of silently propagating via `as unknown as T` casts.
 *
 * Design decisions:
 *   - `.passthrough()` on every object so unexpected extra fields from Gemini
 *     don't cause a validation failure.
 *   - `.optional()` on fields that the AI might omit.
 *   - Enum values are validated loosely (string fallback where needed) because
 *     Gemini sometimes returns English equivalents or unexpected casing.
 */

import { z } from "npm:zod";
import { logger } from "./logger.ts";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Parse an AI response against a Zod schema with structured error logging.
 *
 * @param schema   - The Zod schema to validate against
 * @param data     - The raw data from Gemini's function call args
 * @param fnName   - The edge function name (for log context)
 * @returns The validated & typed data
 * @throws Error with a descriptive message when validation fails
 */
export function parseAIResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fnName: string,
): T {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  // Build a human-readable summary of what went wrong
  const issues = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `  - ${path}: ${issue.message} (code: ${issue.code})`;
  });

  const summary = [
    `[${fnName}] AI response failed Zod validation (${result.error.issues.length} issue(s)):`,
    ...issues,
  ].join("\n");

  logger.error(summary);
  logger.error(`[${fnName}] Raw AI data snapshot:`, JSON.stringify(data).slice(0, 1000));

  throw new Error(
    `AI response validation failed in ${fnName}: ${result.error.issues.length} issue(s). Check logs for details.`,
  );
}

// ---------------------------------------------------------------------------
// 1. PhotoAnalysisResult (analyze-dental-photo)
// ---------------------------------------------------------------------------

const TreatmentIndicationSchema = z.string().optional();

const ToothBoundsSchema = z
  .object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    width: z.number().min(0).max(100),
    height: z.number().min(0).max(100),
  })
  .passthrough();

const DetectedToothSchema = z
  .object({
    tooth: z.string(),
    tooth_region: z.string().nullable().optional(),
    cavity_class: z.string().nullable().optional(),
    restoration_size: z.string().nullable().optional(),
    substrate: z.string().nullable().optional(),
    substrate_condition: z.string().nullable().optional(),
    enamel_condition: z.string().nullable().optional(),
    depth: z.string().nullable().optional(),
    priority: z.string().default("média"),
    notes: z.string().nullable().optional(),
    treatment_indication: TreatmentIndicationSchema,
    indication_reason: z.string().optional(),
    tooth_bounds: ToothBoundsSchema.optional(),
  })
  .passthrough();

export const PhotoAnalysisResultSchema = z
  .object({
    detected: z.boolean(),
    // P2-55: Bounded confidence score (tool schema uses 0-100 scale)
    confidence: z.number().min(0).max(100),
    detected_teeth: z.array(DetectedToothSchema).default([]),
    primary_tooth: z.string().nullable().optional(),
    vita_shade: z.string().nullable().optional(),
    observations: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
    treatment_indication: TreatmentIndicationSchema,
    indication_reason: z.string().optional(),
  })
  .passthrough();

export type PhotoAnalysisResultParsed = z.infer<typeof PhotoAnalysisResultSchema>;

// ---------------------------------------------------------------------------
// 2. DSDAnalysis (generate-dsd)
// ---------------------------------------------------------------------------

const DSDSuggestionSchema = z
  .object({
    // FDI validation moved to post-processing (AI sometimes returns non-FDI values for gingival procedures)
    tooth: z.string(),
    current_issue: z.string(),
    proposed_change: z.string(),
    treatment_indication: z.string().optional(),
  })
  .passthrough();

export const DSDAnalysisSchema = z
  .object({
    facial_midline: z.string(),
    dental_midline: z.string(),
    smile_line: z.string(),
    buccal_corridor: z.string(),
    occlusal_plane: z.string(),
    // P2-55: Bounded numeric scores to prevent nonsensical AI values
    golden_ratio_compliance: z.number().min(0).max(100),
    symmetry_score: z.number().min(0).max(100),
    suggestions: z.array(DSDSuggestionSchema).default([]),
    observations: z.array(z.string()).default([]),
    confidence: z.string().transform(val => {
      const lower = val.toLowerCase();
      const mapping: Record<string, string> = {
        high: 'alta', alta: 'alta',
        medium: 'media', media: 'media', 'média': 'media', moderate: 'media', moderada: 'media',
        low: 'baixa', baixa: 'baixa',
      };
      return mapping[lower] || 'media';
    }),
    simulation_limitation: z.string().optional(),
    // Lip analysis
    lip_thickness: z.string().optional(),
    // Overbite suspicion
    overbite_suspicion: z.string().optional(),
    // Visagism fields
    face_shape: z.string().optional(),
    perceived_temperament: z.string().optional(),
    smile_arc: z.string().optional(),
    recommended_tooth_shape: z.string().optional(),
    visagism_notes: z.string().optional(),
  })
  .passthrough();

export type DSDAnalysisParsed = z.infer<typeof DSDAnalysisSchema>;

// ---------------------------------------------------------------------------
// Enum normalization (Gemini sometimes returns English values)
// ---------------------------------------------------------------------------

const ENUM_MAPPINGS: Record<string, Record<string, string>> = {
  smile_line: { low: "baixa", medium: "média", high: "alta" },
  buccal_corridor: { adequate: "adequado", excessive: "excessivo", absent: "ausente" },
  confidence: { low: "baixa", medium: "média", high: "alta" },
  facial_midline: { centered: "centrada", deviated: "desviada" },
  dental_midline: { aligned: "alinhada", deviated: "desviada" },
  occlusal_plane: { level: "nivelado", tilted: "inclinado" },
  lip_thickness: { thin: "fino", medium: "médio", thick: "volumoso" },
  overbite_suspicion: { yes: "sim", no: "não", undetermined: "indeterminado" },
  face_shape: { oval: "oval", square: "quadrado", triangular: "triangular", rectangular: "retangular", round: "redondo" },
  perceived_temperament: { choleric: "colérico", sanguine: "sanguíneo", melancholic: "melancólico", phlegmatic: "fleumático" },
  smile_arc: { consonant: "consonante", flat: "plano", reverse: "reverso" },
  recommended_tooth_shape: { oval: "oval", square: "quadrado", triangular: "triangular", rectangular: "retangular", round: "arredondado" },
};

/**
 * Normalize enum-like fields in a DSD analysis result.
 * Gemini occasionally returns English equivalents instead of the expected
 * Portuguese values. This function maps known English values back to PT.
 */
export function normalizeAnalysisEnums<T extends Record<string, unknown>>(analysis: T): T {
  for (const [field, mapping] of Object.entries(ENUM_MAPPINGS)) {
    const value = analysis[field];
    if (typeof value === "string") {
      const normalized = mapping[value.toLowerCase()];
      if (normalized) {
        (analysis as Record<string, unknown>)[field] = normalized;
      }
    }
  }
  // VITA shade validation
  const VALID_VITA_SHADES = new Set([
    'A1', 'A2', 'A3', 'A3.5', 'A4',
    'B1', 'B2', 'B3', 'B4',
    'C1', 'C2', 'C3', 'C4',
    'D2', 'D3', 'D4',
    'BL1', 'BL2', 'BL3', 'BL4',
    'OM1', 'OM2', 'OM3',
  ]);

  if ('vita_shade' in analysis && typeof analysis.vita_shade === 'string') {
    const shade = analysis.vita_shade.toUpperCase().trim();
    if (!VALID_VITA_SHADES.has(shade)) {
      (analysis as Record<string, unknown>).vita_shade = null;
    } else {
      (analysis as Record<string, unknown>).vita_shade = shade;
    }
  }

  return analysis;
}

// ---------------------------------------------------------------------------
// 3. CementationProtocol (recommend-cementation)
// ---------------------------------------------------------------------------

const CementationStepSchema = z
  .object({
    order: z.number(),
    step: z.string(),
    material: z.string(),
    technique: z.string().optional(),
    time: z.string().optional(),
  })
  .passthrough();

const CementationDetailsSchema = z
  .object({
    cement_type: z.string(),
    cement_brand: z.string(),
    shade: z.string(),
    light_curing_time: z.string(),
    technique: z.string(),
  })
  .passthrough();

export const CementationProtocolSchema = z
  .object({
    preparation_steps: z.array(CementationStepSchema).default([]),
    ceramic_treatment: z.array(CementationStepSchema).default([]),
    tooth_treatment: z.array(CementationStepSchema).default([]),
    cementation: CementationDetailsSchema,
    finishing: z.array(CementationStepSchema).default([]),
    post_operative: z.array(z.string()).default([]),
    checklist: z.array(z.string()).default([]),
    alerts: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
    confidence: z.string(),
  })
  .passthrough();

export type CementationProtocolParsed = z.infer<typeof CementationProtocolSchema>;

// ---------------------------------------------------------------------------
// 4. RecommendResinResponse (recommend-resin)
// ---------------------------------------------------------------------------

const ProtocolLayerSchema = z
  .object({
    order: z.number(),
    name: z.string(),
    resin_brand: z.string(),
    shade: z.string(),
    thickness: z.string(),
    purpose: z.string(),
    technique: z.string(),
  })
  .passthrough();

const ProtocolAlternativeSchema = z
  .object({
    resin: z.string(),
    shade: z.string(),
    technique: z.string(),
    tradeoff: z.string(),
  })
  .passthrough();

const PolishingStepSchema = z
  .object({
    order: z.number(),
    tool: z.string(),
    grit: z.string().optional(),
    speed: z.string(),
    time: z.string(),
    tip: z.string(),
  })
  .passthrough();

const FinishingProtocolSchema = z
  .object({
    contouring: z.array(PolishingStepSchema).default([]),
    polishing: z.array(PolishingStepSchema).default([]),
    final_glaze: z.string().optional(),
    maintenance_advice: z.string(),
  })
  .passthrough();

export const RecommendResinResponseSchema = z
  .object({
    // protocol may be omitted by Claude when the response is large —
    // the handler already gracefully degrades via optional chaining.
    protocol: z
      .object({
        layers: z.array(ProtocolLayerSchema).min(1),
        alternative: ProtocolAlternativeSchema,
        finishing: FinishingProtocolSchema.optional(),
        checklist: z.array(z.string()).min(1),
        alerts: z.array(z.string()).default([]),
        warnings: z.array(z.string()).default([]),
        justification: z.string().optional(),
        confidence: z.string(),
      })
      .passthrough()
      .optional(),
    justification: z.string().optional(),
    // Fields from the tool-calling response (validated loosely — AI may omit)
    recommended_resin_name: z.string().optional(),
    is_from_inventory: z.boolean().optional(),
    ideal_resin_name: z.string().optional(),
    ideal_reason: z.string().optional(),
    price_range: z.string().optional(),
    budget_compliance: z.boolean().optional(),
    inventory_alternatives: z.array(z.object({ name: z.string(), reason: z.string() }).passthrough()).optional(),
    external_alternatives: z.array(z.object({ name: z.string(), reason: z.string() }).passthrough()).optional(),
  })
  .passthrough();

export type RecommendResinResponseParsed = z.infer<typeof RecommendResinResponseSchema>;

// ---------------------------------------------------------------------------
// 5. ResinCatalogRow (resin_catalog table validation)
// ---------------------------------------------------------------------------

export const ResinCatalogRowSchema = z.object({
  shade: z.string().min(1),
  type: z.string().min(1),
  product_line: z.string().min(1),
});
