// Types
export type { ValueFormat, FormatterOptions } from './types';
export { DEFAULT_FORMATTER_OPTIONS } from './types';

// Master formatter
export { formatValue, getNestedValue } from './value';

// Currency
export {
  // Types
  type ConvertedPricing,
  type UsdPrecision,
  type CurrencyFormatOptions,
  // BRL formatting
  formatCurrency,
  formatPrice,
  formatReaisCompact,
  formatCurrencyOrZero,
  formatReais,
  formatBrlShort,
  // Multi-currency formatting
  formatConvertedPrice,
  getCurrencySymbol,
  formatPriceWithCurrency,
  // USD formatting
  formatUsd,
  formatUsdRaw,
  // Conversion utilities
  centsToDecimal,
  decimalToCents,
} from './currency';

// Date/Time
export {
  formatDate,
  formatDateTime,
  formatTime,
  formatCompactRelativeTime,
  formatRelativeTime,
} from './date';

// Numbers
export {
  formatNumber,
  formatCompactNumber,
  formatPercent,
  formatBoolean,
  formatDuration,
  formatDurationMinutes,
} from './number';

// Time (verbose durations, countdown, timer)
export {
  formatDurationVerbose,
  formatCountdown,
  formatTimer,
  type TranslationFn as TimeTranslationFn,
  type FormatDurationVerboseOptions,
} from './time';
