import { describe, it, expect } from 'vitest';
import { getProtocolFingerprint } from '@/lib/protocol-fingerprint';

// ---------------------------------------------------------------------------
// Test the pure computation logic from useGroupResult
// The hook depends on React Query, AuthContext, useParams, useTranslation, etc.
// We test the extractable helper functions and derived values independently.
// ---------------------------------------------------------------------------

// Minimal types mirroring the hook
interface Resin {
  id?: string;
  name: string;
  manufacturer: string;
}

interface StratificationProtocol {
  layers?: ProtocolLayer[];
  checklist?: string[];
  confidence?: string;
  alternative?: string;
}

interface ProtocolLayer {
  order: number;
  resin_brand: string;
  shade: string;
}

interface CementationProtocol {
  checklist?: string[];
  alerts?: string[];
  warnings?: string[];
  confidence?: string;
  cementation?: {
    cement_type?: string;
    cement_brand?: string;
  };
}

interface GenericProtocol {
  treatment_type: string;
  tooth: string;
  summary: string;
  checklist: string[];
  alerts: string[];
  recommendations: string[];
  ai_reason?: string;
}

interface GroupEvaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  patient_age: number;
  tooth: string;
  region: string;
  cavity_class: string;
  restoration_size: string;
  substrate: string;
  aesthetic_level: string;
  tooth_color: string;
  stratification_needed: boolean;
  bruxism: boolean;
  longevity_expectation: string;
  budget: string;
  recommendation_text: string | null;
  alternatives: unknown[] | null;
  resins: Resin | null;
  photo_frontal: string | null;
  stratification_protocol: StratificationProtocol | null;
  protocol_layers: ProtocolLayer[] | null;
  alerts: string[] | null;
  warnings: string[] | null;
  checklist_progress: number[] | null;
  treatment_type: string | null;
  cementation_protocol: CementationProtocol | null;
  ai_treatment_indication: string | null;
  ai_indication_reason: string | null;
  generic_protocol: GenericProtocol | null;
  session_id: string;
}

// Mirror the group filtering logic
function filterByFingerprint(allEvaluations: GroupEvaluation[], decodedFingerprint: string): GroupEvaluation[] {
  return allEvaluations.filter(ev => getProtocolFingerprint(ev) === decodedFingerprint);
}

// Mirror the groupTeeth computation
function computeGroupTeeth(groupEvaluations: GroupEvaluation[]): string[] {
  return groupEvaluations.map(ev => ev.tooth === 'GENGIVO' ? 'Gengiva' : ev.tooth);
}

// Mirror the computed protocol values
const SPECIAL_TREATMENTS = ['implante', 'coroa', 'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'];

function computeGroupProtocol(primaryEval: GroupEvaluation | null) {
  const treatmentType = primaryEval?.treatment_type || 'resina';
  const isPorcelain = treatmentType === 'porcelana';
  const isSpecialTreatment = SPECIAL_TREATMENTS.includes(treatmentType);
  const cementationProtocol = primaryEval?.cementation_protocol as CementationProtocol | null;
  const genericProtocol = primaryEval?.generic_protocol ?? null;
  const protocol = primaryEval?.stratification_protocol ?? null;

  const layers = protocol?.layers || primaryEval?.protocol_layers || [];

  let checklist: string[];
  if (isPorcelain) {
    checklist = cementationProtocol?.checklist || [];
  } else if (isSpecialTreatment && genericProtocol) {
    checklist = genericProtocol.checklist;
  } else {
    checklist = protocol?.checklist || [];
  }

  let alerts: string[];
  if (isPorcelain) {
    alerts = cementationProtocol?.alerts || [];
  } else if (isSpecialTreatment && genericProtocol) {
    alerts = genericProtocol.alerts;
  } else {
    alerts = primaryEval?.alerts || [];
  }

  const warnings = isPorcelain
    ? (cementationProtocol?.warnings || [])
    : (primaryEval?.warnings || []);

  const confidence = isPorcelain
    ? (cementationProtocol?.confidence || 'média')
    : (protocol?.confidence || 'média');

  const protocolAlternative = protocol?.alternative;
  const resin = primaryEval?.resins ?? null;

  let hasProtocol: boolean;
  if (isPorcelain) {
    hasProtocol = !!cementationProtocol;
  } else if (isSpecialTreatment) {
    hasProtocol = !!genericProtocol;
  } else {
    hasProtocol = layers.length > 0;
  }

  return {
    treatmentType,
    isPorcelain,
    isSpecialTreatment,
    layers,
    checklist,
    alerts,
    warnings,
    confidence,
    protocolAlternative,
    resin,
    hasProtocol,
  };
}

// Base evaluation for convenience
const baseGroupEval: GroupEvaluation = {
  id: 'eval-1',
  created_at: '2025-01-15T10:00:00Z',
  patient_name: 'João',
  patient_age: 35,
  tooth: '11',
  region: 'anterior',
  cavity_class: 'III',
  restoration_size: 'Média',
  substrate: 'esmalte',
  aesthetic_level: 'estético',
  tooth_color: 'A2',
  stratification_needed: true,
  bruxism: false,
  longevity_expectation: 'médio',
  budget: 'padrão',
  recommendation_text: null,
  alternatives: null,
  resins: null,
  photo_frontal: null,
  stratification_protocol: null,
  protocol_layers: null,
  alerts: null,
  warnings: null,
  checklist_progress: null,
  treatment_type: 'resina',
  cementation_protocol: null,
  ai_treatment_indication: null,
  ai_indication_reason: null,
  generic_protocol: null,
  session_id: 'session-1',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getProtocolFingerprint', () => {
  it('should return resina fingerprint with no-resin when resin is null', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'resina',
      resins: null,
      stratification_protocol: null,
    };
    expect(getProtocolFingerprint(eval1)).toBe('resina::no-resin');
  });

  it('should return resina fingerprint with resin name and manufacturer', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'resina',
      resins: { name: 'Filtek Z350 XT', manufacturer: '3M' },
      stratification_protocol: null,
    };
    expect(getProtocolFingerprint(eval1)).toBe('resina::Filtek Z350 XT|3M');
  });

  it('should include sorted layers in resina fingerprint', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
        ],
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe('resina::Z350|3M::Z350:A2B|Z350:A2E');
  });

  it('should return porcelana fingerprint with cementation details', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: {
          cement_type: 'Resinoso',
          cement_brand: 'RelyX',
        },
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe('porcelana::Resinoso::RelyX');
  });

  it('should return simple porcelana fingerprint when no cementation details', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: null,
    };
    expect(getProtocolFingerprint(eval1)).toBe('porcelana');
  });

  it('should return porcelana with empty cementation when cementation obj exists but no details', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: {},
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe('porcelana::::');
  });

  it('should return treatment type as fingerprint for generic treatments', () => {
    for (const type of ['gengivoplastia', 'implante', 'coroa', 'endodontia', 'encaminhamento', 'recobrimento_radicular']) {
      const eval1: GroupEvaluation = {
        ...baseGroupEval,
        treatment_type: type,
      };
      expect(getProtocolFingerprint(eval1)).toBe(type);
    }
  });

  it('should default to resina when treatment_type is null', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: null,
      resins: null,
    };
    expect(getProtocolFingerprint(eval1)).toBe('resina::no-resin');
  });

  it('should produce identical fingerprints for teeth with the same protocol', () => {
    const common = {
      resins: { name: 'Z350', manufacturer: '3M' } as Resin,
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
        ],
      },
    };
    const eval1: GroupEvaluation = { ...baseGroupEval, tooth: '11', ...common };
    const eval2: GroupEvaluation = { ...baseGroupEval, tooth: '12', ...common };
    expect(getProtocolFingerprint(eval1)).toBe(getProtocolFingerprint(eval2));
  });

  it('should produce different fingerprints for different resins', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      resins: { name: 'Z350', manufacturer: '3M' },
    };
    const eval2: GroupEvaluation = {
      ...baseGroupEval,
      resins: { name: 'Charisma', manufacturer: 'Kulzer' },
    };
    expect(getProtocolFingerprint(eval1)).not.toBe(getProtocolFingerprint(eval2));
  });
});

describe('filterByFingerprint', () => {
  it('should return only evaluations matching the fingerprint', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, id: 'e1', tooth: '11', resins: { name: 'Z350', manufacturer: '3M' } },
      { ...baseGroupEval, id: 'e2', tooth: '12', resins: { name: 'Z350', manufacturer: '3M' } },
      { ...baseGroupEval, id: 'e3', tooth: '21', resins: { name: 'Charisma', manufacturer: 'Kulzer' } },
    ];
    const fingerprint = 'resina::Z350|3M';
    const result = filterByFingerprint(evals, fingerprint);
    expect(result).toHaveLength(2);
    expect(result.map(e => e.id)).toEqual(['e1', 'e2']);
  });

  it('should return empty array when no evaluations match', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, id: 'e1', resins: { name: 'Z350', manufacturer: '3M' } },
    ];
    const result = filterByFingerprint(evals, 'porcelana');
    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty evaluations list', () => {
    const result = filterByFingerprint([], 'resina::no-resin');
    expect(result).toHaveLength(0);
  });
});

describe('computeGroupTeeth', () => {
  it('should return empty array for empty group', () => {
    expect(computeGroupTeeth([])).toEqual([]);
  });

  it('should map tooth numbers directly', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, tooth: '11' },
      { ...baseGroupEval, tooth: '12' },
      { ...baseGroupEval, tooth: '21' },
    ];
    expect(computeGroupTeeth(evals)).toEqual(['11', '12', '21']);
  });

  it('should map GENGIVO to Gengiva', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, tooth: 'GENGIVO' },
    ];
    expect(computeGroupTeeth(evals)).toEqual(['Gengiva']);
  });

  it('should handle mixed teeth and GENGIVO', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, tooth: '11' },
      { ...baseGroupEval, tooth: 'GENGIVO' },
      { ...baseGroupEval, tooth: '21' },
    ];
    expect(computeGroupTeeth(evals)).toEqual(['11', 'Gengiva', '21']);
  });
});

describe('computeGroupProtocol', () => {
  it('should return defaults when primaryEval is null', () => {
    const result = computeGroupProtocol(null);
    expect(result.treatmentType).toBe('resina');
    expect(result.isPorcelain).toBe(false);
    expect(result.isSpecialTreatment).toBe(false);
    expect(result.layers).toEqual([]);
    expect(result.checklist).toEqual([]);
    expect(result.alerts).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe('média');
    expect(result.resin).toBeNull();
    expect(result.hasProtocol).toBe(false);
  });

  it('should compute resina protocol data correctly', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
        ],
        checklist: ['Condicionamento', 'Adesivo'],
        confidence: 'alta',
        alternative: 'Bulk fill',
      },
      alerts: ['Bruxismo'],
      warnings: ['Atenção'],
    };
    const result = computeGroupProtocol(eval1);
    expect(result.treatmentType).toBe('resina');
    expect(result.isPorcelain).toBe(false);
    expect(result.isSpecialTreatment).toBe(false);
    expect(result.layers).toHaveLength(2);
    expect(result.checklist).toEqual(['Condicionamento', 'Adesivo']);
    expect(result.alerts).toEqual(['Bruxismo']);
    expect(result.warnings).toEqual(['Atenção']);
    expect(result.confidence).toBe('alta');
    expect(result.protocolAlternative).toBe('Bulk fill');
    expect(result.resin).toEqual({ name: 'Z350', manufacturer: '3M' });
    expect(result.hasProtocol).toBe(true);
  });

  it('should compute porcelana protocol data correctly', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: {
        checklist: ['Preparo', 'Cimentação'],
        alerts: ['Verificar oclusão'],
        warnings: ['Sensibilidade pós-op'],
        confidence: 'alta',
      },
      alerts: ['Should not use this'],
      warnings: ['Should not use this either'],
    };
    const result = computeGroupProtocol(eval1);
    expect(result.treatmentType).toBe('porcelana');
    expect(result.isPorcelain).toBe(true);
    expect(result.checklist).toEqual(['Preparo', 'Cimentação']);
    expect(result.alerts).toEqual(['Verificar oclusão']);
    expect(result.warnings).toEqual(['Sensibilidade pós-op']);
    expect(result.confidence).toBe('alta');
    expect(result.hasProtocol).toBe(true);
  });

  it('should compute special treatment protocol data correctly', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'gengivoplastia',
      generic_protocol: {
        treatment_type: 'gengivoplastia',
        tooth: 'GENGIVO',
        summary: 'Gengivoplastia estética',
        checklist: ['Anestesia', 'Incisão'],
        alerts: ['Alerta gengival'],
        recommendations: ['Recomendação'],
      },
      alerts: ['Should not use this'],
    };
    const result = computeGroupProtocol(eval1);
    expect(result.treatmentType).toBe('gengivoplastia');
    expect(result.isSpecialTreatment).toBe(true);
    expect(result.checklist).toEqual(['Anestesia', 'Incisão']);
    expect(result.alerts).toEqual(['Alerta gengival']);
    expect(result.hasProtocol).toBe(true);
  });

  it('should fall back to protocol_layers when stratification_protocol has no layers', () => {
    const fallbackLayers: ProtocolLayer[] = [
      { order: 1, resin_brand: 'Charisma', shade: 'A3' },
    ];
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'resina',
      stratification_protocol: {},
      protocol_layers: fallbackLayers,
    };
    const result = computeGroupProtocol(eval1);
    expect(result.layers).toEqual(fallbackLayers);
    expect(result.hasProtocol).toBe(true);
  });

  it('should default confidence to média when not specified', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'resina',
      stratification_protocol: {},
    };
    const result = computeGroupProtocol(eval1);
    expect(result.confidence).toBe('média');
  });

  it('should return false for hasProtocol when porcelana has no cementation', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: null,
    };
    const result = computeGroupProtocol(eval1);
    expect(result.hasProtocol).toBe(false);
  });

  it('should return false for hasProtocol when special treatment has no generic protocol', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'implante',
      generic_protocol: null,
    };
    const result = computeGroupProtocol(eval1);
    expect(result.hasProtocol).toBe(false);
  });

  it('should return false for hasProtocol when resina has no layers', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'resina',
      stratification_protocol: null,
      protocol_layers: null,
    };
    const result = computeGroupProtocol(eval1);
    expect(result.hasProtocol).toBe(false);
  });
});

describe('group evaluation session workflow', () => {
  it('should use first evaluation as primary', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, id: 'e1', tooth: '11', resins: { name: 'Z350', manufacturer: '3M' } },
      { ...baseGroupEval, id: 'e2', tooth: '12', resins: { name: 'Z350', manufacturer: '3M' } },
    ];
    const primaryEval = evals[0] || null;
    expect(primaryEval).not.toBeNull();
    expect(primaryEval!.id).toBe('e1');
  });

  it('should return null primary when group is empty', () => {
    const evals: GroupEvaluation[] = [];
    const primaryEval = evals[0] || null;
    expect(primaryEval).toBeNull();
  });

  it('should extract sessionId from evaluations', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, session_id: 'session-abc' },
    ];
    expect(evals[0].session_id).toBe('session-abc');
  });

  it('should handle group of evaluations with same session', () => {
    const evals: GroupEvaluation[] = [
      { ...baseGroupEval, id: 'e1', tooth: '11', session_id: 'session-1' },
      { ...baseGroupEval, id: 'e2', tooth: '12', session_id: 'session-1' },
      { ...baseGroupEval, id: 'e3', tooth: '13', session_id: 'session-1' },
    ];
    const allSameSession = evals.every(ev => ev.session_id === evals[0].session_id);
    expect(allSameSession).toBe(true);
  });
});

describe('porcelana cementation fingerprint edge cases', () => {
  it('should handle cementation with only cement_type', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: {
          cement_type: 'Resinoso',
        },
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe('porcelana::Resinoso::');
  });

  it('should handle cementation with only cement_brand', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: {
          cement_brand: 'RelyX',
        },
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe('porcelana::::RelyX');
  });

  it('should handle cementation protocol without cementation property', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      treatment_type: 'porcelana',
      cementation_protocol: {
        checklist: ['Step 1'],
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe('porcelana');
  });
});

describe('resina layer sorting in fingerprint', () => {
  it('should sort layers by order regardless of input order', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 3, resin_brand: 'Z350', shade: 'A2I' },
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2D' },
        ],
      },
    };
    const eval2: GroupEvaluation = {
      ...baseGroupEval,
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2D' },
          { order: 3, resin_brand: 'Z350', shade: 'A2I' },
        ],
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe(getProtocolFingerprint(eval2));
  });

  it('should include all layers in fingerprint', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Empress', shade: 'Trans' },
        ],
      },
    };
    const fp = getProtocolFingerprint(eval1);
    expect(fp).toContain('Z350:A2B');
    expect(fp).toContain('Empress:Trans');
  });

  it('should not include layers in fingerprint when layers array is empty', () => {
    const eval1: GroupEvaluation = {
      ...baseGroupEval,
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [],
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe('resina::Z350|3M');
  });
});
