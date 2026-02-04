/**
 * CSV Export Utilities
 *
 * RFC 4180 compliant CSV generation and download utilities.
 * Features:
 * - Proper field escaping (commas, quotes, newlines)
 * - UTF-8 BOM for Excel compatibility
 * - Browser download trigger
 *
 * @module utils/csv
 *
 * @example
 * ```ts
 * import { escapeCSVField, downloadCSVFile, createCSVContent } from '@pageshell/core';
 *
 * const escaped = escapeCSVField('Value with, comma');
 * // => '"Value with, comma"'
 *
 * const content = createCSVContent(data, [
 *   { key: 'name', header: 'Name' },
 *   { key: 'email', header: 'Email' },
 * ]);
 *
 * downloadCSVFile(content, 'export.csv');
 * ```
 */

/**
 * Escape a CSV field according to RFC 4180
 *
 * Rules:
 * - If field contains comma, quote, or newline, wrap in quotes
 * - Double any existing quotes
 *
 * @param value - Value to escape (string, number, null, or undefined)
 * @returns Escaped string safe for CSV
 *
 * @example
 * ```ts
 * escapeCSVField('Hello')           // => 'Hello'
 * escapeCSVField('Hello, World')    // => '"Hello, World"'
 * escapeCSVField('Say "Hi"')        // => '"Say ""Hi"""'
 * escapeCSVField(null)              // => ''
 * escapeCSVField(42)                // => '42'
 * ```
 */
export function escapeCSVField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // Check if escaping is needed
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them, then wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Column configuration for CSV generation
 */
export interface CSVColumn<T> {
  /** Key to extract from data object (supports dot notation for nested) */
  key: keyof T | string;
  /** Header text for the column */
  header: string;
  /** Optional transform function */
  transform?: (value: unknown, row: T) => string | number | boolean | null;
}

/**
 * Create CSV content from an array of objects
 *
 * @param rows - Array of data objects
 * @param columns - Column configuration
 * @returns CSV content string (without BOM)
 *
 * @example
 * ```ts
 * const users = [
 *   { name: 'John', email: 'john@example.com', age: 30 },
 *   { name: 'Jane', email: 'jane@example.com', age: 25 },
 * ];
 *
 * const csv = createCSVContent(users, [
 *   { key: 'name', header: 'Name' },
 *   { key: 'email', header: 'Email' },
 *   { key: 'age', header: 'Age', transform: (v) => `${v} years` },
 * ]);
 * ```
 */
export function createCSVContent<T extends Record<string, unknown>>(
  rows: T[],
  columns: CSVColumn<T>[]
): string {
  // Header row
  const headerRow = columns.map((col) => escapeCSVField(col.header)).join(',');

  // Data rows
  const dataRows = rows.map((row) => {
    return columns
      .map((col) => {
        const rawValue = getNestedValue(row, col.key as string);
        const value = col.transform ? col.transform(rawValue, row) : rawValue;
        return escapeCSVField(value as string | number | boolean | null);
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Create a Blob from CSV content with UTF-8 BOM for Excel compatibility
 *
 * @param content - CSV content string
 * @returns Blob ready for download
 */
export function createCSVBlob(content: string): Blob {
  // Add BOM (Byte Order Mark) for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  return new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
}

/**
 * Trigger browser download of a CSV file
 *
 * @param content - CSV content string
 * @param filename - Download filename (should end with .csv)
 *
 * @example
 * ```ts
 * downloadCSVFile(csvContent, 'users-export.csv');
 * downloadCSVFile(csvContent, `report-${formatDateForFilename(new Date())}.csv`);
 * ```
 */
export function downloadCSVFile(content: string, filename: string): void {
  const blob = createCSVBlob(content);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Format a date for use in filenames (YYYY-MM-DD)
 *
 * Safe for filesystem use - no special characters.
 *
 * @param date - Date to format
 * @returns ISO date string (YYYY-MM-DD)
 *
 * @example
 * ```ts
 * formatDateForFilename(new Date()) // => '2026-02-03'
 * ```
 */
export function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0] ?? 'unknown';
}

/**
 * Format a datetime for use in filenames (YYYY-MM-DD_HH-MM-SS)
 *
 * @param date - Date to format
 * @returns Datetime string safe for filenames
 *
 * @example
 * ```ts
 * formatDatetimeForFilename(new Date()) // => '2026-02-03_14-30-45'
 * ```
 */
export function formatDatetimeForFilename(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split('T')[0] ?? 'unknown';
  const timePart = isoString.split('T')[1]?.split('.')[0]?.replace(/:/g, '-') ?? '00-00-00';
  return `${datePart}_${timePart}`;
}
