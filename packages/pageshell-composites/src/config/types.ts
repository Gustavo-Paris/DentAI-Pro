/**
 * ConfigPage Types
 *
 * Type definitions for the ConfigPage composite.
 *
 * @module config/types
 */

import type { ReactNode, ComponentType } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
} from '../shared/types';

// =============================================================================
// Config Field Type
// =============================================================================

/**
 * Field type for config items
 * @note Used for backward compatibility with bridge API
 */
export type ConfigFieldType = 'string' | 'number' | 'boolean' | 'select' | 'enum' | 'textarea';

// =============================================================================
// Config Item
// =============================================================================

/**
 * Base config item fields shared by all types
 */
interface ConfigItemBase {
  /** Unique key */
  key: string;
  /** Description */
  description?: string;
}

/**
 * Config item for text values
 */
interface ConfigItemText extends ConfigItemBase {
  valueType: 'string' | 'textarea';
  value: string;
}

/**
 * Config item for numeric values
 */
interface ConfigItemNumber extends ConfigItemBase {
  valueType: 'number';
  value: number;
}

/**
 * Config item for boolean values
 */
interface ConfigItemBoolean extends ConfigItemBase {
  valueType: 'boolean';
  value: boolean;
}

/**
 * Config item for select/enum values
 */
interface ConfigItemSelect extends ConfigItemBase {
  valueType: 'select' | 'enum';
  value: string;
  options: { value: string | number; label: string }[];
}

/**
 * Discriminated union of all config item types
 */
export type ConfigItem =
  | ConfigItemText
  | ConfigItemNumber
  | ConfigItemBoolean
  | ConfigItemSelect;

// =============================================================================
// Category Configuration
// =============================================================================

/**
 * Category metadata
 */
export interface ConfigCategory {
  /** Category label */
  label: string;
  /** Category icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Category description */
  description?: string;
}

// =============================================================================
// Field Components
// =============================================================================

/**
 * Props passed to field components
 */
export interface ConfigFieldProps<TValue = unknown> {
  /** Field label */
  label: string;
  /** Current value */
  value: TValue;
  /** Change handler */
  onChange: (value: TValue) => void;
  /** Field description */
  description?: string;
  /** Options for select/enum */
  options?: { value: string | number; label: string }[];
  /** Input type (for number fields) */
  type?: string;
}

/**
 * Field component map by type
 * Use Record for type safety with dynamic access
 */
export type ConfigFieldComponents = Record<
  string,
  ComponentType<ConfigFieldProps<unknown>> | undefined
>;

// =============================================================================
// Actions Configuration
// =============================================================================

/**
 * Config action configuration
 */
export interface ConfigActionConfig {
  /** Action label */
  label: string;
  /** Action icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Click handler */
  onClick?: () => void;
  /** Mutation for async operations */
  mutation?: {
    mutateAsync: (input?: unknown) => Promise<unknown>;
    mutate?: (input?: unknown) => void;
    isPending?: boolean;
    // Support both Error and tRPC error types
    error?: { message?: string } | Error | null;
    isError?: boolean;
    reset?: () => void;
  };
}

// =============================================================================
// Empty State
// =============================================================================

/**
 * Empty state configuration for ConfigPage
 */
export interface ConfigEmptyState {
  /** Empty state icon */
  icon?: IconProp;
  /** Empty state title */
  title: string;
  /** Empty state description */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// =============================================================================
// History Modal (API compatibility - not implemented)
// =============================================================================

/**
 * History modal configuration
 * @note For API compatibility with bridge. Not yet implemented.
 */
export interface ConfigHistoryConfig<THistoryItem = unknown> {
  /** Enable history modal */
  enabled: boolean;
  /** Query hook for history */
  query: (configKey: string) => CompositeQueryResult<THistoryItem[]>;
  /** Rollback mutation */
  rollbackMutation?: {
    mutateAsync: (input: { key: string; targetVersion: number }) => Promise<unknown>;
    mutate?: (input: { key: string; targetVersion: number }) => void;
    isPending?: boolean;
    error?: { message?: string } | Error | null;
    isError?: boolean;
    reset?: () => void;
  };
}

// =============================================================================
// ConfigPage Props
// =============================================================================

/**
 * ConfigPage component props
 *
 * @template TData - The query data type
 * @template TConfig - The config item type
 */
export interface ConfigPageProps<
  TData = unknown,
  TConfig extends ConfigItem = ConfigItem,
> extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;

  // ---------------------------------------------------------------------------
  // Data Source
  // ---------------------------------------------------------------------------

  /**
   * Query result (tRPC, React Query, SWR compatible)
   */
  query: CompositeQueryResult<TData>;

  /**
   * Extract configs from query data
   * @default (data) => data as TConfig[]
   */
  getConfigs?: (data: TData) => TConfig[];

  /**
   * Check if data should show empty state
   */
  emptyCheck?: (data: TData) => boolean;

  /**
   * Empty state configuration
   */
  emptyState?: ConfigEmptyState;

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  /**
   * Extract category from config (string key or function)
   */
  categoryKey: string | ((config: TConfig) => string);

  /**
   * Category metadata map
   */
  categories: Record<string, ConfigCategory>;

  // ---------------------------------------------------------------------------
  // Update Mutation
  // ---------------------------------------------------------------------------

  /**
   * Update mutation for saving changes
   */
  updateMutation: {
    mutateAsync: (input: {
      updates: Array<{ key: string; value: unknown }>;
    }) => Promise<unknown>;
    mutate?: (input: {
      updates: Array<{ key: string; value: unknown }>;
    }) => void;
    isPending?: boolean;
    error?: { message?: string } | Error | null;
    isError?: boolean;
    reset?: () => void;
  };

  // ---------------------------------------------------------------------------
  // Field Rendering
  // ---------------------------------------------------------------------------

  /**
   * Field component map by type
   */
  fieldComponents: ConfigFieldComponents;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Optional action buttons
   */
  actions?: Record<string, ConfigActionConfig>;

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /**
   * Called on successful save
   */
  onSaveSuccess?: (category: string) => void;

  /**
   * Called on save error
   */
  onSaveError?: (category: string, error: Error) => void;

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  /**
   * Custom skeleton component
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // History Modal (API compatibility)
  // ---------------------------------------------------------------------------

  /**
   * History modal configuration
   * @note For API compatibility with bridge. Not yet implemented in composites.
   */
  historyModal?: ConfigHistoryConfig;
}
