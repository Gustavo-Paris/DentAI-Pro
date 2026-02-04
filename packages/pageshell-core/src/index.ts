/**
 * @pageshell/core
 *
 * Core hooks, utilities, formatters, and types for PageShell composites.
 * This package contains framework-agnostic logic that can be used with any UI library.
 *
 * @example
 * // Import everything
 * import { useModal, formatCurrency, interpolateHref } from '@pageshell/core';
 *
 * // Import from subpaths for better tree-shaking
 * import { useModal } from '@pageshell/core/hooks';
 * import { formatCurrency } from '@pageshell/core/formatters';
 * import { interpolateHref } from '@pageshell/core/utils';
 */

// Hooks
export * from './hooks';

// Utils
export * from './utils';

// Formatters
export * from './formatters';

// Types
export * from './types';

// Toast
export * from './toast';

// Presets
export * from './presets';

// Test Utilities
export * from './test-utils';

// Config
export * from './config';
