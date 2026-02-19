'use client';

/**
 * PageProcedureChecklist - Procedure checklist with progress
 *
 * Displays a list of checklist items with checkboxes. Required items
 * are visually marked. Includes a progress indicator showing how many
 * items are completed out of the total.
 *
 * @example
 * ```tsx
 * <PageProcedureChecklist
 *   items={[
 *     { id: '1', label: 'Anesthesia applied', completed: true, required: true },
 *     { id: '2', label: 'X-ray taken', completed: false, required: true },
 *     { id: '3', label: 'Patient consent', completed: true, required: false },
 *   ]}
 *   onToggle={(id) => console.log('Toggled', id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { ChecklistItem } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageProcedureChecklistProps {
  /** Checklist items */
  items: ChecklistItem[];
  /** Callback when an item is toggled */
  onToggle?: (id: string) => void;
  /** Title for the checklist */
  title?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageProcedureChecklist({
  items,
  onToggle,
  title = tPageShell('domain.odonto.treatments.checklist.title', 'Procedure Checklist'),
  className,
}: PageProcedureChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} ({progressPercent}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Items */}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <label
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded text-sm',
                onToggle && 'cursor-pointer hover:bg-accent/5',
              )}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggle?.(item.id)}
                disabled={!onToggle}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <span className={cn(item.completed && 'line-through text-muted-foreground')}>
                {item.label}
              </span>
              {item.required && (
                <span
                  className="text-xs text-destructive"
                  title={tPageShell('domain.odonto.treatments.checklist.required', 'Required')}
                >
                  <PageIcon name="asterisk" className="w-3 h-3" />
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
