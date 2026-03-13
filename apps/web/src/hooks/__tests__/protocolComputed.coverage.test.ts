import { describe, it, expect } from 'vitest';
import { computeProtocol } from '@/hooks/domain/protocolComputed';

// ---------------------------------------------------------------------------
// Tests that import directly from the source file for coverage
// ---------------------------------------------------------------------------

describe('computeProtocol (imported from source)', () => {
  it('should return defaults when evaluation is null', () => {
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
    expect(result.resin).toBeNull();
    expect(result.hasProtocol).toBe(false);
    expect(result.currentTreatmentStyle).toBeDefined();
    expect(result.protocolAlternative).toBeUndefined();
  });

  it('should detect porcelana treatment', () => {
    const result = computeProtocol({ treatment_type: 'porcelana' });
    expect(result.treatmentType).toBe('porcelana');
    expect(result.isPorcelain).toBe(true);
    expect(result.isSpecialTreatment).toBe(false);
  });

  it('should detect special treatment types', () => {
    for (const type of ['implante', 'coroa', 'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular']) {
      const result = computeProtocol({ treatment_type: type });
      expect(result.isSpecialTreatment).toBe(true);
      expect(result.isPorcelain).toBe(false);
    }
  });

  it('should extract resina protocol layers from stratification_protocol', () => {
    const layers = [
      { order: 1, resin_brand: 'Z350', shade: 'A2B' },
      { order: 2, resin_brand: 'Z350', shade: 'A2E' },
    ];
    const result = computeProtocol({
      treatment_type: 'resina',
      stratification_protocol: {
        layers,
        checklist: ['Step1', 'Step2'],
        confidence: 'alta',
        alternative: { description: 'Bulk fill' },
      },
      alerts: ['Alert1'],
      warnings: ['Warn1'],
      resins: { id: 'r1', name: 'Z350', manufacturer: '3M', shade: 'A2', brand: 'Filtek', product_line: 'Z350 XT', type: 'esmalte', opacity: 'translucido' },
    });
    expect(result.layers).toEqual(layers);
    expect(result.checklist).toEqual(['Step1', 'Step2']);
    expect(result.confidence).toBe('alta');
    expect(result.alerts).toEqual(['Alert1']);
    expect(result.warnings).toEqual(['Warn1']);
    expect(result.hasProtocol).toBe(true);
    expect(result.resin).toBeTruthy();
    expect(result.protocolAlternative).toEqual({ description: 'Bulk fill' });
  });

  it('should fall back to protocol_layers when stratification_protocol has no layers', () => {
    const fallbackLayers = [{ order: 1, resin_brand: 'Charisma', shade: 'A3' }];
    const result = computeProtocol({
      treatment_type: 'resina',
      stratification_protocol: {},
      protocol_layers: fallbackLayers,
    });
    expect(result.layers).toEqual(fallbackLayers);
    expect(result.hasProtocol).toBe(true);
  });

  it('should return empty layers when both are null', () => {
    const result = computeProtocol({
      treatment_type: 'resina',
      stratification_protocol: null,
      protocol_layers: null,
    });
    expect(result.layers).toEqual([]);
    expect(result.hasProtocol).toBe(false);
  });

  it('should use cementation protocol data for porcelana', () => {
    const result = computeProtocol({
      treatment_type: 'porcelana',
      cementation_protocol: {
        checklist: ['Prep', 'Cement'],
        alerts: ['Check occlusion'],
        warnings: ['Post-op sensitivity'],
        confidence: 'alta',
      },
      alerts: ['Should not use'],
      warnings: ['Should not use either'],
    });
    expect(result.checklist).toEqual(['Prep', 'Cement']);
    expect(result.alerts).toEqual(['Check occlusion']);
    expect(result.warnings).toEqual(['Post-op sensitivity']);
    expect(result.confidence).toBe('alta');
    expect(result.hasProtocol).toBe(true);
  });

  it('should return false hasProtocol for porcelana without cementation', () => {
    const result = computeProtocol({
      treatment_type: 'porcelana',
      cementation_protocol: null,
    });
    expect(result.hasProtocol).toBe(false);
  });

  it('should use generic protocol data for special treatments', () => {
    const genericProtocol = {
      treatment_type: 'gengivoplastia',
      tooth: 'GENGIVO',
      summary: 'Gengivoplastia',
      checklist: ['Anesthesia', 'Incision'],
      alerts: ['Gingival alert'],
      recommendations: ['Rec1'],
    };
    const result = computeProtocol({
      treatment_type: 'gengivoplastia',
      generic_protocol: genericProtocol,
      alerts: ['Should not use'],
    });
    expect(result.checklist).toEqual(['Anesthesia', 'Incision']);
    expect(result.alerts).toEqual(['Gingival alert']);
    expect(result.hasProtocol).toBe(true);
  });

  it('should return false hasProtocol for special treatment without generic protocol', () => {
    const result = computeProtocol({
      treatment_type: 'implante',
      generic_protocol: null,
    });
    expect(result.hasProtocol).toBe(false);
  });

  it('should default treatment_type to resina when null', () => {
    const result = computeProtocol({ treatment_type: null });
    expect(result.treatmentType).toBe('resina');
  });

  it('should return currentTreatmentStyle matching treatment type', () => {
    const result = computeProtocol({ treatment_type: 'porcelana' });
    expect(result.currentTreatmentStyle).toBeDefined();
    expect(result.currentTreatmentStyle.labelKey).toBe('treatmentStyles.porcelana');
  });

  it('should default confidence to media when protocol has none', () => {
    const result = computeProtocol({
      treatment_type: 'resina',
      stratification_protocol: {},
    });
    expect(result.confidence).toBe('média');
  });

  it('should consider hasProtocol true for resina with genericProtocol and no layers', () => {
    const result = computeProtocol({
      treatment_type: 'resina',
      stratification_protocol: null,
      protocol_layers: null,
      generic_protocol: {
        treatment_type: 'resina',
        tooth: '11',
        summary: 'Fallback protocol',
        checklist: ['Step'],
        alerts: [],
        recommendations: [],
      },
    });
    expect(result.hasProtocol).toBe(true);
  });
});
