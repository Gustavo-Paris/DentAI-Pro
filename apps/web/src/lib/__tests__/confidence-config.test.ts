import { describe, it, expect } from 'vitest';
import {
  confidenceConfig,
  normalizeConfidenceKey,
  getConfidenceConfig,
  type ConfidenceLevel,
} from '../confidence-config';

// =============================================================================
// All canonical confidence levels
// =============================================================================
const ALL_LEVELS: ConfidenceLevel[] = ['alta', 'media', 'baixa'];

// =============================================================================
// confidenceConfig record
// =============================================================================
describe('confidenceConfig', () => {
  it('should have entries for all three confidence levels', () => {
    for (const level of ALL_LEVELS) {
      expect(confidenceConfig[level]).toBeDefined();
    }
  });

  it('should have correct bar counts (alta=3, media=2, baixa=1)', () => {
    expect(confidenceConfig.alta.bars).toBe(3);
    expect(confidenceConfig.media.bars).toBe(2);
    expect(confidenceConfig.baixa.bars).toBe(1);
  });

  it('should have correct PDF labels', () => {
    expect(confidenceConfig.alta.pdfLabel).toBe('ALTA');
    expect(confidenceConfig.media.pdfLabel).toBe('MEDIA');
    expect(confidenceConfig.baixa.pdfLabel).toBe('BAIXA');
  });

  it('should have valid pdfColor as RGB tuple [r, g, b]', () => {
    for (const level of ALL_LEVELS) {
      const color = confidenceConfig[level].pdfColor;
      expect(color).toHaveLength(3);
      for (const component of color) {
        expect(component).toBeGreaterThanOrEqual(0);
        expect(component).toBeLessThanOrEqual(255);
      }
    }
  });

  it('should have valid pdfBgColor as RGB tuple [r, g, b]', () => {
    for (const level of ALL_LEVELS) {
      const color = confidenceConfig[level].pdfBgColor;
      expect(color).toHaveLength(3);
      for (const component of color) {
        expect(component).toBeGreaterThanOrEqual(0);
        expect(component).toBeLessThanOrEqual(255);
      }
    }
  });

  it('should have non-empty i18n keys', () => {
    for (const level of ALL_LEVELS) {
      const cfg = confidenceConfig[level];
      expect(cfg.labelKey.length).toBeGreaterThan(0);
      expect(cfg.descriptionKey.length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty pdfDescription', () => {
    for (const level of ALL_LEVELS) {
      expect(confidenceConfig[level].pdfDescription.length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty color/bg/border CSS classes', () => {
    for (const level of ALL_LEVELS) {
      const cfg = confidenceConfig[level];
      expect(cfg.color.length).toBeGreaterThan(0);
      expect(cfg.bg.length).toBeGreaterThan(0);
      expect(cfg.border.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// normalizeConfidenceKey
// =============================================================================
describe('normalizeConfidenceKey', () => {
  it('should return canonical keys unchanged', () => {
    expect(normalizeConfidenceKey('alta')).toBe('alta');
    expect(normalizeConfidenceKey('media')).toBe('media');
    expect(normalizeConfidenceKey('baixa')).toBe('baixa');
  });

  it('should be case-insensitive', () => {
    expect(normalizeConfidenceKey('ALTA')).toBe('alta');
    expect(normalizeConfidenceKey('Media')).toBe('media');
    expect(normalizeConfidenceKey('BAIXA')).toBe('baixa');
  });

  it('should handle accented "média" by stripping accent to "media"', () => {
    expect(normalizeConfidenceKey('média')).toBe('media');
    expect(normalizeConfidenceKey('Média')).toBe('media');
    expect(normalizeConfidenceKey('MÉDIA')).toBe('media');
  });

  it('should default to "media" for unknown values', () => {
    expect(normalizeConfidenceKey('unknown')).toBe('media');
    expect(normalizeConfidenceKey('')).toBe('media');
    expect(normalizeConfidenceKey('HIGH')).toBe('media');
    expect(normalizeConfidenceKey('low')).toBe('media');
  });
});

// =============================================================================
// getConfidenceConfig
// =============================================================================
describe('getConfidenceConfig', () => {
  it('should return the correct config for canonical keys', () => {
    expect(getConfidenceConfig('alta')).toBe(confidenceConfig.alta);
    expect(getConfidenceConfig('media')).toBe(confidenceConfig.media);
    expect(getConfidenceConfig('baixa')).toBe(confidenceConfig.baixa);
  });

  it('should handle accented "média"', () => {
    expect(getConfidenceConfig('média')).toBe(confidenceConfig.media);
  });

  it('should handle case variations', () => {
    expect(getConfidenceConfig('ALTA')).toBe(confidenceConfig.alta);
    expect(getConfidenceConfig('Baixa')).toBe(confidenceConfig.baixa);
  });

  it('should default to media config for unknown values', () => {
    expect(getConfidenceConfig('nonsense')).toBe(confidenceConfig.media);
  });

  it('should return config with the right icon, bars, and label for alta', () => {
    const cfg = getConfidenceConfig('alta');
    expect(cfg.bars).toBe(3);
    expect(cfg.pdfLabel).toBe('ALTA');
  });

  it('should return config with the right icon, bars, and label for baixa', () => {
    const cfg = getConfidenceConfig('baixa');
    expect(cfg.bars).toBe(1);
    expect(cfg.pdfLabel).toBe('BAIXA');
  });
});
