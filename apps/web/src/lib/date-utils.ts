import { ptBR, enUS } from 'date-fns/locale';
import i18n from '@/lib/i18n';

export function getDateLocale() {
  return i18n.language?.startsWith('en') ? enUS : ptBR;
}

export function getDateFormat(format: 'short' | 'medium' | 'long' | 'greeting') {
  const isEn = i18n.language?.startsWith('en');
  switch (format) {
    case 'short': return isEn ? 'MMM d' : "d 'de' MMM";
    case 'medium': return isEn ? 'MMM d, yyyy' : "d 'de' MMM, yyyy";
    case 'long': return isEn ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy";
    case 'greeting': return isEn ? 'EEEE, MMMM d' : "EEEE, d 'de' MMMM";
  }
}

// ---------------------------------------------------------------------------
// Merged from dateUtils.ts
// ---------------------------------------------------------------------------

/**
 * Calculate age from a birth date string
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format a date string to locale-aware short date.
 * Falls back to pt-BR (the app's primary locale).
 * Handles YYYY-MM-DD strings without timezone conversion issues.
 */
export function formatDateBR(dateString: string): string {
  const lang = i18n.language;
  // Default to pt-BR — the app's primary locale and function's historical purpose
  const locale = lang && lang !== 'cimode' ? lang : 'pt-BR';

  // For YYYY-MM-DD format, parse directly to avoid UTC conversion
  const isoDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    // Build a local date to feed into toLocaleDateString
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString(locale);
  }

  // For other formats (with time), use standard parsing
  const date = new Date(dateString);
  return date.toLocaleDateString(locale);
}

/**
 * Parse a Date object to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
