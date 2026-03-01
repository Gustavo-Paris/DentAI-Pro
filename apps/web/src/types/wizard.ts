import type { TreatmentType } from '@/lib/treatment-config';

// Re-export TreatmentType for convenience (canonical source: @/lib/treatment-config)
export type { TreatmentType } from '@/lib/treatment-config';

// Multi-tooth detection structure
export interface DetectedTooth {
  tooth: string;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  priority: "alta" | "média" | "baixa";
  notes: string | null;
  treatment_indication?: TreatmentType;
  indication_reason?: string;
  tooth_bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Problema estético identificado (ex: 'Restauração infiltrada com gap mesial de ~1mm') */
  current_issue?: string;
  /** Mudança proposta com medidas em mm (ex: 'Fechamento com resina composta ~1.5mm, harmonização com 21') */
  proposed_change?: string;
}

export interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
  treatment_indication?: TreatmentType;
  indication_reason?: string;
  /** 0-100 score: how suitable is this photo for DSD image editing (simulation) */
  dsd_simulation_suitability?: number;

  // --- DSD aesthetic analysis fields ---
  facial_midline?: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline?: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line?: "alta" | "média" | "baixa";
  buccal_corridor?: "adequado" | "excessivo" | "ausente";
  occlusal_plane?: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance?: number;
  symmetry_score?: number;
  lip_thickness?: "fino" | "médio" | "volumoso";
  overbite_suspicion?: "sim" | "não" | "indeterminado";
  smile_arc?: "consonante" | "plano" | "reverso";
  face_shape?: "oval" | "quadrado" | "triangular" | "retangular" | "redondo";
  perceived_temperament?: "colérico" | "sanguíneo" | "melancólico" | "fleumático" | "misto";
  recommended_tooth_shape?: "quadrado" | "oval" | "triangular" | "retangular" | "natural";
  visagism_notes?: string;
}

export interface ReviewFormData {
  patientName: string;
  patientAge: string;
  tooth: string;
  toothRegion: string;
  cavityClass: string;
  restorationSize: string;
  vitaShade: string;
  substrate: string;
  substrateCondition: string;
  enamelCondition: string;
  depth: string;
  bruxism: boolean;
  aestheticLevel: string;
  budget: string;
  longevityExpectation: string;
  clinicalNotes: string;
  treatmentType: TreatmentType;
}
