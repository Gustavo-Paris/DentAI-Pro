import { describe, it, expect } from 'vitest';
import { interpolateHref, hasInterpolation, extractInterpolationKeys } from '../interpolate';

describe('interpolateHref', () => {
  describe('basic interpolation', () => {
    it('should interpolate a single parameter', () => {
      expect(interpolateHref('/users/:id', { id: '123' })).toBe('/users/123');
    });

    it('should interpolate multiple parameters', () => {
      expect(interpolateHref('/users/:userId/posts/:postId', { userId: '1', postId: '2' })).toBe(
        '/users/1/posts/2'
      );
    });

    it('should handle numeric values', () => {
      expect(interpolateHref('/items/:count', { count: 42 })).toBe('/items/42');
    });

    it('should handle string without parameters', () => {
      expect(interpolateHref('/static/path', { id: '123' })).toBe('/static/path');
    });
  });

  describe('nested paths', () => {
    it('should interpolate nested object values', () => {
      expect(interpolateHref('/users/:user.id', { user: { id: '456' } })).toBe('/users/456');
    });

    it('should handle deeply nested paths', () => {
      const data = { a: { b: { c: 'deep' } } };
      expect(interpolateHref('/path/:a.b.c', data)).toBe('/path/deep');
    });

    it('should handle mixed simple and nested params', () => {
      expect(
        interpolateHref('/users/:user.id/posts/:postId', {
          user: { id: '123' },
          postId: '456',
        })
      ).toBe('/users/123/posts/456');
    });
  });

  describe('missing values', () => {
    it('should keep original pattern for missing params', () => {
      expect(interpolateHref('/users/:id', {})).toBe('/users/:id');
    });

    it('should keep pattern for undefined values', () => {
      expect(interpolateHref('/users/:id', { id: undefined })).toBe('/users/:id');
    });

    it('should keep pattern for missing nested paths', () => {
      expect(interpolateHref('/users/:user.id', { user: {} })).toBe('/users/:user.id');
    });

    it('should keep pattern when parent is missing', () => {
      expect(interpolateHref('/users/:user.id', {})).toBe('/users/:user.id');
    });
  });

  describe('edge cases', () => {
    it('should handle null data gracefully', () => {
      expect(interpolateHref('/users/:id', null as unknown as object)).toBe('/users/:id');
    });

    it('should interpolate zero as valid value', () => {
      expect(interpolateHref('/items/:index', { index: 0 })).toBe('/items/0');
    });

    it('should interpolate empty string', () => {
      expect(interpolateHref('/items/:name', { name: '' })).toBe('/items/');
    });

    it('should handle params at start', () => {
      expect(interpolateHref(':prefix/path', { prefix: 'api' })).toBe('api/path');
    });

    it('should handle params at end', () => {
      expect(interpolateHref('/path/:suffix', { suffix: 'end' })).toBe('/path/end');
    });

    it('should handle consecutive params', () => {
      expect(interpolateHref('/:a/:b', { a: 'first', b: 'second' })).toBe('/first/second');
    });
  });
});

describe('hasInterpolation', () => {
  it('should return true for string with params', () => {
    expect(hasInterpolation('/users/:id')).toBe(true);
  });

  it('should return true for nested params', () => {
    expect(hasInterpolation('/users/:user.id')).toBe(true);
  });

  it('should return false for static strings', () => {
    expect(hasInterpolation('/users/123')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasInterpolation('')).toBe(false);
  });

  it('should return false for colon without valid param name', () => {
    expect(hasInterpolation('/path:123')).toBe(false);
  });

  it('should return true for param with underscores', () => {
    expect(hasInterpolation('/users/:user_id')).toBe(true);
  });
});

describe('extractInterpolationKeys', () => {
  it('should extract single key', () => {
    expect(extractInterpolationKeys('/users/:id')).toEqual(['id']);
  });

  it('should extract multiple keys', () => {
    expect(extractInterpolationKeys('/users/:userId/posts/:postId')).toEqual(['userId', 'postId']);
  });

  it('should extract nested keys', () => {
    expect(extractInterpolationKeys('/users/:user.id')).toEqual(['user.id']);
  });

  it('should return empty array for no params', () => {
    expect(extractInterpolationKeys('/static/path')).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(extractInterpolationKeys('')).toEqual([]);
  });

  it('should extract keys with underscores', () => {
    expect(extractInterpolationKeys('/items/:item_id/:sub_item_id')).toEqual([
      'item_id',
      'sub_item_id',
    ]);
  });
});
