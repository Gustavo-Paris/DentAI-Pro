/**
 * PageList Constants
 *
 * @package @pageshell/interactions
 */

import type { PageListVariant, PageListIconColor } from './types';

// =============================================================================
// Animation Constants
// =============================================================================

/**
 * Static animation delay classes for Tailwind build-time parsing.
 * Dynamic template literals cannot be parsed by Tailwind at build time.
 */
export const ANIMATION_DELAY_CLASSES: Record<number, string> = {
  0: '',
  1: '[animation-delay:100ms]',
  2: '[animation-delay:200ms]',
  3: '[animation-delay:300ms]',
  4: '[animation-delay:400ms]',
  5: '[animation-delay:500ms]',
  6: '[animation-delay:600ms]',
  7: '[animation-delay:700ms]',
  8: '[animation-delay:800ms]',
};

// =============================================================================
// Style Constants
// =============================================================================

export const variantStyles: Record<PageListVariant, { container: string; item: string; content: string }> = {
  default: {
    container: '',
    item: 'px-4 py-3',
    content: 'gap-3',
  },
  compact: {
    container: '',
    item: 'px-3 py-2',
    content: 'gap-2',
  },
  card: {
    container: 'space-y-2',
    item: 'px-4 py-3 rounded-lg border border-border bg-card',
    content: 'gap-3',
  },
};

export const iconColorClasses: Record<PageListIconColor, string> = {
  default: 'text-muted-foreground bg-muted',
  primary: 'text-primary bg-primary/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  error: 'text-red-500 bg-red-500/10',
  info: 'text-blue-500 bg-blue-500/10',
};
