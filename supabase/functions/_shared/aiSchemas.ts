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
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
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
    // P2-55: Bounded confidence score to prevent nonsensical AI values
    confidence: z.number().min(0).max(1),
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

const FDI_TOOTH_PATTERN = /^[1-4][1-8]$/;

const DSDSuggestionSchema = z
  .object({
    tooth: z.string().regex(FDI_TOOTH_PATTERN, "Tooth must be FDI notation (11-48)"),
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
    confidence: z.string(),
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
      .passthrough(),
    justification: z.string().optional(),
  })
  .passthrough();

export type RecommendResinResponseParsed = z.infer<typeof RecommendResinResponseSchema>;
