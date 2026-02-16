/**
 * Treatment indication normalization for edge functions.
 * The AI model sometimes returns English values instead of Portuguese enum values.
 * This module normalizes them back to the expected Portuguese strings.
 */

import { logger } from "./logger.ts";

// Expanded treatment types (includes gingival procedures)
export type TreatmentIndication = "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento" | "gengivoplastia" | "recobrimento_radicular";

const TREATMENT_INDICATION_MAP: Record<string, TreatmentIndication> = {
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
  // Also handle Portuguese values (pass-through)
  resina: "resina",
  porcelana: "porcelana",
  coroa: "coroa",
  implante: "implante",
  endodontia: "endodontia",
  encaminhamento: "encaminhamento",
  gengivoplastia: "gengivoplastia",
  recobrimento_radicular: "recobrimento_radicular",
};

export function normalizeTreatmentIndication(value: string | undefined | null): TreatmentIndication {
  if (!value) return "resina";
  const normalized = TREATMENT_INDICATION_MAP[value.toLowerCase().trim()];
  if (normalized) return normalized;
  logger.warn(`Unknown treatment_indication: "${value}", defaulting to "resina"`);
  return "resina";
}
