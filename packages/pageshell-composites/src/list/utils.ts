/**
 * ListPage Utility Functions
 *
 * Extracted utilities for the ListPage composite.
 *
 * @module list/utils
 */

import type { FilterConfig, FilterOption, ColumnConfig, FieldConfig, ValueType } from '../shared/types';
import type { ListFilterConfig } from '@pageshell/core';
import type { ListPageProps } from './types';

// =============================================================================
// Filter Normalizers
// =============================================================================

/**
 * Normalize filter config (object → array format)
 */
export function normalizeFilters(
  filters?: FilterConfig[] | Record<string, Omit<FilterConfig, 'key'>>
): FilterConfig[] {
  if (!filters) return [];
  if (Array.isArray(filters)) return filters;
  return Object.entries(filters).map(([key, config]) => ({
    key,
    ...config,
  }));
}

/**
 * Normalize filter option to FilterOption format
 */
export function normalizeOption(option: string | FilterOption): FilterOption {
  if (typeof option === 'string') {
    return { value: option, label: option.charAt(0).toUpperCase() + option.slice(1) };
  }
  return option;
}

/**
 * Convert FilterConfig[] to Record<string, ListFilterConfig> for useListLogic
 */
export function convertFiltersToListLogicFormat(
  filters: FilterConfig[]
): Record<string, ListFilterConfig> {
  return filters.reduce<Record<string, ListFilterConfig>>((acc, filter) => {
    acc[filter.key] = {
      options: filter.options.map((opt) => {
        if (typeof opt === 'string') return opt;
        return { value: opt.value, label: opt.label };
      }),
      defaultValue: filter.defaultValue,
      label: filter.label,
    };
    return acc;
  }, {});
}

/**
 * Card filter configuration type (for card mode)
 */
export interface CardFilterConfig {
  type: 'select' | 'buttons';
  options: Array<{ value: string; label: string }>;
  default?: string;
  label?: string;
}

/**
 * Convert cardFilters to FilterConfig[] format for unified filter handling
 */
export function convertCardFiltersToFilterConfig(
  cardFilters: Record<string, CardFilterConfig>
): FilterConfig[] {
  return Object.entries(cardFilters).map(([key, config]) => ({
    key,
    label: config.label || key,
    options: config.options,
    defaultValue: config.default || 'all',
    // Note: 'type' (buttons/select) is not used in FilterConfig,
    // but could be extended in ListPageFilters if needed
  }));
}

// =============================================================================
// Row Utilities
// =============================================================================

/**
 * Get row key (id) from row data
 */
export function getRowKey<TRow>(
  row: TRow,
  rowKey: ListPageProps<TRow>['rowKey'],
  index: number
): string | number {
  if (typeof rowKey === 'function') return rowKey(row);
  const rowObj = row as Record<string, unknown>;
  if (typeof rowKey === 'string' && rowKey in rowObj) return rowObj[rowKey] as string | number;
  if ('id' in rowObj) return rowObj.id as string | number;
  return index;
}

// =============================================================================
// Field to Column Conversion
// =============================================================================

/**
 * Map FieldConfig valueType to ColumnConfig format
 */
function mapValueTypeToFormat(valueType?: ValueType): ColumnConfig['format'] {
  if (!valueType) return 'text';

  const formatMap: Record<ValueType, ColumnConfig['format']> = {
    text: 'text',
    number: 'number',
    currency: 'currency',
    percent: 'percent',
    date: 'date',
    dateTime: 'datetime',
    relativeTime: 'relative',
    boolean: 'boolean',
    badge: 'badge',
    tag: 'text',
    tags: 'tags',
    avatar: 'text',
    image: 'text',
    link: 'text',
    email: 'text',
    phone: 'text',
    progress: 'number',
    rating: 'number',
    custom: 'text',
  };

  return formatMap[valueType] ?? 'text';
}

/**
 * Map FieldConfig valueEnum to ColumnConfig statusVariants
 */
function mapValueEnumToStatusVariants(
  valueEnum?: FieldConfig['valueEnum']
): ColumnConfig['statusVariants'] | undefined {
  if (!valueEnum) return undefined;

  const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {};

  for (const [key, option] of Object.entries(valueEnum)) {
    if (typeof option === 'string') {
      statusVariants[key] = 'neutral';
    } else {
      // Map status to ColumnConfig statusVariants format
      const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
        default: 'neutral',
        success: 'success',
        warning: 'warning',
        error: 'error',
        info: 'info',
      };
      statusVariants[key] = statusMap[option.status ?? 'default'] ?? 'neutral';
    }
  }

  return statusVariants;
}

/**
 * Convert FieldConfig[] to ColumnConfig[] for table rendering
 *
 * @param fields - Unified field configuration
 * @returns Column configuration for ListPageTable
 *
 * @example
 * ```tsx
 * const fields = [
 *   { key: 'title', label: 'Título', cardSlot: 'title' },
 *   { key: 'status', label: 'Status', valueType: 'badge', valueEnum: {...} },
 * ];
 *
 * const columns = fieldsToColumns(fields);
 * // → [{ key: 'title', label: 'Título' }, { key: 'status', label: 'Status', format: 'badge', statusVariants: {...} }]
 * ```
 */
export function fieldsToColumns<TRow = Record<string, unknown>>(
  fields: FieldConfig<TRow>[]
): ColumnConfig<TRow>[] {
  return fields
    .filter((field) => field.hidden !== true)
    .map((field) => {
      const column: ColumnConfig<TRow> = {
        key: field.key,
        label: field.label ?? field.key,
        format: mapValueTypeToFormat(field.valueType),
        valueType: field.valueType, // Pass valueType for proper rendering (relativeTime, badge, etc.)
        valueEnum: field.valueEnum, // Pass valueEnum for badge styling
        sortable: field.tableConfig?.sortable,
        hiddenOnMobile: field.tableConfig?.hiddenOnMobile,
        width: field.tableConfig?.width,
        maxLines: field.tableConfig?.maxLines,
      };

      // Add statusVariants for badge fields (legacy compatibility)
      if (field.valueType === 'badge' && field.valueEnum) {
        column.statusVariants = mapValueEnumToStatusVariants(field.valueEnum);
      }

      // Use field's custom render if provided
      if (field.renderTable) {
        column.render = field.renderTable;
      } else if (field.render && !column.render) {
        column.render = field.render;
      }

      return column;
    });
}
