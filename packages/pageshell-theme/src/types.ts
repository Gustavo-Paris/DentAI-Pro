/**
 * @pageshell/theme - Type Definitions
 *
 * Type definitions for PageShell theming system.
 *
 * @module types
 */

// =============================================================================
// Theme Types
// =============================================================================

/**
 * Available themes for PageShell
 * All themes use unified portal-* CSS classes
 */
export type PageShellTheme = 'admin' | 'creator' | 'student' | 'default';

/**
 * Vertical spacing between sections
 * - compact: 12px (space-y-3) - for dense layouts
 * - default: 16px (space-y-4) - balanced default
 * - relaxed: 24px (space-y-6) - spacious layouts
 */
export type PageShellSpacing = 'compact' | 'default' | 'relaxed';

/**
 * Theme configuration for CSS class mapping
 * All themes use unified portal-* classes
 */
export interface ThemeConfig {
  /** Container class (e.g., "max-w-7xl mx-auto") */
  container: string;
  /** Base animation class: "portal-animate-in" */
  animate: string;
  /** Function to get delay class: "portal-animate-in-delay-{n}" */
  animateDelay: (index: number) => string;
  /** Heading base class: "portal-heading" */
  heading: string;
  /** XL heading class: "portal-heading-xl" */
  headingXl: string;
  /** LG heading class: "portal-heading-lg" */
  headingLg: string;
  /** MD heading class: "portal-heading-md" */
  headingMd: string;
  /** Label class: "portal-label" */
  label: string;
  /** Section icon class: "portal-section-icon" */
  sectionIcon: string;
  /** Quick action class: "portal-quick-action" */
  quickAction: string;
  /** Quick action icon class: "portal-quick-action-icon" */
  quickActionIcon: string;
  /** Text muted CSS variable */
  textMuted: string;
  /** Primary color CSS variable */
  primary: string;
  /** Accent color CSS variable */
  accent: string;
}

// =============================================================================
// Context Types
// =============================================================================

/**
 * PageShell context value
 */
export interface PageShellContextValue {
  /** Current theme name */
  theme: PageShellTheme;
  /** Theme configuration object */
  config: ThemeConfig;
  /** Current animation delay counter */
  currentDelay: number;
  /** Function to get next delay and increment counter */
  getNextDelay: () => number;
}

/**
 * PageShell provider props
 */
export interface PageShellProviderProps {
  /** Theme preset to use */
  theme: PageShellTheme;
  /** Child components */
  children: React.ReactNode;
}

// =============================================================================
// Wizard Types
// =============================================================================

/**
 * Wizard step context value
 */
export interface WizardStepContextValue {
  /** Current step number (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
}

/**
 * Wizard step provider props
 */
export interface WizardStepProviderProps {
  /** Current step number (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Child components */
  children: React.ReactNode;
}
