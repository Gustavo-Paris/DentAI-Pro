/**
 * Deprecation Warning Utilities for PageShell Composites
 *
 * Development-only warnings for deprecated props and APIs.
 * Uses a Set to ensure each warning is only shown once per component.
 *
 * Supports strictMode for enforcing deprecation warnings as errors during development.
 *
 * @module shared/utils/deprecation
 */

import { logger } from '@repo/logger';

const warned = new Set<string>();

// =============================================================================
// Types
// =============================================================================

/**
 * Deprecation strictness level
 * - 'warn': Log warning (default behavior)
 * - 'error': Throw error in development (for strict enforcement)
 * - 'silent': No output (for gradual migration)
 * - false: Alias for 'silent'
 */
export type DeprecationLevel = 'warn' | 'error' | 'silent' | false;

/**
 * Options for handleDeprecatedProp
 */
export interface DeprecationOptions {
  /**
   * Additional guidance for migration
   */
  hint?: string;

  /**
   * Version when this prop will be removed
   * @example 'v2.0.0'
   */
  removalVersion: string;

  /**
   * Strict mode behavior
   * - 'warn': Log warning (default)
   * - 'error': Throw error in development
   * - 'silent' or false: No output
   */
  strictMode?: DeprecationLevel;
}

// =============================================================================
// Legacy Function (backward compatible)
// =============================================================================

/**
 * Warn about deprecated prop usage (development only, once per component/prop)
 *
 * @param component - Component name (e.g., 'ListPage')
 * @param oldProp - Deprecated prop name
 * @param newProp - New prop to use instead
 * @param hint - Optional additional guidance
 *
 * @deprecated Use handleDeprecatedProp with DeprecationOptions for version tracking
 */
export function warnDeprecatedProp(
  component: string,
  oldProp: string,
  newProp: string,
  hint?: string
): void {
  if (process.env.NODE_ENV === 'production') return;

  const key = `${component}:${oldProp}`;
  if (warned.has(key)) return;

  warned.add(key);
  logger.warn(
    `[${component}] The \`${oldProp}\` prop is deprecated. ` +
      `Use \`${newProp}\` instead.${hint ? ` ${hint}` : ''}`
  );
}

// =============================================================================
// Enhanced Function
// =============================================================================

/**
 * Handle deprecated prop with version tracking and strict mode support
 *
 * @param component - Component name (e.g., 'ListPage')
 * @param oldProp - Deprecated prop name
 * @param newProp - New prop to use instead
 * @param options - Deprecation options (removalVersion required)
 *
 * @example Basic usage
 * ```tsx
 * handleDeprecatedProp('ListPage', 'rowActions', 'actions', {
 *   removalVersion: 'v2.0.0',
 *   hint: 'Use unified actions for both table and card modes.',
 * });
 * ```
 *
 * @example With strict mode from props
 * ```tsx
 * handleDeprecatedProp('ListPage', 'query', 'useQuery', {
 *   removalVersion: 'v2.0.0',
 *   strictMode: props.strictMode,
 * });
 * ```
 */
export function handleDeprecatedProp(
  component: string,
  oldProp: string,
  newProp: string,
  options: DeprecationOptions
): void {
  if (process.env.NODE_ENV === 'production') return;

  const { hint, removalVersion, strictMode = 'warn' } = options;

  // Silent mode - no output
  if (strictMode === 'silent' || strictMode === false) {
    return;
  }

  const key = `${component}:${oldProp}`;

  // Only warn/error once per component/prop
  if (warned.has(key) && strictMode === 'warn') return;

  warned.add(key);

  const message =
    `[${component}] The \`${oldProp}\` prop is deprecated and will be removed in ${removalVersion}. ` +
    `Use \`${newProp}\` instead.${hint ? ` ${hint}` : ''}`;

  if (strictMode === 'error') {
    throw new Error(message);
  }

  logger.warn(message);
}

/**
 * Check if a prop is defined (not undefined)
 * Helper for deprecation checks
 */
export function isPropDefined(value: unknown): boolean {
  return value !== undefined;
}

/**
 * Warn about deprecated API usage (development only, once per key)
 *
 * @param key - Unique key for deduplication
 * @param message - Warning message
 * @param strictMode - Optional strict mode override
 */
export function warnDeprecated(
  key: string,
  message: string,
  strictMode?: DeprecationLevel
): void {
  if (process.env.NODE_ENV === 'production') return;

  // Silent mode - no output
  if (strictMode === 'silent' || strictMode === false) {
    return;
  }

  if (warned.has(key) && strictMode !== 'error') return;
  warned.add(key);

  const fullMessage = `[PageShell] ${message}`;

  if (strictMode === 'error') {
    throw new Error(fullMessage);
  }

  logger.warn(fullMessage);
}

/**
 * Create a wrapper that warns when a deprecated composite is accessed via PageShell.*
 *
 * @param name - Name of the composite (e.g., 'ListPage')
 * @param composite - The actual composite component
 * @returns The same composite (warnings are side effects)
 */
export function wrapDeprecatedComposite<T>(name: string, composite: T): T {
  if (process.env.NODE_ENV === 'production') return composite;

  // Warn on first access via getter
  warnDeprecated(
    `PageShell.${name}`,
    `PageShell.${name} is deprecated. ` +
      `Import directly from '@pageshell/composites' instead:\n\n` +
      `  // Before (deprecated)\n` +
      `  import { PageShell } from '@pageshell/shell';\n` +
      `  <PageShell.${name} ... />\n\n` +
      `  // After (recommended)\n` +
      `  import { ${name} } from '@pageshell/composites';\n` +
      `  <${name} ... />\n\n` +
      `This will be removed in v0.3.0.`
  );

  return composite;
}

/**
 * Clear warned set (for testing purposes only)
 */
export function clearDeprecationWarnings(): void {
  warned.clear();
}
