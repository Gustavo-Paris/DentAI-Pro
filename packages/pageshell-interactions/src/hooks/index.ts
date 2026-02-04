'use client';

// =============================================================================
// Clipboard Hook
// =============================================================================

export {
  useClipboard,
  type UseClipboardOptions,
  type UseClipboardReturn,
} from './useClipboard';

// =============================================================================
// Modal Form Reset Hook
// =============================================================================

export { useModalFormReset } from './useModalFormReset';

// =============================================================================
// Streaming Text Hook
// =============================================================================

export {
  useStreamingText,
  type StreamingTextOptions,
  type StreamingTextResult,
} from './useStreamingText';

// =============================================================================
// Dismissed Alerts Hook
// =============================================================================

export {
  useDismissedAlerts,
  type DismissableAlert,
  type UseDismissedAlertsOptions,
  type UseDismissedAlertsReturn,
} from './useDismissedAlerts';

// =============================================================================
// Form Draft Hook
// =============================================================================

export {
  useFormDraft,
  formatLastSaved,
  type UseFormDraftOptions,
  type UseFormDraftReturn,
  type FormatLastSavedLabels,
} from './useFormDraft';
