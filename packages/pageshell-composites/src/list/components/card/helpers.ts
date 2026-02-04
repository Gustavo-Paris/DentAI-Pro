/**
 * ListPageCard Helpers
 *
 * Helper functions for ListPageCard rendering.
 * Extracted for better code organization and testability.
 *
 * @module list/components/card/helpers
 * @see ADR-0058 - ListPageCard Feature Evolution
 */

import * as React from 'react';
import { formatValue } from '@pageshell/core';
import { Skeleton, type StatusVariant } from '@pageshell/primitives';
import type {
  FieldConfig,
  CardSlot,
  ValueEnumOption,
  SkeletonVariant,
} from '../../../shared/types';

// =============================================================================
// Value Access Helpers
// =============================================================================

/**
 * Get nested value from object using dot notation
 * Works with generic TRow type (accepts any object, including generics)
 */
export function getNestedValue<T = unknown>(obj: unknown, path: string): T | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current as T | undefined;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Line clamp class lookup (explicit for Tailwind JIT detection)
 */
export const LINE_CLAMP_CLASSES: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

// =============================================================================
// Ellipsis Helpers
// =============================================================================

/**
 * Resolve ellipsis config to line-clamp class
 * Defaults to 2 rows for title, subtitle, and description slots
 */
export function resolveEllipsisClass<TRow>(field: FieldConfig<TRow>): string {
  const slot = field.cardSlot ?? field.cardConfig?.slot;
  const ellipsis = field.ellipsis;

  // If ellipsis is explicitly false, no truncation
  if (ellipsis === false) return '';

  // If ellipsis has rows specified, use it
  if (typeof ellipsis === 'object' && ellipsis.rows) {
    return LINE_CLAMP_CLASSES[ellipsis.rows] ?? 'line-clamp-2';
  }

  // If ellipsis is true, use default (2 rows for content slots)
  if (ellipsis === true) {
    return 'line-clamp-2';
  }

  // Default behavior based on slot (2 rows for title/subtitle/description)
  if (slot === 'title' || slot === 'subtitle' || slot === 'description') {
    return 'line-clamp-2';
  }

  // No truncation for other slots by default
  return '';
}

// =============================================================================
// Value Enum Helpers
// =============================================================================

/**
 * Resolve value enum option
 */
export function resolveEnumOption<TRow = Record<string, unknown>>(
  value: unknown,
  field: FieldConfig<TRow>
): ValueEnumOption | undefined {
  if (!field.valueEnum || value === null || value === undefined) return undefined;
  const key = String(value);
  const option = field.valueEnum[key];
  if (!option) return undefined;
  if (typeof option === 'string') {
    return { text: option };
  }
  return option;
}

/**
 * Map status to StatusBadge variant
 */
export function mapStatusToVariant(status?: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    default: 'default',
    success: 'success',
    warning: 'warning',
    error: 'destructive',
    info: 'info',
  };
  return map[status ?? 'default'] ?? 'default';
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Format field value based on valueType
 */
export function formatFieldValue<TRow = Record<string, unknown>>(
  value: unknown,
  field: FieldConfig<TRow>
): string {
  if (value === null || value === undefined) return '-';

  // Check for enum first
  const enumOption = resolveEnumOption<TRow>(value, field);
  if (enumOption) {
    return enumOption.text;
  }

  // Map valueType to formatValue format
  const formatMap: Record<string, string> = {
    text: 'text',
    number: 'number',
    currency: 'currency',
    percent: 'percent',
    date: 'date',
    dateTime: 'datetime',
    relativeTime: 'relative',
    boolean: 'boolean',
    badge: 'text',
    tag: 'text',
    tags: 'tags',
  };

  const format = formatMap[field.valueType ?? 'text'] ?? 'text';
  return formatValue(value, format as Parameters<typeof formatValue>[1]);
}

// =============================================================================
// Field Grouping Helpers
// =============================================================================

/**
 * Group fields by their card slot
 */
export function groupFieldsBySlot<TRow>(
  fields: FieldConfig<TRow>[]
): Map<CardSlot, FieldConfig<TRow>[]> {
  const groups = new Map<CardSlot, FieldConfig<TRow>[]>();

  for (const field of fields) {
    if (field.hidden === true) continue;
    const slot = field.cardSlot ?? field.cardConfig?.slot ?? 'hidden';
    if (slot === 'hidden') continue;

    if (!groups.has(slot)) {
      groups.set(slot, []);
    }
    groups.get(slot)!.push(field);
  }

  return groups;
}

// =============================================================================
// Skeleton Helpers (ADR-0058)
// =============================================================================

/**
 * Infer skeleton variant from field configuration
 * @see ADR-0058
 */
export function inferSkeletonVariant<TRow>(field: FieldConfig<TRow>): SkeletonVariant {
  if (field.skeletonVariant) return field.skeletonVariant;

  const slot = field.cardSlot ?? field.cardConfig?.slot;
  if (slot === 'title') return 'title';
  if (slot === 'badge') return 'badge';
  if (slot === 'avatar') return 'avatar';
  if (slot === 'description' || slot === 'subtitle') return 'description';

  if (field.valueType === 'badge') return 'badge';
  if (field.valueType === 'tags') return 'tags';
  if (field.valueType === 'avatar' || field.valueType === 'image') return 'avatar';

  return 'text';
}

/**
 * Render skeleton placeholder for a field
 * @see ADR-0058
 */
export function renderFieldSkeleton(variant: SkeletonVariant): React.ReactNode {
  switch (variant) {
    case 'badge':
      return React.createElement(Skeleton, { className: 'h-5 w-20 rounded-full' });
    case 'avatar':
      return React.createElement(Skeleton, { className: 'h-10 w-10 rounded-full' });
    case 'tags':
      return React.createElement(
        'div',
        { className: 'flex gap-1.5' },
        React.createElement(Skeleton, { className: 'h-5 w-16 rounded-full' }),
        React.createElement(Skeleton, { className: 'h-5 w-20 rounded-full' }),
        React.createElement(Skeleton, { className: 'h-5 w-14 rounded-full' })
      );
    case 'title':
      return React.createElement(Skeleton, { className: 'h-5 w-3/4' });
    case 'description':
      return React.createElement(
        'div',
        { className: 'space-y-1.5' },
        React.createElement(Skeleton, { className: 'h-4 w-full' }),
        React.createElement(Skeleton, { className: 'h-4 w-2/3' })
      );
    default:
      return React.createElement(Skeleton, { className: 'h-4 w-24' });
  }
}
