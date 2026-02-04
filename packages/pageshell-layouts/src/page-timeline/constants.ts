/**
 * PageTimeline Constants
 *
 * @package @pageshell/layouts
 */

import type { PageTimelineVariant, PageTimelineIconColor } from './types';

// =============================================================================
// Variant Styles
// =============================================================================

export const variantStyles: Record<
  PageTimelineVariant,
  { container: string; item: string; content: string }
> = {
  default: {
    container: 'pl-8',
    item: 'pb-8',
    content: 'ml-6',
  },
  compact: {
    container: 'pl-6',
    item: 'pb-4',
    content: 'ml-4',
  },
  detailed: {
    container: 'pl-10',
    item: 'pb-10',
    content: 'ml-8',
  },
};

// =============================================================================
// Icon Color Classes
// =============================================================================

export const iconColorClasses: Record<PageTimelineIconColor, string> = {
  default: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
};
