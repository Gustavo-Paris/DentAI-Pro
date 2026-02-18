import { describe, it, expect } from 'vitest';
import { calculateComplexity } from '../complexity-score';
import type { DetectedTooth } from '@/components/wizard/ReviewAnalysisStep';

// ---------------------------------------------------------------------------
// Helper to create a minimal DetectedTooth
// ---------------------------------------------------------------------------

function makeTooth(overrides?: Partial<DetectedTooth>): DetectedTooth {
  return {
    tooth: '11',
    tooth_region: 'anterior-superior',
    cavity_class: null,
    restoration_size: null,
    substrate: null,
    substrate_condition: null,
    enamel_condition: null,
    depth: null,
    priority: 'baixa',
    notes: null,
    treatment_indication: 'resina',
    indication_reason: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateComplexity', () => {
  it('should return simples with score 0 for empty teeth array', () => {
    const result = calculateComplexity([]);
    expect(result).toEqual({ level: 'simples', score: 0 });
  });

  it('should return simples with score 0 for null/undefined input', () => {
    const result = calculateComplexity(null as unknown as DetectedTooth[]);
    expect(result).toEqual({ level: 'simples', score: 0 });
  });

  it('should return simples for single tooth with minimal complexity', () => {
    const result = calculateComplexity([makeTooth()]);
    expect(result.level).toBe('simples');
    expect(result.score).toBeLessThanOrEqual(4);
  });

  // ---------------------------------------------------------------------------
  // Boundary tests: simples <= 4, moderado 5-10, complexo >= 11
  // ---------------------------------------------------------------------------

  it('should return simples when score is exactly 4', () => {
    // priority 'média' (1) + cavity_class 'IV' (2) + 1 tooth (no multi-tooth bonus) = 3
    // Need score=4: priority 'média' (1) + cavity_class 'IV' (2) + restoration_size 'Média' (0) + depth null (0) = 3
    // Actually: 1 tooth with priority 'alta' (3) + nothing else = 3
    // 1 tooth with priority 'alta' (3) + priority 'média' for tooth 2...
    // Let's use: 2 teeth with priority 'média' (1+1=2) + one 'IV' class (2) = 4 (no multi-tooth bonus since 2 <= 2)
    const teeth = [
      makeTooth({ priority: 'média', cavity_class: 'Classe IV' }),
      makeTooth({ tooth: '12', priority: 'média' }),
    ];
    const result = calculateComplexity(teeth);
    expect(result.score).toBe(4);
    expect(result.level).toBe('simples');
  });

  it('should return moderado when score is exactly 5', () => {
    // 2 teeth: priority 'média' (1) + cavity_class 'IV' (2) + priority 'média' (1) + cavity_class 'V' (2) = 6
    // That's 6. Let's try: 1 tooth with priority 'alta' (3) + cavity_class 'IV' (2) = 5
    const teeth = [
      makeTooth({ priority: 'alta', cavity_class: 'Classe IV' }),
    ];
    const result = calculateComplexity(teeth);
    expect(result.score).toBe(5);
    expect(result.level).toBe('moderado');
  });

  it('should return moderado when score is exactly 10', () => {
    // 3 teeth: multi-tooth bonus (2) + we need 8 more points
    // 3x priority 'média' (3) + 1x cavity_class 'IV' (2) + 1x restoration_size 'grande' (2) + nothing = 7 + 2 = 9
    // Let's construct: 1 tooth alta (3) + Classe IV (2) + grande (2) + profunda (2) = 9 (1 tooth, no bonus)
    // Need 10: 1 tooth alta (3) + Classe IV (2) + grande (2) + profunda (2) = 9. Need 1 more: média (1) + a second tooth
    // 2 teeth: alta (3) + IV (2) + grande (2) + média (1) + V (2) = 10 (2 teeth, no multi-tooth bonus)
    const teeth = [
      makeTooth({ priority: 'alta', cavity_class: 'Classe IV', restoration_size: 'grande' }),
      makeTooth({ tooth: '12', priority: 'média', cavity_class: 'Classe V' }),
    ];
    const result = calculateComplexity(teeth);
    expect(result.score).toBe(10);
    expect(result.level).toBe('moderado');
  });

  it('should return complexo when score is exactly 11', () => {
    // Same as above (10) + add 1 more: use 3 teeth for multi-tooth bonus (+2)
    // 3 teeth: alta (3) + IV (2) + grande (2) + média (1) + baixa (0) + multi-tooth (2) = 10
    // Need 11: alta (3) + IV (2) + grande (2) + média (1) + V (2) + 3rd tooth + multi-tooth (2) = 12
    // Try: alta (3) + IV (2) + média (1) + baixa (0) + baixa (0) + multi-tooth (2) = 8. Not 11.
    // Let's be precise: alta (3) + grande (2) + profunda (2) + média (1) + média (1) + multi-tooth (2) = 11
    const teeth = [
      makeTooth({ priority: 'alta', restoration_size: 'grande', depth: 'profunda' }),
      makeTooth({ tooth: '12', priority: 'média' }),
      makeTooth({ tooth: '13', priority: 'média' }),
    ];
    const result = calculateComplexity(teeth);
    expect(result.score).toBe(11);
    expect(result.level).toBe('complexo');
  });

  // ---------------------------------------------------------------------------
  // Individual scoring factors
  // ---------------------------------------------------------------------------

  it('should add 2 for Classe IV cavity', () => {
    const base = calculateComplexity([makeTooth()]);
    const withIV = calculateComplexity([makeTooth({ cavity_class: 'Classe IV' })]);
    expect(withIV.score - base.score).toBe(2);
  });

  it('should add 2 for Classe V cavity', () => {
    const base = calculateComplexity([makeTooth()]);
    const withV = calculateComplexity([makeTooth({ cavity_class: 'Classe V' })]);
    expect(withV.score - base.score).toBe(2);
  });

  it('should add 2 for "grande" restoration size', () => {
    const base = calculateComplexity([makeTooth()]);
    const withGrande = calculateComplexity([makeTooth({ restoration_size: 'grande' })]);
    expect(withGrande.score - base.score).toBe(2);
  });

  it('should add 2 for "extensa" restoration size', () => {
    const base = calculateComplexity([makeTooth()]);
    const withExtensa = calculateComplexity([makeTooth({ restoration_size: 'extensa' })]);
    expect(withExtensa.score - base.score).toBe(2);
  });

  it('should add 2 for "profunda" depth', () => {
    const base = calculateComplexity([makeTooth()]);
    const withProfunda = calculateComplexity([makeTooth({ depth: 'profunda' })]);
    expect(withProfunda.score - base.score).toBe(2);
  });

  it('should add 3 for "coroa" treatment', () => {
    const base = calculateComplexity([makeTooth()]);
    const withCoroa = calculateComplexity([makeTooth({ treatment_indication: 'coroa' as DetectedTooth['treatment_indication'] })]);
    expect(withCoroa.score - base.score).toBe(3);
  });

  it('should add 3 for "implante" treatment', () => {
    const base = calculateComplexity([makeTooth()]);
    const withImplante = calculateComplexity([makeTooth({ treatment_indication: 'implante' as DetectedTooth['treatment_indication'] })]);
    expect(withImplante.score - base.score).toBe(3);
  });

  it('should add 3 for "endodontia" treatment', () => {
    const base = calculateComplexity([makeTooth()]);
    const withEndo = calculateComplexity([makeTooth({ treatment_indication: 'endodontia' as DetectedTooth['treatment_indication'] })]);
    expect(withEndo.score - base.score).toBe(3);
  });

  it('should add 4 for "encaminhamento" treatment', () => {
    const base = calculateComplexity([makeTooth()]);
    const withEnc = calculateComplexity([makeTooth({ treatment_indication: 'encaminhamento' as DetectedTooth['treatment_indication'] })]);
    expect(withEnc.score - base.score).toBe(4);
  });

  it('should add 3 for priority "alta"', () => {
    const base = calculateComplexity([makeTooth({ priority: 'baixa' })]);
    const withAlta = calculateComplexity([makeTooth({ priority: 'alta' })]);
    expect(withAlta.score - base.score).toBe(3);
  });

  it('should add 1 for priority "média"', () => {
    const base = calculateComplexity([makeTooth({ priority: 'baixa' })]);
    const withMedia = calculateComplexity([makeTooth({ priority: 'média' })]);
    expect(withMedia.score - base.score).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Multi-tooth bonus
  // ---------------------------------------------------------------------------

  it('should add multi-tooth bonus (+2) for 3+ teeth', () => {
    const twoTeeth = calculateComplexity([
      makeTooth({ tooth: '11' }),
      makeTooth({ tooth: '12' }),
    ]);
    const threeTeeth = calculateComplexity([
      makeTooth({ tooth: '11' }),
      makeTooth({ tooth: '12' }),
      makeTooth({ tooth: '13' }),
    ]);
    expect(threeTeeth.score - twoTeeth.score).toBe(2);
  });

  it('should not add multi-tooth bonus for 2 teeth', () => {
    const oneTooth = calculateComplexity([makeTooth({ tooth: '11' })]);
    const twoTeeth = calculateComplexity([
      makeTooth({ tooth: '11' }),
      makeTooth({ tooth: '12' }),
    ]);
    // Both teeth have same base stats (priority 'baixa' = 0), so 2 teeth = 0+0=0, 1 tooth = 0
    expect(twoTeeth.score).toBe(oneTooth.score * 2);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('should handle case-insensitive cavity class matching', () => {
    const result = calculateComplexity([makeTooth({ cavity_class: 'classe iv' })]);
    // toUpperCase is applied — should detect IV
    expect(result.score).toBe(2);
  });

  it('should not add restoration bonus for "média" or "pequena"', () => {
    const withMedia = calculateComplexity([makeTooth({ restoration_size: 'média' })]);
    const withPequena = calculateComplexity([makeTooth({ restoration_size: 'pequena' })]);
    expect(withMedia.score).toBe(0);
    expect(withPequena.score).toBe(0);
  });

  it('should not add depth bonus for "rasa" or "média"', () => {
    const withRasa = calculateComplexity([makeTooth({ depth: 'rasa' })]);
    const withMedia = calculateComplexity([makeTooth({ depth: 'média' })]);
    expect(withRasa.score).toBe(0);
    expect(withMedia.score).toBe(0);
  });
});
