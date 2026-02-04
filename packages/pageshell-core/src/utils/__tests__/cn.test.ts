import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  describe('basic merging', () => {
    it('should combine multiple class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle single class name', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });
  });

  describe('Tailwind conflict resolution', () => {
    it('should resolve padding conflicts (later wins)', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should resolve margin conflicts', () => {
      expect(cn('mt-2', 'mt-4')).toBe('mt-4');
    });

    it('should resolve text color conflicts', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('px-2', 'py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should resolve background color conflicts', () => {
      expect(cn('bg-white', 'bg-gray-100')).toBe('bg-gray-100');
    });
  });

  describe('conditional classes', () => {
    it('should filter out false values', () => {
      expect(cn('base', false && 'hidden')).toBe('base');
    });

    it('should include true conditional values', () => {
      expect(cn('base', true && 'visible')).toBe('base visible');
    });

    it('should filter out undefined values', () => {
      expect(cn('base', undefined, 'end')).toBe('base end');
    });

    it('should filter out null values', () => {
      expect(cn('base', null, 'end')).toBe('base end');
    });

    it('should filter out empty strings', () => {
      expect(cn('base', '', 'end')).toBe('base end');
    });
  });

  describe('edge cases', () => {
    it('should handle arrays of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
    });

    it('should handle objects with boolean values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle mixed inputs', () => {
      expect(cn('base', ['arr'], { obj: true })).toBe('base arr obj');
    });
  });
});
