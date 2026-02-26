import { describe, it, expect } from 'vitest';
import { computeProtocol } from '@/hooks/domain/protocolComputed';
import type { ProtocolComputed } from '@/hooks/domain/protocolComputed';
import type { ProtocolLayer, ProtocolAlternative, Resin, CementationProtocol, StratificationProtocol } from '@/types/protocol';

// ---------------------------------------------------------------------------
// Test the pure `computeProtocol` function from protocolComputed.ts
// This module is used by both useResult and useGroupResult.
// ---------------------------------------------------------------------------

// Helpers ----------------------------------------------------------------

/** Minimal evaluation-like object with all fields null. */
function makeEval(overrides: Record<string, unknown> = {}) {
  return {
    treatment_type: 'resina' as string | null,
    cementation_protocol: null as CementationProtocol | null,
    generic_protocol: null as {
      treatment_type: string;
      tooth: string;
      summary: string;
      checklist: string[];
      alerts: string[];
      recommendations: string[];
      ai_reason?: string;
    } | null,
    stratification_protocol: null as StratificationProtocol | null,
    protocol_layers: null as ProtocolLayer[] | null,
    alerts: null as string[] | null,
    warnings: null as string[] | null,
    resins: null as Resin | null,
    ...overrides,
  };
}

const sampleLayers: ProtocolLayer[] = [
  { order: 1, name: 'Dentina', resin_brand: 'Z350 XT', shade: 'A2B', thickness: '1.0mm', purpose: 'Corpo', technique: 'Incremental oblíqua', optional: false },
  { order: 2, name: 'Esmalte', resin_brand: 'Z350 XT', shade: 'A2E', thickness: '0.5mm', purpose: 'Esmalte', technique: 'Incremental vestibular', optional: false },
  { order: 3, name: 'Efeitos', resin_brand: 'Z350 XT', shade: 'CT', thickness: '0.3mm', purpose: 'Translucidez incisal', technique: 'Pincelamento', optional: true },
];

const sampleResin: Resin = {
  id: 'resin-z350',
  name: 'Filtek Z350 XT',
  manufacturer: '3M',
  type: 'Nanoparticulada',
  opacity: 'Translúcida',
  resistance: 'Alta',
  polishing: 'Excelente',
  aesthetics: 'Excelente',
  price_range: 'Média',
};

const sampleAlternative: ProtocolAlternative = {
  resin: 'IPS Empress Direct',
  shade: 'A2',
  technique: 'Bulk fill simplificada',
  tradeoff: 'Menos estético, mais rápido',
};

const sampleGenericProtocol = {
  treatment_type: 'gengivoplastia',
  tooth: 'GENGIVO',
  summary: 'Gengivoplastia estética para sorriso gengival',
  checklist: ['Anestesia infiltrativa', 'Marcação da margem gengival', 'Incisão com bisturi 15C'],
  alerts: ['Verificar espessura do tecido queratinizado', 'Avaliar sorriso gengival'],
  recommendations: ['Laser de diodo como alternativa', 'Controle em 30 dias'],
  ai_reason: 'Gengiva assimétrica detectada em DSD',
};

const sampleCementationProtocol: CementationProtocol = {
  preparation_steps: [{ order: 1, step: 'Limpeza', material: 'Pedra-pomes' }],
  ceramic_treatment: [{ order: 1, step: 'Ácido fluorídrico', material: 'HF 10%', time: '60s' }],
  tooth_treatment: [{ order: 1, step: 'Condicionamento', material: 'Ácido fosfórico 37%', time: '15s' }],
  cementation: {
    cement_type: 'Cimento resinoso fotopolimerizável',
    cement_brand: 'Variolink Esthetic LC',
    shade: 'Neutral',
    light_curing_time: '60s',
    technique: 'Remoção de excessos com pincel',
  },
  finishing: [{ order: 1, step: 'Polimento', material: 'Disco de feltro' }],
  post_operative: ['Checar oclusão em MIH', 'Controle em 7 dias'],
  checklist: ['Verificar adaptação marginal', 'Testar cor do try-in', 'Registrar oclusão'],
  alerts: ['Faceta com espessura mínima 0.3mm', 'Margem subgengival'],
  warnings: ['Paciente com bruxismo — considerar placa noturna'],
  confidence: 'alta',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeProtocol — null input', () => {
  it('should return sensible defaults when input is null', () => {
    const result = computeProtocol(null);

    expect(result.treatmentType).toBe('resina');
    expect(result.isPorcelain).toBe(false);
    expect(result.isSpecialTreatment).toBe(false);
    expect(result.cementationProtocol).toBeNull();
    expect(result.genericProtocol).toBeNull();
    expect(result.protocol).toBeNull();
    expect(result.layers).toEqual([]);
    expect(result.checklist).toEqual([]);
    expect(result.alerts).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe('média');
    expect(result.protocolAlternative).toBeUndefined();
    expect(result.resin).toBeNull();
    expect(result.hasProtocol).toBe(false);
    // currentTreatmentStyle should be the resina style (fallback)
    expect(result.currentTreatmentStyle.label).toBe('Restauração em Resina');
  });
});

describe('computeProtocol — resina treatment', () => {
  it('should compute protocol from stratification_protocol', () => {
    const eval_ = makeEval({
      treatment_type: 'resina',
      stratification_protocol: {
        layers: sampleLayers,
        checklist: ['Condicionamento ácido', 'Aplicar adesivo', 'Incrementos oblíquos'],
        confidence: 'alta',
        alternative: sampleAlternative,
      } as StratificationProtocol,
      alerts: ['Bruxismo detectado'],
      warnings: ['Classe IV — considerar opaquer'],
      resins: sampleResin,
    });

    const result = computeProtocol(eval_);

    expect(result.treatmentType).toBe('resina');
    expect(result.isPorcelain).toBe(false);
    expect(result.isSpecialTreatment).toBe(false);
    expect(result.layers).toEqual(sampleLayers);
    expect(result.layers).toHaveLength(3);
    expect(result.checklist).toEqual(['Condicionamento ácido', 'Aplicar adesivo', 'Incrementos oblíquos']);
    expect(result.alerts).toEqual(['Bruxismo detectado']);
    expect(result.warnings).toEqual(['Classe IV — considerar opaquer']);
    expect(result.confidence).toBe('alta');
    expect(result.protocolAlternative).toEqual(sampleAlternative);
    expect(result.resin).toEqual(sampleResin);
    expect(result.hasProtocol).toBe(true);
    expect(result.currentTreatmentStyle.label).toBe('Restauração em Resina');
  });

  it('should fall back to protocol_layers when stratification_protocol has no layers', () => {
    const fallbackLayers: ProtocolLayer[] = [
      { order: 1, name: 'Corpo', resin_brand: 'Charisma', shade: 'A3', thickness: '1.5mm', purpose: 'Corpo', technique: 'Bulk' },
    ];
    const eval_ = makeEval({
      treatment_type: 'resina',
      stratification_protocol: { checklist: ['Step 1'] } as StratificationProtocol,
      protocol_layers: fallbackLayers,
    });

    const result = computeProtocol(eval_);
    expect(result.layers).toEqual(fallbackLayers);
    expect(result.hasProtocol).toBe(true);
  });

  it('should fall back to protocol_layers when stratification_protocol is null', () => {
    const fallbackLayers: ProtocolLayer[] = [
      { order: 1, name: 'Único', resin_brand: 'IPS', shade: 'BL1', thickness: '2.0mm', purpose: 'Monolítica', technique: 'Bulk fill' },
    ];
    const eval_ = makeEval({
      treatment_type: 'resina',
      stratification_protocol: null,
      protocol_layers: fallbackLayers,
    });

    const result = computeProtocol(eval_);
    expect(result.layers).toEqual(fallbackLayers);
    expect(result.hasProtocol).toBe(true);
  });

  it('should report hasProtocol=false when no layers exist at all', () => {
    const eval_ = makeEval({
      treatment_type: 'resina',
      stratification_protocol: null,
      protocol_layers: null,
    });

    const result = computeProtocol(eval_);
    expect(result.layers).toEqual([]);
    expect(result.hasProtocol).toBe(false);
  });

  it('should report hasProtocol=false for empty layers array', () => {
    const eval_ = makeEval({
      treatment_type: 'resina',
      stratification_protocol: { layers: [] } as StratificationProtocol,
      protocol_layers: [],
    });

    const result = computeProtocol(eval_);
    expect(result.layers).toEqual([]);
    expect(result.hasProtocol).toBe(false);
  });
});

describe('computeProtocol — porcelana treatment', () => {
  it('should derive all fields from cementation_protocol', () => {
    const eval_ = makeEval({
      treatment_type: 'porcelana',
      cementation_protocol: sampleCementationProtocol,
      // These should be IGNORED for porcelana:
      stratification_protocol: {
        checklist: ['WRONG checklist'],
        confidence: 'baixa',
      } as StratificationProtocol,
      alerts: ['WRONG alert'],
      warnings: ['WRONG warning'],
    });

    const result = computeProtocol(eval_);

    expect(result.treatmentType).toBe('porcelana');
    expect(result.isPorcelain).toBe(true);
    expect(result.isSpecialTreatment).toBe(false);
    expect(result.cementationProtocol).toEqual(sampleCementationProtocol);
    expect(result.checklist).toEqual(sampleCementationProtocol.checklist);
    expect(result.alerts).toEqual(sampleCementationProtocol.alerts);
    expect(result.warnings).toEqual(sampleCementationProtocol.warnings);
    expect(result.confidence).toBe('alta');
    expect(result.hasProtocol).toBe(true);
    expect(result.currentTreatmentStyle.label).toBe('Faceta de Porcelana');
  });

  it('should return empty arrays when cementation_protocol fields are missing', () => {
    const eval_ = makeEval({
      treatment_type: 'porcelana',
      cementation_protocol: {} as CementationProtocol,
    });

    const result = computeProtocol(eval_);

    expect(result.checklist).toEqual([]);
    expect(result.alerts).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe('média');
    // Empty object is truthy, so hasProtocol = true
    expect(result.hasProtocol).toBe(true);
  });

  it('should report hasProtocol=false when cementation_protocol is null', () => {
    const eval_ = makeEval({
      treatment_type: 'porcelana',
      cementation_protocol: null,
    });

    const result = computeProtocol(eval_);
    expect(result.hasProtocol).toBe(false);
  });
});

describe('computeProtocol — special treatment types', () => {
  const specialTypes = ['implante', 'coroa', 'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'];

  it.each(specialTypes)('should flag %s as isSpecialTreatment=true', (type) => {
    const eval_ = makeEval({ treatment_type: type });
    const result = computeProtocol(eval_);

    expect(result.treatmentType).toBe(type);
    expect(result.isSpecialTreatment).toBe(true);
    expect(result.isPorcelain).toBe(false);
  });

  it('should derive checklist and alerts from generic_protocol', () => {
    const eval_ = makeEval({
      treatment_type: 'gengivoplastia',
      generic_protocol: sampleGenericProtocol,
      // These should be IGNORED for special treatments with generic_protocol:
      alerts: ['WRONG alert from eval'],
    });

    const result = computeProtocol(eval_);

    expect(result.genericProtocol).toEqual(sampleGenericProtocol);
    expect(result.checklist).toEqual(sampleGenericProtocol.checklist);
    expect(result.alerts).toEqual(sampleGenericProtocol.alerts);
    expect(result.hasProtocol).toBe(true);
  });

  it('should fall back to stratification checklist when generic_protocol is null', () => {
    const eval_ = makeEval({
      treatment_type: 'implante',
      generic_protocol: null,
      stratification_protocol: { checklist: ['Fallback checklist item'] } as StratificationProtocol,
      alerts: ['Eval-level alert'],
    });

    const result = computeProtocol(eval_);

    // When generic_protocol is null, checklist falls through to protocol?.checklist
    expect(result.checklist).toEqual(['Fallback checklist item']);
    // Alerts also fall through to eval_.alerts
    expect(result.alerts).toEqual(['Eval-level alert']);
    expect(result.hasProtocol).toBe(false); // hasProtocol checks !!genericProtocol for special
  });

  it('should derive warnings from eval (not generic_protocol) for special treatments', () => {
    const eval_ = makeEval({
      treatment_type: 'endodontia',
      generic_protocol: {
        treatment_type: 'endodontia',
        tooth: '46',
        summary: 'Canal',
        checklist: [],
        alerts: [],
        recommendations: [],
      },
      warnings: ['Paciente com alergia ao hipoclorito'],
    });

    const result = computeProtocol(eval_);

    // Warnings for non-porcelana always come from eval_.warnings
    expect(result.warnings).toEqual(['Paciente com alergia ao hipoclorito']);
  });

  it('should return correct style for each special treatment', () => {
    const expectedLabels: Record<string, string> = {
      implante: 'Indicação de Implante',
      coroa: 'Coroa Protética',
      endodontia: 'Tratamento de Canal',
      encaminhamento: 'Encaminhamento',
      gengivoplastia: 'Gengivoplastia Estética',
      recobrimento_radicular: 'Recobrimento Radicular',
    };

    for (const type of specialTypes) {
      const result = computeProtocol(makeEval({ treatment_type: type }));
      expect(result.currentTreatmentStyle.label).toBe(expectedLabels[type]);
    }
  });
});

describe('computeProtocol — treatment_type defaults and edge cases', () => {
  it('should default to resina when treatment_type is null', () => {
    const eval_ = makeEval({ treatment_type: null });
    const result = computeProtocol(eval_);

    expect(result.treatmentType).toBe('resina');
    expect(result.isPorcelain).toBe(false);
    expect(result.isSpecialTreatment).toBe(false);
  });

  it('should default to resina when treatment_type is undefined', () => {
    const eval_ = makeEval({ treatment_type: undefined });
    const result = computeProtocol(eval_);

    expect(result.treatmentType).toBe('resina');
  });

  it('should default to resina when treatment_type is empty string', () => {
    const eval_ = makeEval({ treatment_type: '' });
    const result = computeProtocol(eval_);

    expect(result.treatmentType).toBe('resina');
  });

  it('should fall back treatment style to resina for unknown treatment type', () => {
    const eval_ = makeEval({ treatment_type: 'tratamento_desconhecido' });
    const result = computeProtocol(eval_);

    // getTreatmentStyle falls back to resina for unknown types
    expect(result.currentTreatmentStyle.label).toBe('Restauração em Resina');
  });
});

describe('computeProtocol — alternative strategy', () => {
  it('should extract alternative from stratification_protocol', () => {
    const eval_ = makeEval({
      stratification_protocol: {
        layers: sampleLayers,
        alternative: sampleAlternative,
      } as StratificationProtocol,
    });

    const result = computeProtocol(eval_);
    expect(result.protocolAlternative).toEqual(sampleAlternative);
    expect(result.protocolAlternative!.resin).toBe('IPS Empress Direct');
    expect(result.protocolAlternative!.shade).toBe('A2');
    expect(result.protocolAlternative!.technique).toBe('Bulk fill simplificada');
    expect(result.protocolAlternative!.tradeoff).toBe('Menos estético, mais rápido');
  });

  it('should return undefined when no alternative exists', () => {
    const eval_ = makeEval({
      stratification_protocol: {
        layers: sampleLayers,
      } as StratificationProtocol,
    });

    const result = computeProtocol(eval_);
    expect(result.protocolAlternative).toBeUndefined();
  });

  it('should return undefined when stratification_protocol is null', () => {
    const eval_ = makeEval({ stratification_protocol: null });
    const result = computeProtocol(eval_);
    expect(result.protocolAlternative).toBeUndefined();
  });
});

describe('computeProtocol — resin data', () => {
  it('should pass through resin when present', () => {
    const eval_ = makeEval({ resins: sampleResin });
    const result = computeProtocol(eval_);

    expect(result.resin).toEqual(sampleResin);
    expect(result.resin!.name).toBe('Filtek Z350 XT');
    expect(result.resin!.manufacturer).toBe('3M');
  });

  it('should return null resin when resins is null', () => {
    const eval_ = makeEval({ resins: null });
    const result = computeProtocol(eval_);
    expect(result.resin).toBeNull();
  });

  it('should return null resin when resins is undefined', () => {
    const eval_ = makeEval({});
    delete (eval_ as Record<string, unknown>).resins;
    const result = computeProtocol(eval_);
    expect(result.resin).toBeNull();
  });
});

describe('computeProtocol — step-by-step extraction (layers)', () => {
  it('should preserve layer order and all fields', () => {
    const eval_ = makeEval({
      stratification_protocol: { layers: sampleLayers } as StratificationProtocol,
    });

    const result = computeProtocol(eval_);

    expect(result.layers).toHaveLength(3);

    expect(result.layers[0].order).toBe(1);
    expect(result.layers[0].name).toBe('Dentina');
    expect(result.layers[0].resin_brand).toBe('Z350 XT');
    expect(result.layers[0].shade).toBe('A2B');
    expect(result.layers[0].thickness).toBe('1.0mm');
    expect(result.layers[0].purpose).toBe('Corpo');
    expect(result.layers[0].technique).toBe('Incremental oblíqua');
    expect(result.layers[0].optional).toBe(false);

    expect(result.layers[1].order).toBe(2);
    expect(result.layers[1].name).toBe('Esmalte');
    expect(result.layers[1].shade).toBe('A2E');

    expect(result.layers[2].order).toBe(3);
    expect(result.layers[2].name).toBe('Efeitos');
    expect(result.layers[2].optional).toBe(true);
  });

  it('should handle single-layer protocol', () => {
    const singleLayer: ProtocolLayer[] = [
      { order: 1, name: 'Corpo único', resin_brand: 'Charisma', shade: 'A3', thickness: '2.0mm', purpose: 'Monocromática', technique: 'Bulk fill' },
    ];
    const eval_ = makeEval({
      stratification_protocol: { layers: singleLayer } as StratificationProtocol,
    });

    const result = computeProtocol(eval_);
    expect(result.layers).toHaveLength(1);
    expect(result.hasProtocol).toBe(true);
  });
});

describe('computeProtocol — confidence levels', () => {
  it.each(['alta', 'média', 'baixa'] as const)('should pass through confidence "%s" for resina', (confidence) => {
    const eval_ = makeEval({
      treatment_type: 'resina',
      stratification_protocol: { confidence } as StratificationProtocol,
    });

    const result = computeProtocol(eval_);
    expect(result.confidence).toBe(confidence);
  });

  it.each(['alta', 'média', 'baixa'] as const)('should pass through confidence "%s" for porcelana', (confidence) => {
    const eval_ = makeEval({
      treatment_type: 'porcelana',
      cementation_protocol: { ...sampleCementationProtocol, confidence },
    });

    const result = computeProtocol(eval_);
    expect(result.confidence).toBe(confidence);
  });

  it('should default to "média" when resina protocol has no confidence', () => {
    const eval_ = makeEval({
      treatment_type: 'resina',
      stratification_protocol: {} as StratificationProtocol,
    });

    const result = computeProtocol(eval_);
    expect(result.confidence).toBe('média');
  });
});

describe('computeProtocol — edge case: all optional fields missing', () => {
  it('should handle an evaluation with only treatment_type set', () => {
    const result = computeProtocol({
      treatment_type: 'resina',
    });

    expect(result.treatmentType).toBe('resina');
    expect(result.isPorcelain).toBe(false);
    expect(result.isSpecialTreatment).toBe(false);
    expect(result.cementationProtocol).toBeNull();
    expect(result.genericProtocol).toBeNull();
    expect(result.protocol).toBeNull();
    expect(result.layers).toEqual([]);
    expect(result.checklist).toEqual([]);
    expect(result.alerts).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe('média');
    expect(result.protocolAlternative).toBeUndefined();
    expect(result.resin).toBeNull();
    expect(result.hasProtocol).toBe(false);
  });

  it('should handle an empty object (no fields at all)', () => {
    const result = computeProtocol({});

    expect(result.treatmentType).toBe('resina');
    expect(result.layers).toEqual([]);
    expect(result.checklist).toEqual([]);
    expect(result.alerts).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe('média');
    expect(result.resin).toBeNull();
    expect(result.hasProtocol).toBe(false);
  });
});

describe('computeProtocol — budget levels (premium vs standard)', () => {
  it('should compute identical structure regardless of budget — budget is upstream concern', () => {
    // Budget level (premium vs standard) is an upstream concern that affects which
    // protocol AI generates. computeProtocol is agnostic — it reads whatever protocol
    // data is provided. We verify this by showing that two different protocols (one
    // with more layers = premium, one with fewer = standard) both compute correctly.

    const premiumEval = makeEval({
      treatment_type: 'resina',
      stratification_protocol: {
        layers: sampleLayers, // 3 layers including optional Efeitos
        checklist: ['Premium step 1', 'Premium step 2'],
        confidence: 'alta',
        alternative: sampleAlternative,
      } as StratificationProtocol,
      resins: sampleResin,
    });

    const standardEval = makeEval({
      treatment_type: 'resina',
      stratification_protocol: {
        layers: [sampleLayers[0], sampleLayers[1]], // 2 layers — no Efeitos
        checklist: ['Standard step 1'],
        confidence: 'média',
      } as StratificationProtocol,
      resins: sampleResin,
    });

    const premiumResult = computeProtocol(premiumEval);
    const standardResult = computeProtocol(standardEval);

    // Premium has more layers and an alternative
    expect(premiumResult.layers).toHaveLength(3);
    expect(premiumResult.protocolAlternative).toBeDefined();
    expect(premiumResult.confidence).toBe('alta');

    // Standard has fewer layers and no alternative
    expect(standardResult.layers).toHaveLength(2);
    expect(standardResult.protocolAlternative).toBeUndefined();
    expect(standardResult.confidence).toBe('média');

    // Both share structural properties
    expect(premiumResult.treatmentType).toBe(standardResult.treatmentType);
    expect(premiumResult.isPorcelain).toBe(standardResult.isPorcelain);
    expect(premiumResult.hasProtocol).toBe(true);
    expect(standardResult.hasProtocol).toBe(true);
  });
});

describe('computeProtocol — return type completeness', () => {
  it('should return all ProtocolComputed fields', () => {
    const result = computeProtocol(null);

    // Verify all expected keys are present
    const expectedKeys: (keyof ProtocolComputed)[] = [
      'treatmentType',
      'isPorcelain',
      'isSpecialTreatment',
      'cementationProtocol',
      'genericProtocol',
      'protocol',
      'layers',
      'checklist',
      'alerts',
      'warnings',
      'confidence',
      'protocolAlternative',
      'resin',
      'hasProtocol',
      'currentTreatmentStyle',
    ];

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }

    // Verify no extra keys leaked in
    expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
  });
});
