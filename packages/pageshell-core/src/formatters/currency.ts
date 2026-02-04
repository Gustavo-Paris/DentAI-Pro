/**
 * Currency & Number Formatting Utilities
 *
 * Centralized currency and number formatting for the platform.
 * All apps should import from here instead of creating local formatters.
 *
 * @module @pageshell/core/formatters/currency
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Converted pricing object from the API
 */
export interface ConvertedPricing {
  selfPaced: number;
  withMentorship: number;
  currency: string;
  rate: number;
  symbol: string;
}

/**
 * USD precision levels for different use cases
 */
export type UsdPrecision = 'standard' | 'precise' | 'detailed';

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  /** Locale for formatting (default: 'pt-BR') */
  locale?: string;
  /** Currency code (default: 'BRL') */
  currency?: string;
  /** Whether the value is in cents (default: true) */
  fromCents?: boolean;
}

// =============================================================================
// BRL FORMATTING
// =============================================================================

/**
 * Format a value as currency
 *
 * @param value - The value in cents (default) or decimal
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1999) // => 'R$ 19,99'
 * formatCurrency(1999, { locale: 'en-US', currency: 'USD' }) // => '$19.99'
 * formatCurrency(19.99, { fromCents: false }) // => 'R$ 19,99'
 */
export function formatCurrency(
  value: number,
  options: CurrencyFormatOptions | string = {}
): string {
  // Support legacy signature: formatCurrency(centavos, currency)
  if (typeof options === 'string') {
    const currency = options;
    const reais = value / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(reais);
  }

  const { locale = 'pt-BR', currency = 'BRL', fromCents = true } = options;
  const amount = fromCents ? value / 100 : value;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Alias for formatCurrency - used in mentorship components
 * @see formatCurrency
 */
export const formatPrice = formatCurrency;

/**
 * Format a value in reais (not centavos) with compact notation
 *
 * Takes the value in reais directly (not centavos).
 * Useful for analytics/dashboards where values are already in reais.
 *
 * @param reais - Value in reais
 * @returns Compact formatted string (e.g., "R$ 1,5 mil")
 *
 * @example
 * formatReaisCompact(1500); // "R$ 1,5 mil"
 * formatReaisCompact(500); // "R$ 500"
 * formatReaisCompact(1200000); // "R$ 1,2 mi"
 */
export function formatReaisCompact(reais: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(reais);
}

/**
 * Format centavos to BRL, returning "R$ 0,00" for null/undefined
 *
 * @param centavos - Value in centavos, or null/undefined
 * @returns Formatted currency string, or "R$ 0,00" for null/undefined
 *
 * @example
 * formatCurrencyOrZero(5000); // "R$ 50,00"
 * formatCurrencyOrZero(null); // "R$ 0,00"
 * formatCurrencyOrZero(undefined); // "R$ 0,00"
 */
export function formatCurrencyOrZero(
  centavos: number | null | undefined
): string {
  if (centavos === null || centavos === undefined) return 'R$ 0,00';
  return formatCurrency(centavos);
}

/**
 * Format a value in reais (not centavos) to BRL currency string
 *
 * Use this when the value is already in reais (e.g., from analytics).
 * For values in centavos, use formatCurrency instead.
 *
 * @param reais - Value in reais
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 *
 * @example
 * formatReais(1234.56); // "R$ 1.234,56"
 * formatReais(50); // "R$ 50,00"
 */
export function formatReais(reais: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Format BRL with short notation for marketing/social proof
 *
 * Uses K+ and M+ suffixes for a more casual/marketing style.
 *
 * @param reais - Value in reais
 * @returns Short formatted string (e.g., "R$ 1.5M+", "R$ 500K+")
 *
 * @example
 * formatBrlShort(1500000); // "R$ 1.5M+"
 * formatBrlShort(500000); // "R$ 500K+"
 * formatBrlShort(1000); // "R$ 1K+"
 */
export function formatBrlShort(reais: number): string {
  if (reais >= 1000000) {
    const millions = reais / 1000000;
    const formatted =
      millions % 1 === 0
        ? millions.toFixed(0)
        : millions.toFixed(1).replace('.0', '');
    return `R$ ${formatted}M+`;
  }
  if (reais >= 1000) {
    const thousands = reais / 1000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0);
    return `R$ ${formatted}K+`;
  }
  return `R$ ${reais}`;
}

// =============================================================================
// MULTI-CURRENCY FORMATTING
// =============================================================================

/**
 * Format a price using converted pricing data
 *
 * If convertedPricing is provided, formats in the user's currency.
 * Otherwise, falls back to BRL formatting with the original amount.
 *
 * @param originalCents - Original price in cents (BRL)
 * @param convertedPricing - Optional converted pricing object from API
 * @param priceType - 'selfPaced' or 'withMentorship'
 * @returns Formatted price string
 *
 * @example
 * // With converted pricing (BRL)
 * formatConvertedPrice(9900, { selfPaced: 9900, currency: 'BRL', rate: 1, symbol: 'R$' }, 'selfPaced');
 * // Returns: "R$ 99,00"
 *
 * // With converted pricing (USD)
 * formatConvertedPrice(9900, { selfPaced: 1815, currency: 'USD', rate: 0.1833, symbol: '$' }, 'selfPaced');
 * // Returns: "$18.15"
 */
export function formatConvertedPrice(
  originalCents: number,
  convertedPricing?: ConvertedPricing,
  priceType: 'selfPaced' | 'withMentorship' = 'selfPaced'
): string {
  if (convertedPricing) {
    const amount =
      priceType === 'selfPaced'
        ? convertedPricing.selfPaced
        : convertedPricing.withMentorship;
    return formatCurrency(amount, convertedPricing.currency);
  }

  // Fallback to BRL
  return formatCurrency(originalCents, 'BRL');
}

/**
 * Get the currency symbol from converted pricing or default to R$
 */
export function getCurrencySymbol(convertedPricing?: ConvertedPricing): string {
  return convertedPricing?.symbol ?? 'R$';
}

/**
 * Format a simple price value (in the currency's smallest unit) with the given currency
 *
 * @param cents - Price in cents/smallest unit
 * @param currency - Currency code (e.g., 'BRL', 'USD')
 * @param _symbol - Currency symbol for display (unused, kept for compatibility)
 * @returns Formatted price string
 */
export function formatPriceWithCurrency(
  cents: number,
  currency: string = 'BRL',
  _symbol?: string
): string {
  const value = cents / 100;

  // Use Intl for proper formatting
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

// =============================================================================
// USD FORMATTING
// =============================================================================

/**
 * Format a value in USD (already in dollars, not cents)
 *
 * @param value - Value in dollars
 * @param precision - Precision level:
 *   - 'standard' (default): 2 decimal places (e.g., "$1.23")
 *   - 'precise': 2-4 decimal places (e.g., "$0.0012") - for usage tracking
 *   - 'detailed': 4-6 decimal places (e.g., "$0.001234") - for detailed cost breakdowns
 * @returns Formatted USD string
 *
 * @example
 * formatUsd(1234.56); // "$1,234.56"
 * formatUsd(0.001234, 'precise'); // "$0.0012"
 * formatUsd(0.00123456, 'detailed'); // "$0.001235"
 */
export function formatUsd(
  value: number,
  precision: UsdPrecision = 'standard'
): string {
  const precisionConfig: Record<
    UsdPrecision,
    { minimumFractionDigits: number; maximumFractionDigits: number }
  > = {
    standard: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    precise: { minimumFractionDigits: 2, maximumFractionDigits: 4 },
    detailed: { minimumFractionDigits: 4, maximumFractionDigits: 6 },
  };

  const config = precisionConfig[precision];

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...config,
  }).format(value);
}

/**
 * Format USD value as raw number string (no symbol) for exports
 *
 * @param value - Value in dollars, or null/undefined
 * @param fallback - String to return for null/undefined (default: '-')
 * @returns Raw number string (e.g., "1234.56") or fallback
 *
 * @example
 * formatUsdRaw(1234.56); // "1234.56"
 * formatUsdRaw(null); // "-"
 * formatUsdRaw(undefined, ''); // ""
 */
export function formatUsdRaw(
  value: number | null | undefined,
  fallback: string = '-'
): string {
  if (value === null || value === undefined) return fallback;
  return value.toFixed(2);
}

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert cents to decimal
 */
export function centsToDecimal(cents: number): number {
  return cents / 100;
}

/**
 * Convert decimal to cents
 */
export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100);
}
