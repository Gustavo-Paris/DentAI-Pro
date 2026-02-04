'use client';

/**
 * StatusToggleSection Component
 *
 * Reusable status toggle for cards with switch and status indicator.
 *
 * @module item-card-sections
 */

import { cn } from '@pageshell/core';
import { Switch, Badge, PageIcon } from '@pageshell/primitives';
import type { StatusToggleSectionProps } from './types';

/**
 * StatusToggleSection - Status display with toggle switch
 *
 * @example
 * ```tsx
 * <StatusToggleSection
 *   status="active"
 *   onToggle={() => toggleServiceStatus(id)}
 *   activeLabel="Active"
 *   inactiveLabel="Inactive"
 *   disabled={isLoading}
 * />
 * ```
 */
export function StatusToggleSection({
  status,
  onToggle,
  disabled = false,
  loading = false,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className,
  ariaLabel,
}: StatusToggleSectionProps) {
  const isActive = status === 'active';

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        <Badge variant={isActive ? 'default' : 'secondary'}>
          <PageIcon
            name={isActive ? 'check-circle' : 'x-circle'}
            className={cn(
              'h-3 w-3 mr-1',
              isActive ? 'text-success' : 'text-muted-foreground'
            )}
          />
          {isActive ? activeLabel : inactiveLabel}
        </Badge>
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
        disabled={disabled || loading}
        aria-label={ariaLabel ?? (isActive ? `Deactivate` : `Activate`)}
      />
    </div>
  );
}

StatusToggleSection.displayName = 'StatusToggleSection';
