/**
 * Formatter types for PageShell
 *
 * @module formatters/types
 */

/**
 * Supported value formats
 */
export type ValueFormat =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'time'
  | 'currency'
  | 'percent'
  | 'duration'
  | 'boolean'
  | 'status'
  | 'badge'
  | 'tags'
  | 'link'
  | 'truncate'
  | 'relative'
  | 'avatar';

/**
 * Formatter options
 */
export interface FormatterOptions {
  locale?: string;
  currency?: string;
  emptyValue?: string;
}

/**
 * Default formatter options
 */
export const DEFAULT_FORMATTER_OPTIONS: Required<FormatterOptions> = {
  locale: 'pt-BR',
  currency: 'BRL',
  emptyValue: '—',
};
