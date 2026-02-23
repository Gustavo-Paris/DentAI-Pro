import { useMemo } from 'react';
import type { Resin, StratificationProtocol, ProtocolLayer, CementationProtocol } from '@/types/protocol';
import { getTreatmentStyle, isSpecialTreatmentType } from '@/lib/treatment-config';

// ---------------------------------------------------------------------------
// Input shape — loose enough for both single evaluations and group primaries
// ---------------------------------------------------------------------------

interface ProtocolSource {
  treatment_type?: string | null;
  cementation_protocol?: CementationProtocol | null;
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

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface ProtocolComputed {
  treatmentType: string;
  isPorcelain: boolean;
  isSpecialTreatment: boolean;
  cementationProtocol: CementationProtocol | null;
  genericProtocol: ProtocolSource['generic_protocol'];
  protocol: StratificationProtocol | null;
  layers: ProtocolLayer[];
  checklist: string[];
  alerts: string[];
  warnings: string[];
  confidence: string;
  protocolAlternative: StratificationProtocol['alternative'];
  resin: Resin | null;
  hasProtocol: boolean;
  currentTreatmentStyle: ReturnType<typeof getTreatmentStyle>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProtocolComputed(source: ProtocolSource | null): ProtocolComputed {
  const treatmentType = source?.treatment_type || 'resina';
  const isPorcelain = treatmentType === 'porcelana';
  const isSpecialTreatment = isSpecialTreatmentType(treatmentType);
  const cementationProtocol = (source?.cementation_protocol as CementationProtocol | null) ?? null;
  const genericProtocol = source?.generic_protocol ?? null;
  const protocol = source?.stratification_protocol ?? null;

  const layers = protocol?.layers || source?.protocol_layers || [];
  const checklist = useMemo(() => isPorcelain
    ? (cementationProtocol?.checklist || [])
    : isSpecialTreatment && genericProtocol
      ? genericProtocol.checklist
      : (protocol?.checklist || []),
    [isPorcelain, cementationProtocol?.checklist, isSpecialTreatment, genericProtocol, protocol?.checklist]);
  const alerts = isPorcelain
    ? (cementationProtocol?.alerts || [])
    : isSpecialTreatment && genericProtocol
      ? genericProtocol.alerts
      : (source?.alerts || []);
  const warnings = isPorcelain ? (cementationProtocol?.warnings || []) : (source?.warnings || []);
  const confidence = isPorcelain ? (cementationProtocol?.confidence || 'média') : (protocol?.confidence || 'média');
  const protocolAlternative = protocol?.alternative;

  const resin = source?.resins ?? null;
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
