import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateAge, formatDateBR, toISODateString } from '../dateUtils';

describe('calculateAge', () => {
  beforeEach(() => {
    // Mock current date to 2025-01-27
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-27'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate age correctly for birthday already passed this year', () => {
    const age = calculateAge('1990-01-01');
    expect(age).toBe(35);
  });

  it('should calculate age correctly for birthday not yet passed this year', () => {
    const age = calculateAge('1990-12-31');
    expect(age).toBe(34);
  });

  it('should calculate age correctly for birthday today', () => {
    const age = calculateAge('1990-01-27');
    expect(age).toBe(35);
  });

  it('should calculate age correctly for birthday tomorrow', () => {
    const age = calculateAge('1990-01-28');
    expect(age).toBe(34);
  });

  it('should return 0 for baby born this year', () => {
    const age = calculateAge('2025-01-01');
    expect(age).toBe(0);
  });

  it('should handle leap year birthdays', () => {
    const age = calculateAge('2000-02-29');
    expect(age).toBe(24);
  });
});

describe('formatDateBR', () => {
  it('should format date to Brazilian format', () => {
    const formatted = formatDateBR('2025-01-27');
    expect(formatted).toBe('27/01/2025');
  });

  it('should format ISO date string', () => {
    const formatted = formatDateBR('2024-12-25T10:00:00Z');
    // Note: result depends on timezone, but should contain day/month/year
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should handle single digit day and month', () => {
    const formatted = formatDateBR('2025-03-05');
    expect(formatted).toBe('05/03/2025');
  });
});

describe('toISODateString', () => {
  it('should convert Date to ISO date string', () => {
    const date = new Date('2025-01-27T15:30:00Z');
    const isoString = toISODateString(date);
    expect(isoString).toBe('2025-01-27');
  });

  it('should only return date part without time', () => {
    const date = new Date('2024-06-15T23:59:59Z');
    const isoString = toISODateString(date);
    expect(isoString).not.toContain('T');
    expect(isoString).not.toContain(':');
  });

  it('should return consistent format YYYY-MM-DD', () => {
    const date = new Date('2025-03-05');
    const isoString = toISODateString(date);
    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
