/**
 * PreferencesPage Constants
 *
 * Color class mappings for preference icons.
 *
 * @module preferences/constants
 */

import type { SemanticIconColor } from './types';

// =============================================================================
// Icon Color Classes
// =============================================================================

export const iconColorClasses: Record<SemanticIconColor, string> = {
  violet: 'text-violet-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  blue: 'text-blue-500',
  cyan: 'text-cyan-500',
  red: 'text-red-500',
  primary: 'text-primary',
} as const;
