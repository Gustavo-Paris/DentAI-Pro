// packages/pageshell-core/src/utils/filterOptions.ts

/**
 * Translation function type (compatible with i18next useTranslation)
 */
type TFunction = (key: string) => string;

/**
 * Filter option
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Options for createFilterOptions
 */
export interface CreateFilterOptionsConfig {
  /** Include "all" option at the start (default: true) */
  includeAll?: boolean;
  /** Value for the "all" option (default: 'all') */
  allValue?: string;
}

/**
 * Create filter options array from i18n translation keys
 *
 * @param t - Translation function from useTranslation()
 * @param i18nPrefix - Prefix for translation keys (e.g., 'filters.status')
 * @param values - Array of filter values (keys appended to prefix)
 * @param options - Configuration options
 * @returns Array of filter options with translated labels
 *
 * @example
 * ```tsx
 * const { t } = useTranslation('admin');
 * const statusFilterOptions = createFilterOptions(t, 'filters.status', [
 *   'draft', 'published', 'archived'
 * ]);
 * ```
 */
export function createFilterOptions(
  t: TFunction,
  i18nPrefix: string,
  values: string[],
  options: CreateFilterOptionsConfig = {}
): FilterOption[] {
  const { includeAll = true, allValue = 'all' } = options;

  const result: FilterOption[] = [];

  if (includeAll) {
    result.push({
      value: allValue,
      label: t(`${i18nPrefix}.${allValue}`),
    });
  }

  for (const value of values) {
    result.push({
      value,
      label: t(`${i18nPrefix}.${value}`),
    });
  }

  return result;
}
