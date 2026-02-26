import { describe, it, expect } from 'vitest';
import {
  treatmentConfig,
  treatmentStyles,
  getTreatmentConfig,
  getTreatmentStyle,
  normalizeTreatmentType,
  isSpecialTreatmentType,
  formatToothLabel,
  SPECIAL_TREATMENT_TYPES,
  type TreatmentType,
} from '../treatment-config';

// =============================================================================
// All canonical treatment type keys
// =============================================================================
const ALL_TYPES: TreatmentType[] = [
  'resina', 'porcelana', 'coroa', 'implante',
  'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular',
];

// =============================================================================
// treatmentConfig record
// =============================================================================
describe('treatmentConfig', () => {
  it('should have entries for every canonical treatment type', () => {
    for (const type of ALL_TYPES) {
      expect(treatmentConfig[type]).toBeDefined();
    }
  });

  it('should have required string fields for each entry', () => {
    for (const type of ALL_TYPES) {
      const cfg = treatmentConfig[type];
      expect(typeof cfg.label).toBe('string');
      expect(typeof cfg.shortLabel).toBe('string');
      expect(typeof cfg.labelKey).toBe('string');
      expect(typeof cfg.shortLabelKey).toBe('string');
      expect(cfg.label.length).toBeGreaterThan(0);
      expect(cfg.shortLabel.length).toBeGreaterThan(0);
    }
  });

  it('should mark only resina as showCavityInfo=true', () => {
    expect(treatmentConfig.resina.showCavityInfo).toBe(true);
    for (const type of ALL_TYPES.filter(t => t !== 'resina')) {
      expect(treatmentConfig[type].showCavityInfo).toBe(false);
    }
  });

  it('should have valid variant values', () => {
    const validVariants = ['default', 'secondary', 'destructive', 'outline'];
    for (const type of ALL_TYPES) {
      expect(validVariants).toContain(treatmentConfig[type].variant);
    }
  });
});

// =============================================================================
// treatmentStyles record
// =============================================================================
describe('treatmentStyles', () => {
  it('should have entries for every canonical treatment type', () => {
    for (const type of ALL_TYPES) {
      expect(treatmentStyles[type]).toBeDefined();
    }
  });

  it('should have required styling fields for each entry', () => {
    for (const type of ALL_TYPES) {
      const style = treatmentStyles[type];
      expect(typeof style.label).toBe('string');
      expect(typeof style.labelKey).toBe('string');
      expect(typeof style.bgClass).toBe('string');
      expect(typeof style.borderClass).toBe('string');
      expect(typeof style.iconClass).toBe('string');
      expect(typeof style.ringClass).toBe('string');
      expect(typeof style.solidBgClass).toBe('string');
      expect(typeof style.glowClass).toBe('string');
      expect(typeof style.overlayColor).toBe('string');
    }
  });

  it('should have valid badgeVariant values', () => {
    const validVariants = ['default', 'secondary', 'outline', 'destructive'];
    for (const type of ALL_TYPES) {
      expect(validVariants).toContain(treatmentStyles[type].badgeVariant);
    }
  });

  it('should have overlayColor in rgba() format', () => {
    for (const type of ALL_TYPES) {
      expect(treatmentStyles[type].overlayColor).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
    }
  });
});

// =============================================================================
// getTreatmentConfig
// =============================================================================
describe('getTreatmentConfig', () => {
  it('should return correct config for a valid treatment type', () => {
    expect(getTreatmentConfig('resina')).toBe(treatmentConfig.resina);
    expect(getTreatmentConfig('porcelana')).toBe(treatmentConfig.porcelana);
    expect(getTreatmentConfig('gengivoplastia')).toBe(treatmentConfig.gengivoplastia);
  });

  it('should fall back to resina for null', () => {
    expect(getTreatmentConfig(null)).toBe(treatmentConfig.resina);
  });

  it('should fall back to resina for undefined', () => {
    expect(getTreatmentConfig(undefined)).toBe(treatmentConfig.resina);
  });

  it('should fall back to resina for empty string', () => {
    expect(getTreatmentConfig('')).toBe(treatmentConfig.resina);
  });

  it('should fall back to resina for an unknown type', () => {
    expect(getTreatmentConfig('unknown_type')).toBe(treatmentConfig.resina);
  });
});

// =============================================================================
// getTreatmentStyle
// =============================================================================
describe('getTreatmentStyle', () => {
  it('should return correct style for a valid treatment type', () => {
    expect(getTreatmentStyle('resina')).toBe(treatmentStyles.resina);
    expect(getTreatmentStyle('coroa')).toBe(treatmentStyles.coroa);
    expect(getTreatmentStyle('recobrimento_radicular')).toBe(treatmentStyles.recobrimento_radicular);
  });

  it('should fall back to resina for null', () => {
    expect(getTreatmentStyle(null)).toBe(treatmentStyles.resina);
  });

  it('should fall back to resina for undefined', () => {
    expect(getTreatmentStyle(undefined)).toBe(treatmentStyles.resina);
  });

  it('should fall back to resina for empty string', () => {
    expect(getTreatmentStyle('')).toBe(treatmentStyles.resina);
  });

  it('should fall back to resina for an unknown type', () => {
    expect(getTreatmentStyle('nonexistent')).toBe(treatmentStyles.resina);
  });
});

// =============================================================================
// normalizeTreatmentType
// =============================================================================
describe('normalizeTreatmentType', () => {
  it('should return Portuguese keys unchanged (lowercase)', () => {
    expect(normalizeTreatmentType('resina')).toBe('resina');
    expect(normalizeTreatmentType('porcelana')).toBe('porcelana');
    expect(normalizeTreatmentType('coroa')).toBe('coroa');
    expect(normalizeTreatmentType('implante')).toBe('implante');
    expect(normalizeTreatmentType('endodontia')).toBe('endodontia');
    expect(normalizeTreatmentType('encaminhamento')).toBe('encaminhamento');
    expect(normalizeTreatmentType('gengivoplastia')).toBe('gengivoplastia');
    expect(normalizeTreatmentType('recobrimento_radicular')).toBe('recobrimento_radicular');
  });

  it('should normalize English keys to Portuguese', () => {
    expect(normalizeTreatmentType('porcelain')).toBe('porcelana');
    expect(normalizeTreatmentType('resin')).toBe('resina');
    expect(normalizeTreatmentType('crown')).toBe('coroa');
    expect(normalizeTreatmentType('implant')).toBe('implante');
    expect(normalizeTreatmentType('endodontics')).toBe('endodontia');
    expect(normalizeTreatmentType('referral')).toBe('encaminhamento');
    expect(normalizeTreatmentType('gingivoplasty')).toBe('gengivoplastia');
    expect(normalizeTreatmentType('root_coverage')).toBe('recobrimento_radicular');
  });

  it('should be case-insensitive', () => {
    expect(normalizeTreatmentType('RESINA')).toBe('resina');
    expect(normalizeTreatmentType('Porcelain')).toBe('porcelana');
    expect(normalizeTreatmentType('CROWN')).toBe('coroa');
    expect(normalizeTreatmentType('Implante')).toBe('implante');
    expect(normalizeTreatmentType('ROOT_COVERAGE')).toBe('recobrimento_radicular');
  });

  it('should return lowercase raw value for unknown types', () => {
    expect(normalizeTreatmentType('unknown')).toBe('unknown');
    expect(normalizeTreatmentType('SOMETHING')).toBe('something');
  });
});

// =============================================================================
// isSpecialTreatmentType
// =============================================================================
describe('isSpecialTreatmentType', () => {
  it('should return true for all special treatment types', () => {
    expect(isSpecialTreatmentType('implante')).toBe(true);
    expect(isSpecialTreatmentType('coroa')).toBe(true);
    expect(isSpecialTreatmentType('endodontia')).toBe(true);
    expect(isSpecialTreatmentType('encaminhamento')).toBe(true);
    expect(isSpecialTreatmentType('gengivoplastia')).toBe(true);
    expect(isSpecialTreatmentType('recobrimento_radicular')).toBe(true);
  });

  it('should return false for resina (uses resin stratification)', () => {
    expect(isSpecialTreatmentType('resina')).toBe(false);
  });

  it('should return false for porcelana (not in special list)', () => {
    expect(isSpecialTreatmentType('porcelana')).toBe(false);
  });

  it('should return false for unknown types', () => {
    expect(isSpecialTreatmentType('unknown')).toBe(false);
  });
});

// =============================================================================
// SPECIAL_TREATMENT_TYPES
// =============================================================================
describe('SPECIAL_TREATMENT_TYPES', () => {
  it('should contain exactly 6 types', () => {
    expect(SPECIAL_TREATMENT_TYPES).toHaveLength(6);
  });

  it('should not include resina or porcelana', () => {
    expect(SPECIAL_TREATMENT_TYPES).not.toContain('resina');
    expect(SPECIAL_TREATMENT_TYPES).not.toContain('porcelana');
  });
});

// =============================================================================
// formatToothLabel
// =============================================================================
describe('formatToothLabel', () => {
  it('should return "Gengiva" for GENGIVO tooth without translation function', () => {
    expect(formatToothLabel('GENGIVO')).toBe('Gengiva');
  });

  it('should return "Dente <number>" for numbered teeth without translation function', () => {
    expect(formatToothLabel('11')).toBe('Dente 11');
    expect(formatToothLabel('21')).toBe('Dente 21');
    expect(formatToothLabel('48')).toBe('Dente 48');
  });

  it('should use translation function for GENGIVO when provided', () => {
    const t = (key: string) => {
      if (key === 'toothLabel.gingiva') return 'Gingiva (translated)';
      return key;
    };
    expect(formatToothLabel('GENGIVO', t)).toBe('Gingiva (translated)');
  });

  it('should use translation function for numbered teeth when provided', () => {
    const t = (key: string, opts?: Record<string, unknown>) => {
      if (key === 'toothLabel.tooth') return `Tooth #${opts?.number}`;
      return key;
    };
    expect(formatToothLabel('11', t)).toBe('Tooth #11');
  });
});
