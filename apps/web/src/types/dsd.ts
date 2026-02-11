/**
 * Shared DSD types — analysis, simulation layers, and supporting interfaces.
 *
 * Each SimulationLayer represents one progressive treatment visualization:
 *   Layer 1: restorations-only (structural corrections at natural tooth color)
 *   Layer 2: whitening-restorations (corrections + whitening)
 *   Layer 3: complete-treatment (with gengivoplasty, conditional)
 */

// ---------------------------------------------------------------------------
// Treatment & Analysis Types
// ---------------------------------------------------------------------------

export type TreatmentIndication = "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento" | "gengivoplastia" | "recobrimento_radicular";

export interface DSDSuggestion {
  tooth: string;
  current_issue: string;
  proposed_change: string;
  treatment_indication?: TreatmentIndication;
}

export interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
  suggestions: DSDSuggestion[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
  simulation_limitation?: string;
  lip_thickness?: "fino" | "médio" | "volumoso";
  overbite_suspicion?: "sim" | "não" | "indeterminado";
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
  /** Multi-layer simulations (restorations-only, whitening-restorations, complete-treatment) */
  layers?: SimulationLayer[];
}

// ---------------------------------------------------------------------------
// Simulation Layer Types
// ---------------------------------------------------------------------------

export type SimulationLayerType =
  | 'restorations-only'
  | 'whitening-restorations'
  | 'complete-treatment';

export interface SimulationLayer {
  /** Layer type identifier */
  type: SimulationLayerType;
  /** User-facing label in PT-BR */
  label: string;
  /** Storage path (not signed URL) */
  simulation_url: string | null;
  /** Whitening level used for this layer */
  whitening_level: 'natural' | 'hollywood';
  /** Whether gengivoplasty recontouring is included */
  includes_gengivoplasty: boolean;
}

/** Layer labels (PT-BR) */
export const LAYER_LABELS: Record<SimulationLayerType, string> = {
  'restorations-only': 'Apenas Restaurações',
  'whitening-restorations': 'Restaurações + Clareamento',
  'complete-treatment': 'Tratamento Completo',
};

// ---------------------------------------------------------------------------
// Supporting Types (used by DSDStep and related components)
// ---------------------------------------------------------------------------

export type ToothBoundsPct = {
  /** center X in % */
  x: number;
  /** center Y in % */
  y: number;
  /** width in % */
  width: number;
  /** height in % */
  height: number;
};

export type DetectedToothForMask = {
  tooth_bounds?: ToothBoundsPct;
};

export interface ClinicalToothFinding {
  tooth: string;
  indication_reason?: string;
  treatment_indication?: string;
}

export interface AdditionalPhotos {
  smile45: string | null;
  face: string | null;
}

export interface PatientPreferences {
  whiteningLevel: 'natural' | 'hollywood';
}
