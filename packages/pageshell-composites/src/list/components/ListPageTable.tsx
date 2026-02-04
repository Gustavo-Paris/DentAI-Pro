/**
 * ListPageTable Component
 *
 * Table rendering for ListPage composite.
 * Handles columns, sorting, selection, and row actions.
 *
 * Supports both legacy `format`/`statusVariants` and new `valueType`/`valueEnum` patterns.
 *
 * @module list/components/ListPageTable
 */

'use client';

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, formatValue, interpolateHref, formatRelativeTime } from '@pageshell/core';
import {
  Button,
  Checkbox,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  resolveIcon,
  StatusBadge,
  type StatusVariant,
} from '@pageshell/primitives';
import { MoreHorizontal, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import type { ColumnConfig, RowActionsConfig, RowActionConfirm, ValueEnumOption } from '../../shared/types';
import { getRowKey } from '../utils';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Maps column statusVariants to StatusBadge variants (legacy)
 */
function mapStatusVariant(variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'): StatusVariant {
  const variantMap: Record<string, StatusVariant> = {
    success: 'success',
    warning: 'warning',
    error: 'destructive',
    info: 'info',
    neutral: 'default',
  };
  return variantMap[variant] ?? 'default';
}

/**
 * Maps valueEnum status to StatusBadge variants
 */
function mapValueEnumStatus(status?: 'default' | 'success' | 'warning' | 'error' | 'info'): StatusVariant {
  const variantMap: Record<string, StatusVariant> = {
    default: 'default',
    success: 'success',
    warning: 'warning',
    error: 'destructive',
    info: 'info',
  };
  return variantMap[status ?? 'default'] ?? 'default';
}

/**
 * Get display text and status from valueEnum
 */
function getValueEnumDisplay(
  value: unknown,
  valueEnum: ColumnConfig['valueEnum']
): { text: string; status?: StatusVariant } | null {
  if (!valueEnum || value === null || value === undefined) return null;

  const key = String(value);
  const enumValue = valueEnum[key];

  if (!enumValue) return null;

  if (typeof enumValue === 'string') {
    return { text: enumValue };
  }

  const option = enumValue as ValueEnumOption;
  return {
    text: option.text,
    status: option.status ? mapValueEnumStatus(option.status) : undefined,
  };
}

// =============================================================================
// Types
// =============================================================================

export interface ListPageTableProps<TRow = Record<string, unknown>> {
  /** Table rows */
  rows: TRow[];
  /** Column configuration */
  columns: ColumnConfig<TRow>[];
  /** Row key field or getter */
  rowKey: string | ((row: TRow) => string | number);
  /** Row actions */
  rowActions?: RowActionsConfig<TRow>;
  /** Enable row selection */
  selectable?: boolean;
  /** Currently selected row IDs */
  selectedIds: Set<string | number>;
  /** Handle row selection change */
  onSelectRow: (id: string | number, checked: boolean) => void;
  /** Handle select all */
  onSelectAll: (checked: boolean, rows: TRow[]) => void;
  /** Current sort column */
  sortBy?: string;
  /** Current sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Handle sort change */
  onSortChange: (key: string, order: 'asc' | 'desc') => void;
  /** Open confirmation dialog */
  onConfirm: (config: RowActionConfirm, action: () => Promise<void>) => void;
  /** Callback when a row is clicked */
  onRowClick?: (row: TRow) => void;
}

// =============================================================================
// Component
// =============================================================================

export function ListPageTable<TRow = Record<string, unknown>>({
  rows,
  columns,
  rowKey,
  rowActions,
  selectable,
  selectedIds,
  onSelectRow,
  onSelectAll,
  sortBy,
  sortOrder,
  onSortChange,
  onConfirm,
  onRowClick,
}: ListPageTableProps<TRow>) {
  const navigate = useNavigate();

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => onSelectAll(checked === true, rows)}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {columns.map((col) => {
              const isSorted = sortBy === col.key;
              const currentDirection = isSorted ? sortOrder : undefined;

              const handleSort = () => {
                if (isSorted) {
                  onSortChange(col.key, currentDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  onSortChange(col.key, 'asc');
                }
              };

              return (
                <TableHead
                  key={col.key}
                  style={{ width: col.width }}
                  aria-sort={
                    col.sortable
                      ? isSorted
                        ? currentDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    col.sortable && 'cursor-pointer select-none',
                    col.hiddenOnMobile && 'hidden md:table-cell'
                  )}
                  role={col.sortable ? 'button' : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  onClick={col.sortable ? handleSort : undefined}
                  onKeyDown={col.sortable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort();
                    }
                  } : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && isSorted && (
                      currentDirection === 'asc'
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </span>
                </TableHead>
              );
            })}
            {rowActions && Object.keys(rowActions).length > 0 && (
              <TableHead className="w-12" />
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => {
            const id = getRowKey(row, rowKey, rowIndex);
            const isSelected = selectedIds.has(id);

            return (
              <TableRow
                key={id}
                data-state={isSelected ? 'selected' : undefined}
                className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectRow(id, checked === true)}
                      aria-label={`Select row ${id}`}
                    />
                  </TableCell>
                )}
                {columns.map((col) => {
                  const rowObj = row as Record<string, unknown>;
                  const value = col.key.includes('.')
                    ? col.key.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], row)
                    : rowObj[col.key];

                  return (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.hiddenOnMobile && 'hidden md:table-cell',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.className
                      )}
                    >
                      {(() => {
                        // Line clamp class lookup (explicit for Tailwind JIT detection)
                        const LINE_CLAMP_CLASSES: Record<number, string> = {
                          1: 'line-clamp-1',
                          2: 'line-clamp-2',
                          3: 'line-clamp-3',
                          4: 'line-clamp-4',
                          5: 'line-clamp-5',
                          6: 'line-clamp-6',
                        };

                        // Helper to wrap content with line clamping
                        // Default: 2 lines for text content (unless maxLines is explicitly set or disabled)
                        const wrapWithClamp = (content: React.ReactNode, forceDefault = true) => {
                          // If maxLines is explicitly set to 0 or false-y, no clamping
                          if (col.maxLines === 0) {
                            return content;
                          }

                          // Use explicit maxLines if set, otherwise default to 2 for text
                          const lines = col.maxLines ?? (forceDefault ? 2 : undefined);

                          if (lines && lines > 0) {
                            const clampClass = LINE_CLAMP_CLASSES[lines] ?? 'line-clamp-2';
                            return (
                              <span className={clampClass}>
                                {content}
                              </span>
                            );
                          }
                          return content;
                        };

                        // 1. Custom render function (highest priority)
                        if (col.render) {
                          return wrapWithClamp(col.render(row, value));
                        }

                        // 2. New API: valueType + valueEnum
                        if (col.valueType === 'badge' && col.valueEnum) {
                          const display = getValueEnumDisplay(value, col.valueEnum);
                          if (display) {
                            return (
                              <StatusBadge variant={display.status ?? 'default'} size="sm">
                                {display.text}
                              </StatusBadge>
                            );
                          }
                          return formatValue(value, 'text');
                        }

                        // 3. New API: relativeTime
                        if (col.valueType === 'relativeTime') {
                          if (!value) return '—';
                          const date = value instanceof Date ? value : new Date(value as string | number);
                          return (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {formatRelativeTime(date)}
                            </span>
                          );
                        }

                        // 4. New API: date/dateTime
                        if (col.valueType === 'date' || col.valueType === 'dateTime') {
                          return formatValue(value, col.valueType === 'dateTime' ? 'datetime' : 'date');
                        }

                        // 5. New API: other valueTypes (number, currency, percent, etc.)
                        if (col.valueType && col.valueType !== 'text' && col.valueType !== 'custom') {
                          // Map valueType to format for compatibility
                          const formatMap: Record<string, string> = {
                            number: 'number',
                            currency: 'currency',
                            percent: 'percent',
                            boolean: 'boolean',
                            tags: 'tags',
                          };
                          const format = formatMap[col.valueType];
                          if (format) {
                            // Apply line clamping for tags (text-based content)
                            if (format === 'tags') {
                              return wrapWithClamp(formatValue(value, format as 'tags'));
                            }
                            return formatValue(value, format as 'number' | 'currency' | 'percent' | 'boolean' | 'tags');
                          }
                        }

                        // 6. Legacy API: format + statusVariants
                        const isBadgeFormat = col.format === 'badge' || col.format === 'status';
                        const hasStatusVariants = col.statusVariants && typeof value === 'string';

                        if (isBadgeFormat && hasStatusVariants) {
                          const statusValue = value as string;
                          const variant = mapStatusVariant(col.statusVariants![statusValue] ?? 'neutral');
                          return (
                            <StatusBadge variant={variant} size="sm">
                              {formatValue(value, 'text')}
                            </StatusBadge>
                          );
                        }

                        // 7. Legacy API: format
                        if (col.format) {
                          return wrapWithClamp(formatValue(value, col.format));
                        }

                        // 8. Default: text
                        return wrapWithClamp(formatValue(value, 'text'));
                      })()}
                    </TableCell>
                  );
                })}
                {rowActions && Object.keys(rowActions).length > 0 && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg hover:bg-muted transition-colors touch-manipulation">
                          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(rowActions).map(([key, action], idx, arr) => {
                          if (action.hidden) {
                            const isHidden = typeof action.hidden === 'function' ? action.hidden(row) : action.hidden;
                            if (isHidden) return null;
                          }
                          const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : action.disabled;
                          const isDestructive = action.variant === 'destructive';
                          const RowActionIcon = resolveIcon(action.icon);

                          // Add separator before destructive actions
                          const prevAction = idx > 0 ? arr[idx - 1]?.[1] : null;
                          const showSeparator = isDestructive && idx > 0 && prevAction?.variant !== 'destructive';

                          return (
                            <React.Fragment key={key}>
                              {showSeparator && <DropdownMenuSeparator />}
                              <DropdownMenuItem
                                disabled={isDisabled}
                                className={cn(isDestructive && 'text-destructive focus:text-destructive')}
                                onClick={() => {
                                  // Handle href navigation (immediate, no confirm needed)
                                  if (action.href) {
                                    const url = typeof action.href === 'function'
                                      ? action.href(row)
                                      : interpolateHref(action.href, row as Record<string, unknown>);
                                    navigate(url);
                                    return;
                                  }

                                  const executeAction = async () => {
                                    if (action.mutation && action.getInput) {
                                      const input = action.getInput(row);
                                      await action.mutation.mutateAsync(input);
                                    } else if (action.onClick) {
                                      await action.onClick(row);
                                    }
                                  };

                                  if (action.confirm) {
                                    onConfirm(action.confirm, executeAction);
                                  } else {
                                    executeAction();
                                  }
                                }}
                              >
                                {RowActionIcon && <RowActionIcon className="mr-2 h-4 w-4" />}
                                {action.label}
                              </DropdownMenuItem>
                            </React.Fragment>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

ListPageTable.displayName = 'ListPageTable';
