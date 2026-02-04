import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatDateTime, formatTime, formatRelativeTime } from '../date';

describe('formatDate', () => {
  describe('short format (default)', () => {
    it('should format Date object', () => {
      const date = new Date(2026, 0, 15); // Jan 15, 2026
      expect(formatDate(date)).toBe('15/01/2026');
    });

    it('should format ISO string', () => {
      // Use ISO with time to avoid timezone issues
      expect(formatDate('2026-06-20T12:00:00')).toBe('20/06/2026');
    });

    it('should format timestamp', () => {
      const timestamp = new Date(2026, 5, 20).getTime();
      expect(formatDate(timestamp)).toMatch(/20\/06\/2026/);
    });
  });

  describe('medium format', () => {
    it('should format with short month name', () => {
      const date = new Date(2026, 0, 15);
      const result = formatDate(date, { format: 'medium' });
      expect(result).toMatch(/15.*jan.*2026/i);
    });
  });

  describe('long format', () => {
    it('should format with full month name', () => {
      const date = new Date(2026, 0, 15);
      const result = formatDate(date, { format: 'long' });
      expect(result).toMatch(/15.*janeiro.*2026/i);
    });
  });

  describe('locale support', () => {
    it('should format with en-US locale', () => {
      const date = new Date(2026, 0, 15);
      const result = formatDate(date, { locale: 'en-US' });
      expect(result).toBe('01/15/2026');
    });
  });

  describe('invalid dates', () => {
    it('should return dash for invalid date', () => {
      expect(formatDate('invalid')).toBe('-');
    });

    it('should return dash for invalid string', () => {
      expect(formatDate('not-a-date')).toBe('-');
    });
  });
});

describe('formatDateTime', () => {
  describe('short format (default)', () => {
    it('should format date and time', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      const result = formatDateTime(date);
      expect(result).toMatch(/15\/01\/2026/);
      expect(result).toMatch(/14:30/);
    });
  });

  describe('medium format', () => {
    it('should format with short month and time', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      const result = formatDateTime(date, { format: 'medium' });
      expect(result).toMatch(/jan/i);
      expect(result).toMatch(/14:30/);
    });
  });

  describe('long format', () => {
    it('should format with full month, time, and seconds', () => {
      const date = new Date(2026, 0, 15, 14, 30, 45);
      const result = formatDateTime(date, { format: 'long' });
      expect(result).toMatch(/janeiro/i);
      expect(result).toMatch(/14:30:45/);
    });
  });

  describe('locale support', () => {
    it('should format with en-US locale', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      const result = formatDateTime(date, { locale: 'en-US' });
      expect(result).toMatch(/01\/15\/2026/);
    });
  });

  describe('invalid dates', () => {
    it('should return dash for invalid date', () => {
      expect(formatDateTime('invalid')).toBe('-');
    });
  });
});

describe('formatTime', () => {
  describe('default (no seconds)', () => {
    it('should format time without seconds', () => {
      const date = new Date(2026, 0, 15, 14, 30, 45);
      expect(formatTime(date)).toBe('14:30');
    });

    it('should format from timestamp', () => {
      const date = new Date(2026, 0, 15, 9, 5);
      expect(formatTime(date)).toBe('09:05');
    });
  });

  describe('with seconds', () => {
    it('should format time with seconds', () => {
      const date = new Date(2026, 0, 15, 14, 30, 45);
      expect(formatTime(date, { showSeconds: true })).toBe('14:30:45');
    });
  });

  describe('locale support', () => {
    it('should format with en-US locale', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      const result = formatTime(date, { locale: 'en-US' });
      expect(result).toMatch(/2:30|14:30/); // 12h or 24h depending on locale
    });
  });

  describe('invalid dates', () => {
    it('should return dash for invalid date', () => {
      expect(formatTime('invalid')).toBe('-');
    });
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('seconds', () => {
    it('should format seconds ago', () => {
      const date = new Date(Date.now() - 30000); // 30 seconds ago
      const result = formatRelativeTime(date);
      expect(result).toMatch(/30|segundo/i);
    });
  });

  describe('minutes', () => {
    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60000); // 5 minutes ago
      const result = formatRelativeTime(date);
      expect(result).toMatch(/5|minuto/i);
    });
  });

  describe('hours', () => {
    it('should format hours ago', () => {
      const date = new Date(Date.now() - 2 * 3600000); // 2 hours ago
      const result = formatRelativeTime(date);
      expect(result).toMatch(/2|hora/i);
    });
  });

  describe('days', () => {
    it('should format days ago', () => {
      const date = new Date(Date.now() - 3 * 86400000); // 3 days ago
      const result = formatRelativeTime(date);
      expect(result).toMatch(/3|dia/i);
    });
  });

  describe('months', () => {
    it('should format months ago', () => {
      const date = new Date(Date.now() - 45 * 86400000); // ~1.5 months ago
      const result = formatRelativeTime(date);
      expect(result).toMatch(/mês|mes/i);
    });
  });

  describe('years', () => {
    it('should format years ago', () => {
      const date = new Date(Date.now() - 400 * 86400000); // ~1 year ago
      const result = formatRelativeTime(date);
      expect(result).toMatch(/ano/i);
    });
  });

  describe('future dates', () => {
    it('should format future time', () => {
      const date = new Date(Date.now() + 2 * 3600000); // 2 hours from now
      const result = formatRelativeTime(date);
      expect(result).toMatch(/2|hora/i);
    });
  });

  describe('locale support', () => {
    it('should format with en-US locale', () => {
      const date = new Date(Date.now() - 2 * 3600000);
      const result = formatRelativeTime(date, { locale: 'en-US' });
      expect(result).toMatch(/2|hour/i);
    });
  });

  describe('invalid dates', () => {
    it('should return dash for invalid date', () => {
      expect(formatRelativeTime('invalid')).toBe('-');
    });
  });
});
