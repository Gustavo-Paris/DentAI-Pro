/**
 * Column Presets - Factory functions for common column configurations
 *
 * These presets create column configurations compatible with ListPage, PageTable,
 * and other table/list components. They provide sensible defaults while allowing
 * full customization through options.
 *
 * @module presets/columnPresets
 *
 * @example Basic usage
 * ```tsx
 * const columns = [
 *   textColumn({ key: 'name', label: 'Nome' }),
 *   statusColumn({ statusVariants: { active: 'success', inactive: 'neutral' } }),
 *   currencyColumn({ key: 'price', label: 'Preço' }),
 *   dateColumn({ key: 'createdAt', label: 'Criado em' }),
 * ];
 * ```
 *
 * @example With custom render
 * ```tsx
 * stackedTextColumn({
 *   key: 'user',
 *   label: 'Usuário',
 *   primary: (row) => row.name,
 *   secondary: (row) => row.email,
 * })
 * ```
 */

import type { ReactNode } from 'react';
import type { ValueFormat } from '../formatters/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Base column configuration (minimal interface compatible with ColumnConfig)
 */
export interface ColumnPreset<TRow = Record<string, unknown>> {
  /** Unique column key (dot notation supported) */
  key: string;
  /** Display label */
  label: string;
  /** Value format */
  format?: ValueFormat;
  /** Sortable? */
  sortable?: boolean;
  /** Hidden on mobile? */
  hiddenOnMobile?: boolean;
  /** Column width */
  width?: string | number;
  /** Custom cell renderer */
  render?: (row: TRow, value: unknown) => ReactNode;
  /** Badge variant mapping */
  badgeVariants?: Record<string, string>;
  /** Status variant mapping */
  statusVariants?: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'>;
}

/**
 * Base options for all column presets
 */
type BaseColumnOptions<TRow> = Partial<Omit<ColumnPreset<TRow>, 'format'>>;

/**
 * Options for status column
 */
export type StatusColumnOptions<TRow> = BaseColumnOptions<TRow> & {
  statusVariants?: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'>;
};

/**
 * Options for badge column
 */
export type BadgeColumnOptions<TRow> = BaseColumnOptions<TRow> & {
  badgeVariants?: Record<string, string>;
};

/**
 * Options for stacked text column
 */
export type StackedTextColumnOptions<TRow> = Omit<BaseColumnOptions<TRow>, 'render'> & {
  /** Column label (required) */
  label: string;
  /** Primary text (main line) */
  primary: keyof TRow | ((row: TRow) => string | null | undefined);
  /** Secondary text (muted line below) */
  secondary?: keyof TRow | ((row: TRow) => string | null | undefined);
};

// =============================================================================
// Column Presets
// =============================================================================

/**
 * Text column preset
 *
 * @example
 * ```tsx
 * textColumn({ key: 'name', label: 'Nome' })
 * textColumn({ key: 'email', label: 'Email', hiddenOnMobile: true })
 * ```
 */
export function textColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'value', label = 'Valor', ...rest } = options;

  return {
    key,
    label,
    format: 'text',
    ...rest,
  };
}

/**
 * Status column preset
 *
 * @example
 * ```tsx
 * statusColumn({
 *   statusVariants: {
 *     active: 'success',
 *     pending: 'warning',
 *     cancelled: 'error',
 *   }
 * })
 * ```
 */
export function statusColumn<TRow>(
  options: StatusColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'status', label = 'Status', statusVariants, ...rest } = options;

  return {
    key,
    label,
    format: 'status',
    statusVariants,
    ...rest,
  };
}

/**
 * Badge column preset
 *
 * @example
 * ```tsx
 * badgeColumn({
 *   key: 'type',
 *   label: 'Tipo',
 *   badgeVariants: {
 *     premium: 'violet',
 *     standard: 'slate',
 *   }
 * })
 * ```
 */
export function badgeColumn<TRow>(
  options: BadgeColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'value', label = 'Valor', badgeVariants, ...rest } = options;

  return {
    key,
    label,
    format: 'badge',
    badgeVariants,
    ...rest,
  };
}

/**
 * Tags column preset
 *
 * @example
 * ```tsx
 * tagsColumn({ key: 'categories', label: 'Categorias' })
 * ```
 */
export function tagsColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'tags', label = 'Tags', ...rest } = options;

  return {
    key,
    label,
    format: 'tags',
    ...rest,
  };
}

/**
 * Date column preset (formatted date without time)
 *
 * @example
 * ```tsx
 * dateColumn({ key: 'birthDate', label: 'Data de Nascimento' })
 * ```
 */
export function dateColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'date', label = 'Data', ...rest } = options;

  return {
    key,
    label,
    format: 'date',
    ...rest,
  };
}

/**
 * DateTime column preset (date with time)
 *
 * @example
 * ```tsx
 * dateTimeColumn({ key: 'createdAt', label: 'Criado em' })
 * ```
 */
export function dateTimeColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'createdAt', label = 'Data', ...rest } = options;

  return {
    key,
    label,
    format: 'datetime',
    ...rest,
  };
}

/**
 * Relative date column (e.g., "há 2 dias", "em 3 horas")
 *
 * Uses native Intl.RelativeTimeFormat for locale-aware formatting.
 * Perfect for "time ago" or "time until" displays.
 *
 * @example
 * ```tsx
 * relativeDateColumn({
 *   key: 'requestedAt',
 *   label: 'Solicitado',
 * })
 * // Renders: "há 3 dias", "há 2 semanas", etc.
 * ```
 */
export function relativeDateColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'createdAt', label = 'Data', ...rest } = options;

  return {
    key,
    label,
    format: 'relative',
    ...rest,
  };
}

/**
 * Currency column preset
 *
 * @example
 * ```tsx
 * currencyColumn({ key: 'price', label: 'Preço' })
 * currencyColumn({ key: 'total', label: 'Total', sortable: true })
 * ```
 */
export function currencyColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'amount', label = 'Valor', ...rest } = options;

  return {
    key,
    label,
    format: 'currency',
    ...rest,
  };
}

/**
 * Number column preset
 *
 * @example
 * ```tsx
 * numberColumn({ key: 'quantity', label: 'Quantidade' })
 * ```
 */
export function numberColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'value', label = 'Valor', ...rest } = options;

  return {
    key,
    label,
    format: 'number',
    ...rest,
  };
}

/**
 * Percent column preset
 *
 * @example
 * ```tsx
 * percentColumn({ key: 'progress', label: 'Progresso' })
 * ```
 */
export function percentColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'percent', label = 'Percentual', ...rest } = options;

  return {
    key,
    label,
    format: 'percent',
    ...rest,
  };
}

/**
 * Boolean column preset
 *
 * @example
 * ```tsx
 * booleanColumn({ key: 'isActive', label: 'Ativo' })
 * ```
 */
export function booleanColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'active', label = 'Ativo', ...rest } = options;

  return {
    key,
    label,
    format: 'boolean',
    ...rest,
  };
}

/**
 * Avatar column preset
 *
 * @example
 * ```tsx
 * avatarColumn({ key: 'user.avatar', label: 'Foto' })
 * ```
 */
export function avatarColumn<TRow>(
  options: BaseColumnOptions<TRow> = {}
): ColumnPreset<TRow> {
  const { key = 'avatar', label = 'Foto', width = 48, ...rest } = options;

  return {
    key,
    label,
    format: 'avatar',
    width,
    ...rest,
  };
}

/**
 * Stacked text column with primary and secondary lines
 *
 * @example
 * ```tsx
 * stackedTextColumn<User>({
 *   key: 'creator',
 *   label: 'Criador',
 *   primary: (row) => row.creatorName,
 *   secondary: (row) => row.creatorEmail,
 * })
 *
 * // Or with key paths
 * stackedTextColumn<User>({
 *   key: 'user',
 *   label: 'Usuário',
 *   primary: 'name',
 *   secondary: 'email',
 * })
 * ```
 */
export function stackedTextColumn<TRow>(
  options: StackedTextColumnOptions<TRow>
): ColumnPreset<TRow> {
  const { key = 'stacked', label, primary, secondary, ...rest } = options;

  const getValue = (
    row: TRow,
    getter: keyof TRow | ((row: TRow) => string | null | undefined)
  ): string => {
    if (typeof getter === 'function') {
      return getter(row) ?? '';
    }
    return String(row[getter] ?? '');
  };

  return {
    key,
    label,
    render: (row: TRow) => {
      const primaryValue = getValue(row, primary);
      const secondaryValue = secondary ? getValue(row, secondary) : null;

      return (
        <div className="text-sm">
          <div>{primaryValue}</div>
          {secondaryValue && (
            <div className="text-xs text-muted-foreground">{secondaryValue}</div>
          )}
        </div>
      );
    },
    ...rest,
  };
}
