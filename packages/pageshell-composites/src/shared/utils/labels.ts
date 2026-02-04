/**
 * Label Resolver Utilities
 *
 * Factory functions for creating type-safe label resolvers.
 * Reduces boilerplate across composite components.
 *
 * @module shared/utils/labels
 */

/**
 * Creates a label resolver function that merges user-provided labels with defaults.
 *
 * For flat label objects, performs a shallow merge.
 *
 * @example
 * ```ts
 * const DEFAULT_LABELS = { save: 'Save', cancel: 'Cancel' };
 * const resolveLabels = createLabelResolver(DEFAULT_LABELS);
 *
 * resolveLabels(); // Returns defaults
 * resolveLabels({ save: 'Submit' }); // Merges with defaults
 * ```
 *
 * @param defaults - Default label values
 * @returns A resolver function that merges user labels with defaults
 */
export function createLabelResolver<T extends object>(
  defaults: Required<T>
): (userLabels?: Partial<T>) => Required<T> {
  return (userLabels?: Partial<T>): Required<T> => {
    if (!userLabels) return defaults;
    return { ...defaults, ...userLabels };
  };
}
