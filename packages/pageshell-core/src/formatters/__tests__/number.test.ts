import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCompactNumber,
  formatPercent,
  formatBoolean,
  formatDuration,
} from '../number';

describe('formatNumber', () => {
  describe('default locale (pt-BR)', () => {
    it('should format integer', () => {
      expect(formatNumber(1234567)).toBe('1.234.567');
    });

    it('should format decimal', () => {
      expect(formatNumber(1234.56)).toBe('1.234,56');
    });

    it('should format zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should format negative number', () => {
      expect(formatNumber(-1234.56)).toBe('-1.234,56');
    });
  });

  describe('en-US locale', () => {
    it('should format with US separators', () => {
      expect(formatNumber(1234567.89, { locale: 'en-US' })).toBe('1,234,567.89');
    });
  });

  describe('fraction digits', () => {
    it('should format with minimum fraction digits', () => {
      expect(formatNumber(100, { minimumFractionDigits: 2 })).toBe('100,00');
    });

    it('should format with maximum fraction digits', () => {
      expect(formatNumber(100.12345, { maximumFractionDigits: 2 })).toBe('100,12');
    });

    it('should format with both min and max fraction digits', () => {
      const result = formatNumber(100.1, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      expect(result).toBe('100,10');
    });
  });
});

describe('formatCompactNumber', () => {
  describe('default locale (pt-BR)', () => {
    it('should format thousands', () => {
      const result = formatCompactNumber(1500);
      expect(result).toMatch(/1,5.*mil|1\.5.*mil/i);
    });

    it('should format millions', () => {
      const result = formatCompactNumber(1500000);
      expect(result).toMatch(/1,5.*mi|1\.5.*mi/i);
    });

    it('should format small numbers without compact notation', () => {
      expect(formatCompactNumber(100)).toBe('100');
    });

    it('should format zero', () => {
      expect(formatCompactNumber(0)).toBe('0');
    });
  });

  describe('en-US locale', () => {
    it('should format with K suffix', () => {
      const result = formatCompactNumber(1500, { locale: 'en-US' });
      expect(result).toMatch(/1\.5K|1,5K/i);
    });

    it('should format with M suffix', () => {
      const result = formatCompactNumber(1500000, { locale: 'en-US' });
      expect(result).toMatch(/1\.5M|1,5M/i);
    });
  });
});

describe('formatPercent', () => {
  describe('default (multiply = true)', () => {
    it('should format decimal as percent', () => {
      expect(formatPercent(0.75)).toBe('75%');
    });

    it('should format 100%', () => {
      expect(formatPercent(1)).toBe('100%');
    });

    it('should format 0%', () => {
      expect(formatPercent(0)).toBe('0%');
    });
  });

  describe('with decimals', () => {
    it('should format with 1 decimal', () => {
      expect(formatPercent(0.756, { decimals: 1 })).toBe('75,6%');
    });

    it('should format with 2 decimals', () => {
      expect(formatPercent(0.7567, { decimals: 2 })).toBe('75,67%');
    });
  });

  describe('multiply = false', () => {
    it('should not multiply when multiply is false', () => {
      expect(formatPercent(75, { multiply: false })).toBe('75%');
    });
  });

  describe('en-US locale', () => {
    it('should format with US locale', () => {
      expect(formatPercent(0.756, { locale: 'en-US', decimals: 1 })).toBe('75.6%');
    });
  });
});

describe('formatBoolean', () => {
  describe('default locale (pt-BR)', () => {
    it('should format true as Sim', () => {
      expect(formatBoolean(true)).toBe('Sim');
    });

    it('should format false as Não', () => {
      expect(formatBoolean(false)).toBe('Não');
    });

    it('should format truthy values as Sim', () => {
      expect(formatBoolean(1)).toBe('Sim');
      expect(formatBoolean('text')).toBe('Sim');
      expect(formatBoolean({})).toBe('Sim');
    });

    it('should format falsy values as Não', () => {
      expect(formatBoolean(0)).toBe('Não');
      expect(formatBoolean('')).toBe('Não');
      expect(formatBoolean(null)).toBe('Não');
      expect(formatBoolean(undefined)).toBe('Não');
    });
  });

  describe('en locale', () => {
    it('should format true as Yes', () => {
      expect(formatBoolean(true, { locale: 'en' })).toBe('Yes');
    });

    it('should format false as No', () => {
      expect(formatBoolean(false, { locale: 'en' })).toBe('No');
    });
  });

  describe('custom labels', () => {
    it('should use custom true label', () => {
      expect(formatBoolean(true, { trueLabel: 'Active' })).toBe('Active');
    });

    it('should use custom false label', () => {
      expect(formatBoolean(false, { falseLabel: 'Inactive' })).toBe('Inactive');
    });

    it('should use both custom labels', () => {
      expect(formatBoolean(true, { trueLabel: 'On', falseLabel: 'Off' })).toBe('On');
      expect(formatBoolean(false, { trueLabel: 'On', falseLabel: 'Off' })).toBe('Off');
    });
  });
});

describe('formatDuration', () => {
  describe('seconds only', () => {
    it('should format seconds', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('should format zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('minutes and seconds', () => {
    it('should format minutes and seconds', () => {
      expect(formatDuration(65)).toBe('1m 5s');
    });

    it('should format minutes only when no remaining seconds', () => {
      expect(formatDuration(120)).toBe('2m');
    });
  });

  describe('hours, minutes, and seconds', () => {
    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3661)).toBe('1h 1m 1s');
    });

    it('should format hours only', () => {
      expect(formatDuration(7200)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3720)).toBe('1h 2m');
    });

    it('should format hours and seconds', () => {
      expect(formatDuration(3605)).toBe('1h 5s');
    });
  });

  describe('large durations', () => {
    it('should format many hours', () => {
      expect(formatDuration(86400)).toBe('24h'); // 24 hours
    });
  });

  describe('edge cases', () => {
    it('should return dash for negative values', () => {
      expect(formatDuration(-1)).toBe('-');
    });

    it('should handle fractional seconds', () => {
      expect(formatDuration(65.7)).toBe('1m 5s');
    });
  });
});
