/**
 * Inference utilities for PageShell composites
 *
 * Smart defaults and auto-configuration for columns, actions, filters, etc.
 * Reduces boilerplate by inferring settings from naming conventions.
 *
 * @module utils/inference
 */

import type { ValueFormat } from '../formatters/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Icon type - generic to allow any icon library
 */
export type IconType = React.ComponentType<{ className?: string }>;

/**
 * Row action confirmation config
 */
export interface RowActionConfirm {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning';
  confirmText?: string;
  cancelText?: string;
}

/**
 * Row action configuration
 */
export interface RowActionConfig<T> {
  label?: string;
  icon?: IconType;
  variant?: 'default' | 'destructive';
  confirm?: boolean | RowActionConfirm;
  href?: string | ((item: T) => string);
  onClick?: (item: T) => void | Promise<void>;
  mutation?: {
    mutateAsync: (item: T) => Promise<unknown>;
  };
  hidden?: boolean | ((item: T) => boolean);
  disabled?: boolean | ((item: T) => boolean);
}

/**
 * Column configuration for inference
 */
export interface InferColumnConfig<T> {
  key: string;
  label?: string;
  format?: ValueFormat;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string | number;
  render?: (value: unknown, item: T, index: number) => React.ReactNode;
}

/**
 * Filter option
 */
export interface FilterOption {
  value: string;
  label: string;
  icon?: IconType;
}

/**
 * Filter configuration for inference
 */
export interface InferFilterConfig {
  label?: string;
  options: (string | FilterOption)[];
  defaultValue?: string;
  render?: (option: FilterOption) => React.ReactNode;
}

/**
 * Stat configuration
 */
export interface StatConfig {
  key: string;
  label: string;
  icon?: IconType;
  format?: 'number' | 'currency' | 'percent';
}

// =============================================================================
// Action Inference
// =============================================================================

/**
 * Default variants for common actions
 */
const ACTION_VARIANTS: Record<string, 'default' | 'destructive'> = {
  delete: 'destructive',
  remove: 'destructive',
  archive: 'destructive',
};

/**
 * Default confirmation configs for common actions
 */
const ACTION_CONFIRM_DEFAULTS: Record<string, RowActionConfirm> = {
  delete: {
    title: 'Excluir item?',
    description: 'Esta ação não pode ser desfeita.',
    variant: 'destructive',
    confirmText: 'Excluir',
  },
  remove: {
    title: 'Remover item?',
    description: 'Esta ação não pode ser desfeita.',
    variant: 'destructive',
    confirmText: 'Remover',
  },
  archive: {
    title: 'Arquivar item?',
    description: 'O item será movido para arquivados.',
    variant: 'warning',
    confirmText: 'Arquivar',
  },
};

/**
 * Infer row action defaults based on action key
 *
 * Automatically sets variant and confirmation based on the action name.
 * Icon mapping is handled separately by the consuming framework.
 *
 * @param key - The action key (e.g., 'edit', 'delete', 'view')
 * @param config - The provided action config
 * @returns Enhanced config with inferred defaults
 *
 * @example
 * ```ts
 * // Key 'delete' will infer:
 * // - variant: 'destructive'
 * // - confirm: { title: 'Excluir item?', ... }
 *
 * inferRowActionDefaults('delete', { label: 'Excluir' })
 * ```
 */
export function inferRowActionDefaults<T>(
  key: string,
  config: RowActionConfig<T>
): RowActionConfig<T> {
  const inferred = { ...config };

  // Infer variant from action name
  if (!inferred.variant && ACTION_VARIANTS[key]) {
    inferred.variant = ACTION_VARIANTS[key];
  }

  // Infer confirmation from action name
  if (inferred.confirm === true && ACTION_CONFIRM_DEFAULTS[key]) {
    inferred.confirm = ACTION_CONFIRM_DEFAULTS[key];
  } else if (inferred.confirm === undefined && key === 'delete') {
    // Always add confirmation for delete actions
    inferred.confirm = ACTION_CONFIRM_DEFAULTS.delete;
  }

  return inferred;
}

/**
 * Apply defaults to all row actions
 */
export function applyRowActionsDefaults<T>(
  actions: Record<string, RowActionConfig<T>> | undefined
): Array<{ key: string } & RowActionConfig<T>> {
  if (!actions) return [];

  return Object.entries(actions).map(([key, config]) => ({
    key,
    ...inferRowActionDefaults(key, config),
  }));
}

// =============================================================================
// Column Inference
// =============================================================================

/**
 * Common column key patterns and their formats
 */
const COLUMN_FORMAT_PATTERNS: Array<{
  pattern: RegExp;
  format: ValueFormat;
}> = [
  { pattern: /^(created|updated|deleted|published|archived)At$/i, format: 'date' },
  { pattern: /Date$/i, format: 'date' },
  { pattern: /^(price|amount|total|revenue|cost|value)$/i, format: 'currency' },
  { pattern: /^status$/i, format: 'status' },
  { pattern: /^(is|has|can|should|enabled|active|visible)/, format: 'boolean' },
  { pattern: /^(count|total|quantity|qty)$/i, format: 'number' },
  { pattern: /percent|rate$/i, format: 'percent' },
];

/**
 * Column alignment based on format
 */
const FORMAT_ALIGNMENTS: Record<ValueFormat, 'left' | 'center' | 'right'> = {
  text: 'left',
  number: 'right',
  date: 'left',
  datetime: 'left',
  time: 'left',
  currency: 'right',
  percent: 'right',
  duration: 'right',
  boolean: 'center',
  status: 'left',
  badge: 'center',
  tags: 'left',
  link: 'left',
  truncate: 'left',
  relative: 'left',
  avatar: 'center',
};

/**
 * Infer column defaults based on column key
 *
 * Automatically sets format and alignment based on the column name.
 *
 * @param column - The column config
 * @returns Enhanced config with inferred defaults
 *
 * @example
 * ```ts
 * // Key 'createdAt' will infer:
 * // - format: 'date'
 * // - align: 'left'
 *
 * inferColumnDefaults({ key: 'createdAt', label: 'Criado em' })
 * ```
 */
export function inferColumnDefaults<T>(
  column: InferColumnConfig<T>
): InferColumnConfig<T> {
  const inferred = { ...column };

  // Infer format from key
  if (!inferred.format) {
    for (const { pattern, format } of COLUMN_FORMAT_PATTERNS) {
      if (pattern.test(column.key)) {
        inferred.format = format;
        break;
      }
    }
  }

  // Infer alignment from format
  if (!inferred.align && inferred.format) {
    inferred.align = FORMAT_ALIGNMENTS[inferred.format];
  }

  return inferred;
}

/**
 * Apply defaults to all columns
 */
export function applyColumnsDefaults<T>(
  columns: InferColumnConfig<T>[]
): InferColumnConfig<T>[] {
  return columns.map(inferColumnDefaults);
}

// =============================================================================
// Filter Inference
// =============================================================================

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Normalize filter options to FilterOption format
 */
export function normalizeFilterOptions(
  options: (string | FilterOption)[]
): FilterOption[] {
  return options.map((opt) => {
    if (typeof opt === 'string') {
      return {
        value: opt,
        label: opt === 'all' ? 'All' : capitalizeFirst(opt),
      };
    }
    return {
      ...opt,
      label: opt.label ?? capitalizeFirst(opt.value),
    };
  });
}

/**
 * Apply defaults to filter config
 */
export function applyFilterDefaults(
  key: string,
  config: InferFilterConfig
): InferFilterConfig & { key: string } {
  return {
    key,
    label: config.label ?? capitalizeFirst(key),
    options: normalizeFilterOptions(config.options),
    defaultValue: config.defaultValue ?? 'all',
    render: config.render,
  };
}

/**
 * Apply defaults to all filters
 */
export function applyFiltersDefaults(
  filters: Record<string, InferFilterConfig> | undefined
): Array<InferFilterConfig & { key: string }> {
  if (!filters) return [];

  return Object.entries(filters).map(([key, config]) =>
    applyFilterDefaults(key, config)
  );
}

// =============================================================================
// Stats Inference
// =============================================================================

/**
 * Infer stat defaults
 */
export function inferStatDefaults(stat: StatConfig): StatConfig {
  const inferred = { ...stat };

  // Infer format from key
  if (!inferred.format) {
    if (
      stat.key.includes('revenue') ||
      stat.key.includes('price') ||
      stat.key.includes('amount')
    ) {
      inferred.format = 'currency';
    } else if (stat.key.includes('percent') || stat.key.includes('rate')) {
      inferred.format = 'percent';
    }
  }

  return inferred;
}

/**
 * Apply defaults to all stats
 */
export function applyStatsDefaults(
  stats: StatConfig[] | undefined
): StatConfig[] {
  if (!stats) return [];
  return stats.map(inferStatDefaults);
}
