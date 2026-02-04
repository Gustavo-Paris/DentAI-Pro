import { describe, it, expect } from 'vitest';
import { formatValue, getNestedValue } from '../value';

describe('formatValue', () => {
  describe('null and undefined handling', () => {
    it('should return empty value for null', () => {
      expect(formatValue(null, 'text')).toBe('—');
    });

    it('should return empty value for undefined', () => {
      expect(formatValue(undefined, 'text')).toBe('—');
    });

    it('should use custom empty value', () => {
      expect(formatValue(null, 'text', { emptyValue: '-' })).toBe('-');
    });
  });

  describe('text format', () => {
    it('should convert value to string', () => {
      expect(formatValue('hello', 'text')).toBe('hello');
    });

    it('should convert number to string', () => {
      expect(formatValue(123, 'text')).toBe('123');
    });

    it('should handle default format', () => {
      expect(formatValue('hello')).toBe('hello');
    });
  });

  describe('date format', () => {
    it('should format Date object', () => {
      const date = new Date(2026, 0, 15);
      expect(formatValue(date, 'date')).toBe('15/01/2026');
    });

    it('should format date string', () => {
      // Use ISO with time to avoid timezone issues
      expect(formatValue('2026-06-20T12:00:00', 'date')).toBe('20/06/2026');
    });

    it('should format timestamp', () => {
      const timestamp = new Date(2026, 5, 20).getTime();
      expect(formatValue(timestamp, 'date')).toMatch(/20\/06\/2026/);
    });
  });

  describe('datetime format', () => {
    it('should format date and time', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      const result = formatValue(date, 'datetime');
      expect(result).toMatch(/15\/01\/2026/);
      expect(result).toMatch(/14:30/);
    });
  });

  describe('time format', () => {
    it('should format time only', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      expect(formatValue(date, 'time')).toBe('14:30');
    });
  });

  describe('currency format', () => {
    it('should format currency from cents', () => {
      expect(formatValue(1999, 'currency')).toBe('R$\u00a019,99');
    });

    it('should format string number as currency', () => {
      expect(formatValue('1999', 'currency')).toBe('R$\u00a019,99');
    });
  });

  describe('number format', () => {
    it('should format number with separators', () => {
      expect(formatValue(1234567, 'number')).toBe('1.234.567');
    });

    it('should format string as number', () => {
      expect(formatValue('1234.56', 'number')).toBe('1.234,56');
    });
  });

  describe('percent format', () => {
    it('should format decimal as percent', () => {
      expect(formatValue(0.75, 'percent')).toBe('75%');
    });
  });

  describe('duration format', () => {
    it('should format seconds as duration', () => {
      expect(formatValue(3661, 'duration')).toBe('1h 1m 1s');
    });

    it('should format string seconds as duration', () => {
      expect(formatValue('65', 'duration')).toBe('1m 5s');
    });
  });

  describe('boolean format', () => {
    it('should format true', () => {
      expect(formatValue(true, 'boolean')).toBe('Sim');
    });

    it('should format false', () => {
      expect(formatValue(false, 'boolean')).toBe('Não');
    });
  });

  describe('status format', () => {
    it('should return value as string', () => {
      expect(formatValue('active', 'status')).toBe('active');
    });
  });

  describe('badge format', () => {
    it('should return value as string', () => {
      expect(formatValue('premium', 'badge')).toBe('premium');
    });
  });

  describe('tags format', () => {
    it('should join array with commas', () => {
      expect(formatValue(['react', 'typescript', 'next'], 'tags')).toBe(
        'react, typescript, next'
      );
    });

    it('should handle single tag', () => {
      expect(formatValue(['react'], 'tags')).toBe('react');
    });

    it('should handle non-array as string', () => {
      expect(formatValue('single-tag', 'tags')).toBe('single-tag');
    });

    it('should handle empty array', () => {
      expect(formatValue([], 'tags')).toBe('');
    });
  });

  describe('options', () => {
    it('should use custom locale', () => {
      expect(formatValue(1234.56, 'number', { locale: 'en-US' })).toBe('1,234.56');
    });
  });
});

describe('getNestedValue', () => {
  describe('simple paths', () => {
    it('should get top-level value', () => {
      const obj = { name: 'John' };
      expect(getNestedValue(obj, 'name')).toBe('John');
    });

    it('should get nested value', () => {
      const obj = { user: { name: 'John' } };
      expect(getNestedValue(obj, 'user.name')).toBe('John');
    });

    it('should get deeply nested value', () => {
      const obj = { a: { b: { c: { d: 'deep' } } } };
      expect(getNestedValue(obj, 'a.b.c.d')).toBe('deep');
    });
  });

  describe('missing paths', () => {
    it('should return undefined for missing key', () => {
      const obj = { name: 'John' };
      expect(getNestedValue(obj, 'email')).toBeUndefined();
    });

    it('should return undefined for missing nested key', () => {
      const obj = { user: { name: 'John' } };
      expect(getNestedValue(obj, 'user.email')).toBeUndefined();
    });

    it('should return undefined for missing intermediate key', () => {
      const obj = { user: { name: 'John' } };
      expect(getNestedValue(obj, 'user.profile.email')).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should return undefined for null object', () => {
      expect(getNestedValue(null, 'name')).toBeUndefined();
    });

    it('should return undefined for undefined object', () => {
      expect(getNestedValue(undefined, 'name')).toBeUndefined();
    });

    it('should return undefined for non-object', () => {
      expect(getNestedValue('string', 'length')).toBeUndefined();
    });

    it('should return undefined for primitive in path', () => {
      const obj = { name: 'John' };
      expect(getNestedValue(obj, 'name.length')).toBeUndefined();
    });

    it('should handle null in path', () => {
      const obj = { user: null };
      expect(getNestedValue(obj, 'user.name')).toBeUndefined();
    });

    it('should handle array values', () => {
      const obj = { items: [1, 2, 3] };
      expect(getNestedValue(obj, 'items')).toEqual([1, 2, 3]);
    });

    it('should handle numeric keys for arrays', () => {
      const obj = { items: ['a', 'b', 'c'] };
      expect(getNestedValue(obj, 'items.1')).toBe('b');
    });
  });

  describe('value types', () => {
    it('should get number value', () => {
      const obj = { count: 42 };
      expect(getNestedValue(obj, 'count')).toBe(42);
    });

    it('should get boolean value', () => {
      const obj = { active: true };
      expect(getNestedValue(obj, 'active')).toBe(true);
    });

    it('should get false boolean', () => {
      const obj = { active: false };
      expect(getNestedValue(obj, 'active')).toBe(false);
    });

    it('should get zero number', () => {
      const obj = { count: 0 };
      expect(getNestedValue(obj, 'count')).toBe(0);
    });

    it('should get empty string', () => {
      const obj = { name: '' };
      expect(getNestedValue(obj, 'name')).toBe('');
    });

    it('should get object value', () => {
      const nested = { foo: 'bar' };
      const obj = { data: nested };
      expect(getNestedValue(obj, 'data')).toBe(nested);
    });
  });
});
