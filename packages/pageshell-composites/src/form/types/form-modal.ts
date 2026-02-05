/**
 * FormModal Types
 *
 * Type definitions for the FormModal composite.
 *
 * @module form/types/form-modal
 */

import type { ReactNode, RefObject } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { FormPageProps } from './form-page';
import type { MutationLike } from './shared';

// =============================================================================
// FormModal Props
// =============================================================================

/**
 * Props for the FormModal composite.
 *
 * Supports three modes:
 * - **Full Declarative**: trigger + fields + mutation (recommended)
 * - **Controlled with Form**: open/onOpenChange + form + fields + mutation
 * - **Trigger mode**: trigger + fields + defaultValues + mutation
 */
export interface FormModalProps<
  TValues extends FieldValues = FieldValues,
  TPayload = TValues,
> extends Omit<FormPageProps<TValues>, 'navigationGuard' | 'mutation' | 'backHref' | 'backLabel' | 'slots'> {
  // ===========================================================================
  // Modal State (Controlled or Trigger mode)
  // ===========================================================================

  /**
   * Modal open state (controlled mode).
   */
  open?: boolean;

  /**
   * Modal close handler (controlled mode).
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Trigger element that opens the modal when clicked.
   */
  trigger?: ReactNode;

  // ===========================================================================
  // Modal Configuration
  // ===========================================================================

  /**
   * Modal size.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Optional icon before title.
   */
  icon?: ReactNode;

  /**
   * Show divider between header and content.
   * @default false
   */
  showHeaderDivider?: boolean;

  /**
   * Close on successful submit?
   * @default true
   */
  closeOnSuccess?: boolean;

  /**
   * Reset form when modal closes?
   * @default true
   */
  resetOnClose?: boolean;

  // ===========================================================================
  // Visual Variants
  // ===========================================================================

  /**
   * Visual variant.
   * - 'default': Standard modal appearance
   * - 'glass': Glassmorphism effect with blur
   * @default 'default'
   */
  variant?: 'default' | 'glass';

  /**
   * Animate fields on mount.
   * @default false
   */
  animateFields?: boolean;

  /**
   * Show validation error summary above form fields.
   * Displays a consolidated list of all field errors when present.
   * @default false
   */
  showErrorSummary?: boolean;

  // ===========================================================================
  // Mobile Behavior
  // ===========================================================================

  /**
   * Mobile display mode.
   * - 'modal': Standard centered modal
   * - 'sheet': Bottom sheet with drag-to-close
   * @default 'modal'
   */
  mobileMode?: 'modal' | 'sheet';

  /**
   * Snap points for sheet mode (% of viewport height).
   */
  sheetSnapPoints?: number[];

  // ===========================================================================
  // Payload Transform
  // ===========================================================================

  /**
   * Transform form values before sending to mutation.
   */
  transformPayload?: (values: TValues) => TPayload;

  // ===========================================================================
  // Navigation
  // ===========================================================================

  /**
   * URL to redirect after successful submit.
   */
  redirectTo?: string;

  /**
   * Route params for URL interpolation.
   */
  routeParams?: Record<string, string | undefined>;

  /**
   * Refresh router after successful submit.
   */
  refreshOnSuccess?: boolean;

  /**
   * Delay in ms before redirect.
   * @default 0
   */
  redirectDelay?: number;

  /**
   * Callback after successful submit and before navigation.
   */
  onSuccessNavigate?: () => void;

  // ===========================================================================
  // Focus Management
  // ===========================================================================

  /**
   * Auto-focus first field when modal opens.
   * @default true
   */
  autoFocus?: boolean;

  /**
   * Custom selector for auto-focus target.
   */
  autoFocusSelector?: string;

  /**
   * Ref to the form container for focus management.
   */
  containerRef?: RefObject<HTMLDivElement>;

  // ===========================================================================
  // Slots
  // ===========================================================================

  /**
   * Slot overrides for customizing modal sections.
   */
  slots?: {
    /** Custom overlay (backdrop) */
    overlay?: ReactNode;
    /** Custom header content (replaces default header) */
    header?: ReactNode;
    /** Custom footer content (replaces default footer) */
    footer?: ReactNode;
    /** Custom handle for sheet mode */
    handle?: ReactNode;
    /** Content rendered before form fields */
    beforeFields?: ReactNode;
    /** Content rendered after form fields */
    afterFields?: ReactNode;
  };

  /**
   * Additional footer content (left side).
   */
  footerLeftContent?: ReactNode;

  // ===========================================================================
  // Mutation (override with specific type)
  // ===========================================================================

  /**
   * Mutation for form submission.
   * Optional when using onSubmit directly.
   */
  mutation?: MutationLike<TPayload, unknown>;

  /**
   * Disable submit button externally.
   */
  isSubmitDisabled?: boolean;

  /**
   * Custom submit handler (alternative to mutation).
   * Also accepts form.handleSubmit result for backward compatibility.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Intentional: supports both data handler and form.handleSubmit result
  onSubmit?: ((data: TValues) => void | Promise<void>) | ((e?: any) => Promise<void>);

  /**
   * Is form currently submitting (for external control).
   */
  isSubmitting?: boolean;

  // ===========================================================================
  // Value Change Callback
  // ===========================================================================

  /**
   * Callback fired when form values change.
   * Useful for auto-save/draft functionality with useFormDraft.
   *
   * @example
   * ```tsx
   * const [draftValues, setDraftValues] = useState<FormValues>();
   * const { clearDraft, restoreDraft } = useFormDraft({
   *   key: `form-${id}`,
   *   value: draftValues,
   * });
   *
   * <FormModal
   *   defaultValues={restoreDraft() || initialValues}
   *   onValuesChange={setDraftValues}
   *   onSuccess={() => { clearDraft(); }}
   * />
   * ```
   */
  onValuesChange?: (values: TValues) => void;
}
