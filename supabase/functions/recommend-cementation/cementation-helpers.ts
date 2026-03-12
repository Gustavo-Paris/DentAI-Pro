/**
 * Pure helper functions for the recommend-cementation edge function.
 *
 * Extracted from index.ts to enable unit testing without requiring
 * live Supabase/AI connections. All functions here are stateless and
 * have no external dependencies.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// FDI tooth notation regex: 2 digits, first digit 1-4 (permanent teeth only)
export const FDI_TOOTH_REGEX = /^[1-4][1-8]$/;

// Valid ceramic types — closed enum to prevent wrong HF acid protocol
export const VALID_CERAMIC_TYPES = [
  'dissilicato_de_litio',      // e.max
  'leucita',                    // IPS Empress
  'feldspatica',               // Feldspathic
  'zirconia',                   // Zirconia
  'zirconia_reforcada',        // Reinforced zirconia
  'resina_cad_cam',            // CAD/CAM resin
] as const;

export type ValidCeramicType = typeof VALID_CERAMIC_TYPES[number];

// Map Portuguese display names → normalized keys
export const CERAMIC_TYPE_ALIASES: Record<string, ValidCeramicType> = {
  'dissilicato de litio':       'dissilicato_de_litio',
  'dissilicato de lítio':       'dissilicato_de_litio',
  'e.max':                      'dissilicato_de_litio',
  'emax':                       'dissilicato_de_litio',
  'ips e.max':                  'dissilicato_de_litio',
  'leucita':                    'leucita',
  'ips empress':                'leucita',
  'empress':                    'leucita',
  'feldspatica':                'feldspatica',
  'feldspática':                'feldspatica',
  'ceramica feldspática':       'feldspatica',
  'ceramica feldspatica':       'feldspatica',
  'porcelana feldspática':      'feldspatica',
  'porcelana feldspatica':      'feldspatica',
  'zirconia':                   'zirconia',
  'zircônia':                   'zirconia',
  'zirconia reforcada':         'zirconia_reforcada',
  'zircônia reforçada':         'zirconia_reforcada',
  'zirconia reforçada':         'zirconia_reforcada',
  'zircônia reforcada':         'zirconia_reforcada',
  'resina cad cam':             'resina_cad_cam',
  'resina cad/cam':             'resina_cad_cam',
  'cad cam':                    'resina_cad_cam',
  'cad/cam':                    'resina_cad_cam',
};

// ---------------------------------------------------------------------------
// normalizeCeramicType
// ---------------------------------------------------------------------------

/**
 * Normalize a ceramicType input string: lowercase, trim, strip accents for
 * matching, then look up in alias map or direct enum match.
 * Returns the normalized key or null if invalid.
 */
export function normalizeCeramicType(raw: string): ValidCeramicType | null {
  const trimmed = raw.trim().toLowerCase();
  // Strip Unicode accents for matching
  const stripped = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Direct enum match (already a valid key)
  if ((VALID_CERAMIC_TYPES as readonly string[]).includes(trimmed)) {
    return trimmed as ValidCeramicType;
  }
  if ((VALID_CERAMIC_TYPES as readonly string[]).includes(stripped)) {
    return stripped as ValidCeramicType;
  }

  // Alias lookup (try with accents first, then without)
  if (CERAMIC_TYPE_ALIASES[trimmed]) {
    return CERAMIC_TYPE_ALIASES[trimmed];
  }
  // Try alias lookup with stripped accents on all alias keys
  for (const [alias, key] of Object.entries(CERAMIC_TYPE_ALIASES)) {
    const aliasStripped = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (aliasStripped === stripped) {
      return key;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// deriveTreatmentType
// ---------------------------------------------------------------------------

/**
 * Derives the correct treatment_type for the evaluations table from the ceramic type.
 *
 * Maps:
 * - Zirconia full crowns → "coroa"
 * - Everything else (veneers, onlays, overlays, etc.) → "porcelana"
 *
 * NOTE: This is a best-effort mapping from ceramicType. Future improvement could
 * accept an explicit treatment_type in the request payload.
 */
export function deriveTreatmentType(ceramicTypeRaw: string): string {
  const normalized = normalizeCeramicType(ceramicTypeRaw);
  // Zirconia and reinforced zirconia are primarily used for full crowns
  if (normalized === "zirconia" || normalized === "zirconia_reforcada") {
    return "coroa";
  }
  // All other ceramic types (lithium disilicate, leucite, feldspathic, CAD/CAM resin)
  // are typically used for veneers/laminates — "porcelana"
  return "porcelana";
}

// ---------------------------------------------------------------------------
// validateRequest
// ---------------------------------------------------------------------------

export interface DSDContext {
  currentIssue: string;
  proposedChange: string;
  observations: string[];
}

export interface RequestData {
  evaluationId: string;
  teeth: string[];
  shade: string;
  ceramicType: ValidCeramicType;
  substrate: string;
  substrateCondition?: string;
  aestheticGoals?: string;
  dsdContext?: DSDContext;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: RequestData;
}

/**
 * Validate the incoming HTTP request payload.
 * Returns success=false with a Portuguese error message on any violation.
 */
export function validateRequest(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const req = data as Record<string, unknown>;

  if (!req.evaluationId || typeof req.evaluationId !== "string") {
    return { success: false, error: "ID da avaliação não fornecido" };
  }

  if (!req.teeth || !Array.isArray(req.teeth) || req.teeth.length === 0) {
    return { success: false, error: "Dentes não especificados" };
  }

  if (req.teeth.length > 32) {
    return { success: false, error: "Número máximo de dentes excedido (32)" };
  }

  // Validate each tooth matches FDI notation
  for (const tooth of req.teeth) {
    if (typeof tooth !== "string" || !FDI_TOOTH_REGEX.test(tooth)) {
      return { success: false, error: `Dente inválido: ${String(tooth).substring(0, 10)}` };
    }
  }

  if (!req.shade || typeof req.shade !== "string") {
    return { success: false, error: "Cor não especificada" };
  }

  if (!req.substrate || typeof req.substrate !== "string") {
    return { success: false, error: "Substrato não especificado" };
  }

  if (!req.ceramicType || typeof req.ceramicType !== "string") {
    return { success: false, error: "ceramicType é obrigatório para gerar protocolo de cimentação" };
  }

  // Validate ceramicType against closed enum — wrong type → wrong HF acid protocol → irreversible damage
  const normalizedCeramicType = normalizeCeramicType(req.ceramicType as string);
  if (!normalizedCeramicType) {
    return {
      success: false,
      error: `Tipo cerâmico inválido: "${String(req.ceramicType).substring(0, 50)}". Tipos aceitos: ${VALID_CERAMIC_TYPES.join(', ')}`,
    };
  }

  return {
    success: true,
    data: {
      evaluationId: req.evaluationId as string,
      teeth: req.teeth as string[],
      shade: req.shade as string,
      ceramicType: normalizedCeramicType,
      substrate: req.substrate as string,
      substrateCondition: req.substrateCondition as string | undefined,
      aestheticGoals: req.aestheticGoals as string | undefined,
      dsdContext: req.dsdContext as DSDContext | undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// validateHFConcentration
// ---------------------------------------------------------------------------

/**
 * Post-processing safety net: Validate HF acid concentration for lithium disilicate.
 * Lithium disilicate (e.max) MUST use 5% HF for 20s — 10% causes irreversible surface damage.
 *
 * Mutates `protocol` in-place and returns it.
 */
export function validateHFConcentration(
  protocol: Record<string, unknown>,
  ceramicType: string,
): Record<string, unknown> {
  const isLithiumDisilicate = /e\.?max|dissilicato|lithium/i.test(ceramicType);
  if (!isLithiumDisilicate) return protocol;

  const ceramicTreatment = protocol.ceramic_treatment;
  if (!Array.isArray(ceramicTreatment)) return protocol;

  let corrected = false;
  protocol.ceramic_treatment = ceramicTreatment.map((step: Record<string, string>) => {
    const stepText = `${step.step || ''} ${step.material || ''}`;
    if (/10\s*%/i.test(stepText) && /(?:HF|fluorídr|fluor)/i.test(stepText)) {
      corrected = true;
      return {
        ...step,
        step: (step.step || '').replace(/10\s*%/g, '5%'),
        material: (step.material || '').replace(/10\s*%/g, '5%'),
      };
    }
    return step;
  });

  if (corrected) {
    const warnings = Array.isArray(protocol.warnings) ? [...protocol.warnings] : [];
    warnings.push('HF validado: 5% por 20s para dissilicato de lítio (e.max). NUNCA usar 10% — causa dano superficial irreversível.');
    protocol.warnings = warnings;
  }

  return protocol;
}
