/**
 * ProgressiveExtractionPage Types
 *
 * Type definitions for the ProgressiveExtractionPage composite.
 *
 * @module progressive-extraction/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type { CompositeBaseProps, CompositeQueryResult } from '../shared/types';

// =============================================================================
// Field Types
// =============================================================================

/**
 * Field variant for automatic styling
 * - title: Large bold text (h2 style)
 * - text: Regular muted text
 * - multiline: Text with preserved line breaks
 * - tags: Array rendered as muted badges
 * - badges: Array rendered as primary-tinted badges
 * - score: Value mapped to styled card via scoreConfig
 * - custom: Use render function
 */
export type ExtractionFieldVariant =
  | 'title'
  | 'text'
  | 'multiline'
  | 'tags'
  | 'badges'
  | 'score'
  | 'custom';

/**
 * Score config for 'score' variant
 * Maps field values to visual styling
 */
export interface ScoreConfig {
  [value: string]: {
    label: string;
    icon?: string;
    bgClass: string;
    textClass: string;
  };
}

/**
 * Field configuration for extraction phase
 */
export interface ExtractionField<TData> {
  /** Unique field key (also used to get value from data if no render) */
  key: string;
  /** Field label */
  label: string;
  /**
   * Field variant for automatic styling (default: inferred from key or 'text')
   */
  variant?: ExtractionFieldVariant;
  /** Custom render function (overrides variant) */
  render?: (data: TData) => ReactNode;
  /** Skeleton height (default: inferred from variant) */
  skeletonSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Empty state text when value is falsy */
  emptyText?: string;
  /** Show field only when extraction is complete */
  showOnlyWhenComplete?: boolean;
  /** Custom condition to show field */
  showWhen?: (data: TData, isExtracting: boolean) => boolean;

  // === Score variant options ===
  /** Config mapping values to styles (required for variant='score') */
  scoreConfig?: ScoreConfig;
  /** Key for reasoning/description text below score (optional) */
  reasoningKey?: string;
}

// =============================================================================
// Input Phase Types
// =============================================================================

/**
 * Input phase configuration
 */
export interface InputPhaseConfig {
  /** Input label */
  label: string;
  /** Input placeholder */
  placeholder?: string;
  /** Minimum input length */
  minLength?: number;
  /** Hint text below input */
  hint?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Submit button icon - accepts string name or ComponentType */
  submitIcon?: IconProp;
  /** Number of textarea rows */
  rows?: number;
  /** Submit handler - returns the created entity ID (alternative to createEndpoint) */
  onSubmit?: (text: string) => Promise<string>;
  /** Is submission in progress */
  isSubmitting?: boolean;
  /** tRPC mutation endpoint for creating entity */
  createEndpoint?: {
    useMutation: () => {
      mutateAsync: (input: { rawText: string }) => Promise<unknown>;
      isPending: boolean;
    };
  };
  /** Success message to show after creation */
  successMessage?: string;
  /** Extract ID from mutation result */
  getIdFromResult?: (result: unknown) => string;
}

// =============================================================================
// Extraction Phase Types
// =============================================================================

/**
 * Footer action configuration
 */
export interface FooterAction {
  /** Action label */
  label: string;
  /** Action icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Button variant */
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'primary';
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Only show when extraction is complete (default: true for primary variant) */
  requiresComplete?: boolean;
}

/**
 * Complete action configuration
 */
export interface CompleteActionConfig<TData> {
  /** Action label */
  label: string;
  /** Action icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Click handler */
  onClick: (data: TData) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Extraction phase configuration
 *
 * Smart defaults for common extraction patterns:
 * - statusKey: 'extractionStatus' (field to read status from)
 * - extractingStatuses: ['pending', 'extracting', 'enriching']
 * - completeStatus: 'complete'
 * - pollInterval: 1000ms
 */
export interface ExtractionPhaseConfig<TData, TStatus = string> {
  /** Query result (compatible with tRPC/React Query/SWR) */
  query: CompositeQueryResult<TData>;

  // === Smart Defaults API ===
  /** Key to read status from data (default: 'extractionStatus') */
  statusKey?: string;
  /** Statuses that indicate extraction is in progress (default: ['pending', 'extracting', 'enriching']) */
  extractingStatuses?: TStatus[];
  /** Status that indicates extraction is complete (default: 'complete') */
  completeStatus?: TStatus;

  // === Custom status API (override defaults) ===
  /** Extract status from data (default: data?.[statusKey]) */
  getExtractionStatus?: (data: TData | undefined) => TStatus | undefined;
  /** Check if currently extracting (default: extractingStatuses.includes(status)) */
  isExtracting?: (status: TStatus | undefined) => boolean;
  /** Check if extraction is complete (default: status === completeStatus) */
  isComplete?: (status: TStatus | undefined) => boolean;

  /** Polling interval in ms (default: 1000) */
  pollInterval?: number;
  /** Status indicator config */
  statusConfig?: Record<string, { label: string }>;
  /** Fields to display */
  fields: ExtractionField<TData>[];
  /** Action when complete (single action) */
  completeAction?: CompleteActionConfig<TData>;
  /** Footer actions (multiple actions - replaces completeAction if provided) */
  footerActions?: FooterAction[];
  /** Back to list button label */
  backToListLabel?: string;
  /**
   * Make footer actions sticky at the bottom on mobile
   * @default false
   */
  stickyFooter?: boolean;
}

// =============================================================================
// Slots
// =============================================================================

/**
 * Slots for customization
 */
export interface ProgressiveExtractionPageSlots {
  /** Before input field in input phase */
  beforeInput?: ReactNode;
  /** After input field in input phase */
  afterInput?: ReactNode;
  /** Before fields in extraction phase */
  beforeFields?: ReactNode;
  /** After fields in extraction phase */
  afterFields?: ReactNode;
  /** Custom footer */
  footer?: ReactNode;
}

// =============================================================================
// Main Props
// =============================================================================

/**
 * ProgressiveExtractionPage component props
 *
 * @template TData - The data type returned by the query
 * @template TStatus - The extraction status type
 */
export interface ProgressiveExtractionPageProps<TData, TStatus = string>
  extends CompositeBaseProps {
  /** Page title */
  title: string;
  /** Back navigation href */
  backHref: string;
  /** Back button click handler */
  onBack?: () => void;
  /** Cancel button click handler */
  onCancel?: () => void;
  /** Input phase configuration */
  inputPhase: InputPhaseConfig;
  /** Extraction phase configuration */
  extractionPhase: ExtractionPhaseConfig<TData, TStatus>;
  /** Slot overrides */
  slots?: ProgressiveExtractionPageSlots;
  /** Entity ID (if already created) */
  entityId?: string | null;
  /** Callback when entity is created */
  onEntityCreated?: (id: string) => void;
}
