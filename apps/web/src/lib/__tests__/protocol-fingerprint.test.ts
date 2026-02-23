import { describe, it, expect } from 'vitest';
import { SPECIAL_TREATMENT_TYPES } from '@/lib/treatment-config';
import { getProtocolFingerprint } from '../protocol-fingerprint';
import type { FingerprintableEvaluation } from '../protocol-fingerprint';

// ---------------------------------------------------------------------------
// Tests for the actual exported getProtocolFingerprint function
// ---------------------------------------------------------------------------

describe('getProtocolFingerprint', () => {
  it('should produce the same fingerprint for identical protocol data', () => {
    const eval1: FingerprintableEvaluation = {
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
        ],
      },
    };
    const eval2: FingerprintableEvaluation = {
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
        ],
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe(getProtocolFingerprint(eval2));
  });

  it('should produce different fingerprints for different layers', () => {
    const eval1: FingerprintableEvaluation = {
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
      },
    };
    const eval2: FingerprintableEvaluation = {
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [{ order: 1, resin_brand: 'Z350', shade: 'A3B' }],
      },
    };
    expect(getProtocolFingerprint(eval1)).not.toBe(getProtocolFingerprint(eval2));
  });

  it('should handle missing fields gracefully (no crash)', () => {
    expect(() => getProtocolFingerprint({})).not.toThrow();
    expect(() => getProtocolFingerprint({ treatment_type: null })).not.toThrow();
    expect(() => getProtocolFingerprint({ resins: null, stratification_protocol: null })).not.toThrow();
    expect(() => getProtocolFingerprint({ treatment_type: 'porcelana', cementation_protocol: null })).not.toThrow();
  });

  it('should default to resina when treatment_type is null/undefined', () => {
    const result = getProtocolFingerprint({ treatment_type: null, resins: null });
    expect(result).toBe('resina::no-resin');
  });

  it('should produce resina fingerprint with resin name and manufacturer', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'resina',
      resins: { name: 'Filtek Z350 XT', manufacturer: '3M' },
    });
    expect(result).toBe('resina::Filtek Z350 XT|3M');
  });

  it('should produce resina fingerprint with no-resin when resins is null', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'resina',
      resins: null,
    });
    expect(result).toBe('resina::no-resin');
  });

  it('should include sorted layers in resina fingerprint', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 3, resin_brand: 'Z350', shade: 'A2I' },
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2D' },
        ],
      },
    });
    expect(result).toBe('resina::Z350|3M::Z350:A2B|Z350:A2D|Z350:A2I');
  });

  it('should produce identical fingerprints regardless of layer input order', () => {
    const eval1: FingerprintableEvaluation = {
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
        ],
      },
    };
    const eval2: FingerprintableEvaluation = {
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
        ],
      },
    };
    expect(getProtocolFingerprint(eval1)).toBe(getProtocolFingerprint(eval2));
  });

  it('should not include layers when layers array is empty', () => {
    const result = getProtocolFingerprint({
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: { layers: [] },
    });
    expect(result).toBe('resina::Z350|3M');
  });

  // ---------------------------------------------------------------------------
  // Porcelana fingerprints
  // ---------------------------------------------------------------------------

  it('should produce porcelana fingerprint with cementation details', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: {
          cement_type: 'Resinoso',
          cement_brand: 'RelyX',
        },
      },
    });
    expect(result).toBe('porcelana::Resinoso::RelyX');
  });

  it('should produce simple porcelana fingerprint when no cementation protocol', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'porcelana',
      cementation_protocol: null,
    });
    expect(result).toBe('porcelana');
  });

  it('should produce simple porcelana fingerprint when no cementation property', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'porcelana',
      cementation_protocol: {},
    });
    expect(result).toBe('porcelana');
  });

  it('should handle porcelana with partial cementation (only type)', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: { cement_type: 'Resinoso' },
      },
    });
    expect(result).toBe('porcelana::Resinoso::');
  });

  it('should handle porcelana with partial cementation (only brand)', () => {
    const result = getProtocolFingerprint({
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: { cement_brand: 'RelyX' },
      },
    });
    expect(result).toBe('porcelana::::RelyX');
  });

  // ---------------------------------------------------------------------------
  // Generic/special treatments
  // ---------------------------------------------------------------------------

  it('should return treatment type as fingerprint for generic treatments', () => {
    for (const type of SPECIAL_TREATMENT_TYPES) {
      const result = getProtocolFingerprint({ treatment_type: type });
      expect(result).toBe(type);
    }
  });

  // ---------------------------------------------------------------------------
  // Resin-only vs cementation protocol
  // ---------------------------------------------------------------------------

  it('should produce different fingerprints for resin vs cementation protocol', () => {
    const resinFp = getProtocolFingerprint({
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
    });
    const porcelanaFp = getProtocolFingerprint({
      treatment_type: 'porcelana',
      cementation_protocol: {
        cementation: { cement_type: 'Resinoso', cement_brand: 'RelyX' },
      },
    });
    expect(resinFp).not.toBe(porcelanaFp);
  });
});
