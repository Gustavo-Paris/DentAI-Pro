/**
 * ItemCard Constants
 *
 * Size and color class mappings for the ItemCard component.
 *
 * @module item-card/constants
 */

// =============================================================================
// Size Classes
// =============================================================================

export const sizeClasses = {
  sm: {
    container: 'p-3',
    icon: 'h-8 w-8',
    iconInner: 'h-4 w-4',
    title: 'text-sm',
    description: 'text-xs',
    stats: 'text-[10px]',
    footer: 'text-[10px]',
  },
  md: {
    container: 'p-4',
    icon: 'h-9 w-9',
    iconInner: 'h-4 w-4',
    title: 'text-base',
    description: 'text-sm',
    stats: 'text-xs',
    footer: 'text-xs',
  },
  lg: {
    container: 'p-5',
    icon: 'h-10 w-10',
    iconInner: 'h-5 w-5',
    title: 'text-lg',
    description: 'text-sm',
    stats: 'text-sm',
    footer: 'text-sm',
  },
} as const;

export type SizeKey = keyof typeof sizeClasses;

// =============================================================================
// Icon Color Classes
// =============================================================================

export const iconColorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  muted: 'bg-muted text-muted-foreground',
} as const;

export type IconColorKey = keyof typeof iconColorClasses;

// =============================================================================
// Variant Classes
// =============================================================================

export const variantClasses = {
  default: 'hover:shadow-md hover:border-border/80',
  elevated: 'shadow-md hover:shadow-lg',
  bordered: 'border-2 hover:border-primary/30',
  flat: 'shadow-none border-transparent hover:bg-muted/50',
} as const;

export type VariantKey = keyof typeof variantClasses;
