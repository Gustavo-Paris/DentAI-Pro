/**
 * Wizard Logic Types
 *
 * @module hooks/wizard
 */

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Step validation result
 */
export interface StepValidationResult {
  /** Is step valid */
  valid: boolean;
  /** Validation error message */
  error?: string;
}

// =============================================================================
// Resumable Types
// =============================================================================

/**
 * Resumable progress configuration
 */
export interface WizardResumableConfig<TData = unknown> {
  /** Enable resumable progress */
  enabled: boolean;
  /** localStorage key */
  storageKey: string;
  /** Get current data to save */
  getData?: () => Partial<TData>;
  /** Set data on resume */
  setData?: (data: Partial<TData>) => void;
  /** Called when resuming progress */
  onResume?: (step: number, data: Partial<TData>) => void;
  /** Expiry time in days (default: 7) */
  expiryDays?: number;
}

// =============================================================================
// Hook Options
// =============================================================================

/**
 * useWizardLogic options
 */
export interface UseWizardLogicOptions<TData = unknown> {
  /** Total number of steps */
  totalSteps: number;
  /** Initial step (1-indexed, default: 1) */
  initialStep?: number;

  // Navigation callbacks
  /** Called when going to next step (not on final step) */
  onNext?: () => void | Promise<void>;
  /** Called when going back */
  onBack?: () => void;
  /** Called when completing (on final step) */
  onComplete?: () => void | Promise<void>;
  /** Called when skipping a step */
  onSkip?: () => void;
  /** Called when jumping to a specific step */
  onJumpToStep?: (step: number) => void;

  // Validation
  /** Validate before going next. Return false or throw to prevent navigation */
  validateStep?: (step: number) => boolean | Promise<boolean> | StepValidationResult | Promise<StepValidationResult>;

  // Step configuration
  /** Allow jumping to previous steps */
  allowJumpToStep?: boolean;
  /** Can skip current step */
  canSkip?: boolean;

  // Keyboard
  /** Enable keyboard navigation (arrow keys, enter) */
  enableKeyboardNav?: boolean;

  // Scroll
  /** Scroll to top on step change */
  scrollToTop?: boolean;

  // Resumable
  /** Resumable progress configuration */
  resumable?: WizardResumableConfig<TData>;
}

// =============================================================================
// Hook Return Type
// =============================================================================

/**
 * useWizardLogic return type
 */
export interface UseWizardLogicReturn {
  // State
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Is on final step */
  isFinalStep: boolean;
  /** Is on first step */
  isFirstStep: boolean;
  /** Validation error from last navigation attempt */
  validationError: string | null;
  /** Is validating step */
  isValidating: boolean;
  /** Is navigating (next/complete in progress) */
  isNavigating: boolean;

  // Navigation
  /** Go to next step (or complete if final) */
  goNext: () => Promise<void>;
  /** Go to previous step */
  goBack: () => void;
  /** Skip current step */
  skip: () => void;
  /** Jump to a specific step */
  jumpToStep: (step: number) => void;
  /** Set step directly (use for external control) */
  setStep: (step: number) => void;

  // Computed
  /** Can go to next step */
  canGoNext: boolean;
  /** Can go back */
  canGoBack: boolean;
  /** Can skip */
  canSkip: boolean;
  /** Progress percentage (0-100) */
  progressPercent: number;

  // Actions
  /** Clear validation error */
  clearValidationError: () => void;
  /** Clear resumable progress */
  clearProgress: () => void;
}
