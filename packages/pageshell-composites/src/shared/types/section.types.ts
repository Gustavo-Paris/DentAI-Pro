/**
 * Section, Tab, and Wizard Step Types
 *
 * Configuration for sections, tabs, and wizard steps.
 *
 * @module shared/types/section
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Section Configuration
// =============================================================================

/**
 * Section configuration for detail/settings pages
 */
export interface SectionConfig {
  /** Section ID */
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Section icon - accepts string name (e.g., 'settings') or ComponentType */
  icon?: IconProp;
  /** Icon color CSS class */
  iconColor?: string;
  /** Section content (alias for children) */
  content?: ReactNode | ((data: unknown) => ReactNode);
  /** Section content */
  children?: ReactNode;
}

// =============================================================================
// Tab Configuration
// =============================================================================

/**
 * Tab configuration for tabbed views
 */
export interface TabConfig {
  /** Tab ID */
  id: string;
  /** Tab label */
  label: string;
  /** Tab icon - accepts string name (e.g., 'user', 'settings') or ComponentType */
  icon?: IconProp;
  /** Badge count */
  badge?: number | string;
  /** Tab content (alias for children) */
  content?: ReactNode | ((data: unknown) => ReactNode);
  /** Tab content */
  children?: ReactNode;
}

// =============================================================================
// Wizard Step Configuration
// =============================================================================

/**
 * Wizard step configuration
 */
export interface WizardStepConfig {
  /** Step ID */
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Step icon - accepts string name (e.g., 'check', 'user') or ComponentType */
  icon?: IconProp;
  /** Is step optional? */
  optional?: boolean;
  /** Validation function */
  validate?: () => boolean | Promise<boolean>;
  /** Step content */
  children?: ReactNode;
}
