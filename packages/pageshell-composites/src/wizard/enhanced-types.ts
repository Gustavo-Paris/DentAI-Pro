/**
 * EnhancedWizardPage Types
 *
 * Extended type definitions for AI-integrated wizard with
 * declarative fields, resumable progress, and side panel support.
 *
 * @module wizard/enhanced-types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { CompositeBaseProps, CompositeQueryResult } from '../shared/types';

// =============================================================================
// Re-exports from shared modules
// =============================================================================

export type { WizardBackgroundVariant } from './types';

// Re-export all form field types
export type {
  WizardFormFieldType,
  WizardFormFieldBase,
  WizardFormFieldText,
  WizardFormFieldPasswordStrength,
  WizardFormFieldNumber,
  WizardFormFieldCurrency,
  WizardFormFieldTextarea,
  WizardFormFieldSelectOption,
  WizardFormFieldSelect,
  WizardFormFieldRadio,
  WizardFormFieldCheckbox,
  WizardFormFieldSwitch,
  WizardFormFieldCustom,
  WizardFormField,
  WizardFormFieldLayout,
} from './wizard-form-field.types';

// =============================================================================
// Chat Integration Types
// =============================================================================

/**
 * Chat message structure for AI-integrated wizards
 */
export interface WizardChatMessage {
  /** Unique message ID */
  id: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Message timestamp */
  createdAt?: Date;
  /** Whether message is streaming */
  isStreaming?: boolean;
}

/**
 * AI chat configuration for EnhancedWizardPage
 */
export interface WizardAIChatConfig {
  /** Enable AI chat for wizard */
  enabled: boolean;
  /** Steps where chat is shown (empty = all steps) */
  showInSteps?: number[];
  /** Message handler */
  onSendMessage: (message: string, step: number) => Promise<void>;
  /** Current messages for step */
  getMessages: (step: number) => WizardChatMessage[];
  /** Whether currently sending/waiting */
  isSending?: boolean;
  /** Chat title per step */
  getTitle?: (step: number) => string;
  /** Chat placeholder per step */
  getPlaceholder?: (step: number) => string;
  /** Chat description per step */
  getDescription?: (step: number) => string;
}

// =============================================================================
// Resumable Progress Types
// =============================================================================

/**
 * Resumable progress configuration for EnhancedWizardPage
 */
export interface WizardEnhancedResumableConfig<TData = unknown> {
  /** Enable resumable progress */
  enabled: boolean;
  /** Storage key for localStorage */
  storageKey: string;
  /** Callback when progress is resumed */
  onResume?: (step: number, data: Partial<TData>) => void;
  /** Save form data with progress */
  saveData?: boolean;
  /** Get current form data */
  getData?: () => Partial<TData>;
  /** Set form data on resume */
  setData?: (data: Partial<TData>) => void;
}

// =============================================================================
// Side Panel Types
// =============================================================================

/**
 * Side panel configuration for EnhancedWizardPage
 */
export interface WizardEnhancedSidePanelConfig<TData = unknown> {
  /** Enable side panel */
  enabled: boolean;
  /** Panel width */
  width?: 'sm' | 'md' | 'lg';
  /** Panel title */
  title?: string;
  /** Show in specific steps (empty = all steps) */
  showInSteps?: number[];
  /** Collapsible panel */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Panel content render */
  render: (step: number, data: TData | undefined) => ReactNode;
}

// =============================================================================
// Enhanced Step Configuration
// =============================================================================

// Import form field types for use in step config
import type { WizardFormField, WizardFormFieldLayout } from './wizard-form-field.types';

/**
 * Enhanced wizard step configuration with declarative fields support
 */
export interface EnhancedWizardStepConfig {
  /** Step number (1-indexed) */
  step: number;
  /** Step label */
  label: string;
  /** Step icon */
  icon?: IconProp;
  /** Step description */
  description?: string;
  /** Optional step */
  optional?: boolean;
  /** Custom validation for step */
  validate?: () => boolean | Promise<boolean>;

  // === Declarative Fields API ===

  /** Form fields for this step (renders FormFieldsRenderer if provided) */
  fields?: WizardFormField[];
  /** Layout configuration for fields */
  layout?: WizardFormFieldLayout;
}

// =============================================================================
// EnhancedWizardPage Slots
// =============================================================================

/**
 * Slot configuration for EnhancedWizardPage customization
 */
export interface EnhancedWizardPageSlots<T> {
  /** Content before progress indicator */
  beforeProgress?: ReactNode;
  /** Custom progress indicator */
  progress?: ReactNode;
  /** Content after progress indicator */
  afterProgress?: ReactNode;
  /** Content before main content area */
  beforeContent?: ReactNode;
  /** Content between chat and form (when chat is enabled) */
  betweenChatAndForm?: ReactNode;
  /** Content after main content area */
  afterContent?: ReactNode;
  /** Custom navigation footer */
  footer?: ReactNode;
  /** Side panel slot (alternative to config) */
  sidePanel?: ReactNode | ((step: number, data: T | undefined) => ReactNode);
}

// =============================================================================
// EnhancedWizardPage Props
// =============================================================================

/**
 * EnhancedWizardPage component props
 *
 * A full-featured wizard composite with:
 * - AI chat integration for interactive step guidance
 * - Resumable progress with localStorage persistence
 * - Side panel for context/preview
 * - Declarative fields API per step
 *
 * @template TData - Query result data type
 * @template TFieldValues - Form values type from react-hook-form
 */
export interface EnhancedWizardPageProps<
  TData = unknown,
  TFieldValues extends FieldValues = FieldValues,
> extends CompositeBaseProps {
  // Header
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Icon for the page */
  icon?: IconProp;
  /** Background variant */
  background?: 'none' | 'gradient-mesh' | 'grid' | 'noise';

  // Step configuration
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Step labels */
  stepLabels?: string[];
  /** Step configurations (alternative to stepLabels) */
  steps?: EnhancedWizardStepConfig[];
  /** Allow jumping to completed steps */
  allowJumpToStep?: boolean;
  /** Jump handler */
  onJumpToStep?: (step: number) => void;

  // Navigation
  /** Back handler */
  onBack?: () => void;
  /** Next handler */
  onNext?: () => void | Promise<void>;
  /** Complete handler (final step) */
  onComplete?: () => void | Promise<void>;
  /**
   * Redirect href after wizard completion.
   * Supports :param pattern interpolation with query data.
   * @example completionRedirect="/courses/:id/success"
   */
  completionRedirect?: string;
  /** Back disabled */
  backDisabled?: boolean;
  /** Next disabled */
  nextDisabled?: boolean;
  /** Next loading */
  nextLoading?: boolean;
  /** Is completing */
  isCompleting?: boolean;
  /** Back label */
  backLabel?: string;
  /** Next label */
  nextLabel?: string;
  /** Complete label */
  completeLabel?: string;
  /** Hide navigation */
  hideNavigation?: boolean;
  /** Show skip button */
  showSkip?: boolean;
  /** Skip handler */
  onSkip?: () => void;
  /** Skip label */
  skipLabel?: string;

  // Progress
  /** Show progress indicator */
  showProgress?: boolean;
  /** Progress variant */
  progressVariant?: 'bar' | 'dots' | 'steps';
  /** Show step count */
  showStepCount?: boolean;

  // Data
  /** tRPC query result */
  query?: CompositeQueryResult<TData>;
  /** Loading skeleton */
  skeleton?: ReactNode;

  // Enhanced Features
  /** AI chat integration */
  aiChat?: WizardAIChatConfig;
  /** Resumable progress */
  resumable?: WizardEnhancedResumableConfig<TData>;
  /** Side panel */
  sidePanel?: WizardEnhancedSidePanelConfig<TData>;

  // Validation
  /** Step validation */
  validateStep?: () => boolean | Promise<boolean>;
  /** Validation error message */
  validationError?: string;

  // Keyboard
  /** Enable keyboard navigation */
  enableKeyboardNav?: boolean;
  /** Scroll to top on step change */
  scrollToTop?: boolean;

  // Slots
  /** Slot overrides */
  slots?: EnhancedWizardPageSlots<TData>;

  // === Declarative Fields API ===

  /**
   * react-hook-form instance (required when using steps with fields)
   * Shared across all steps for wizard-wide form state
   * @example form={useForm<WizardFormValues>({ ... })}
   */
  form?: UseFormReturn<TFieldValues>;
  /** Gap between fields (default: 4) */
  fieldGap?: number;
  /** Gap between columns (default: 4) */
  columnGap?: number;

  // Content
  /**
   * Content render function or ReactNode.
   * If steps have `fields`, content is auto-generated for those steps.
   * Children is only used for steps without `fields` config.
   */
  children?: ReactNode | ((data: TData) => ReactNode);
}
