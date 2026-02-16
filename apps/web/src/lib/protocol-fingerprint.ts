/** Shape required by getProtocolFingerprint — works with both EvaluationItem and GroupEvaluation */
export interface FingerprintableEvaluation {
  treatment_type?: string | null;
  resins?: { name: string; manufacturer: string } | null;
  stratification_protocol?: {
    layers?: Array<{ order: number; resin_brand: string; shade: string }> | null;
  } | null;
  cementation_protocol?: {
    cementation?: { cement_type?: string | null; cement_brand?: string | null } | null;
  } | null;
}

/**
 * Generates a fingerprint from an evaluation's protocol so identical protocols
 * can be grouped. Prefixed by treatment_type to prevent cross-type collisions.
 *
 * Shared between EvaluationDetails and useGroupResult — single source of truth.
 */
export function getProtocolFingerprint(evaluation: FingerprintableEvaluation): string {
  const treatmentType = evaluation.treatment_type || 'resina';

  if (treatmentType === 'resina') {
    const resinKey = evaluation.resins
      ? `${evaluation.resins.name}|${evaluation.resins.manufacturer}`
      : 'no-resin';
    if (!evaluation.stratification_protocol?.layers?.length) return `resina::${resinKey}`;
    const layersKey = [...evaluation.stratification_protocol.layers]
      .sort((a, b) => a.order - b.order)
      .map(l => `${l.resin_brand}:${l.shade}`)
      .join('|');
    return `resina::${resinKey}::${layersKey}`;
  }

  if (treatmentType === 'porcelana') {
    const cem = evaluation.cementation_protocol;
    if (cem?.cementation) {
      return `porcelana::${cem.cementation.cement_type || ''}::${cem.cementation.cement_brand || ''}`;
    }
    return 'porcelana';
  }

  // Generic treatments (gengivoplastia, implante, coroa, etc.)
  return treatmentType;
}
