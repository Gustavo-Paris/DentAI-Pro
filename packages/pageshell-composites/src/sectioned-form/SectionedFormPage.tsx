/**
 * SectionedFormPage Composite
 *
 * Form page with collapsible sections, alerts, and badges.
 * Ideal for settings pages with multiple configuration areas.
 *
 * @module sectioned-form/SectionedFormPage
 *
 * @example Basic usage
 * ```tsx
 * <SectionedFormPage
 *   title="Payment Settings"
 *   description="Configure your payment methods"
 *   query={bankingQuery}
 *   mutation={updateMutation}
 *   alert={{
 *     show: (data) => !data?.isComplete,
 *     variant: 'warning',
 *     title: 'Setup incomplete',
 *     description: 'Please complete your payment information.',
 *   }}
 *   sections={[
 *     {
 *       id: 'pix',
 *       title: 'PIX Key',
 *       icon: Wallet,
 *       iconColor: 'violet',
 *       badge: data?.hasPix ? { label: '✓', variant: 'success' } : undefined,
 *       fields: [
 *         { name: 'pixKeyType', type: 'select', label: 'Key Type', options: [...] },
 *         { name: 'pixKey', type: 'text', label: 'Key Value' },
 *       ],
 *     },
 *     {
 *       id: 'bank',
 *       title: 'Bank Account',
 *       icon: Building2,
 *       iconColor: 'emerald',
 *       fields: [...],
 *     },
 *   ]}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button, PageConfirmDialog } from '@pageshell/primitives';
import { PageHeader } from '@pageshell/layouts';
import type { FieldValues } from 'react-hook-form';
import type { SectionedFormPageProps } from './types';
import { sectionedFormPageDefaults } from './types';
import { getContainerClasses } from '../shared/styles';
import { useSectionedFormLogic } from './hooks';
import {
  FormSection,
  SectionedFormSkeleton,
  SectionAlert,
} from './components';

// =============================================================================
// Component
// =============================================================================

export function SectionedFormPage<
  TValues extends FieldValues = FieldValues,
  TData = unknown,
>(props: SectionedFormPageProps<TValues, TData>) {
  const {
    // Base
    theme = sectionedFormPageDefaults.theme,
    containerVariant = sectionedFormPageDefaults.containerVariant,
    title,
    description,
    className,
    testId,
    // Alert
    alert,
    successAlert,
    // Sections
    sections,
    // Form
    form: externalForm,
    defaultValues,
    onSubmit,
    mutation,
    transformPayload,
    onSuccess,
    onError,
    // Data loading
    query,
    mapDataToValues,
    // Navigation
    backHref,
    backLabel,
    cancelHref,
    onCancel,
    // Actions
    primaryAction,
    secondaryAction,
    headerAction,
    // Behavior
    warnOnUnsavedChanges = true,
    showErrors = false,
    formatError,
    fieldColumns = 2,
    fieldGap = 4,
    // Slots
    slots,
    skeleton,
    labels: propsLabels,
  } = props;

  // Merge labels with defaults
  const labels = { ...sectionedFormPageDefaults, ...propsLabels };

  // Section open states
  const [sectionStates, setSectionStates] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((section, index) => {
      initial[section.id] = section.defaultOpen ?? (index === 0);
    });
    return initial;
  });

  // Form logic hook
  const formLogic = useSectionedFormLogic<TValues, TData>({
    form: externalForm,
    defaultValues,
    queryData: query?.data as TData | undefined,
    mapDataToValues,
    onSubmit,
    mutation,
    transformPayload,
    onSuccess,
    onError,
    formatError,
    warnOnUnsavedChanges,
    backHref,
    cancelHref,
    onCancel,
  });

  const {
    form,
    isSubmitting,
    isValid,
    isDirty,
    hasErrors,
    errorMessages,
    handleFormSubmit,
    handleFieldChange,
    handleCancel,
    handleBack,
    showLeaveDialog,
    confirmNavigation,
    cancelNavigation,
  } = formLogic;

  // Toggle section
  const toggleSection = React.useCallback((sectionId: string, open: boolean) => {
    setSectionStates((prev) => ({ ...prev, [sectionId]: open }));
  }, []);

  // Container classes (defined early for skeleton)
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-3xl mx-auto';

  // Loading state
  if (query?.isLoading) {
    return (
      <div className={cn(containerClasses, className)} data-theme={theme}>
        {skeleton || <SectionedFormSkeleton sections={sections.length} />}
      </div>
    );
  }

  const data = query?.data as TData | undefined;

  // Resolve slot content - handle both TData and TData | undefined
  const resolveSlot = (
    slot: React.ReactNode | ((data: TData) => React.ReactNode) | undefined
  ): React.ReactNode => {
    if (!slot) return null;
    if (typeof slot === 'function') {
      // Only call if data is defined
      return data !== undefined ? slot(data) : null;
    }
    return slot;
  };

  // Resolve description
  const resolvedDescription = description
    ? typeof description === 'function'
      ? (description as (data: unknown) => string)(data)
      : description
    : undefined;

  // Container classes
  const classes = getContainerClasses(containerVariant);
  const cardContainerClasses = containerVariant === 'shell' ? '' : 'bg-card rounded-xl border border-border overflow-hidden';
  const headerSectionClasses = classes.header || 'p-4 sm:p-6 border-b border-border bg-muted/30';
  const contentSectionClasses = containerVariant === 'shell' ? 'space-y-4' : 'p-4 sm:p-6 space-y-4';

  return (
    <>
      <div
        className={cn(containerClasses, 'outline-none', className)}
        data-theme={theme}
        data-testid={testId}
      >
        <div className={cardContainerClasses}>
          {/* Header Section */}
          <div className={headerSectionClasses}>
            <div className="flex items-center justify-between gap-4">
              <PageHeader
                title={title}
                description={resolvedDescription}
                backHref={backHref}
                backLabel={backLabel || labels.backLabel}
                onBack={backHref ? handleBack : undefined}
              />
              {headerAction}
            </div>
          </div>

          {/* Content Section */}
          <div className={contentSectionClasses}>
            {/* Before Alert Slot */}
            {resolveSlot(slots?.beforeAlert)}

            {/* Warning Alert */}
            {alert && (
              <SectionAlert config={alert} data={data} animationDelay={1} />
            )}

            {/* After Alert Slot */}
            {resolveSlot(slots?.afterAlert)}

            {/* Form Error Summary */}
            {showErrors && hasErrors && (
              <div className="portal-animate-in">
                {slots?.errors
                  ? typeof slots.errors === 'function'
                    ? slots.errors(form.formState.errors as Record<string, { message?: string }>)
                    : slots.errors
                  : (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive">
                      <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                        {errorMessages.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* Sections */}
            <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
              {sections.map((section, index) => (
                <FormSection
                  key={section.id}
                  section={section}
                  form={form}
                  data={data}
                  open={sectionStates[section.id]}
                  onOpenChange={(open) => toggleSection(section.id, open)}
                  fieldColumns={fieldColumns}
                  fieldGap={fieldGap}
                  onFieldChange={handleFieldChange}
                  animationDelay={index + 1}
                />
              ))}

              {/* After Sections Slot */}
              {resolveSlot(slots?.afterSections)}

              {/* Form-level Error */}
              {form.formState.errors.root && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive">
                  <p className="text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border portal-animate-in portal-animate-in-delay-3">
                {/* Left: Extra slot + Status */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {resolveSlot(slots?.footerExtra)}
                  {isDirty && (
                    <span className="text-amber-500">{labels.unsavedIndicator}</span>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex gap-3 w-full sm:w-auto">
                  {secondaryAction && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={secondaryAction.onClick}
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                  >
                    {labels.cancelText}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || (!isDirty && !primaryAction?.loading)}
                    loading={isSubmitting || primaryAction?.loading}
                    className="flex-1 sm:flex-none sm:min-w-[140px]"
                  >
                    {isSubmitting ? labels.loadingText : (primaryAction?.label || labels.submitText)}
                  </Button>
                </div>
              </div>
            </form>

            {/* Success Alert */}
            {successAlert && (
              <SectionAlert config={successAlert} data={data} animationDelay={3} />
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <PageConfirmDialog
        open={showLeaveDialog}
        onOpenChange={(open) => !open && cancelNavigation()}
        title={labels.unsavedChangesTitle}
        description={labels.unsavedChangesDescription}
        variant="warning"
        confirmText={labels.leaveWithoutSaving}
        cancelText={labels.keepEditing}
        onConfirm={confirmNavigation}
      />
    </>
  );
}

SectionedFormPage.displayName = 'SectionedFormPage';
