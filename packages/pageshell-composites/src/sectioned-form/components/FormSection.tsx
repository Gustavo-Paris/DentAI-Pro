/**
 * FormSection Component
 *
 * Collapsible form section wrapper with badge support.
 *
 * @module sectioned-form/components/FormSection
 */

'use client';

import * as React from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import { PageCollapsible, type IconColor } from '@pageshell/layouts';
import { resolveIcon } from '@pageshell/primitives';
import type { SectionedFormSectionConfig } from '../types';
import { SectionFormField } from './SectionFormField';

// =============================================================================
// Types
// =============================================================================

export interface FormSectionProps<TValues extends FieldValues = FieldValues> {
  /** Section configuration */
  section: SectionedFormSectionConfig<TValues>;
  /** Form instance */
  form: UseFormReturn<TValues>;
  /** Query data for resolvers */
  data?: unknown;
  /** Whether section is open */
  open?: boolean;
  /** Open state change handler */
  onOpenChange?: (open: boolean) => void;
  /** Field columns (1 or 2) */
  fieldColumns?: 1 | 2;
  /** Field gap */
  fieldGap?: 4 | 6 | 8;
  /** Field change handler */
  onFieldChange?: (name: string, value: unknown) => void;
  /** Animation delay index */
  animationDelay?: number;
}

// =============================================================================
// Component
// =============================================================================

export function FormSection<TValues extends FieldValues = FieldValues>({
  section,
  form,
  data,
  open,
  onOpenChange,
  fieldColumns = 2,
  fieldGap = 4,
  onFieldChange,
  animationDelay = 1,
}: FormSectionProps<TValues>) {
  const { formState, getValues } = form;
  const values = getValues() as TValues;
  const errors = formState.errors as Record<string, { message?: string } | undefined>;

  // Resolve badge
  const badge = section.badgeResolver
    ? section.badgeResolver(data)
    : section.badge;

  // Grid class for fields
  const gridClass = fieldColumns === 2 ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col';
  const gapClass = `gap-${fieldGap}`;

  // Resolve icon if it's a string
  const ResolvedIcon = section.icon
    ? typeof section.icon === 'string'
      ? resolveIcon(section.icon)
      : section.icon
    : undefined;

  return (
    <div className={`portal-animate-in portal-animate-in-delay-${animationDelay}`}>
      <PageCollapsible
        title={section.title}
        description={section.description}
        icon={ResolvedIcon as LucideIcon | undefined}
        iconColor={section.iconColor as IconColor}
        open={open}
        defaultOpen={section.defaultOpen}
        onOpenChange={onOpenChange}
        badge={badge}
        variant="card"
        testId={`section-${section.id}`}
      >
        <div className="pt-4">
          {/* Custom render */}
          {section.render ? (
            section.render({ form, data })
          ) : section.children ? (
            // Custom children
            section.children
          ) : section.fields ? (
            // Declarative fields
            <div className={`${gridClass} ${gapClass}`}>
              {section.fields.map((field) => {
                // Check visibility
                const hiddenByProp = typeof field.hidden === 'function'
                  ? field.hidden(values)
                  : field.hidden;
                const hiddenByShowWhen = field.showWhen
                  ? !field.showWhen(values)
                  : false;

                if (hiddenByProp || hiddenByShowWhen) {
                  return null;
                }

                const fieldError = errors[field.name as string];
                const colSpanClass = field.colSpan === 2 ? 'sm:col-span-2' : '';

                return (
                  <div
                    key={field.name}
                    className={colSpanClass}
                  >
                    <SectionFormField
                      field={field}
                      form={form}
                      value={values[field.name as keyof TValues]}
                      error={fieldError?.message}
                      onChange={onFieldChange}
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </PageCollapsible>
    </div>
  );
}
