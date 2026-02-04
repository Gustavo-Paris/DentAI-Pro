/**
 * Default merger utility for PageShell composites
 *
 * Provides deep merging of user configuration with defaults,
 * with optional transformers for computed values.
 *
 * @module utils/defaultMerger
 */

/**
 * Transformer function type for computed default values
 */
export type Transformer<T, K extends keyof T> = (
  value: T[K],
  config: T
) => T[K];

/**
 * Deep merges user configuration with defaults.
 *
 * Features:
 * - Deep merges nested objects
 * - Arrays are replaced, not merged
 * - undefined values in userConfig don't override defaults
 * - null values in userConfig do override defaults
 * - Transformers can compute values based on merged config
 *
 * @param userConfig - Partial user configuration
 * @param defaults - Default values
 * @param transformers - Optional functions to transform values after merge
 * @returns Merged configuration with all defaults applied
 *
 * @example
 * ```typescript
 * const defaults = { format: 'text', sortable: false };
 * const userConfig = { sortable: true };
 * const result = mergeDefaults(userConfig, defaults);
 * // { format: 'text', sortable: true }
 * ```
 *
 * @example With transformers
 * ```typescript
 * const defaults = { format: 'text' };
 * const userConfig = { key: 'createdAt' };
 * const transformers = {
 *   format: (val, config) => config.key?.endsWith('At') ? 'date' : val
 * };
 * const result = mergeDefaults(userConfig, defaults, transformers);
 * // { key: 'createdAt', format: 'date' }
 * ```
 */
export function mergeDefaults<T extends object>(
  userConfig: Partial<T>,
  defaults: T,
  transformers?: Partial<Record<keyof T, Transformer<T, keyof T>>>
): T {
  const merged = { ...defaults } as T;

  for (const key in userConfig) {
    if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
      const userValue = userConfig[key as keyof T];
      const defaultValue = defaults[key as keyof T];

      // Skip undefined values - they don't override defaults
      if (userValue === undefined) {
        continue;
      }

      // Deep merge objects (but not arrays or null)
      if (
        typeof defaultValue === 'object' &&
        defaultValue !== null &&
        !Array.isArray(defaultValue) &&
        typeof userValue === 'object' &&
        userValue !== null &&
        !Array.isArray(userValue)
      ) {
        (merged as Record<string, unknown>)[key] = mergeDefaults(
          userValue as object,
          defaultValue as object
        );
      } else {
        // Direct assignment for primitives, arrays, and null
        (merged as Record<string, unknown>)[key] = userValue;
      }
    }
  }

  // Apply transformers after merge
  if (transformers) {
    for (const key in transformers) {
      if (Object.prototype.hasOwnProperty.call(transformers, key)) {
        const transformer = transformers[key];
        if (transformer) {
          (merged as Record<string, unknown>)[key] = transformer(
            merged[key as keyof T],
            merged
          );
        }
      }
    }
  }

  return merged;
}

/**
 * Applies defaults to an array of items.
 *
 * Useful for processing arrays of column definitions, filter options, etc.
 *
 * @param items - Array of partial configurations
 * @param defaults - Default values to apply to each item
 * @param transformers - Optional transformers for computed values
 * @returns Array with defaults applied to each item
 *
 * @example
 * ```typescript
 * const columns = [
 *   { key: 'name' },
 *   { key: 'createdAt' }
 * ];
 * const defaults = { format: 'text', sortable: false };
 * const transformers = {
 *   format: (val, config) => config.key?.endsWith('At') ? 'date' : val
 * };
 * const result = applyDefaults(columns, defaults, transformers);
 * // [
 * //   { key: 'name', format: 'text', sortable: false },
 * //   { key: 'createdAt', format: 'date', sortable: false }
 * // ]
 * ```
 */
export function applyDefaults<T extends object>(
  items: Partial<T>[],
  defaults: T,
  transformers?: Partial<Record<keyof T, Transformer<T, keyof T>>>
): T[] {
  return items.map((item) => mergeDefaults(item, defaults, transformers));
}
