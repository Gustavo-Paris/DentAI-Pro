/**
 * LinearFlowPage Types
 *
 * Type definitions for the LinearFlowPage composite.
 *
 * @module linear-flow/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  EmptyStateConfig,
} from '../shared/types';

// =============================================================================
// Step Types
// =============================================================================

/**
 * Step status
 */
export type StepStatus = 'completed' | 'current' | 'upcoming';

/**
 * Step configuration
 */
export interface StepConfig {
  /** Unique step identifier */
  id: string;
  /** Step label */
  label: string;
  /** Step icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Step description */
  description?: string;
  /** Step status (auto-inferred if not provided) */
  status?: StepStatus;
}

// =============================================================================
// Slots
// =============================================================================

/**
 * LinearFlowPage slots for customization
 */
export interface LinearFlowPageSlots<TData> {
  /** Content before progress indicator */
  beforeProgress?: ReactNode;
  /** Custom progress indicator */
  progress?: ReactNode | ((steps: StepConfig[], currentStep: string) => ReactNode);
  /** Content after progress indicator */
  afterProgress?: ReactNode;
  /** Content before main content */
  beforeContent?: ReactNode;
  /** Content after main content */
  afterContent?: ReactNode;
  /** Custom footer */
  footer?: ReactNode;
}

// =============================================================================
// LinearFlowPage Props
// =============================================================================

/**
 * LinearFlowPage component props
 *
 * @template TData - The data type returned by the query
 */
export interface LinearFlowPageProps<TData = unknown>
  extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Page icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Label above title */
  label?: string;

  // ---------------------------------------------------------------------------
  // Steps
  // ---------------------------------------------------------------------------

  /**
   * Step definitions
   */
  steps: StepConfig[];

  /**
   * Current step identifier
   */
  currentStep: string;

  /**
   * Step click handler
   */
  onStepClick?: (stepId: string) => void;

  /**
   * Allow clicking on steps to navigate
   */
  allowStepNavigation?: boolean | ((stepId: string, currentStepId: string) => boolean);

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  /**
   * Query result
   */
  query?: CompositeQueryResult<TData>;

  /**
   * Check if data is empty
   */
  emptyCheck?: (data: TData) => boolean;

  /**
   * Empty state configuration
   */
  emptyState?: EmptyStateConfig;

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Back navigation href
   */
  backHref?: string;

  /**
   * Back button label
   * @default "Back"
   */
  backLabel?: string;

  /**
   * Back button click handler
   */
  onBack?: () => void;

  // ---------------------------------------------------------------------------
  // Footer Actions
  // ---------------------------------------------------------------------------

  /**
   * Show footer with navigation buttons
   * @default true
   */
  showFooter?: boolean;

  /**
   * Next button click handler
   */
  onNext?: () => void | Promise<void>;

  /**
   * Next button label
   * @default "Continue"
   */
  nextLabel?: string;

  /**
   * Next button loading state
   */
  nextLoading?: boolean;

  /**
   * Next button disabled state
   */
  nextDisabled?: boolean;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: LinearFlowPageSlots<TData>;

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  /**
   * Custom skeleton component
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------

  /**
   * Content render function
   */
  children: (data: TData) => ReactNode;
}
