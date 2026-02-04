/**
 * Wizard Types
 *
 * Types for wizard and linear flow components
 *
 * @module wizard/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type { PageShellTheme } from '@pageshell/theme';

// =============================================================================
// Wizard Types
// =============================================================================

/**
 * Background variants for wizard pages
 */
export type WizardBackground = 'gradient-mesh' | 'grid' | 'noise' | 'none';

/**
 * Progress indicator display variants
 */
export type WizardProgressVariant = 'bar' | 'dots' | 'steps' | 'stepper';

/**
 * Step status for validation states
 */
export type WizardStepStatus = 'idle' | 'complete' | 'error' | 'warning';

/**
 * Step transition direction
 */
export type WizardTransitionDirection = 'forward' | 'backward' | 'none';

/**
 * Step configuration for wizard
 */
export interface WizardStepConfig {
  /** Step number (1-indexed) */
  id: number;
  /** Step label */
  label: string;
  /** Whether step is optional */
  optional?: boolean;
  /** Step status (for validation display) */
  status?: WizardStepStatus;
  /** Icon variant (e.g., 'check', 'settings', 'user') */
  icon?: IconProp;
  /** Optional description shown in expanded progress */
  description?: string;
}

/**
 * Query result interface for data fetching.
 * Error type is `unknown` to be compatible with tRPC and other query libraries.
 */
export interface WizardQueryResult<TData> {
  data?: TData;
  error?: unknown;
  isLoading: boolean;
  refetch?: () => void;
}

/**
 * Wizard variant props - for multi-step wizards with progress indicators
 */
export interface PageShellWizardProps<TData = unknown> {
  /** Theme variant */
  theme: PageShellTheme;

  // Step Management
  /** Current step number (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step labels for progress indicator */
  stepLabels?: string[];
  /** Full step configuration (alternative to stepLabels) */
  steps?: WizardStepConfig[];
  /** Status for each step (indexed by step number - 1) */
  stepStatuses?: WizardStepStatus[];

  // Header
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Icon variant (e.g., 'rocket', 'wand', 'sparkles') */
  icon?: IconProp;

  // Navigation
  /** Handler for back navigation */
  onBack?: () => void;
  /** Handler for next navigation */
  onNext?: () => void;
  /** Back button label */
  backLabel?: string;
  /** Next button label */
  nextLabel?: string;
  /** Whether to show skip option */
  showSkip?: boolean;
  /** Handler for skip */
  onSkip?: () => void;
  /** Skip button label */
  skipLabel?: string;
  /** Disable back button */
  backDisabled?: boolean;
  /** Disable next button */
  nextDisabled?: boolean;
  /** Next button loading state */
  nextLoading?: boolean;
  /** Hide navigation footer */
  hideNavigation?: boolean;

  // Validation
  /** Validate current step before proceeding (return true to proceed, false to block) */
  validateStep?: () => boolean | Promise<boolean>;
  /** Error message to show when validation fails */
  validationError?: string;

  // Completion
  /** Handler when wizard reaches final step and user clicks next */
  onComplete?: () => void | Promise<void>;
  /** Completing state (for final step) */
  isCompleting?: boolean;
  /** Complete button label (shown on last step) */
  completeLabel?: string;

  // Jump Navigation
  /** Allow clicking on completed steps to jump back */
  allowJumpToStep?: boolean;
  /** Handler for jumping to a specific step */
  onJumpToStep?: (step: number) => void;

  // Keyboard
  /** Enable keyboard navigation (Arrow keys, Enter, Escape) */
  enableKeyboardNav?: boolean;

  // Scroll Behavior
  /** Scroll to top on step change */
  scrollToTop?: boolean;

  // Transition
  /** Transition direction (for animations) */
  transitionDirection?: WizardTransitionDirection;

  // Progress
  /** Whether to show progress indicator */
  showProgress?: boolean;
  /** Progress indicator variant */
  progressVariant?: WizardProgressVariant;
  /** Show step count (e.g., "Step 2 of 5") */
  showStepCount?: boolean;

  // Background
  /** Background style */
  background?: WizardBackground;

  // Data
  /** Optional tRPC query result */
  query?: WizardQueryResult<TData>;
  /** Loading skeleton */
  skeleton?: ReactNode;

  // Content
  /** Render function or static content */
  children: ReactNode | ((data: TData) => ReactNode);
  /** Additional CSS classes */
  className?: string;
  /** Additional content area CSS classes */
  contentClassName?: string;
}

/**
 * WizardStep component props - for conditional step rendering
 */
export interface WizardStepProps {
  /** Step number this content belongs to */
  step: number;
  /** Step content */
  children: ReactNode;
}

/**
 * WizardProgress component props
 */
export interface WizardProgressProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Step labels */
  stepLabels?: string[];
  /** Full step configuration */
  steps?: WizardStepConfig[];
  /** Status for each step */
  stepStatuses?: WizardStepStatus[];
  /** Display variant */
  variant?: WizardProgressVariant;
  /** Allow clicking on steps to jump */
  allowJump?: boolean;
  /** Handler for jumping to a step */
  onJumpToStep?: (step: number) => void;
  /** Show step count text */
  showStepCount?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * WizardNavigation component props
 */
export interface WizardNavigationProps {
  /** Back handler */
  onBack?: () => void;
  /** Next handler */
  onNext?: () => void;
  /** Skip handler */
  onSkip?: () => void;
  /** Complete handler (for final step) */
  onComplete?: () => void;
  /** Back label */
  backLabel?: string;
  /** Next label */
  nextLabel?: string;
  /** Skip label */
  skipLabel?: string;
  /** Complete label (for final step) */
  completeLabel?: string;
  /** Show skip button */
  showSkip?: boolean;
  /** Disable back */
  backDisabled?: boolean;
  /** Disable next */
  nextDisabled?: boolean;
  /** Next loading state */
  nextLoading?: boolean;
  /** Is this the final step */
  isFinalStep?: boolean;
  /** Is completing (final step loading state) */
  isCompleting?: boolean;
  /** Validation error message */
  validationError?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * WizardBackground component props
 */
export interface WizardBackgroundProps {
  /** Background variant */
  variant: WizardBackground;
  /** Theme for styling */
  theme: PageShellTheme;
}

/**
 * WizardSkeleton component props
 */
export interface WizardSkeletonProps {
  /** Number of steps to show in progress indicator */
  steps?: number;
  /** Whether to show the progress bar */
  showProgress?: boolean;
  /** Number of content placeholder rows */
  contentRows?: number;
  /** Additional CSS classes */
  className?: string;
}
