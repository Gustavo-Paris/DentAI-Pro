import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateAge, formatDateBR, toISODateString, getDateFormat, getDateLocale } from '../date-utils';
import { ptBR, enUS } from 'date-fns/locale';

// =============================================================================
// Mock i18n — controls i18n.language for getDateLocale / getDateFormat
// =============================================================================
let mockLanguage = 'pt-BR';

vi.mock('@/lib/i18n', () => ({
  default: {
    get language() {
      return mockLanguage;
    },
  },
}));

// =============================================================================
// getDateLocale
// =============================================================================
describe('getDateLocale', () => {
  it('should return ptBR locale for pt-BR language', () => {
    mockLanguage = 'pt-BR';
    expect(getDateLocale()).toBe(ptBR);
  });

  it('should return enUS locale for en-US language', () => {
    mockLanguage = 'en-US';
    expect(getDateLocale()).toBe(enUS);
  });

  it('should return enUS locale for any "en" prefix', () => {
    mockLanguage = 'en';
    expect(getDateLocale()).toBe(enUS);
  });

  it('should return ptBR locale for non-English languages', () => {
    mockLanguage = 'es-ES';
    expect(getDateLocale()).toBe(ptBR);
  });

  it('should return ptBR when language is undefined', () => {
    mockLanguage = undefined as unknown as string;
    // i18n.language?.startsWith('en') will be undefined → falsy → ptBR
    expect(getDateLocale()).toBe(ptBR);
  });
});

// =============================================================================
// getDateFormat
// =============================================================================
describe('getDateFormat', () => {
  describe('when language is pt-BR', () => {
    beforeEach(() => { mockLanguage = 'pt-BR'; });

    it('should return Brazilian short format', () => {
      expect(getDateFormat('short')).toBe("d 'de' MMM");
    });

    it('should return Brazilian medium format', () => {
      expect(getDateFormat('medium')).toBe("d 'de' MMM, yyyy");
    });

    it('should return Brazilian long format', () => {
      expect(getDateFormat('long')).toBe("d 'de' MMMM 'de' yyyy");
    });

    it('should return Brazilian greeting format', () => {
      expect(getDateFormat('greeting')).toBe("EEEE, d 'de' MMMM");
    });
  });

  describe('when language is en-US', () => {
    beforeEach(() => { mockLanguage = 'en-US'; });

    it('should return English short format', () => {
      expect(getDateFormat('short')).toBe('MMM d');
    });

    it('should return English medium format', () => {
      expect(getDateFormat('medium')).toBe('MMM d, yyyy');
    });

    it('should return English long format', () => {
      expect(getDateFormat('long')).toBe('MMMM d, yyyy');
    });

    it('should return English greeting format', () => {
      expect(getDateFormat('greeting')).toBe('EEEE, MMMM d');
    });
  });
});

// =============================================================================
// calculateAge (additional coverage beyond dateUtils.test.ts)
// =============================================================================
describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-26'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate age when birthday already passed this year', () => {
    expect(calculateAge('1990-01-15')).toBe(36);
  });

  it('should calculate age when birthday has not yet occurred this year', () => {
    expect(calculateAge('1990-12-31')).toBe(35);
  });

  it('should calculate age on the exact birthday', () => {
    expect(calculateAge('1990-02-26')).toBe(36);
  });

  it('should return 0 for a date earlier this year', () => {
    expect(calculateAge('2026-01-01')).toBe(0);
  });
});

// =============================================================================
// formatDateBR
// =============================================================================
describe('formatDateBR', () => {
  beforeEach(() => { mockLanguage = 'pt-BR'; });

  it('should format YYYY-MM-DD directly without timezone issues', () => {
    expect(formatDateBR('2025-01-27')).toBe('27/01/2025');
  });

  it('should handle single-digit day/month with leading zeros', () => {
    expect(formatDateBR('2025-03-05')).toBe('05/03/2025');
  });

  it('should format ISO datetime string (with time)', () => {
    const result = formatDateBR('2024-12-25T10:00:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should format end-of-year date correctly', () => {
    expect(formatDateBR('2025-12-31')).toBe('31/12/2025');
  });

  it('should format leap day correctly', () => {
    expect(formatDateBR('2024-02-29')).toBe('29/02/2024');
  });
});

// =============================================================================
// toISODateString
// =============================================================================
describe('toISODateString', () => {
  it('should return YYYY-MM-DD format', () => {
    const date = new Date('2026-02-26T15:30:00Z');
    expect(toISODateString(date)).toBe('2026-02-26');
  });

  it('should not include time component', () => {
    const date = new Date('2025-06-15T23:59:59Z');
    const result = toISODateString(date);
    expect(result).not.toContain('T');
    expect(result).not.toContain(':');
  });

  it('should match YYYY-MM-DD pattern', () => {
    const date = new Date('2024-01-01');
    const result = toISODateString(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
