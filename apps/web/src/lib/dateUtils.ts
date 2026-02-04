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
 * Format a date string to Brazilian format (DD/MM/YYYY)
 * Handles YYYY-MM-DD strings without timezone conversion issues
 */
export function formatDateBR(dateString: string): string {
  // For YYYY-MM-DD format, parse directly to avoid UTC conversion
  const isoDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  // For other formats (with time), use standard parsing
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Parse a Date object to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
