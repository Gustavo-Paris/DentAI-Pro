// Shared validation schemas for edge functions
// Using lightweight validation without external dependencies

// ---------------------------------------------------------------------------
// Prompt-injection sanitisation
// ---------------------------------------------------------------------------

/**
 * Strips known prompt-injection patterns from free-text user input before it
 * is interpolated into an LLM prompt.
 *
 * This is a defence-in-depth layer — the main defence is the prompt structure
 * itself (system vs user messages), but sanitising removes the most obvious
 * attack vectors for instruction override / context hijacking.
 */
export function sanitizeForPrompt(input: string): string {
  if (!input) return input;

  let sanitized = input;

  // Remove markdown-style system/instruction blocks
  sanitized = sanitized.replace(/```(?:system|instruction|prompt)[\s\S]*?```/gi, "");

  // Remove explicit role/instruction override patterns
  sanitized = sanitized.replace(
    /(?:^|\n)\s*(?:system|assistant|user|instruction|role)\s*:/gi,
    ""
  );

  // Remove "ignore previous" / "forget" patterns (English)
  sanitized = sanitized.replace(
    /(?:ignore|forget|disregard|override|bypass)\s+(?:all\s+)?(?:previous|above|prior|earlier)\s+(?:instructions?|context|prompts?|rules?)/gi,
    "[removed]"
  );

  // Remove "you are now" / "act as" / "pretend" override patterns (English)
  sanitized = sanitized.replace(
    /(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you\s+are)|from\s+now\s+on\s+you\s+are)/gi,
    "[removed]"
  );

  // Portuguese injection patterns: "ignore/esqueça/desconsidere... instruções/contexto/regras"
  sanitized = sanitized.replace(
    /(?:ignore|ignor[ea]|esqueça|desconsider[ea]|sobrescreva|pule|burle)\s+.*?\s+(?:instruções?|contexto|prompts?|regras?|anteriores?|sistema)/gi,
    "[removed]"
  );

  // Portuguese "act as" / "pretend" patterns
  sanitized = sanitized.replace(
    /(?:aja|atue|comporte-se|finja|simule)\s+como\s+/gi,
    "[removed] "
  );

  // Portuguese "don't follow" patterns
  sanitized = sanitized.replace(
    /não\s+sig[au]\s+/gi,
    "[removed] "
  );

  // Portuguese "new role" patterns
  sanitized = sanitized.replace(
    /novo\s+(?:papel|role)\s*/gi,
    "[removed] "
  );

  // Portuguese "from now on" — common injection prefix
  sanitized = sanitized.replace(
    /a\s+partir\s+de\s+agora\s+/gi,
    "[removed] "
  );

  // Remove XML/HTML-like injection tags
  sanitized = sanitized.replace(/<\/?(?:system|instruction|prompt|context|role)[^>]*>/gi, "");

  // Collapse excessive whitespace introduced by removals
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n").trim();

  return sanitized;
}

/**
 * Sanitise a Record of string fields that will be interpolated into prompts.
 * Non-string values are returned as-is; string values are passed through
 * `sanitizeForPrompt`.
 */
export function sanitizeFieldsForPrompt<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[],
): T {
  const copy = { ...data };
  for (const key of fields) {
    const val = copy[key];
    if (typeof val === "string") {
      (copy as Record<string, unknown>)[key as string] = sanitizeForPrompt(val);
    }
  }
  return copy;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Tooth notation validation (FDI: 11-18, 21-28, 31-38, 41-48)
const TOOTH_REGEX = /^[1-4][1-8]$/;

// VITA shade validation - includes classic, bleach, and opaque shades
const VITA_SHADES = [
  // Escala clássica
  "A1", "A2", "A3", "A3.5", "A4", 
  "B1", "B2", "B3", "B4", 
  "C1", "C2", "C3", "C4", 
  "D2", "D3", "D4",
  // Bleach shades
  "BL1", "BL2", "BL3", "BL4",
  // Opaque/Modifier shades
  "OM1", "OM2", "OM3"
];

// Valid enum values
const VALID_REGIONS = ["anterior-superior", "anterior-inferior", "posterior-superior", "posterior-inferior"];
const VALID_CAVITY_CLASSES = [
  // Restaurador tradicional
  "Classe I", "Classe II", "Classe III", "Classe IV", "Classe V", "Classe VI",
  // Procedimentos estéticos
  "Faceta Direta", "Recontorno Estético", "Fechamento de Diastema", "Reparo de Restauração", "Lente de Contato"
];
const VALID_RESTORATION_SIZES = ["Pequena", "Média", "Grande", "Extensa"];
const VALID_SUBSTRATES = ["Esmalte", "Dentina", "Esmalte e Dentina", "Dentina profunda"];
const VALID_AESTHETIC_LEVELS = ["funcional", "estético", "baixo", "médio", "alto", "muito alto"];
const VALID_LONGEVITY = ["curto", "médio", "longo"];
const VALID_BUDGETS = ["padrão", "premium", "econômico", "moderado"];

function isUUID(value: unknown): boolean {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function isString(value: unknown, maxLength = 500): boolean {
  return typeof value === "string" && value.length <= maxLength;
}

function isBoolean(value: unknown): boolean {
  return typeof value === "boolean";
}

function isValidEnum(value: unknown, validValues: string[]): boolean {
  return typeof value === "string" && validValues.includes(value);
}

function isValidTooth(value: unknown): boolean {
  return typeof value === "string" && TOOTH_REGEX.test(value);
}

function isValidVitaShade(value: unknown): boolean {
  if (typeof value !== "string") return false;
  
  // Normalize the shade: remove spaces, "VITA" prefix, and convert to uppercase
  let shade = value.trim().toUpperCase();
  shade = shade.replace(/^VITA\s*/i, "").replace(/\s+/g, "");
  
  // Handle common variations like "A2D", "A2E", "A2 Dentina", etc.
  const baseShade = shade.replace(/[DE]$/, "").replace(/\s*(DENTINA|ESMALTE|BODY|INCISAL|OPACO)$/i, "");
  
  // Check if it matches any valid VITA shade
  return VITA_SHADES.includes(baseShade) || VITA_SHADES.includes(shade);
}

// EvaluationData validation for recommend-resin
export interface EvaluationData {
  evaluationId: string;
  userId: string;
  patientAge: string;
  tooth: string;
  region: string;
  cavityClass: string;
  restorationSize: string;
  substrate: string;
  aestheticLevel: string;
  toothColor: string;
  stratificationNeeded: boolean;
  bruxism: boolean;
  longevityExpectation: string;
  budget: string;
  depth?: string;
  substrateCondition?: string;
  enamelCondition?: string;
  clinicalNotes?: string;
  aestheticGoals?: string;
}

export function validateEvaluationData(data: unknown): ValidationResult<EvaluationData> {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const obj = data as Record<string, unknown>;

  // Required UUID fields
  if (!isUUID(obj.evaluationId)) {
    return { success: false, error: "ID de avaliação inválido" };
  }
  if (!isUUID(obj.userId)) {
    return { success: false, error: "ID de usuário inválido" };
  }

  // Required string fields with validation
  if (!isString(obj.patientAge, 10) || !/^\d+$/.test(obj.patientAge as string)) {
    return { success: false, error: "Idade do paciente inválida" };
  }

  if (!isValidTooth(obj.tooth)) {
    return { success: false, error: "Número do dente inválido" };
  }

  if (!isValidEnum(obj.region, VALID_REGIONS)) {
    return { success: false, error: "Região inválida" };
  }

  if (!isValidEnum(obj.cavityClass, VALID_CAVITY_CLASSES)) {
    return { success: false, error: "Classe de cavidade inválida" };
  }

  if (!isValidEnum(obj.restorationSize, VALID_RESTORATION_SIZES)) {
    return { success: false, error: "Tamanho de restauração inválido" };
  }

  if (!isValidEnum(obj.substrate, VALID_SUBSTRATES)) {
    return { success: false, error: "Substrato inválido" };
  }

  if (!isValidEnum(obj.aestheticLevel, VALID_AESTHETIC_LEVELS)) {
    return { success: false, error: "Nível estético inválido" };
  }

  if (!isValidVitaShade(obj.toothColor)) {
    return { success: false, error: "Cor VITA inválida" };
  }

  // Required boolean fields
  if (!isBoolean(obj.stratificationNeeded)) {
    return { success: false, error: "Campo estratificação inválido" };
  }

  if (!isBoolean(obj.bruxism)) {
    return { success: false, error: "Campo bruxismo inválido" };
  }

  if (!isValidEnum(obj.longevityExpectation, VALID_LONGEVITY)) {
    return { success: false, error: "Expectativa de longevidade inválida" };
  }

  if (!isValidEnum(obj.budget, VALID_BUDGETS)) {
    return { success: false, error: "Orçamento inválido" };
  }

  // Optional fields
  if (obj.depth !== undefined && !isString(obj.depth, 50)) {
    return { success: false, error: "Profundidade inválida" };
  }

  if (obj.substrateCondition !== undefined && !isString(obj.substrateCondition, 50)) {
    return { success: false, error: "Condição do substrato inválida" };
  }

  if (obj.enamelCondition !== undefined && !isString(obj.enamelCondition, 50)) {
    return { success: false, error: "Condição do esmalte inválida" };
  }

  if (obj.clinicalNotes !== undefined && !isString(obj.clinicalNotes, 2000)) {
    return { success: false, error: "Notas clínicas muito longas" };
  }

  // Validate aestheticGoals (optional string, max 1000 chars)
  if (obj.aestheticGoals !== undefined && obj.aestheticGoals !== null && obj.aestheticGoals !== '') {
    if (typeof obj.aestheticGoals !== 'string') {
      return { success: false, error: "aestheticGoals deve ser uma string" };
    }
    if (obj.aestheticGoals.length > 1000) {
      return { success: false, error: "aestheticGoals muito longo (máx 1000 caracteres)" };
    }
  }

  return {
    success: true,
    data: {
      evaluationId: obj.evaluationId as string,
      userId: obj.userId as string,
      patientAge: obj.patientAge as string,
      tooth: obj.tooth as string,
      region: obj.region as string,
      cavityClass: obj.cavityClass as string,
      restorationSize: obj.restorationSize as string,
      substrate: obj.substrate as string,
      aestheticLevel: obj.aestheticLevel as string,
      toothColor: obj.toothColor as string,
      stratificationNeeded: obj.stratificationNeeded as boolean,
      bruxism: obj.bruxism as boolean,
      longevityExpectation: obj.longevityExpectation as string,
      budget: obj.budget as string,
      depth: obj.depth as string | undefined,
      substrateCondition: obj.substrateCondition as string | undefined,
      enamelCondition: obj.enamelCondition as string | undefined,
      clinicalNotes: obj.clinicalNotes as string | undefined,
      aestheticGoals: obj.aestheticGoals as string | undefined,
    },
  };
}

// AnalyzePhotosData validation
export interface AnalyzePhotosData {
  evaluationId: string;
  photoFrontal?: string;
  photo45?: string;
  photoFace?: string;
}

export function validateAnalyzePhotosData(data: unknown): ValidationResult<AnalyzePhotosData> {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const obj = data as Record<string, unknown>;

  // Required UUID field
  if (!isUUID(obj.evaluationId)) {
    return { success: false, error: "ID de avaliação inválido" };
  }

  // Optional path fields (storage paths)
  if (obj.photoFrontal !== undefined && !isString(obj.photoFrontal, 500)) {
    return { success: false, error: "Caminho de foto inválido" };
  }

  if (obj.photo45 !== undefined && !isString(obj.photo45, 500)) {
    return { success: false, error: "Caminho de foto inválido" };
  }

  if (obj.photoFace !== undefined && !isString(obj.photoFace, 500)) {
    return { success: false, error: "Caminho de foto inválido" };
  }

  return {
    success: true,
    data: {
      evaluationId: obj.evaluationId as string,
      photoFrontal: obj.photoFrontal as string | undefined,
      photo45: obj.photo45 as string | undefined,
      photoFace: obj.photoFace as string | undefined,
    },
  };
}
