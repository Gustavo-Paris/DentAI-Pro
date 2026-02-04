/**
 * WizardPage Types
 *
 * Type definitions for wizard/stepper composites.
 *
 * @module wizard/types
 */

import type { ReactNode, ComponentType } from 'react';
import type { CompositeBaseProps, WizardStepConfig } from '../shared/types';

// =============================================================================
// Background Variant
// =============================================================================

/**
 * Background visual variant for wizard page.
 */
export type WizardBackgroundVariant = 'none' | 'gradient-mesh' | 'grid' | 'noise';

// =============================================================================
// Side Panel Configuration
// =============================================================================

/**
 * Width variant for the side panel.
 */
export type SidePanelWidth = 'sm' | 'md' | 'lg';

/**
 * Configuration for the wizard side panel.
 *
 * @template TValues - Form values type for render function
 *
 * @example Basic usage
 * ```tsx
 * <WizardPage
 *   sidePanel={{
 *     enabled: true,
 *     title: 'Help',
 *     render: (step) => <HelpContent step={step} />,
 *   }}
 * />
 * ```
 *
 * @example With step visibility
 * ```tsx
 * <WizardPage
 *   sidePanel={{
 *     enabled: true,
 *     width: 'lg',
 *     showInSteps: [0, 2], // Only show in first and third steps
 *     collapsible: true,
 *     defaultCollapsed: false,
 *     render: (step, values) => <ContextualHelp step={step} data={values} />,
 *   }}
 * />
 * ```
 */
export interface WizardSidePanelConfig<TValues = unknown> {
  /** Enable the side panel */
  enabled: boolean;
  /** Width variant */
  width?: SidePanelWidth;
  /** Panel title */
  title?: string;
  /** Only show in specific steps (0-indexed). Empty = all steps */
  showInSteps?: number[];
  /** Allow collapsing the panel */
  collapsible?: boolean;
  /** Start collapsed */
  defaultCollapsed?: boolean;
  /** Render function for panel content */
  render: (step: number, values: TValues | undefined) => ReactNode;
}

// =============================================================================
// Resumable Configuration
// =============================================================================

/**
 * Resumable wizard configuration.
 *
 * Pass `true` for default behavior (localStorage with key 'pageshell-wizard')
 * or an object for customization.
 *
 * @template TData - Form data type for getData/setData/onResume
 *
 * @example Simple usage
 * ```tsx
 * <WizardPage resumable />
 * ```
 *
 * @example Custom storage key
 * ```tsx
 * <WizardPage resumable={{ storageKey: 'onboarding-wizard' }} />
 * ```
 *
 * @example Full configuration
 * ```tsx
 * <WizardPage
 *   resumable={{
 *     storageKey: 'onboarding-wizard',
 *     getData: () => formState,
 *     setData: (data) => setFormState(data),
 *     onResume: (step, data) => {
 *       console.log('Resuming at step', step);
 *     },
 *     expiryDays: 14,
 *   }}
 * />
 * ```
 */
export type WizardResumableConfig<TData = unknown> =
  | boolean
  | {
      /** localStorage key for persisting progress */
      storageKey: string;
      /** Get current form data to save with progress */
      getData?: () => Partial<TData>;
      /** Set form data when resuming (called before onResume) */
      setData?: (data: Partial<TData>) => void;
      /** Callback when resuming progress */
      onResume?: (step: number, data: Partial<TData>) => void;
      /** Expiry time in days (default: 7) */
      expiryDays?: number;
    };

// =============================================================================
// WizardPage Props
// =============================================================================

/**
 * Props for the WizardPage composite
 */
export interface WizardPageProps<TValues extends Record<string, unknown> = Record<string, unknown>>
  extends CompositeBaseProps {
  /**
   * Background visual variant.
   * @default 'none'
   */
  background?: WizardBackgroundVariant;

  /**
   * Wizard steps configuration.
   */
  steps: WizardStepConfig[];

  /**
   * Current step index (0-based).
   * If not provided, component manages its own state.
   */
  currentStep?: number;

  /**
   * Step change handler.
   */
  onStepChange?: (step: number) => void;

  /**
   * Form values (if wizard contains forms).
   */
  values?: TValues;

  /**
   * Values change handler.
   */
  onValuesChange?: (values: TValues) => void;

  /**
   * Completion handler.
   */
  onComplete?: (values: TValues) => void | Promise<void>;

  /**
   * Cancel handler.
   */
  onCancel?: () => void;

  /**
   * Enable resumable wizard with localStorage persistence.
   * Pass true for defaults or config object for customization.
   * @default false
   */
  resumable?: WizardResumableConfig<TValues>;

  /**
   * Keyboard navigation?
   */
  keyboardNavigation?: boolean;

  /**
   * Show keyboard navigation hints.
   * Only visible when keyboardNavigation is enabled.
   * @default true
   */
  showKeyboardHints?: boolean;

  /**
   * Scroll to top on step change.
   * @default false
   */
  scrollToTop?: boolean;

  /**
   * Show step indicators?
   */
  showStepIndicator?: boolean;

  /**
   * Navigation button labels.
   */
  labels?: {
    next?: string;
    previous?: string;
    complete?: string;
    cancel?: string;
  };

  /**
   * Slots for customization.
   */
  slots?: WizardPageSlots<TValues>;

  /**
   * Side panel configuration for contextual content.
   *
   * @example
   * ```tsx
   * <WizardPage
   *   sidePanel={{
   *     enabled: true,
   *     width: 'md',
   *     title: 'Help',
   *     collapsible: true,
   *     render: (step, values) => <HelpPanel step={step} />,
   *   }}
   * />
   * ```
   */
  sidePanel?: WizardSidePanelConfig<TValues>;
}

// =============================================================================
// WizardPage Slots
// =============================================================================

/**
 * Slot configuration for WizardPage customization.
 *
 * @template TValues - Form values type for render functions
 */
export interface WizardPageSlots<TValues = unknown> {
  /**
   * Custom skeleton for loading state.
   */
  skeleton?: ReactNode;

  /**
   * Custom header content (replaces default title/description).
   */
  header?: ReactNode;

  /**
   * Content rendered before the progress indicator.
   * Useful for alerts, banners, or contextual information.
   */
  beforeProgress?: ReactNode;

  /**
   * Custom step indicator (replaces default StepIndicator).
   */
  stepIndicator?: ReactNode;

  /**
   * Content rendered between header and main content area.
   * Different from beforeContent which is after the step indicator.
   */
  betweenHeaderAndContent?: ReactNode;

  /**
   * Content between step indicator and step content.
   */
  beforeContent?: ReactNode;

  /**
   * Content after step content.
   */
  afterContent?: ReactNode;

  /**
   * Side panel slot (alternative to sidePanel config).
   * Can be ReactNode or render function receiving step and values.
   */
  sidePanel?: ReactNode | ((step: number, values: TValues | undefined) => ReactNode);

  /**
   * Custom navigation footer (replaces default navigation).
   */
  navigation?: ReactNode;
}
