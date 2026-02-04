/**
 * Date Locale Utilities
 *
 * Provides mapping between locale codes and date-fns Locale objects.
 * Framework-agnostic - can be used with any i18n solution.
 *
 * @module utils/date-locale
 */

import { ptBR, enUS, es, fr, de, type Locale } from 'date-fns/locale';

/**
 * Mapping of locale codes to date-fns Locale objects.
 * Add new locales here as needed.
 */
export const DATE_LOCALES: Record<string, Locale> = {
  'pt-BR': ptBR,
  'pt': ptBR,
  'en-US': enUS,
  'en': enUS,
  'es-ES': es,
  'es': es,
  'fr-FR': fr,
  'fr': fr,
  'de-DE': de,
  'de': de,
};

/**
 * Default locale when no match is found
 */
export const DEFAULT_DATE_LOCALE = ptBR;

/**
 * Get the date-fns Locale object for a given locale code.
 *
 * @param localeCode - Locale code (e.g., 'pt-BR', 'en-US', 'en')
 * @returns date-fns Locale object, falls back to ptBR if not found
 *
 * @example
 * ```tsx
 * import { format } from 'date-fns';
 * import { getDateLocale } from '@pageshell/core';
 *
 * const locale = getDateLocale('pt-BR');
 * const formatted = format(new Date(), "d 'de' MMMM", { locale });
 * // => "3 de fevereiro"
 * ```
 *
 * @example With next-intl
 * ```tsx
 * import { useLocale } from 'next-intl';
 * import { getDateLocale } from '@pageshell/core';
 *
 * function MyComponent() {
 *   const locale = useLocale();
 *   const dateLocale = getDateLocale(locale);
 *   // ...
 * }
 * ```
 */
export function getDateLocale(localeCode: string): Locale {
  return DATE_LOCALES[localeCode] ?? DEFAULT_DATE_LOCALE;
}

/**
 * Check if a locale code is supported.
 *
 * @param localeCode - Locale code to check
 * @returns true if the locale is supported
 */
export function isDateLocaleSupported(localeCode: string): boolean {
  return localeCode in DATE_LOCALES;
}

/**
 * Get all supported locale codes.
 *
 * @returns Array of supported locale codes
 */
export function getSupportedDateLocales(): string[] {
  return Object.keys(DATE_LOCALES);
}

// Re-export Locale type for convenience
export type { Locale } from 'date-fns/locale';
