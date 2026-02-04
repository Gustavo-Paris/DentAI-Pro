/**
 * Form Shared Types
 *
 * Common types used by FormPage and FormModal.
 *
 * @module form/types/shared
 */

import type { ReactNode } from 'react';

// =============================================================================
// Mutation Interface
// =============================================================================

/**
 * Mutation interface compatible with tRPC, React Query, and similar libraries.
 */
export interface MutationLike<TInput = unknown, TOutput = unknown> {
  mutateAsync: (input: TInput) => Promise<TOutput>;
  isPending?: boolean;
  isError?: boolean;
  error?: { message?: string } | null;
  reset?: () => void;
}

// =============================================================================
// FormPage Slots
// =============================================================================

/**
 * Slot overrides for FormPage
 */
export interface FormPageSlots {
  /**
   * Custom error summary rendering.
   * Can be a static ReactNode or a function receiving errors.
   */
  errors?: ReactNode | ((errors: Record<string, { message?: string }>) => ReactNode);
  /** Content rendered before the main form card */
  beforeContent?: ReactNode;
  /** Content rendered after the main form card */
  afterContent?: ReactNode;
  /**
   * Extra actions in footer (left side, before status indicators).
   * Example: "Save as Draft" button, "Preview" button
   */
  footerExtra?: ReactNode;
}
