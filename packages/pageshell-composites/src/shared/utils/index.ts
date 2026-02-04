/**
 * Shared utilities for composites
 *
 * @module shared/utils
 */

// Core utilities (cn, data extractors)
export {
  cn,
  extractArrayFromData,
  extractTotalFromData,
  defaultKeyExtractor,
} from './common';

// Nested value utilities
export { resolveNestedValue } from './resolveNestedValue';
// Note: setNestedValue exists but is not exported (unused)

// Label utilities
export { createLabelResolver } from './labels';

// Deprecation utilities (runtime warnings)
export {
  warnDeprecatedProp,
  warnDeprecated,
  wrapDeprecatedComposite,
} from './deprecation';
