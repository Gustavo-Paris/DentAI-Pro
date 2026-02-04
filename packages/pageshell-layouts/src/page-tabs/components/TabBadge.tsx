/**
 * TabBadge Component
 *
 * Badge for PageTabs tab buttons.
 *
 * @package @pageshell/layouts
 */

'use client';

import { cn } from '@pageshell/core';

// =============================================================================
// Props
// =============================================================================

export interface TabBadgeProps {
  badge: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

// =============================================================================
// Component
// =============================================================================

export function TabBadge({ badge, variant = 'default' }: TabBadgeProps) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    error: 'bg-destructive/20 text-destructive',
  };

  const displayValue = typeof badge === 'number' && badge > 99 ? '99+' : badge;

  return (
    <span
      className={cn(
        'ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium min-w-[18px] text-center',
        variantClasses[variant]
      )}
    >
      {displayValue}
    </span>
  );
}

TabBadge.displayName = 'TabBadge';
