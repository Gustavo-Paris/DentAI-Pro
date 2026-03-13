import { ptBR, enUS } from 'date-fns/locale';
import i18n from '@/lib/i18n';
import {
  formatDateShort as psFormatDateShort,
  formatDateLong as psFormatDateLong,
  formatDayMonth as psFormatDayMonth,
  formatDayMonthNumeric as psFormatDayMonthNumeric,
  formatDateTime as psFormatDateTime,
  formatRelativeTime as psFormatRelativeTime,
  formatDateForFilename as psFormatDateForFilename,
} from '@parisgroup-ai/pageshell/core';

export function getDateLocale() {
  return i18n.language?.startsWith('en') ? enUS : ptBR;
}

/**
 * Returns the current locale as a BCP 47 language tag string for use with
 * PageShell formatters (which use Intl.DateTimeFormat, not date-fns locales).
 */
export function getLocaleString(): string {
  return i18n.language?.startsWith('en') ? 'en-US' : 'pt-BR';
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
// PageShell i18n-aware formatters (thin adapters)
// These use Intl.DateTimeFormat under the hood — no date-fns format strings.
// ---------------------------------------------------------------------------

/** Short date with year: "13 de mar. de 2026" (pt-BR) / "Mar 13, 2026" (en-US) */
export function formatDateMedium(date: Date | string): string {
  return psFormatDateShort(date, { locale: getLocaleString() });
}

/** Long date with full month: "13 de março de 2026" (pt-BR) / "March 13, 2026" (en-US) */
export function formatDateLong(date: Date | string): string {
  return psFormatDateLong(date, { locale: getLocaleString() });
}

/** Day + abbreviated month: "13 de mar." (pt-BR) / "Mar 13" (en-US) */
export function formatDayMonth(date: Date | string): string {
  return psFormatDayMonth(date, { locale: getLocaleString() });
}

/** Numeric day/month: "13/03" (pt-BR) / "03/13" (en-US) */
export function formatDayMonthNumeric(date: Date | string): string {
  return psFormatDayMonthNumeric(date, { locale: getLocaleString() });
}

/** Date + time: "13/03/2026, 09:39" (pt-BR) / "3/13/2026, 9:39 AM" (en-US) */
export function formatDateTimeLocale(date: Date | string): string {
  return psFormatDateTime(date, { locale: getLocaleString() });
}

/** ISO date string for filenames: "2026-03-13" */
export function formatDateFilename(date: Date | string): string {
  return psFormatDateForFilename(date);
}

/** Relative time from now: "há 1 minuto" (pt-BR) / "1 minute ago" (en-US) */
export function formatRelative(date: Date | string): string {
  return psFormatRelativeTime(date, { locale: getLocaleString() });
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
