import { describe, it, expect } from 'vitest';
import { formatCurrency, centsToDecimal, decimalToCents } from '../currency';

describe('formatCurrency', () => {
  describe('BRL formatting (default)', () => {
    it('should format cents to BRL', () => {
      expect(formatCurrency(1999)).toBe('R$\u00a019,99');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('R$\u00a00,00');
    });

    it('should format large amounts', () => {
      expect(formatCurrency(1234567)).toBe('R$\u00a012.345,67');
    });

    it('should format single digit cents', () => {
      expect(formatCurrency(5)).toBe('R$\u00a00,05');
    });

    it('should format negative values', () => {
      expect(formatCurrency(-1999)).toBe('-R$\u00a019,99');
    });
  });

  describe('USD formatting', () => {
    it('should format cents to USD', () => {
      expect(formatCurrency(1999, { locale: 'en-US', currency: 'USD' })).toBe('$19.99');
    });

    it('should format large USD amounts', () => {
      expect(formatCurrency(123456789, { locale: 'en-US', currency: 'USD' })).toBe('$1,234,567.89');
    });
  });

  describe('fromCents option', () => {
    it('should format from decimal when fromCents is false', () => {
      expect(formatCurrency(19.99, { fromCents: false })).toBe('R$\u00a019,99');
    });

    it('should format integer decimal', () => {
      expect(formatCurrency(100, { fromCents: false })).toBe('R$\u00a0100,00');
    });
  });

  describe('edge cases', () => {
    it('should handle very small amounts', () => {
      expect(formatCurrency(1)).toBe('R$\u00a00,01');
    });

    it('should handle amounts with rounding', () => {
      // 0.005 * 100 = 0.5, which rounds to 1 cent
      expect(formatCurrency(0.5, { fromCents: false })).toBe('R$\u00a00,50');
    });
  });
});

describe('centsToDecimal', () => {
  it('should convert cents to decimal', () => {
    expect(centsToDecimal(1999)).toBe(19.99);
  });

  it('should handle zero', () => {
    expect(centsToDecimal(0)).toBe(0);
  });

  it('should handle single cent', () => {
    expect(centsToDecimal(1)).toBe(0.01);
  });

  it('should handle large amounts', () => {
    expect(centsToDecimal(1000000)).toBe(10000);
  });

  it('should handle negative values', () => {
    expect(centsToDecimal(-500)).toBe(-5);
  });
});

describe('decimalToCents', () => {
  it('should convert decimal to cents', () => {
    expect(decimalToCents(19.99)).toBe(1999);
  });

  it('should handle zero', () => {
    expect(decimalToCents(0)).toBe(0);
  });

  it('should handle whole numbers', () => {
    expect(decimalToCents(100)).toBe(10000);
  });

  it('should round floating point errors', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(decimalToCents(0.1 + 0.2)).toBe(30);
  });

  it('should round to nearest cent', () => {
    expect(decimalToCents(19.999)).toBe(2000);
    expect(decimalToCents(19.994)).toBe(1999);
  });

  it('should handle negative values', () => {
    expect(decimalToCents(-5.5)).toBe(-550);
  });
});
