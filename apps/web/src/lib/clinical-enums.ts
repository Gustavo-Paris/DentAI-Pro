/**
 * Clinical enum translation helper.
 *
 * Maps raw Portuguese enum values from the backend (AI analysis, database)
 * to i18n translation keys under the `enums.*` namespace.
 */
import type { TFunction } from 'i18next';

/**
 * Normalize a raw Portuguese enum value into an i18n key fragment.
 * e.g. "Classe II" → "classe_ii", "Média" → "media"
 */
function normalizeEnumValue(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/\s+/g, '_');
}

type ClinicalEnumType = 'cavityClass' | 'restorationSize' | 'depth' | 'substrate' | 'substrateCondition';

/**
 * Translate a clinical enum value using the i18n system.
 * Falls back to the raw value when no translation key exists.
 *
 * @example
 * tEnum(t, 'cavityClass', 'Classe II')  // → "Class II" (en-US) or "Classe II" (pt-BR)
 * tEnum(t, 'depth', 'profundo')          // → "Deep" (en-US) or "Profundo" (pt-BR)
 */
export function tEnum(t: TFunction, enumType: ClinicalEnumType, value: string): string {
  const key = `enums.${enumType}.${normalizeEnumValue(value)}`;
  const translated = t(key);
  // If the key wasn't found, t() returns the key itself — fall back to the raw value
  return translated === key ? value : translated;
}
