// Class names
export { cn } from './cn';

// URL interpolation
export { interpolateHref, hasInterpolation, extractInterpolationKeys } from './interpolate';

// Default merging
export { mergeDefaults, applyDefaults, type Transformer } from './defaultMerger';

// Text and Avatar utilities
export {
  getAvatarUrl,
  getInitials,
  truncate,
  pageUtils,
  type AvatarUrlOptions,
} from './text';

// Search and filter utilities
export {
  normalizeString,
  matchesSearch,
  matchesFilters,
  getDefaultFilters,
} from './searchUtils';

// Date utilities
export {
  subDays,
  addDays,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
  daysBetween,
} from './dateUtils';

// Inference (smart defaults)
export {
  // Row actions
  inferRowActionDefaults,
  applyRowActionsDefaults,
  type RowActionConfig,
  type RowActionConfirm,
  type IconType,
  // Columns
  inferColumnDefaults,
  applyColumnsDefaults,
  type InferColumnConfig,
  // Filters
  normalizeFilterOptions,
  applyFilterDefaults,
  applyFiltersDefaults,
  type InferFilterConfig,
  type FilterOption,
  // Stats
  inferStatDefaults,
  applyStatsDefaults,
  type StatConfig,
} from './inference';

// Filter options builder
export {
  createFilterOptions,
  type FilterOption as FilterOptionType,
  type CreateFilterOptionsConfig,
} from './filterOptions';

// Stats counting utility
export { countByField } from './countByField';

// Gauge utilities
export {
  getGaugeStatus,
  getGaugeColors,
  getGaugeStatusClasses,
  DEFAULT_GAUGE_THRESHOLDS,
  type GaugeStatus,
  type GaugeColors,
  type GaugeThresholds,
} from './gauge';

// Threshold color utilities
export {
  getThresholdVariant,
  getThresholdColor,
  getProgressColor,
  getStatusColor,
  DEFAULT_THRESHOLDS,
  type ThresholdConfig,
  type ThresholdVariant,
  type ThresholdColorType,
} from './threshold-colors';

// Status config factory
export {
  createStatusConfig,
  getStatusVariantColors,
  STATUS_VARIANT_COLORS,
  type StatusConfigVariant,
  type StatusConfigItem,
  type StatusConfigInput,
  type StatusConfigResult,
} from './status-config';

// Compact variant factory
export {
  createCompactVariant,
  createSizeVariants,
  COMPACT_BUTTON_DEFAULTS,
  MINIMAL_BUTTON_DEFAULTS,
  type SizeableProps,
} from './compact-variant.js';

// Safe storage utilities
export {
  isBrowser,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetRaw,
  safeSetRaw,
} from './storage';

// Progress calculation utilities
export {
  calculateProgress,
  calculateUsagePercent,
  getCompletionStatus,
  formatProgressFraction,
} from './progress';

// Date locale utilities
export {
  getDateLocale,
  isDateLocaleSupported,
  getSupportedDateLocales,
  DATE_LOCALES,
  DEFAULT_DATE_LOCALE,
  type Locale,
} from './date-locale';

// CSV export utilities
export {
  escapeCSVField,
  createCSVContent,
  createCSVBlob,
  downloadCSVFile,
  formatDateForFilename,
  formatDatetimeForFilename,
  type CSVColumn,
} from './csv';

// Recovery codes utilities
export {
  formatRecoveryCodeForDisplay,
  copyRecoveryCodesToClipboard,
  downloadRecoveryCodes,
  RECOVERY_CODE_LENGTH,
  RECOVERY_CODE_SPLIT,
  DEFAULT_RECOVERY_CODES_STRINGS,
  type RecoveryCodesDownloadStrings,
  type DownloadRecoveryCodesOptions,
} from './recovery-codes';
