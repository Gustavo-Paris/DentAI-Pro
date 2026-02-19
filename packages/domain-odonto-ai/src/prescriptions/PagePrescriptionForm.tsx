'use client';

/**
 * PagePrescriptionForm - Prescription form layout
 *
 * Provides a form layout with patient field, medication list (add/remove),
 * notes field, and sign/save action buttons. Each medication entry has
 * name, dosage, frequency, duration, and instructions fields.
 *
 * @example
 * ```tsx
 * <PagePrescriptionForm
 *   patientName="Maria Silva"
 *   medications={[
 *     { id: 'm1', name: 'Amoxicillin', dosage: '500mg', frequency: '8/8h', duration: '7 days' },
 *   ]}
 *   onAddMedication={() => openMedicationSearch()}
 *   onRemoveMedication={(id) => removeMed(id)}
 *   onMedicationChange={(id, field, value) => updateMed(id, field, value)}
 *   onSave={(notes) => savePrescription(notes)}
 *   onSign={() => signPrescription()}
 * />
 * ```
 */

import { useState } from 'react';

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { MedicationItem } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PagePrescriptionFormProps {
  /** Patient name to display */
  patientName: string;
  /** Current list of medications */
  medications: MedicationItem[];
  /** Callback to add a medication */
  onAddMedication: () => void;
  /** Callback to remove a medication by id */
  onRemoveMedication: (id: string) => void;
  /** Callback when a medication field changes */
  onMedicationChange: (id: string, field: keyof Omit<MedicationItem, 'id'>, value: string) => void;
  /** Callback to save the prescription */
  onSave: (notes: string) => void;
  /** Callback to sign the prescription */
  onSign?: () => void;
  /** Initial notes value */
  initialNotes?: string;
  /** Whether the form is in a loading/saving state */
  saving?: boolean;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PagePrescriptionForm({
  patientName,
  medications,
  onAddMedication,
  onRemoveMedication,
  onMedicationChange,
  onSave,
  onSign,
  initialNotes = '',
  saving = false,
  className,
}: PagePrescriptionFormProps) {
  const [notes, setNotes] = useState(initialNotes);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Patient */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {tPageShell('domain.odonto.prescriptions.form.patient', 'Patient')}
        </label>
        <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
          <PageIcon name="user" className="w-4 h-4 text-muted-foreground" />
          <span>{patientName}</span>
        </div>
      </div>

      {/* Medications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {tPageShell('domain.odonto.prescriptions.form.medications', 'Medications')}
          </label>
          <Button size="sm" variant="outline" onClick={onAddMedication}>
            <PageIcon name="plus" className="w-3 h-3 mr-1" />
            {tPageShell('domain.odonto.prescriptions.form.addMedication', 'Add')}
          </Button>
        </div>

        {medications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
            {tPageShell('domain.odonto.prescriptions.form.noMedications', 'No medications added')}
          </p>
        ) : (
          <div className="space-y-4">
            {medications.map((med, index) => (
              <div key={med.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {tPageShell('domain.odonto.prescriptions.form.medicationNumber', 'Medication')} #{index + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveMedication(med.id)}
                    aria-label={tPageShell('domain.odonto.prescriptions.form.removeMedication', 'Remove medication')}
                  >
                    <PageIcon name="trash-2" className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      {tPageShell('domain.odonto.prescriptions.form.medicationName', 'Name')}
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => onMedicationChange(med.id, 'name', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Dosage */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      {tPageShell('domain.odonto.prescriptions.form.dosage', 'Dosage')}
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => onMedicationChange(med.id, 'dosage', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      {tPageShell('domain.odonto.prescriptions.form.frequency', 'Frequency')}
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => onMedicationChange(med.id, 'frequency', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      {tPageShell('domain.odonto.prescriptions.form.duration', 'Duration')}
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => onMedicationChange(med.id, 'duration', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {tPageShell('domain.odonto.prescriptions.form.instructions', 'Instructions')}
                  </label>
                  <input
                    type="text"
                    value={med.instructions ?? ''}
                    onChange={(e) => onMedicationChange(med.id, 'instructions', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={tPageShell('domain.odonto.prescriptions.form.instructionsPlaceholder', 'e.g. Take with food')}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {tPageShell('domain.odonto.prescriptions.form.notes', 'Notes')}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder={tPageShell('domain.odonto.prescriptions.form.notesPlaceholder', 'Additional notes...')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => onSave(notes)} disabled={saving}>
          <PageIcon name="save" className="w-4 h-4 mr-2" />
          {saving
            ? tPageShell('domain.odonto.prescriptions.form.saving', 'Saving...')
            : tPageShell('domain.odonto.prescriptions.form.save', 'Save')
          }
        </Button>
        {onSign && (
          <Button variant="outline" onClick={onSign} disabled={saving}>
            <PageIcon name="pen-tool" className="w-4 h-4 mr-2" />
            {tPageShell('domain.odonto.prescriptions.form.sign', 'Sign')}
          </Button>
        )}
      </div>
    </div>
  );
}
