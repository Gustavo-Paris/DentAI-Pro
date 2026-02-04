/**
 * PageTabs Utilities
 *
 * @package @pageshell/layouts
 */

import { cn } from '@pageshell/core';
import { sizeConfig } from './constants';
import type { PageTabsVariant, PageTabsOrientation, PageTabsSize } from './types';

// =============================================================================
// Tab List Container Styles
// =============================================================================

export function getTabListClasses(
  variant: PageTabsVariant,
  orientation: PageTabsOrientation,
  fullWidth: boolean
): string {
  const base = 'flex';

  const orientationClasses = orientation === 'vertical' ? 'flex-col' : 'flex-row items-center';

  const variantClasses: Record<PageTabsVariant, string> = {
    pills: cn(
      'gap-1 p-1 rounded-lg bg-muted border border-border',
      orientation === 'horizontal' && 'inline-flex'
    ),
    underline: cn(
      'gap-0 border-b border-border',
      orientation === 'vertical' && 'border-b-0 border-r'
    ),
    boxed: cn(
      'gap-0 rounded-lg overflow-hidden',
      'border border-border divide-x divide-border',
      orientation === 'vertical' && 'divide-x-0 divide-y'
    ),
  };

  return cn(base, orientationClasses, variantClasses[variant], fullWidth && 'w-full');
}

// =============================================================================
// Tab Button Styles
// =============================================================================

export function getTabButtonClasses(
  variant: PageTabsVariant,
  size: PageTabsSize,
  isActive: boolean,
  isDisabled: boolean,
  fullWidth: boolean
): string {
  const sizeStyles = sizeConfig[size];

  const base = cn(
    'flex items-center justify-center gap-2 font-medium transition-all',
    sizeStyles.padding,
    sizeStyles.fontSize,
    fullWidth && 'flex-1',
    isDisabled && 'opacity-50 cursor-not-allowed'
  );

  const variantStyles: Record<PageTabsVariant, string> = {
    pills: cn(
      'rounded-md',
      isActive
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
      isDisabled && !isActive && 'hover:bg-transparent hover:text-muted-foreground'
    ),
    underline: cn(
      'relative border-b-2 -mb-[1px]',
      isActive
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
      isDisabled && 'hover:border-transparent hover:text-muted-foreground'
    ),
    boxed: cn(
      isActive
        ? 'bg-background text-foreground'
        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
      isDisabled && 'hover:bg-muted/50 hover:text-muted-foreground'
    ),
  };

  return cn(base, variantStyles[variant]);
}
