/**
 * GridEmptyState Component
 *
 * Empty state for PageGrid.
 *
 * @package @pageshell/layouts
 */

'use client';

import { isValidElement, type ReactNode, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { renderAction } from './ActionButton';
import type { PageGridEmptyState } from '../types';

// =============================================================================
// Component
// =============================================================================

export function GridEmptyState({
  emptyState,
  LinkComponent,
}: {
  emptyState: PageGridEmptyState;
  LinkComponent?: ComponentType<{ href: string; children: ReactNode; className?: string }>;
}) {
  const renderIcon = () => {
    if (!emptyState.icon) return null;

    if (isValidElement(emptyState.icon)) {
      return emptyState.icon;
    }

    const IconComponent = emptyState.icon as LucideIcon;
    return <IconComponent className="h-12 w-12" />;
  };

  return (
    <div
      className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      {emptyState.icon && (
        <div className="mb-4 text-muted-foreground">{renderIcon()}</div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{emptyState.title}</h3>
      {emptyState.description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {emptyState.description}
        </p>
      )}
      {emptyState.action && (
        <div className="mt-4">{renderAction(emptyState.action, LinkComponent)}</div>
      )}
    </div>
  );
}
