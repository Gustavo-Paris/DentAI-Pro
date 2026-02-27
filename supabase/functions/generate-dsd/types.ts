// DSD Analysis interface
export interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
  suggestions: {
    tooth: string;
    current_issue: string;
    proposed_change: string;
    treatment_indication?: "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento" | "gengivoplastia" | "recobrimento_radicular";
  }[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
  simulation_limitation?: string;
  // Lip analysis
  lip_thickness?: "fino" | "médio" | "volumoso";
  // Overbite suspicion
  overbite_suspicion?: "sim" | "não" | "indeterminado";
  // Visagism fields
  face_shape?: "oval" | "quadrado" | "triangular" | "retangular" | "redondo";
  perceived_temperament?: "colérico" | "sanguíneo" | "melancólico" | "fleumático" | "misto";
  smile_arc?: "consonante" | "plano" | "reverso";
  recommended_tooth_shape?: "quadrado" | "oval" | "triangular" | "retangular" | "natural";
  visagism_notes?: string;
}

export interface DSDResult {
  analysis: DSDAnalysis;
  simulation_url: string | null;
  simulation_note?: string;
}

// Dual-pass smile line classifier result
export interface SmileLineClassifierResult {
  smile_line: "alta" | "média" | "baixa";
  gingival_exposure_mm: number;
  confidence: "alta" | "média" | "baixa";
  justification: string;
}

export interface AdditionalPhotos {
  smile45?: string;
  face?: string;
}

export interface PatientPreferences {
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
  // Legacy fields (deprecated)
  aestheticGoals?: string;
  desiredChanges?: string[];
}

// Whitening level to instruction mapping (direct, no AI analysis needed)
export const WHITENING_INSTRUCTIONS: Record<string, { instruction: string; intensity: string }> = {
  natural: {
    instruction: "Make ALL visible teeth 1-2 shades lighter (A1/A2). Subtle, natural whitening that looks realistic.",
    intensity: "NATURAL"
  },
  white: {
    instruction: "Make ALL visible teeth CLEARLY WHITER — target shade A1 or brighter. The whitening MUST be OBVIOUS and IMMEDIATELY VISIBLE in a before/after comparison. This simulates professional in-office whitening. Every visible tooth must be DRAMATICALLY brighter than the input photo. If the before/after looks similar, you have FAILED.",
    intensity: "VISIBLE"
  },
  hollywood: {
    instruction: "Make ALL visible teeth EXTREMELY WHITE (BL1). Pure bright white like porcelain veneers. The teeth should appear DRAMATICALLY lighter - almost glowing white. This is the MAXIMUM possible whitening.",
    intensity: "MAXIMUM"
  }
};

export interface ClinicalToothFinding {
  tooth: string;
  indication_reason?: string;
  treatment_indication?: string;
}

export interface RequestData {
  imageBase64: string;
  evaluationId?: string;
  regenerateSimulationOnly?: boolean;
  existingAnalysis?: DSDAnalysis;
  toothShape?: 'natural' | 'quadrado' | 'triangular' | 'oval' | 'retangular';
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
  analysisOnly?: boolean; // Return only analysis, skip simulation
  clinicalObservations?: string[]; // Observations from analyze-dental-photo to prevent contradictions
  clinicalTeethFindings?: ClinicalToothFinding[]; // Per-tooth findings to prevent false restoration claims
  layerType?: 'restorations-only' | 'whitening-restorations' | 'complete-treatment' | 'root-coverage' | 'face-mockup'; // Multi-layer simulation
  inputAlreadyProcessed?: boolean; // When true, input image already has corrected/whitened teeth (Layer 2→3 chaining)
}

// Tooth shape descriptions for simulation prompt
export const toothShapeDescriptions: Record<string, string> = {
  natural: "Manter as características individuais naturais de cada dente do paciente",
  quadrado: "Bordas incisais retas e paralelas, ângulos bem definidos, proporção largura/altura equilibrada",
  triangular: "Convergência gradual em direção à cervical, bordas incisais mais largas que a região cervical",
  oval: "Contornos arredondados e suaves, transições sem ângulos marcados, formato elíptico",
  retangular: "Proporção altura/largura mais alongada, bordas verticais mais paralelas",
};
