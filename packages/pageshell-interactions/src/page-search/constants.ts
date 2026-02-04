/**
 * PageSearch Constants
 *
 * @package @pageshell/interactions
 */

import type { PageSearchVariant } from './types';

// =============================================================================
// Variant Styles
// =============================================================================

export const variantStyles: Record<PageSearchVariant, { container: string; input: string }> = {
  default: {
    container: '',
    input: 'h-10',
  },
  minimal: {
    container: '',
    input: 'h-9 text-sm',
  },
  expanded: {
    container: 'w-full',
    input: 'h-12 text-base',
  },
};
