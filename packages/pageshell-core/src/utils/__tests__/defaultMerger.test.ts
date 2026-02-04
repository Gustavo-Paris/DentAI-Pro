import { describe, it, expect } from 'vitest';
import { mergeDefaults, applyDefaults } from '../defaultMerger';
import type { Transformer } from '../defaultMerger';

describe('mergeDefaults', () => {
  describe('basic merging', () => {
    it('should return defaults when user config is empty', () => {
      const defaults = { format: 'text', sortable: false };
      const result = mergeDefaults({}, defaults);
      expect(result).toEqual(defaults);
    });

    it('should override default with user value', () => {
      const defaults = { format: 'text', sortable: false };
      const userConfig = { sortable: true };
      const result = mergeDefaults(userConfig, defaults);
      expect(result).toEqual({ format: 'text', sortable: true });
    });

    it('should add new properties from user config', () => {
      const defaults = { format: 'text' };
      const userConfig = { key: 'name' } as Record<string, string>;
      const result = mergeDefaults(userConfig, defaults);
      expect(result).toEqual({ format: 'text', key: 'name' });
    });

    it('should handle multiple overrides', () => {
      const defaults = { a: 1, b: 2, c: 3 };
      const userConfig = { a: 10, c: 30 };
      const result = mergeDefaults(userConfig, defaults);
      expect(result).toEqual({ a: 10, b: 2, c: 30 });
    });
  });

  describe('undefined handling', () => {
    it('should not override defaults with undefined', () => {
      const defaults = { format: 'text', sortable: false };
      const userConfig = { format: undefined };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.format).toBe('text');
    });

    it('should preserve explicit undefined in user config when key exists', () => {
      const defaults = { format: 'text' };
      const userConfig = { format: undefined };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.format).toBe('text');
    });
  });

  describe('null handling', () => {
    it('should override defaults with null', () => {
      const defaults = { format: 'text', icon: 'star' as string | null };
      const userConfig = { icon: null };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.icon).toBeNull();
    });
  });

  describe('deep merging', () => {
    it('should deep merge nested objects', () => {
      type Config = {
        style: { color: string; size: string };
        label: string;
      };
      const defaults: Config = {
        style: { color: 'red', size: 'small' },
        label: 'Label',
      };
      const userConfig: Partial<Config> = {
        style: { color: 'blue', size: 'small' },
      };
      const result = mergeDefaults(userConfig, defaults);
      expect(result).toEqual({
        style: { color: 'blue', size: 'small' },
        label: 'Label',
      });
    });

    it('should deep merge multiple levels', () => {
      type Config = {
        a: { b: { c: number; d: number }; e: number };
      };
      const defaults: Config = {
        a: { b: { c: 1, d: 2 }, e: 3 },
      };
      const userConfig: Partial<Config> = {
        a: { b: { c: 10, d: 2 }, e: 3 },
      };
      const result = mergeDefaults(userConfig, defaults);
      expect(result).toEqual({
        a: { b: { c: 10, d: 2 }, e: 3 },
      });
    });

    it('should not merge arrays - replace instead', () => {
      const defaults = { tags: ['a', 'b', 'c'] };
      const userConfig = { tags: ['x', 'y'] };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.tags).toEqual(['x', 'y']);
    });
  });

  describe('array handling', () => {
    it('should replace array with user array', () => {
      const defaults = { items: [1, 2, 3] };
      const userConfig = { items: [4, 5] };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.items).toEqual([4, 5]);
    });

    it('should replace array with empty array', () => {
      const defaults = { items: [1, 2, 3] };
      const userConfig = { items: [] };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.items).toEqual([]);
    });

    it('should keep default array when not overridden', () => {
      const defaults = { items: [1, 2, 3] };
      const userConfig = {};
      const result = mergeDefaults(userConfig, defaults);
      expect(result.items).toEqual([1, 2, 3]);
    });
  });

  describe('transformers', () => {
    it('should apply transformer to value', () => {
      const defaults = { format: 'text', key: '' };
      const userConfig = { key: 'createdAt' };
      type D = typeof defaults;
      const transformers: Partial<Record<keyof D, Transformer<D, keyof D>>> = {
        format: (val, config) => (config.key?.endsWith('At') ? 'date' : val),
      };
      const result = mergeDefaults(userConfig, defaults, transformers);
      expect(result.format).toBe('date');
    });

    it('should apply transformer after merge', () => {
      const defaults = { value: 0, doubled: 0 };
      const userConfig = { value: 5 };
      type D = typeof defaults;
      const transformers: Partial<Record<keyof D, Transformer<D, keyof D>>> = {
        doubled: (_, config) => (config.value as number) * 2,
      };
      const result = mergeDefaults(userConfig, defaults, transformers);
      expect(result.doubled).toBe(10);
    });

    it('should apply multiple transformers', () => {
      const defaults = { a: 1, b: 2, sum: 0 };
      const userConfig = { a: 10, b: 20 };
      type D = typeof defaults;
      const transformers: Partial<Record<keyof D, Transformer<D, keyof D>>> = {
        sum: (_, config) => (config.a as number) + (config.b as number),
      };
      const result = mergeDefaults(userConfig, defaults, transformers);
      expect(result.sum).toBe(30);
    });

    it('should allow transformer to access merged config', () => {
      const defaults = { type: 'input', readonly: false };
      const userConfig = { type: 'display' };
      type D = typeof defaults;
      const transformers: Partial<Record<keyof D, Transformer<D, keyof D>>> = {
        readonly: (_, config) => config.type === 'display',
      };
      const result = mergeDefaults(userConfig, defaults, transformers);
      expect(result.readonly).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty defaults', () => {
      const defaults = {} as Record<string, string>;
      const userConfig = { key: 'value' };
      const result = mergeDefaults(userConfig, defaults);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle primitive values in defaults', () => {
      const defaults = { count: 0, enabled: false, name: '' };
      const userConfig = { count: 10 };
      const result = mergeDefaults(userConfig, defaults);
      expect(result).toEqual({ count: 10, enabled: false, name: '' });
    });

    it('should handle boolean values', () => {
      const defaults = { active: true };
      const userConfig = { active: false };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.active).toBe(false);
    });

    it('should handle number zero as valid override', () => {
      const defaults = { count: 10 };
      const userConfig = { count: 0 };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.count).toBe(0);
    });

    it('should handle empty string as valid override', () => {
      const defaults = { name: 'default' };
      const userConfig = { name: '' };
      const result = mergeDefaults(userConfig, defaults);
      expect(result.name).toBe('');
    });
  });
});

describe('applyDefaults', () => {
  describe('basic array processing', () => {
    it('should apply defaults to empty array', () => {
      const items: Partial<{ key: string; format: string }>[] = [];
      const defaults = { key: '', format: 'text' };
      const result = applyDefaults(items, defaults);
      expect(result).toEqual([]);
    });

    it('should apply defaults to single item', () => {
      const items = [{ key: 'name' }];
      const defaults = { key: '', format: 'text', sortable: false };
      const result = applyDefaults(items, defaults);
      expect(result).toEqual([{ key: 'name', format: 'text', sortable: false }]);
    });

    it('should apply defaults to multiple items', () => {
      const items = [{ key: 'name' }, { key: 'email' }];
      const defaults = { key: '', format: 'text' };
      const result = applyDefaults(items, defaults);
      expect(result).toEqual([
        { key: 'name', format: 'text' },
        { key: 'email', format: 'text' },
      ]);
    });
  });

  describe('with transformers', () => {
    it('should apply transformers to each item', () => {
      const items = [{ key: 'name' }, { key: 'createdAt' }];
      const defaults = { key: '', format: 'text', sortable: false };
      type D = typeof defaults;
      const transformers: Partial<Record<keyof D, Transformer<D, keyof D>>> = {
        format: (val, config) => (config.key?.endsWith('At') ? 'date' : val),
      };
      const result = applyDefaults(items, defaults, transformers);
      expect(result).toEqual([
        { key: 'name', format: 'text', sortable: false },
        { key: 'createdAt', format: 'date', sortable: false },
      ]);
    });

    it('should apply different transformations based on item data', () => {
      const items = [{ key: 'price', format: 'currency' }, { key: 'count' }];
      const defaults = { key: '', format: 'text' };
      const result = applyDefaults(items, defaults);
      expect(result).toEqual([
        { key: 'price', format: 'currency' },
        { key: 'count', format: 'text' },
      ]);
    });
  });

  describe('column-like usage', () => {
    it('should process column definitions', () => {
      type Column = {
        key: string;
        label: string;
        format: 'text' | 'badge';
        sortable: boolean;
      };
      const columns: Partial<Column>[] = [
        { key: 'id', label: 'ID' },
        { key: 'name' },
        { key: 'status', format: 'badge' },
      ];
      const defaults: Column = {
        key: '',
        label: '',
        format: 'text',
        sortable: false,
      };
      const transformers: Partial<Record<keyof Column, Transformer<Column, keyof Column>>> = {
        label: (val, config) =>
          (val as string) ||
          (config.key as string).charAt(0).toUpperCase() + (config.key as string).slice(1),
      };
      const result = applyDefaults(columns, defaults, transformers);
      expect(result).toEqual([
        { key: 'id', label: 'ID', format: 'text', sortable: false },
        { key: 'name', label: 'Name', format: 'text', sortable: false },
        { key: 'status', label: 'Status', format: 'badge', sortable: false },
      ]);
    });
  });
});
