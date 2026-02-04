/**
 * Calendar Logic Constants
 *
 * @module hooks/calendar
 */

import type { CalendarEventStyleConfig } from './types';

// =============================================================================
// Locale Constants
// =============================================================================

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const DAYS_PT_FULL = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
];

export const DAYS_PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// =============================================================================
// Style Constants
// =============================================================================

/** Event text color - uses CSS variable with white fallback for contrast on colored backgrounds */
export const EVENT_TEXT_COLOR = 'var(--color-foreground-inverse, #ffffff)';

export const DEFAULT_STYLE: CalendarEventStyleConfig = {
  backgroundColor: 'var(--color-violet-500, #8b5cf6)',
  color: EVENT_TEXT_COLOR,
};

export const COLOR_MAP: Record<string, CalendarEventStyleConfig> = {
  emerald: { backgroundColor: 'var(--color-emerald-500, #10b981)', color: EVENT_TEXT_COLOR },
  amber: { backgroundColor: 'var(--color-amber-500, #f59e0b)', color: EVENT_TEXT_COLOR },
  red: { backgroundColor: 'var(--color-red-500, #ef4444)', color: EVENT_TEXT_COLOR },
  blue: { backgroundColor: 'var(--color-blue-500, #3b82f6)', color: EVENT_TEXT_COLOR },
  violet: { backgroundColor: 'var(--color-violet-500, #8b5cf6)', color: EVENT_TEXT_COLOR },
  cyan: { backgroundColor: 'var(--color-cyan-500, #06b6d4)', color: EVENT_TEXT_COLOR },
  pink: { backgroundColor: 'var(--color-pink-500, #ec4899)', color: EVENT_TEXT_COLOR },
  gray: { backgroundColor: 'var(--color-neutral-500, #57505f)', color: EVENT_TEXT_COLOR },
};
