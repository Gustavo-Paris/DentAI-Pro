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

export interface PolishingStep {
  order: number;
  tool: string;
  grit?: string;
  speed: string;
  time: string;
  tip: string;
}

export interface FinishingProtocol {
  contouring: PolishingStep[];
  polishing: PolishingStep[];
  final_glaze?: string;
  maintenance_advice: string;
}

export interface StratificationProtocol {
  layers: ProtocolLayer[];
  alternative: ProtocolAlternative;
  finishing?: FinishingProtocol;
  checklist: string[];
  alerts: string[];
  warnings: string[];
  justification: string;
  confidence: "alta" | "média" | "baixa";
}
