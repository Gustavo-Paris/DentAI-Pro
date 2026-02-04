/**
 * Get a nested value from an object using dot notation
 * @example getNestedValue({ user: { name: 'John' } }, 'user.name') => 'John'
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Interpolate :param patterns in a string with object values
 *
 * @example
 * interpolateHref('/users/:id', { id: '123' })
 * // => '/users/123'
 *
 * @example
 * interpolateHref('/users/:user.id/posts/:postId', { user: { id: '123' }, postId: '456' })
 * // => '/users/123/posts/456'
 */
export function interpolateHref<T>(template: string, data: T): string {
  return template.replace(/:([a-zA-Z_][a-zA-Z0-9_.]*)/g, (_, path: string) => {
    const value = getNestedValue(data, path);
    return value != null ? String(value) : `:${path}`;
  });
}

/**
 * Check if a string contains interpolation patterns
 */
export function hasInterpolation(str: string): boolean {
  return /:([a-zA-Z_][a-zA-Z0-9_.]*)/.test(str);
}

/**
 * Extract interpolation keys from a template string
 * @example extractInterpolationKeys('/users/:id/posts/:postId') => ['id', 'postId']
 */
export function extractInterpolationKeys(template: string): string[] {
  const matches = template.match(/:([a-zA-Z_][a-zA-Z0-9_.]*)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1));
}
