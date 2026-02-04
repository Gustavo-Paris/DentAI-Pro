/**
 * FormPage Composite
 *
 * Full-page form with react-hook-form integration, navigation guard,
 * keyboard shortcuts, auto-save, and mobile-friendly sticky footer.
 *
 * @module form/FormPage
 */

'use client';

import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import {
  cn,
  useFormModalShortcuts,
  type Shortcut,
} from '@pageshell/core';
import {
  Button,
  PageConfirmDialog,
  resolveIcon,
} from '@pageshell/primitives';
import { PageHeader } from '@pageshell/layouts';
import type { FormPageProps } from './types';
import { FormField } from './FormField';
import { FormErrorSummary } from './components';
import { useFormPageLogic } from './hooks';
import { GenericSkeleton } from '../shared/components';
import { getContainerClasses } from '../shared/styles';
import { formPageDefaults } from './defaults';

// =============================================================================
// Form Page Component
// =============================================================================

/**
 * Declarative form page composite with premium features.
 *
 * @example
 * ```tsx
 * <FormPage
 *   title="Edit Profile"
 *   backHref="/settings"
 *   defaultValues={{ name: '', email: '' }}
 *   fields={[
 *     { name: 'name', type: 'text', label: 'Name', required: true },
 *     { name: 'email', type: 'email', label: 'Email', required: true },
 *   ]}
 *   mutation={updateProfileMutation}
 *   onSuccess={() => router.push('/settings')}
 * />
 * ```
 */
export function FormPage<TValues extends FieldValues = FieldValues>(
  props: FormPageProps<TValues>
) {
  const {
    // Base
    theme = formPageDefaults.theme,
    containerVariant = formPageDefaults.containerVariant,
    className,
    // Header
    title,
    description,
    backHref,
    backLabel = formPageDefaults.backLabel,
    // Declarative mode
    defaultValues,
    onSubmit,
    mutation,
    transformPayload,
    onSuccess,
    successRedirect,
    onError,
    // Controlled mode
    form: externalForm,
    // Data loading
    query,
    // Override props
    isSubmitting: isSubmittingProp,
    isValid: isValidProp,
    isDirty: isDirtyProp,
    showErrors = false,
    formatError,
    // Labels
    submitText = formPageDefaults.submitText,
    submitLabel,
    cancelHref,
    cancelText = formPageDefaults.cancelText,
    cancelLabel,
    loadingText = formPageDefaults.loadingText,
    // Behavior
    warnOnUnsavedChanges = formPageDefaults.warnOnUnsavedChanges,
    navigationGuard,
    stickyFooter = false,
    autoSave,
    // Fields
    fields,
    sections,
    sectionLayout = 'inline',
    layout,
    fieldGap = 4,
    columnGap = 4,
    // Shortcuts
    shortcuts = [],
    disableDefaultShortcuts = false,
    // Slots
    slots,
    skeleton,
    footerSlot,
    onCancel,
    // Content
    children,
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Resolve label aliases
  const finalSubmitText = submitLabel || submitText;
  const finalCancelText = cancelLabel || cancelText;
  const shouldWarnOnUnsavedChanges = warnOnUnsavedChanges || navigationGuard;

  // =========================================================================
  // Form Page Logic Hook
  // =========================================================================

  const formLogic = useFormPageLogic<TValues>({
    form: externalForm,
    defaultValues,
    queryData: query?.data as TValues | undefined,
    onSubmit,
    mutation,
    transformPayload,
    onSuccess,
    successRedirect,
    onError,
    warnOnUnsavedChanges: shouldWarnOnUnsavedChanges,
    backHref,
    cancelHref,
    onCancel,
    autoSave,
    formatError,
  });

  const {
    form,
    isSubmitting: hookIsSubmitting,
    isValid: hookIsValid,
    isDirty: hookIsDirty,
    hasErrors,
    errorMessages,
    handleFormSubmit,
    handleFieldChange,
    handleCancel,
    handleBack,
    showLeaveDialog,
    confirmNavigation,
    cancelNavigation,
    autoSaveStatus,
  } = formLogic;

  // Allow prop overrides for form state
  const isSubmitting = isSubmittingProp ?? hookIsSubmitting;
  const isValid = isValidProp ?? hookIsValid;
  const isDirty = isDirtyProp ?? hookIsDirty;
  const formState = form?.formState;

  // =========================================================================
  // Keyboard Shortcuts
  // =========================================================================

  const defaultShortcuts: Shortcut[] = disableDefaultShortcuts
    ? []
    : [
        {
          key: 's',
          modifiers: ['cmd'],
          action: async () => {
            await handleFormSubmit();
          },
          when: () => !isSubmitting && isValid,
        },
        {
          key: 'Escape',
          action: handleCancel,
          when: () => !isSubmitting && (!!cancelHref || !!backHref || !!onCancel),
        },
      ];

  useFormModalShortcuts({
    shortcuts: [...defaultShortcuts, ...shortcuts],
    enabled: true,
    scope: containerRef,
  });

  // =========================================================================
  // Loading State
  // =========================================================================

  // Container classes for loading state (defined early for skeleton)
  const loadingContainerClasses = containerVariant === 'shell' ? '' : 'max-w-3xl mx-auto';

  if (query?.isLoading) {
    return skeleton || (
      <GenericSkeleton
        pattern="form"
        fields={4}
        showSubmit
        className={loadingContainerClasses}
      />
    );
  }

  // =========================================================================
  // Render Fields
  // =========================================================================

  const renderFields = () => {
    if (!fields || !form) {
      return children;
    }

    const values = form.getValues() as Record<string, unknown>;
    const errors = (formState?.errors || {}) as Record<string, { message?: string } | undefined>;

    const fieldElements = fields.map((field) => {
      const fieldName = field.name as string;
      // Handle both hidden and showWhen (showWhen is inverted hidden)
      const hiddenByHidden = typeof field.hidden === 'function' ? field.hidden(values as TValues) : field.hidden;
      const hiddenByShowWhen = field.showWhen ? !field.showWhen(values as TValues) : false;
      const isHidden = hiddenByHidden || hiddenByShowWhen;
      if (isHidden) return null;

      if (field.render) {
        return (
          <div key={fieldName}>
            {field.render(field, { values: values as TValues, errors, handleChange: handleFieldChange })}
          </div>
        );
      }

      const fieldError = errors[fieldName];
      const errorMessage = fieldError?.message;

      return (
        <FormField
          key={fieldName}
          field={field as unknown as Parameters<typeof FormField>[0]['field']}
          value={values[fieldName]}
          error={errorMessage}
          values={values}
          onChange={handleFieldChange}
        />
      );
    });

    // Render with sections
    if (sections && sections.length > 0) {
      return sections.map((section) => {
        const sectionIcon = section.icon ? resolveIcon(section.icon) : null;
        const SectionIcon = sectionIcon;

        const sectionContent = (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-2">
              {SectionIcon && <SectionIcon className="h-5 w-5 text-muted-foreground" />}
              <h2 className="text-lg font-semibold">{section.title}</h2>
            </div>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
            <div className={cn('space-y-4', `gap-${fieldGap}`)}>
              {fieldElements.filter((el) => el !== null)}
            </div>
          </div>
        );

        if (sectionLayout === 'cards') {
          return (
            <div key={section.id} className="rounded-lg border border-border bg-card p-6">
              {sectionContent}
            </div>
          );
        }

        return sectionContent;
      });
    }

    // Render without sections
    return (
      <div className={cn('space-y-4', `gap-${fieldGap}`)}>
        {fieldElements}
      </div>
    );
  };

  // =========================================================================
  // Render
  // =========================================================================

  const resolvedDescription = description
    ? typeof description === 'function'
      ? description(query?.data)
      : description
    : undefined;

  // Container classes based on variant
  const classes = getContainerClasses(containerVariant);
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-3xl mx-auto';
  const cardContainerClasses = classes.card;
  const headerSectionClasses = classes.header;
  const contentSectionClasses = classes.content;

  return (
    <>
      <div
        ref={containerRef}
        tabIndex={-1}
        className={cn(containerClasses, 'outline-none', className)}
        data-theme={theme}
      >
        <div className={cardContainerClasses}>
          {/* Header Section */}
          <div className={headerSectionClasses}>
            <PageHeader
              title={title}
              description={resolvedDescription}
              backHref={backHref}
              backLabel={backLabel}
              onBack={backHref ? handleBack : undefined}
            />
          </div>

          {/* Content Section */}
          <div className={contentSectionClasses}>
            {/* Error Summary */}
            {showErrors && hasErrors && (
              <div>
                {slots?.errors
                  ? typeof slots.errors === 'function'
                    ? slots.errors(formState?.errors as Record<string, { message?: string }>)
                    : slots.errors
                  : <FormErrorSummary errors={errorMessages} />}
              </div>
            )}

            {/* Before Content Slot */}
            {slots?.beforeContent}

            {/* Form Content */}
            {sectionLayout === 'cards' && sections && sections.length > 0 ? (
              <div className="space-y-6">
                {renderFields()}
              </div>
            ) : (
              <div>
                {renderFields()}
              </div>
            )}

            {/* After Content Slot */}
            {slots?.afterContent}

            {/* Footer */}
            <div
              className={cn(
                'flex gap-3 pt-4 border-t border-border',
                'flex-col sm:flex-row sm:items-center sm:justify-between',
                stickyFooter && [
                  'fixed bottom-0 left-0 right-0 z-40',
                  'bg-background/95 backdrop-blur-sm',
                  'px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]',
                  'shadow-md',
                  'sm:static sm:z-auto sm:bg-transparent sm:backdrop-blur-none',
                  'sm:px-0 sm:pb-0 sm:shadow-none',
                ]
              )}
            >
              {/* Left: Extra actions + Status */}
              <div className={cn(
                'flex items-center gap-4 text-sm text-muted-foreground',
                stickyFooter && 'hidden sm:flex'
              )}>
                {slots?.footerExtra || footerSlot}
                {typeof autoSave === 'object' && autoSave.enabled && (
                  <>
                    {autoSaveStatus === 'saving' && <span>Saving...</span>}
                    {autoSaveStatus === 'saved' && <span className="text-emerald-500">Saved</span>}
                    {autoSaveStatus === 'error' && <span className="text-destructive">Save failed</span>}
                  </>
                )}
                {isDirty && !(typeof autoSave === 'object' && autoSave.enabled) && (
                  <span className="text-amber-500">Unsaved changes</span>
                )}
              </div>

              {/* Right: Actions */}
              <div className={cn(
                'flex gap-3',
                stickyFooter ? 'flex-col-reverse sm:flex-row' : 'items-center'
              )}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className={cn(stickyFooter && 'h-11 flex-1 sm:flex-none sm:h-auto')}
                >
                  {finalCancelText}
                </Button>
                <Button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting || !isValid}
                  loading={isSubmitting}
                  className={cn(stickyFooter && 'h-11 flex-1 sm:flex-none sm:h-auto')}
                >
                  {isSubmitting ? loadingText : finalSubmitText}
                </Button>
              </div>
            </div>

            {/* Spacer for mobile sticky footer */}
            {stickyFooter && <div className="h-28 sm:hidden" aria-hidden="true" />}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      <PageConfirmDialog
        open={showLeaveDialog}
        onOpenChange={(open) => !open && cancelNavigation()}
        title="Unsaved changes"
        description="You have unsaved changes. Are you sure you want to leave?"
        variant="warning"
        confirmText="Leave without saving"
        cancelText="Keep editing"
        onConfirm={confirmNavigation}
      />
    </>
  );
}

FormPage.displayName = 'FormPage';
