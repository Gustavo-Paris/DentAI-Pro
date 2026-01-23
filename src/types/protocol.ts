// Tipos centralizados para protocolo de estratificação

export interface ProtocolLayer {
  order: number;
  name: string;
  resin_brand: string;
  shade: string;
  thickness: string;
  purpose: string;
  technique: string;
}

export interface ProtocolAlternative {
  resin: string;
  shade: string;
  technique: string;
  tradeoff: string;
}

export interface Resin {
  id?: string;
  name: string;
  manufacturer: string;
  type: string;
  opacity: string;
  resistance: string;
  polishing: string;
  aesthetics: string;
  price_range?: string;
  description?: string | null;
  indications?: string[];
}

export interface StratificationProtocol {
  layers?: ProtocolLayer[];
  alternative?: ProtocolAlternative;
  checklist?: string[];
  confidence?: "alta" | "média" | "baixa" | string;
  [key: string]: unknown;
}

export interface DSDAnalysisPDF {
  facial_midline?: string;
  dental_midline?: string;
  smile_line?: string;
  buccal_corridor?: string;
  occlusal_plane?: string;
  golden_ratio_compliance?: number;
  symmetry_score?: number;
  suggestions?: { tooth: string; current_issue: string; proposed_change: string }[];
  observations?: string[];
}

export interface PDFData {
  createdAt: string;
  dentistName?: string;
  dentistCRO?: string;
  patientName?: string;
  patientAge: number;
  tooth: string;
  region: string;
  cavityClass: string;
  restorationSize: string;
  toothColor: string;
  aestheticLevel: string;
  bruxism: boolean;
  stratificationNeeded: boolean;
  resin: Resin | null;
  recommendationText: string | null;
  layers: ProtocolLayer[];
  alternative?: ProtocolAlternative;
  checklist: string[];
  alerts: string[];
  warnings: string[];
  confidence: string;
  
  // Clinical photos (base64)
  photoFrontal?: string;
  photo45?: string;
  photoFace?: string;
  
  // DSD Analysis
  dsdAnalysis?: DSDAnalysisPDF;
  dsdSimulationImage?: string;
  
  // Additional clinical data
  depth?: string;
  substrateCondition?: string;
  enamelCondition?: string;
  substrate?: string;
  longevityExpectation?: string;
  budget?: string;
  
  // Ideal resin (when different from recommended)
  idealResin?: Resin;
  idealReason?: string;
  isFromInventory?: boolean;
}
