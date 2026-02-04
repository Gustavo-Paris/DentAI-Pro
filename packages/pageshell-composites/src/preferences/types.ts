/**
 * PreferencesPage Types
 *
 * Type definitions for the PreferencesPage composite.
 *
 * @module preferences/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
} from '../shared/types';

// =============================================================================
// Icon Color
// =============================================================================

/**
 * Semantic icon color names
 */
export type SemanticIconColor =
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'blue'
  | 'cyan'
  | 'red'
  | 'primary';

// =============================================================================
// Preference Item
// =============================================================================

/**
 * Single preference configuration
 */
export interface PreferenceItem {
  /** Unique key (maps to data property) */
  key: string;
  /** Display label */
  label: string;
  /** Description text */
  description?: string;
  /** Custom icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Icon color - use semantic names (amber, emerald, etc.) */
  iconColor?: SemanticIconColor;
  /** Default value if not in data */
  defaultValue?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Disabled reason (shown as tooltip) */
  disabledReason?: string;
}

// =============================================================================
// Preference Section
// =============================================================================

/**
 * Section configuration
 */
export interface PreferenceSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Section icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Icon color - use semantic names (amber, emerald, etc.) */
  iconColor?: SemanticIconColor;
  /** Preferences in this section */
  preferences: PreferenceItem[];
}

// =============================================================================
// Slots
// =============================================================================

/**
 * Slots for PreferencesPage customization
 */
export interface PreferencesPageSlots<T> {
  /** Content before sections */
  beforeSections?: ReactNode;
  /** Content after sections */
  afterSections?: ReactNode;
  /** Custom header */
  header?: ReactNode | ((data: T) => ReactNode);
  /** Footer content */
  footer?: ReactNode | ((data: T) => ReactNode);
  /** Content between sections */
  betweenSections?: ReactNode;
}

// =============================================================================
// PreferencesPage Props
// =============================================================================

/**
 * PreferencesPage component props
 *
 * @template TData - The query data type
 */
export interface PreferencesPageProps<TData extends object = Record<string, boolean>>
  extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;
  /** Label above title */
  label?: string;
  /** Page description */
  description?: string;

  // ---------------------------------------------------------------------------
  // Data Source
  // ---------------------------------------------------------------------------

  /**
   * Query result (tRPC, React Query, SWR compatible)
   */
  query: CompositeQueryResult<TData>;

  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  /**
   * Section configurations with preferences
   */
  sections: PreferenceSection[];

  // ---------------------------------------------------------------------------
  // Toggle Handling
  // ---------------------------------------------------------------------------

  /**
   * Toggle handler - receives key and new value
   * Return promise for loading state, or void for optimistic
   */
  onToggle: (key: string, value: boolean) => void | Promise<void>;

  /**
   * Enable optimistic updates
   * @default true
   */
  optimistic?: boolean;

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  /**
   * Wrap all sections in single Card
   * @default false
   */
  singleCard?: boolean;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: PreferencesPageSlots<TData>;

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  /**
   * Custom skeleton component
   */
  skeleton?: ReactNode;
}
