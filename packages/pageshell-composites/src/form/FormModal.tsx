/**
 * FormModal Composite
 *
 * Modal wrapper for forms with declarative field configuration.
 * Supports both controlled mode (open/onOpenChange) and trigger mode.
 * With react-hook-form integration for advanced validation.
 *
 * @module form/FormModal
 */

'use client';

import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import {
  useFormModalFocus,
  useFormModalShortcuts,
  useIsMobile,
  type Shortcut,
} from '@pageshell/core';
import {
  Skeleton,
  PageAlert,
  FocusGlow,
  AnimatedFields,
  BottomSheet,
  PageModal,
  PageModalFooter,
} from '@pageshell/primitives';
import { cn } from '../shared/utils';
import type { FormModalProps } from './types';
import { resolveDescription } from '../shared/types';
import { FormField } from './FormField';
import { FormErrorSummary } from './components/FormErrorSummary';
import { glassModalVariants } from './FormModal.styles';
import { useFormModalLogic } from './hooks';

// =============================================================================
// Types
// =============================================================================

type ComponentTheme = 'admin' | 'creator' | 'student' | undefined;

// =============================================================================
// Utilities
// =============================================================================

/**
 * Normalize theme for components that don't support 'default'
 */
function normalizeTheme(theme: string | undefined): ComponentTheme {
  if (theme === 'default' || !theme) return undefined;
  return theme as ComponentTheme;
}

// =============================================================================
// Form Modal Component
// =============================================================================

/**
 * Declarative form modal composite with full API parity.
 *
 * Supports three modes:
 * - **Full Declarative**: trigger + fields + mutation (recommended)
 * - **Controlled with Form**: open/onOpenChange + form + fields + mutation
 * - **Trigger mode**: trigger + fields + defaultValues + mutation
 *
 * @example Full declarative (recommended)
 * ```tsx
 * <FormModal
 *   trigger={<Button>Create User</Button>}
 *   title="Create User"
 *   fields={[{ type: 'text', name: 'email', label: 'Email' }]}
 *   defaultValues={{ email: '' }}
 *   mutation={createUserMutation}
 *   successMessage="User created!"
 * />
 * ```
 *
 * @example Controlled with form
 * ```tsx
 * const form = useForm<UserForm>();
 * <FormModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   form={form}
 *   title="Edit User"
 *   fields={fields}
 *   mutation={updateUserMutation}
 * />
 * ```
 */
export function FormModal<
  TValues extends FieldValues = FieldValues,
  TPayload = TValues,
>(props: FormModalProps<TValues, TPayload>) {
  const {
    // Modal state
    open: openProp,
    onOpenChange: onOpenChangeProp,
    trigger,
    // Modal config
    size = 'md',
    icon,
    showHeaderDivider = false,
    closeOnSuccess = true,
    resetOnClose = true,
    // Visual variants
    variant = 'default',
    animateFields = false,
    showErrorSummary = false,
    // Mobile behavior
    mobileMode = 'modal',
    sheetSnapPoints,
    // Base
    title,
    description,
    className,
    // Data
    query,
    // Fields
    fields,
    // Mutation
    mutation,
    // Direct submit props (alternative to mutation)
    onSubmit,
    isSubmitting: isSubmittingProp,
    isSubmitDisabled,
    // Defaults
    defaultValues,
    // Transform
    transformPayload,
    // Callbacks
    onSuccess,
    onError,
    onCancel,
    onSuccessNavigate,
    // Feedback
    successMessage,
    errorMessage,
    // Navigation
    redirectTo,
    routeParams,
    refreshOnSuccess,
    redirectDelay = 0,
    // Labels
    submitLabel,
    cancelLabel,
    submitText,
    loadingText = 'Saving...',
    cancelText,
    // Slots
    skeleton,
    footerSlot,
    footerLeftContent,
    // Content
    children,
    // react-hook-form integration
    form: formProp,
    // Focus management
    autoFocus = true,
    autoFocusSelector,
    containerRef: containerRefProp,
    // Keyboard shortcuts
    shortcuts = [],
    disableDefaultShortcuts = false,
    // Slots
    slots,
    // Theme (from CompositeBaseProps)
    theme,
    // Value change callback
    onValuesChange,
  } = props;

  // Mobile detection
  const isMobile = useIsMobile();

  // Container ref for focus management
  const internalContainerRef = React.useRef<HTMLDivElement>(null);
  const containerRef = containerRefProp ?? internalContainerRef;

  // ===========================================================================
  // Form Modal Logic Hook
  // ===========================================================================

  const modalLogic = useFormModalLogic<TValues, TPayload>(
    {
      open: openProp,
      onOpenChange: onOpenChangeProp,
      form: formProp,
      defaultValues,
      fields,
      queryData: query?.data as TValues | undefined,
      mutation,
      onSubmit,
      isSubmitting: isSubmittingProp,
      transformPayload,
      onSuccess,
      onError,
      onCancel,
      onSuccessNavigate,
      onValuesChange,
      closeOnSuccess,
      resetOnClose,
      redirectTo,
      routeParams,
      refreshOnSuccess,
      redirectDelay,
      successMessage,
      sheetSnapPoints,
    },
    containerRef
  );

  const {
    open,
    showSuccess,
    isPending,
    form,
    values,
    errors,
    handleOpenChange,
    handleSubmit,
    handleCancel,
    handleChange,
    handleTriggerOpen,
    handleTriggerKeyDown,
    handleFooterSubmit,
    bottomSheet,
  } = modalLogic;

  // Resolve labels (aliases)
  const resolvedSubmitLabel = submitText || submitLabel || 'Save';
  const resolvedCancelLabel = cancelText || cancelLabel || 'Cancel';

  // ===========================================================================
  // Focus Management & Keyboard Shortcuts
  // ===========================================================================

  // Auto-focus first field when modal opens
  useFormModalFocus({
    containerRef,
    selector: autoFocusSelector,
    delayMs: 100,
    disabled: !autoFocus || !open,
  });

  // Default shortcuts (Escape to close, Cmd+Enter to submit)
  const defaultShortcuts: Shortcut[] = disableDefaultShortcuts
    ? []
    : [
        { key: 'Escape', action: () => handleOpenChange(false) },
        {
          key: 'Enter',
          modifiers: ['cmd'],
          action: () => handleFooterSubmit(),
          when: () => !isPending,
        },
      ];

  // Keyboard shortcuts
  useFormModalShortcuts({
    shortcuts: [...defaultShortcuts, ...shortcuts],
    enabled: open,
    scope: containerRef,
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  const mutationError = mutation?.isError
    ? errorMessage ??
      mutation?.error?.message ??
      'An error occurred. Please try again.'
    : null;

  // ===========================================================================
  // Error Summary
  // ===========================================================================

  const fieldErrorsList = React.useMemo(() => {
    if (!showErrorSummary) return [];
    return Object.entries(errors)
      .filter(([, fieldError]) => fieldError?.message)
      .map(([fieldName, fieldError]) => ({
        field: fieldName,
        message: fieldError?.message as string,
      }));
  }, [showErrorSummary, errors]);

  // ===========================================================================
  // Render
  // ===========================================================================

  // Disable field animations on mobile sheet - BottomSheet already has entrance animation
  const shouldAnimateFields = animateFields && !(isMobile && mobileMode === 'sheet');

  // Glass variant styling
  const isGlass = variant === 'glass';

  // ===========================================================================
  // Alerts Content
  // ===========================================================================

  const alertsContent = (
    <>
      {showSuccess && successMessage && (
        <PageAlert
          variant="success"
          title="Success"
          description={successMessage}
          className="mb-4"
        />
      )}
      {mutationError && (
        <PageAlert
          variant="error"
          title="Error"
          description={mutationError}
          className="mb-4"
        />
      )}
      {showErrorSummary && fieldErrorsList.length > 0 && (
        <FormErrorSummary errors={fieldErrorsList} animate className="mb-4" />
      )}
    </>
  );

  // ===========================================================================
  // Form Fields Content
  // ===========================================================================

  const formFieldsContent = fields ? (
    <>
      {fields.map((field) => {
        const fieldError = errors[field.name as string];
        return (
          <FormField
            key={field.name as string}
            field={field}
            value={values[field.name as keyof TValues]}
            error={fieldError?.message as string | undefined}
            values={values}
            onChange={handleChange}
          />
        );
      })}
    </>
  ) : null;

  // Wrap with AnimatedFields if enabled
  const animatedFormFields = shouldAnimateFields ? (
    <AnimatedFields staggerMs={50}>{formFieldsContent}</AnimatedFields>
  ) : (
    <div className="space-y-4">{formFieldsContent}</div>
  );

  // Wrap with FocusGlow if glass variant
  const styledFormFields = isGlass ? (
    <FocusGlow theme={normalizeTheme(theme)}>{animatedFormFields}</FocusGlow>
  ) : (
    animatedFormFields
  );

  // ===========================================================================
  // Content Wrapper
  // ===========================================================================

  const contentWrapper = (
    <div ref={containerRef}>
      {alertsContent}
      {/* Before Fields Slot */}
      {slots?.beforeFields && (
        <div className="mb-4 pb-4 border-b border-border space-y-4">
          {slots.beforeFields}
        </div>
      )}
      {styledFormFields}
      {/* After Fields Slot */}
      {slots?.afterFields && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {slots.afterFields}
        </div>
      )}
      {/* Children (additional content) */}
      {children}
    </div>
  );

  // ===========================================================================
  // Footer Content
  // ===========================================================================

  const footerContent = slots?.footer ?? (
    <PageModalFooter
      onCancel={handleCancel}
      onSubmit={handleFooterSubmit}
      isSubmitting={isPending}
      cancelText={resolvedCancelLabel}
      submitText={resolvedSubmitLabel}
      loadingText={loadingText}
      leftContent={footerLeftContent}
    />
  );

  // ===========================================================================
  // Trigger Element
  // ===========================================================================

  const triggerElement = trigger ? (
    <span
      onClick={handleTriggerOpen}
      onKeyDown={handleTriggerKeyDown}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      {trigger}
    </span>
  ) : null;

  // ===========================================================================
  // Render: Mobile Bottom Sheet
  // ===========================================================================

  if (isMobile && mobileMode === 'sheet') {
    return (
      <>
        {triggerElement}
        <BottomSheet
          open={open}
          onClose={handleCancel}
          sheetRef={bottomSheet.sheetProps.ref}
          style={bottomSheet.sheetProps.style}
          onTouchStart={bottomSheet.sheetProps.onTouchStart}
          onTouchMove={bottomSheet.sheetProps.onTouchMove}
          onTouchEnd={bottomSheet.sheetProps.onTouchEnd}
          title={title}
          description={description ? resolveDescription(description, query?.data) : undefined}
          theme={normalizeTheme(theme)}
          handle={slots?.handle}
          footer={footerContent}
          className={className}
        >
          {query?.isLoading ? (
            skeleton || (
              <div className="space-y-4 py-4">
                {Array.from({ length: fields?.length || 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {contentWrapper}
            </form>
          )}
        </BottomSheet>
      </>
    );
  }

  // ===========================================================================
  // Render: Desktop Modal
  // ===========================================================================

  return (
    <>
      {triggerElement}
      <PageModal
        open={open}
        onOpenChange={handleOpenChange}
        title={title}
        description={description ? resolveDescription(description, query?.data) : undefined}
        icon={icon}
        size={size}
        theme={normalizeTheme(theme)}
        showHeaderDivider={showHeaderDivider}
        className={cn(isGlass && glassModalVariants({ theme: normalizeTheme(theme), size }), className)}
        footer={footerContent}
      >
        {query?.isLoading ? (
          skeleton || (
            <div className="space-y-4 py-4">
              {Array.from({ length: fields?.length || 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {contentWrapper}
          </form>
        )}
      </PageModal>
    </>
  );
}

FormModal.displayName = 'FormModal';
