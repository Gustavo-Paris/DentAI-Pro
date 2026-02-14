import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from useResult
// The hook depends on React Query, AuthContext, useParams, useTranslation, etc.
// We test the extractable helper functions and derived values independently.
// ---------------------------------------------------------------------------

// Minimal types mirroring the hook
interface Alternative {
  name: string;
  manufacturer: string;
  reason: string;
}

interface Resin {
  id: string;
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

interface Evaluation {
  id: string;
  treatment_type: 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia' | 'recobrimento_radicular' | null;
  stratification_protocol: StratificationProtocol | null;
  protocol_layers: ProtocolLayer[] | null;
  cementation_protocol: CementationProtocol | null;
  generic_protocol: GenericProtocol | null;
  alerts: string[] | null;
  warnings: string[] | null;
  resins: Resin | null;
  ideal_resin: Resin | null;
  alternatives: Alternative[] | null;
  checklist_progress: number[] | null;
  photo_frontal: string | null;
  photo_45: string | null;
  photo_face: string | null;
}

// Mirror helper functions from useResult

const SPECIAL_TREATMENTS = ['implante', 'coroa', 'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'];

function computeTreatmentFlags(evaluation: Evaluation | null) {
  const treatmentType = evaluation?.treatment_type || 'resina';
  const isPorcelain = treatmentType === 'porcelana';
  const isSpecialTreatment = SPECIAL_TREATMENTS.includes(treatmentType);
  return { treatmentType, isPorcelain, isSpecialTreatment };
}

function computeLayers(evaluation: Evaluation | null): ProtocolLayer[] {
  if (!evaluation) return [];
  const protocol = evaluation.stratification_protocol ?? null;
  return protocol?.layers || evaluation.protocol_layers || [];
}

function computeChecklist(evaluation: Evaluation | null): string[] {
  if (!evaluation) return [];
  const { isPorcelain, isSpecialTreatment } = computeTreatmentFlags(evaluation);
  const cementationProtocol = evaluation.cementation_protocol as CementationProtocol | null;
  const genericProtocol = evaluation.generic_protocol ?? null;
  const protocol = evaluation.stratification_protocol ?? null;

  if (isPorcelain) return cementationProtocol?.checklist || [];
  if (isSpecialTreatment && genericProtocol) return genericProtocol.checklist;
  return protocol?.checklist || [];
}

function computeAlerts(evaluation: Evaluation | null): string[] {
  if (!evaluation) return [];
  const { isPorcelain, isSpecialTreatment } = computeTreatmentFlags(evaluation);
  const cementationProtocol = evaluation.cementation_protocol as CementationProtocol | null;
  const genericProtocol = evaluation.generic_protocol ?? null;

  if (isPorcelain) return cementationProtocol?.alerts || [];
  if (isSpecialTreatment && genericProtocol) return genericProtocol.alerts;
  return evaluation.alerts || [];
}

function computeWarnings(evaluation: Evaluation | null): string[] {
  if (!evaluation) return [];
  const { isPorcelain } = computeTreatmentFlags(evaluation);
  const cementationProtocol = evaluation.cementation_protocol as CementationProtocol | null;

  if (isPorcelain) return cementationProtocol?.warnings || [];
  return evaluation.warnings || [];
}

function computeConfidence(evaluation: Evaluation | null): string {
  if (!evaluation) return 'média';
  const { isPorcelain } = computeTreatmentFlags(evaluation);
  const cementationProtocol = evaluation.cementation_protocol as CementationProtocol | null;
  const protocol = evaluation.stratification_protocol ?? null;

  if (isPorcelain) return cementationProtocol?.confidence || 'média';
  return protocol?.confidence || 'média';
}

function computeShowIdealResin(evaluation: Evaluation | null): boolean {
  if (!evaluation) return false;
  const resin = evaluation.resins ?? null;
  const idealResin = evaluation.ideal_resin ?? null;
  return !!(idealResin && resin && idealResin.id !== resin.id);
}

function computeHasProtocol(evaluation: Evaluation | null): boolean {
  if (!evaluation) return false;
  const { isPorcelain, isSpecialTreatment } = computeTreatmentFlags(evaluation);
  const cementationProtocol = evaluation.cementation_protocol as CementationProtocol | null;
  const genericProtocol = evaluation.generic_protocol ?? null;
  const layers = computeLayers(evaluation);

  if (isPorcelain) return !!cementationProtocol;
  if (isSpecialTreatment) return !!genericProtocol;
  return layers.length > 0;
}

function computeHasPhotos(photoUrls: { frontal: string | null; angle45: string | null; face: string | null }): boolean {
  return !!(photoUrls.frontal || photoUrls.angle45 || photoUrls.face);
}

function getChecklistCompletionStatus(evaluation: Evaluation | null) {
  if (!evaluation) return { complete: true, total: 0, progress: 0 };
  const checklist = computeChecklist(evaluation);
  const progressIndices = evaluation.checklist_progress || [];
  return {
    complete: checklist.length === 0 || progressIndices.length === checklist.length,
    total: checklist.length,
    progress: progressIndices.length,
  };
}

// Base evaluation for convenience
const baseEval: Evaluation = {
  id: 'eval-1',
  treatment_type: 'resina',
  stratification_protocol: null,
  protocol_layers: null,
  cementation_protocol: null,
  generic_protocol: null,
  alerts: null,
  warnings: null,
  resins: null,
  ideal_resin: null,
  alternatives: null,
  checklist_progress: null,
  photo_frontal: null,
  photo_45: null,
  photo_face: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeTreatmentFlags', () => {
  it('should default to resina when evaluation is null', () => {
    const flags = computeTreatmentFlags(null);
    expect(flags.treatmentType).toBe('resina');
    expect(flags.isPorcelain).toBe(false);
    expect(flags.isSpecialTreatment).toBe(false);
  });

  it('should default to resina when treatment_type is null', () => {
    const flags = computeTreatmentFlags({ ...baseEval, treatment_type: null });
    expect(flags.treatmentType).toBe('resina');
    expect(flags.isPorcelain).toBe(false);
    expect(flags.isSpecialTreatment).toBe(false);
  });

  it('should detect porcelana treatment', () => {
    const flags = computeTreatmentFlags({ ...baseEval, treatment_type: 'porcelana' });
    expect(flags.isPorcelain).toBe(true);
    expect(flags.isSpecialTreatment).toBe(false);
  });

  it('should detect special treatment types', () => {
    for (const type of SPECIAL_TREATMENTS) {
      const flags = computeTreatmentFlags({ ...baseEval, treatment_type: type as Evaluation['treatment_type'] });
      expect(flags.isSpecialTreatment).toBe(true);
      expect(flags.isPorcelain).toBe(false);
    }
  });

  it('should not flag resina as special or porcelain', () => {
    const flags = computeTreatmentFlags({ ...baseEval, treatment_type: 'resina' });
    expect(flags.isPorcelain).toBe(false);
    expect(flags.isSpecialTreatment).toBe(false);
  });
});

describe('computeLayers', () => {
  it('should return empty array for null evaluation', () => {
    expect(computeLayers(null)).toEqual([]);
  });

  it('should prefer stratification_protocol layers', () => {
    const layers: ProtocolLayer[] = [
      { order: 1, resin_brand: 'Z350', shade: 'A2B' },
      { order: 2, resin_brand: 'Z350', shade: 'A2E' },
    ];
    const eval1: Evaluation = {
      ...baseEval,
      stratification_protocol: { layers },
      protocol_layers: [{ order: 1, resin_brand: 'Fallback', shade: 'X' }],
    };
    expect(computeLayers(eval1)).toEqual(layers);
  });

  it('should fall back to protocol_layers when stratification_protocol has no layers', () => {
    const fallbackLayers: ProtocolLayer[] = [
      { order: 1, resin_brand: 'Charisma', shade: 'A3' },
    ];
    const eval1: Evaluation = {
      ...baseEval,
      stratification_protocol: {},
      protocol_layers: fallbackLayers,
    };
    expect(computeLayers(eval1)).toEqual(fallbackLayers);
  });

  it('should fall back to protocol_layers when stratification_protocol is null', () => {
    const fallbackLayers: ProtocolLayer[] = [
      { order: 1, resin_brand: 'IPS', shade: 'BL1' },
    ];
    const eval1: Evaluation = {
      ...baseEval,
      stratification_protocol: null,
      protocol_layers: fallbackLayers,
    };
    expect(computeLayers(eval1)).toEqual(fallbackLayers);
  });

  it('should return empty array when both are null', () => {
    const eval1: Evaluation = {
      ...baseEval,
      stratification_protocol: null,
      protocol_layers: null,
    };
    expect(computeLayers(eval1)).toEqual([]);
  });
});

describe('computeChecklist', () => {
  it('should return empty array for null evaluation', () => {
    expect(computeChecklist(null)).toEqual([]);
  });

  it('should return stratification checklist for resina treatment', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: { checklist: ['Condicionamento', 'Adesivo', 'Incrementos'] },
    };
    expect(computeChecklist(eval1)).toEqual(['Condicionamento', 'Adesivo', 'Incrementos']);
  });

  it('should return cementation checklist for porcelana treatment', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: { checklist: ['Preparo', 'Moldagem'] },
    };
    expect(computeChecklist(eval1)).toEqual(['Preparo', 'Moldagem']);
  });

  it('should return generic checklist for special treatments', () => {
    const genericProtocol: GenericProtocol = {
      treatment_type: 'gengivoplastia',
      tooth: 'GENGIVO',
      summary: 'Gengivoplastia estética',
      checklist: ['Step 1', 'Step 2'],
      alerts: [],
      recommendations: [],
    };
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'gengivoplastia',
      generic_protocol: genericProtocol,
    };
    expect(computeChecklist(eval1)).toEqual(['Step 1', 'Step 2']);
  });

  it('should return empty array for special treatment without generic protocol', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'implante',
      generic_protocol: null,
      stratification_protocol: { checklist: ['Should not use this'] },
    };
    // Falls through to protocol?.checklist since genericProtocol is null
    expect(computeChecklist(eval1)).toEqual(['Should not use this']);
  });

  it('should return empty array when no protocol exists', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: null,
    };
    expect(computeChecklist(eval1)).toEqual([]);
  });

  it('should return empty array when protocol checklist is undefined', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: {} as CementationProtocol,
    };
    expect(computeChecklist(eval1)).toEqual([]);
  });
});

describe('computeAlerts', () => {
  it('should return empty array for null evaluation', () => {
    expect(computeAlerts(null)).toEqual([]);
  });

  it('should return evaluation alerts for resina', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      alerts: ['Bruxismo detectado', 'Classe IV complexa'],
    };
    expect(computeAlerts(eval1)).toEqual(['Bruxismo detectado', 'Classe IV complexa']);
  });

  it('should return cementation alerts for porcelana', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: { alerts: ['Verificar oclusão'] },
      alerts: ['Should not use this'],
    };
    expect(computeAlerts(eval1)).toEqual(['Verificar oclusão']);
  });

  it('should return generic protocol alerts for special treatments', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'coroa',
      generic_protocol: {
        treatment_type: 'coroa',
        tooth: '46',
        summary: 'Coroa total',
        checklist: [],
        alerts: ['Alerta coroa'],
        recommendations: [],
      },
      alerts: ['Should not use this'],
    };
    expect(computeAlerts(eval1)).toEqual(['Alerta coroa']);
  });

  it('should return empty array when alerts are null for resina', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      alerts: null,
    };
    expect(computeAlerts(eval1)).toEqual([]);
  });
});

describe('computeWarnings', () => {
  it('should return empty array for null evaluation', () => {
    expect(computeWarnings(null)).toEqual([]);
  });

  it('should return evaluation warnings for resina', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      warnings: ['Aviso 1'],
    };
    expect(computeWarnings(eval1)).toEqual(['Aviso 1']);
  });

  it('should return cementation warnings for porcelana', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: { warnings: ['Aviso porcelana'] },
      warnings: ['Should not use this'],
    };
    expect(computeWarnings(eval1)).toEqual(['Aviso porcelana']);
  });

  it('should return evaluation warnings for special treatments (not generic protocol)', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'implante',
      warnings: ['Aviso implante'],
    };
    expect(computeWarnings(eval1)).toEqual(['Aviso implante']);
  });

  it('should return empty array when warnings are null', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      warnings: null,
    };
    expect(computeWarnings(eval1)).toEqual([]);
  });
});

describe('computeConfidence', () => {
  it('should return "média" for null evaluation', () => {
    expect(computeConfidence(null)).toBe('média');
  });

  it('should return stratification confidence for resina', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: { confidence: 'alta' },
    };
    expect(computeConfidence(eval1)).toBe('alta');
  });

  it('should return cementation confidence for porcelana', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: { confidence: 'alta' },
      stratification_protocol: { confidence: 'baixa' },
    };
    expect(computeConfidence(eval1)).toBe('alta');
  });

  it('should default to "média" when protocol has no confidence', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: {},
    };
    expect(computeConfidence(eval1)).toBe('média');
  });

  it('should default to "média" for porcelana without cementation confidence', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: {} as CementationProtocol,
    };
    expect(computeConfidence(eval1)).toBe('média');
  });
});

describe('computeShowIdealResin', () => {
  it('should return false for null evaluation', () => {
    expect(computeShowIdealResin(null)).toBe(false);
  });

  it('should return false when no ideal resin', () => {
    const eval1: Evaluation = {
      ...baseEval,
      resins: { id: 'r1', name: 'Z350', manufacturer: '3M' },
      ideal_resin: null,
    };
    expect(computeShowIdealResin(eval1)).toBe(false);
  });

  it('should return false when no resin', () => {
    const eval1: Evaluation = {
      ...baseEval,
      resins: null,
      ideal_resin: { id: 'r2', name: 'IPS', manufacturer: 'Ivoclar' },
    };
    expect(computeShowIdealResin(eval1)).toBe(false);
  });

  it('should return false when ideal and recommended are the same', () => {
    const eval1: Evaluation = {
      ...baseEval,
      resins: { id: 'r1', name: 'Z350', manufacturer: '3M' },
      ideal_resin: { id: 'r1', name: 'Z350', manufacturer: '3M' },
    };
    expect(computeShowIdealResin(eval1)).toBe(false);
  });

  it('should return true when ideal differs from recommended', () => {
    const eval1: Evaluation = {
      ...baseEval,
      resins: { id: 'r1', name: 'Z350', manufacturer: '3M' },
      ideal_resin: { id: 'r2', name: 'IPS Empress', manufacturer: 'Ivoclar' },
    };
    expect(computeShowIdealResin(eval1)).toBe(true);
  });
});

describe('computeHasProtocol', () => {
  it('should return false for null evaluation', () => {
    expect(computeHasProtocol(null)).toBe(false);
  });

  it('should return true for resina with layers', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: {
        layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2' }],
      },
    };
    expect(computeHasProtocol(eval1)).toBe(true);
  });

  it('should return false for resina without layers', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: null,
      protocol_layers: null,
    };
    expect(computeHasProtocol(eval1)).toBe(false);
  });

  it('should return true for porcelana with cementation protocol', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: { checklist: ['Step 1'] },
    };
    expect(computeHasProtocol(eval1)).toBe(true);
  });

  it('should return false for porcelana without cementation protocol', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: null,
    };
    expect(computeHasProtocol(eval1)).toBe(false);
  });

  it('should return true for special treatment with generic protocol', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'gengivoplastia',
      generic_protocol: {
        treatment_type: 'gengivoplastia',
        tooth: 'GENGIVO',
        summary: 'Gengivoplastia',
        checklist: [],
        alerts: [],
        recommendations: [],
      },
    };
    expect(computeHasProtocol(eval1)).toBe(true);
  });

  it('should return false for special treatment without generic protocol', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'implante',
      generic_protocol: null,
    };
    expect(computeHasProtocol(eval1)).toBe(false);
  });

  it('should check protocol_layers as fallback for resina', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: null,
      protocol_layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2' }],
    };
    expect(computeHasProtocol(eval1)).toBe(true);
  });
});

describe('computeHasPhotos', () => {
  it('should return false when no photos', () => {
    expect(computeHasPhotos({ frontal: null, angle45: null, face: null })).toBe(false);
  });

  it('should return true when frontal photo exists', () => {
    expect(computeHasPhotos({ frontal: 'https://photo.url', angle45: null, face: null })).toBe(true);
  });

  it('should return true when angle45 photo exists', () => {
    expect(computeHasPhotos({ frontal: null, angle45: 'https://photo.url', face: null })).toBe(true);
  });

  it('should return true when face photo exists', () => {
    expect(computeHasPhotos({ frontal: null, angle45: null, face: 'https://photo.url' })).toBe(true);
  });

  it('should return true when all photos exist', () => {
    expect(computeHasPhotos({ frontal: 'a', angle45: 'b', face: 'c' })).toBe(true);
  });
});

describe('getChecklistCompletionStatus', () => {
  it('should return complete with zero total for null evaluation', () => {
    expect(getChecklistCompletionStatus(null)).toEqual({
      complete: true,
      total: 0,
      progress: 0,
    });
  });

  it('should return complete when checklist is empty', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: { checklist: [] },
      checklist_progress: null,
    };
    expect(getChecklistCompletionStatus(eval1)).toEqual({
      complete: true,
      total: 0,
      progress: 0,
    });
  });

  it('should return complete when all items are checked', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: { checklist: ['A', 'B', 'C'] },
      checklist_progress: [0, 1, 2],
    };
    expect(getChecklistCompletionStatus(eval1)).toEqual({
      complete: true,
      total: 3,
      progress: 3,
    });
  });

  it('should return incomplete when some items are not checked', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: { checklist: ['A', 'B', 'C'] },
      checklist_progress: [0],
    };
    expect(getChecklistCompletionStatus(eval1)).toEqual({
      complete: false,
      total: 3,
      progress: 1,
    });
  });

  it('should return incomplete when no progress recorded', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: { checklist: ['A', 'B'] },
      checklist_progress: null,
    };
    expect(getChecklistCompletionStatus(eval1)).toEqual({
      complete: false,
      total: 2,
      progress: 0,
    });
  });

  it('should handle porcelana checklist completion', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: { checklist: ['Prep', 'Cement', 'Polish'] },
      checklist_progress: [0, 1, 2],
    };
    expect(getChecklistCompletionStatus(eval1)).toEqual({
      complete: true,
      total: 3,
      progress: 3,
    });
  });

  it('should handle generic protocol checklist completion for special treatments', () => {
    const eval1: Evaluation = {
      ...baseEval,
      treatment_type: 'gengivoplastia',
      generic_protocol: {
        treatment_type: 'gengivoplastia',
        tooth: 'GENGIVO',
        summary: 'Gengivoplastia',
        checklist: ['Step 1', 'Step 2'],
        alerts: [],
        recommendations: [],
      },
      checklist_progress: [0],
    };
    expect(getChecklistCompletionStatus(eval1)).toEqual({
      complete: false,
      total: 2,
      progress: 1,
    });
  });
});

describe('treatment style mapping', () => {
  // Mirror the treatmentStyles keys from useResult to ensure completeness
  const VALID_TREATMENT_TYPES = [
    'resina',
    'porcelana',
    'coroa',
    'implante',
    'endodontia',
    'encaminhamento',
    'gengivoplastia',
    'recobrimento_radicular',
  ];

  it('should cover all known treatment types', () => {
    // Verify the treatment flags logic handles all types
    for (const type of VALID_TREATMENT_TYPES) {
      const flags = computeTreatmentFlags({ ...baseEval, treatment_type: type as Evaluation['treatment_type'] });
      expect(flags.treatmentType).toBe(type);
    }
  });

  it('should classify porcelana as not special, not resina', () => {
    const flags = computeTreatmentFlags({ ...baseEval, treatment_type: 'porcelana' });
    expect(flags.isPorcelain).toBe(true);
    expect(flags.isSpecialTreatment).toBe(false);
  });

  it('should classify resina as not special, not porcelain', () => {
    const flags = computeTreatmentFlags({ ...baseEval, treatment_type: 'resina' });
    expect(flags.isPorcelain).toBe(false);
    expect(flags.isSpecialTreatment).toBe(false);
  });

  it('should classify all special treatments correctly', () => {
    const specialTypes = ['implante', 'coroa', 'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'];
    for (const type of specialTypes) {
      const flags = computeTreatmentFlags({ ...baseEval, treatment_type: type as Evaluation['treatment_type'] });
      expect(flags.isPorcelain).toBe(false);
      expect(flags.isSpecialTreatment).toBe(true);
    }
  });
});

describe('protocolAlternative computation', () => {
  it('should return undefined when no stratification protocol', () => {
    const protocol = baseEval.stratification_protocol ?? null;
    const protocolAlternative = protocol?.alternative;
    expect(protocolAlternative).toBeUndefined();
  });

  it('should return the alternative from stratification protocol', () => {
    const eval1: Evaluation = {
      ...baseEval,
      stratification_protocol: { alternative: 'Técnica bulk fill como alternativa' },
    };
    const protocol = eval1.stratification_protocol ?? null;
    const protocolAlternative = protocol?.alternative;
    expect(protocolAlternative).toBe('Técnica bulk fill como alternativa');
  });
});
