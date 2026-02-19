'use client';

/**
 * PageMedicalHistory - Medical history timeline
 *
 * Displays a list of MedicalRecord items sorted by date, with type icons,
 * severity badges, and optional filtering by record type.
 *
 * @example
 * ```tsx
 * <PageMedicalHistory
 *   records={[
 *     { id: '1', date: '2026-01-15', type: 'allergy', description: 'Penicillin allergy', active: true, severity: 'high' },
 *     { id: '2', date: '2025-12-01', type: 'medication', description: 'Amoxicillin 500mg', active: true },
 *   ]}
 * />
 * ```
 */

import { useState } from 'react';

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { MedicalRecord } from './types';

// =============================================================================
// Types
// =============================================================================

type RecordType = MedicalRecord['type'];

export interface PageMedicalHistoryProps {
  /** List of medical records */
  records: MedicalRecord[];
  /** Additional CSS class names */
  className?: string;
  /** Override title label */
  titleLabel?: string;
  /** Override empty state label */
  emptyLabel?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_ICON: Record<RecordType, string> = {
  condition: 'heart',
  allergy: 'alert-triangle',
  medication: 'pill',
  surgery: 'scissors',
};

const TYPE_LABEL: Record<RecordType, string> = {
  condition: tPageShell('domain.odonto.patients.medicalHistory.typeCondition', 'Condition'),
  allergy: tPageShell('domain.odonto.patients.medicalHistory.typeAllergy', 'Allergy'),
  medication: tPageShell('domain.odonto.patients.medicalHistory.typeMedication', 'Medication'),
  surgery: tPageShell('domain.odonto.patients.medicalHistory.typeSurgery', 'Surgery'),
};

const SEVERITY_VARIANT: Record<string, 'accent' | 'muted' | 'outline'> = {
  high: 'accent',
  medium: 'muted',
  low: 'outline',
};

const FILTER_OPTIONS: RecordType[] = ['condition', 'allergy', 'medication', 'surgery'];

// =============================================================================
// Component
// =============================================================================

export function PageMedicalHistory({
  records,
  className,
  titleLabel = tPageShell('domain.odonto.patients.medicalHistory.title', 'Medical History'),
  emptyLabel = tPageShell('domain.odonto.patients.medicalHistory.empty', 'No medical records found'),
}: PageMedicalHistoryProps) {
  const [activeFilter, setActiveFilter] = useState<RecordType | null>(null);

  const filteredRecords = activeFilter
    ? records.filter((r) => r.type === activeFilter)
    : records;

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <PageIcon name="clipboard-list" className="w-4 h-4 text-muted-foreground" />
          {titleLabel}
        </h3>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeFilter === null ? 'default' : 'outline'}
          onClick={() => setActiveFilter(null)}
        >
          {tPageShell('domain.odonto.patients.medicalHistory.filterAll', 'All')}
        </Button>
        {FILTER_OPTIONS.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={activeFilter === type ? 'default' : 'outline'}
            onClick={() => setActiveFilter(type)}
          >
            {TYPE_LABEL[type]}
          </Button>
        ))}
      </div>

      {/* Records */}
      {sortedRecords.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {sortedRecords.map((record) => (
            <div
              key={record.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border border-border p-3',
                !record.active && 'opacity-60',
              )}
            >
              <div className="mt-0.5 flex-shrink-0">
                <PageIcon
                  name={TYPE_ICON[record.type]}
                  className="w-4 h-4 text-muted-foreground"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{record.description}</span>
                  <StatusBadge variant="outline" label={TYPE_LABEL[record.type]} />
                  {record.severity && (
                    <StatusBadge
                      variant={SEVERITY_VARIANT[record.severity]}
                      label={record.severity}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{record.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
