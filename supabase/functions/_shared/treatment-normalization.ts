/**
 * Treatment indication normalization for edge functions.
 * The AI model sometimes returns English values instead of Portuguese enum values.
 * This module normalizes them back to the expected Portuguese strings.
 *
 * SAFETY: Unknown values throw instead of silently defaulting to "resina",
 * preventing incorrect protocol generation for unrecognized treatment types.
 */

import { logger } from "./logger.ts";

// Expanded treatment types (includes gingival procedures and specialist referrals)
export type TreatmentIndication = "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento" | "gengivoplastia" | "recobrimento_radicular";

/**
 * Error thrown when a treatment indication cannot be mapped to a known type.
 * Callers should catch this and handle appropriately (e.g., reject the protocol).
 */
export class UnknownTreatmentError extends Error {
  constructor(public readonly rawValue: string) {
    super(`Unknown treatment_indication: "${rawValue}" — cannot safely default. Review AI output or add mapping.`);
    this.name = "UnknownTreatmentError";
  }
}

const TREATMENT_INDICATION_MAP: Record<string, TreatmentIndication> = {
  // English → Portuguese mappings
  resin: "resina",
  porcelain: "porcelana",
  crown: "coroa",
  implant: "implante",
  endodontics: "endodontia",
  referral: "encaminhamento",
  gingivoplasty: "gengivoplastia",
  gingivectomy: "gengivoplastia",
  gum_recontouring: "gengivoplastia",
  root_coverage: "recobrimento_radicular",
  gingival_graft: "recobrimento_radicular",
  // Specialist referral treatments — these require specialist care,
  // not resin/porcelain protocols. Map to "encaminhamento".
  clareamento: "encaminhamento",
  branqueamento: "encaminhamento",
  whitening: "encaminhamento",
  ortodontia: "encaminhamento",
  orthodontics: "encaminhamento",
  periodontia: "encaminhamento",
  periodontics: "encaminhamento",
  // Portuguese pass-through values
  resina: "resina",
  porcelana: "porcelana",
  coroa: "coroa",
  implante: "implante",
  endodontia: "endodontia",
  encaminhamento: "encaminhamento",
  gengivoplastia: "gengivoplastia",
  recobrimento_radicular: "recobrimento_radicular",
};

/**
 * Normalizes a treatment indication string to a known TreatmentIndication enum value.
 *
 * @throws {UnknownTreatmentError} if the value is not null/undefined AND cannot be mapped.
 *         This prevents silent fallback to "resina" for unknown treatment types,
 *         which could generate clinically incorrect protocols.
 *
 * @param value - Raw treatment indication from AI or request
 * @param fallback - If provided, used when value is null/undefined (backward-compat).
 *                   Defaults to "resina" for callers that expect the old behavior.
 */
export function normalizeTreatmentIndication(
  value: string | undefined | null,
  fallback: TreatmentIndication = "resina",
): TreatmentIndication {
  if (!value) return fallback;
  const normalized = TREATMENT_INDICATION_MAP[value.toLowerCase().trim()];
  if (normalized) return normalized;
  logger.error(`Unknown treatment_indication: "${value}" — refusing to default to "resina"`);
  throw new UnknownTreatmentError(value);
}

/**
 * Treatment types that should NOT generate resin stratification protocols.
 * These are either gingival procedures or specialist referrals.
 */
const NON_RESIN_TREATMENTS: ReadonlySet<TreatmentIndication> = new Set([
  "gengivoplastia",
  "recobrimento_radicular",
  "encaminhamento",
]);

/**
 * Checks whether a treatment indication is valid for resin protocol generation.
 * Returns false for gingival procedures, specialist referrals, and other
 * non-restorative treatments that should not produce stratification protocols.
 */
export function isResinApplicable(treatment: TreatmentIndication): boolean {
  return !NON_RESIN_TREATMENTS.has(treatment);
}
