import type { Resin, StratificationProtocol, ProtocolLayer, ProtocolAlternative, CementationProtocol } from '@/types/protocol';
import { getTreatmentStyle, isSpecialTreatmentType } from '@/lib/treatment-config';
import type { TreatmentStyle } from '@/lib/treatment-config';

// ---------------------------------------------------------------------------
// Shared protocol computation extracted from useResult / useGroupResult
// ---------------------------------------------------------------------------

interface EvaluationLike {
  treatment_type?: string | null;
  cementation_protocol?: CementationProtocol | unknown | null;
  generic_protocol?: {
    treatment_type: string;
    tooth: string;
    summary: string;
    checklist: string[];
    alerts: string[];
    recommendations: string[];
    ai_reason?: string;
  } | null;
  stratification_protocol?: StratificationProtocol | null;
  protocol_layers?: ProtocolLayer[] | null;
  alerts?: string[] | null;
  warnings?: string[] | null;
  resins?: Resin | null;
}

export interface ProtocolComputed {
  treatmentType: string;
  isPorcelain: boolean;
  isSpecialTreatment: boolean;
  cementationProtocol: CementationProtocol | null;
  genericProtocol: EvaluationLike['generic_protocol'];
  protocol: StratificationProtocol | null;
  layers: ProtocolLayer[];
  checklist: string[];
  alerts: string[];
  warnings: string[];
  confidence: string;
  protocolAlternative: ProtocolAlternative | undefined;
  resin: Resin | null;
  hasProtocol: boolean;
  currentTreatmentStyle: TreatmentStyle;
}

/**
 * Compute protocol-derived values from an evaluation-like object.
 * Used by both useResult (single eval) and useGroupResult (primary eval of group).
 */
export function computeProtocol(eval_: EvaluationLike | null): ProtocolComputed {
  const treatmentType = eval_?.treatment_type || 'resina';
  const isPorcelain = treatmentType === 'porcelana';
  const isSpecialTreatment = isSpecialTreatmentType(treatmentType);
  const cementationProtocol = (eval_?.cementation_protocol as CementationProtocol) ?? null;
  const genericProtocol = eval_?.generic_protocol ?? null;
  const protocol = eval_?.stratification_protocol ?? null;

  const layers = protocol?.layers || eval_?.protocol_layers || [];
  const checklist = isPorcelain
    ? (cementationProtocol?.checklist || [])
    : isSpecialTreatment && genericProtocol
      ? genericProtocol.checklist
      : (protocol?.checklist || []);
  const alerts = isPorcelain
    ? (cementationProtocol?.alerts || [])
    : isSpecialTreatment && genericProtocol
      ? genericProtocol.alerts
      : (eval_?.alerts || []);
  const warnings = isPorcelain ? (cementationProtocol?.warnings || []) : (eval_?.warnings || []);
  const confidence = isPorcelain ? (cementationProtocol?.confidence || 'média') : (protocol?.confidence || 'média');
  const protocolAlternative = protocol?.alternative;

  const resin = eval_?.resins ?? null;
  const hasProtocol = isPorcelain ? !!cementationProtocol : isSpecialTreatment ? !!genericProtocol : layers.length > 0;
  const currentTreatmentStyle = getTreatmentStyle(treatmentType);

  return {
    treatmentType,
    isPorcelain,
    isSpecialTreatment,
    cementationProtocol,
    genericProtocol,
    protocol,
    layers,
    checklist,
    alerts,
    warnings,
    confidence,
    protocolAlternative,
    resin,
    hasProtocol,
    currentTreatmentStyle,
  };
}
