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
    confidence: z.number(),
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
    golden_ratio_compliance: z.number(),
    symmetry_score: z.number(),
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
