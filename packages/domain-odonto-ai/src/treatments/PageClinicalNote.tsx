'use client';

/**
 * PageClinicalNote - Clinical note display
 *
 * Displays a clinical note in a compact card format with date, author,
 * content text, associated teeth numbers, and associated procedure.
 *
 * @example
 * ```tsx
 * <PageClinicalNote
 *   note={{
 *     id: '1',
 *     date: '2026-02-10',
 *     author: 'Dr. Santos',
 *     content: 'Patient presented with pain in lower right quadrant...',
 *     toothNumbers: [46, 47],
 *     procedureId: 'proc-1',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { ClinicalNoteData } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageClinicalNoteProps {
  /** Clinical note data */
  note: ClinicalNoteData;
  /** Label for associated procedure */
  procedureLabel?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageClinicalNote({
  note,
  procedureLabel,
  className,
}: PageClinicalNoteProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <PageIcon name="calendar" className="w-3 h-3" />
            {note.date}
          </span>
          <span className="flex items-center gap-1">
            <PageIcon name="user" className="w-3 h-3" />
            {note.author}
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed">{note.content}</p>

      {/* Metadata */}
      {(note.toothNumbers?.length || note.procedureId) && (
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
          {note.toothNumbers && note.toothNumbers.length > 0 && (
            <span className="flex items-center gap-1">
              <PageIcon name="hash" className="w-3 h-3" />
              {tPageShell('domain.odonto.treatments.clinicalNote.teeth', 'Teeth')}: {note.toothNumbers.join(', ')}
            </span>
          )}
          {note.procedureId && (
            <span className="flex items-center gap-1">
              <PageIcon name="file-text" className="w-3 h-3" />
              {procedureLabel || tPageShell('domain.odonto.treatments.clinicalNote.procedure', 'Procedure')}: {note.procedureId}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
