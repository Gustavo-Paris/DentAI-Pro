/**
 * Preferences Logic Types
 *
 * @module hooks/preferences
 */

import type { ComponentType, SVGProps } from 'react';

// =============================================================================
// Icon Types
// =============================================================================

/**
 * Icon component type (compatible with Lucide icons)
 */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

// =============================================================================
// Item Configuration
// =============================================================================

/**
 * Preference item configuration
 */
export interface PreferenceItemConfig {
  /** Unique key (maps to data property) */
  key: string;
  /** Display label */
  label: string;
  /** Description text */
  description?: string;
  /** Custom icon */
  icon?: IconComponent;
  /** Icon color */
  iconColor?: string;
  /** Default value if not in data */
  defaultValue?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Disabled reason */
  disabledReason?: string;
}

// =============================================================================
// Section Configuration
// =============================================================================

/**
 * Section configuration
 */
export interface PreferenceSectionConfig {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Section icon */
  icon?: IconComponent;
  /** Icon color */
  iconColor?: string;
  /** Preferences in this section */
  preferences: PreferenceItemConfig[];
}

// =============================================================================
// State Types
// =============================================================================

/**
 * Computed preference item with state
 */
export interface PreferenceItemState extends PreferenceItemConfig {
  /** Current checked state */
  checked: boolean;
  /** Is currently loading */
  isLoading: boolean;
  /** Has error */
  hasError: boolean;
  /** Error message */
  errorMessage?: string;
}

/**
 * Computed section with state
 */
export interface PreferenceSectionState {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Section icon */
  icon?: IconComponent;
  /** Icon color */
  iconColor?: string;
  /** Preference items with state */
  items: PreferenceItemState[];
  /** Any item in section is loading */
  isLoading: boolean;
  /** All items checked */
  allChecked: boolean;
  /** Some items checked */
  someChecked: boolean;
  /** None checked */
  noneChecked: boolean;
}

// =============================================================================
// Hook Options
// =============================================================================

/**
 * usePreferencesLogic options
 */
export interface UsePreferencesLogicOptions<TData extends object> {
  /** Current data (preference values) */
  data?: TData | null;
  /** Section configurations */
  sections: PreferenceSectionConfig[];
  /** Toggle handler */
  onToggle: (key: string, value: boolean) => void | Promise<void>;
  /** Enable optimistic updates (default: true) */
  optimistic?: boolean;
  /** Called when any toggle completes */
  onToggleComplete?: (key: string, value: boolean, success: boolean) => void;
  /** Called when any toggle fails */
  onToggleError?: (key: string, error: unknown) => void;
}

// =============================================================================
// Hook Return Type
// =============================================================================

/**
 * usePreferencesLogic return value
 */
export interface UsePreferencesLogicReturn {
  // State
  /** Sections with computed state */
  sections: PreferenceSectionState[];
  /** All preferences flat list */
  preferences: PreferenceItemState[];
  /** Values map (key -> boolean) */
  values: Record<string, boolean>;
  /** Loading keys set */
  loadingKeys: Set<string>;
  /** Error keys map */
  errorKeys: Map<string, string>;

  // Computed
  /** Any preference is loading */
  isLoading: boolean;
  /** Has any errors */
  hasErrors: boolean;
  /** Total preferences count */
  totalCount: number;
  /** Enabled preferences count */
  enabledCount: number;
  /** Disabled preferences count */
  disabledCount: number;

  // Actions
  /** Toggle a preference */
  toggle: (key: string) => Promise<void>;
  /** Set a preference value directly */
  setValue: (key: string, value: boolean) => Promise<void>;
  /** Toggle all in a section */
  toggleSection: (sectionId: string, value: boolean) => Promise<void>;
  /** Toggle all preferences */
  toggleAll: (value: boolean) => Promise<void>;
  /** Clear error for a key */
  clearError: (key: string) => void;
  /** Clear all errors */
  clearAllErrors: () => void;

  // Utilities
  /** Get preference by key */
  getPreference: (key: string) => PreferenceItemState | undefined;
  /** Check if a key is loading */
  isKeyLoading: (key: string) => boolean;
  /** Check if a key has error */
  hasKeyError: (key: string) => boolean;
  /** Get error message for key */
  getKeyError: (key: string) => string | undefined;
}
