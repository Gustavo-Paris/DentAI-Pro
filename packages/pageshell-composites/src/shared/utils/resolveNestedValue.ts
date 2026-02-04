/**
 * Utility to resolve nested values from an object using dot notation.
 *
 * @module shared/utils/resolveNestedValue
 */

/**
 * Resolves a nested value from an object using dot notation path.
 *
 * @example
 * ```ts
 * const data = { main: { stats: { totalHours: 10 } } };
 * resolveNestedValue(data, 'main.stats.totalHours'); // 10
 * resolveNestedValue(data, 'main.stats.missing'); // undefined
 * ```
 *
 * @param obj - The object to resolve from
 * @param path - Dot-notation path (e.g., "main.stats.totalHours")
 * @returns The resolved value or undefined
 */
export function resolveNestedValue<T = unknown>(
  obj: Record<string, unknown> | undefined | null,
  path: string
): T | undefined {
  if (!obj || !path) return undefined;

  // Handle static values (e.g., "10" as a number)
  const numericValue = Number(path);
  if (!isNaN(numericValue) && path.trim() !== '') {
    return numericValue as T;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T | undefined;
}

/**
 * Sets a nested value in an object using dot notation path.
 * Creates intermediate objects as needed.
 *
 * @example
 * ```ts
 * const obj = {};
 * setNestedValue(obj, 'a.b.c', 42);
 * // obj is now { a: { b: { c: 42 } } }
 * ```
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1]!;
  current[lastKey] = value;
}
