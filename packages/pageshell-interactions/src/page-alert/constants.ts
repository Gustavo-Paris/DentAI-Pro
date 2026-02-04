/**
 * PageAlert Constants
 *
 * @module page-alert
 */

import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageAlertVariant } from './types';

// Animation duration constant (200ms for normal animations)
export const ANIMATION_DURATION_NORMAL = 200;

// =============================================================================
// Default Icons
// =============================================================================

export const defaultIcons: Record<PageAlertVariant, LucideIcon> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

// =============================================================================
// Variant Styles
// =============================================================================

/**
 * Variant styles use intentionally hardcoded semantic colors (not design tokens).
 *
 * These colors represent universal status meanings:
 * - blue: informational
 * - emerald: success/positive
 * - amber: warning/caution
 * - red: error/destructive
 *
 * They remain consistent across all themes (creator, admin, student) to maintain
 * clear visual communication regardless of the active theme palette.
 *
 * @see docs/design-system-guidelines.md - "Preserved Accent Colors" section
 */
export const variantStyles: Record<
  PageAlertVariant,
  {
    container: string;
    icon: string;
    title: string;
    description: string;
    action: string;
    dismiss: string;
  }
> = {
  info: {
    container: 'bg-blue-500/10 border-blue-500/20',
    icon: 'text-blue-500',
    title: 'text-blue-600 dark:text-blue-400',
    description: 'text-blue-600/80 dark:text-blue-400/80',
    action: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    dismiss: 'text-blue-500/60 hover:text-blue-500 hover:bg-blue-500/10',
  },
  success: {
    container: 'bg-emerald-500/10 border-emerald-500/20',
    icon: 'text-emerald-500',
    title: 'text-emerald-600 dark:text-emerald-400',
    description: 'text-emerald-600/80 dark:text-emerald-400/80',
    action: 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
    dismiss: 'text-emerald-500/60 hover:text-emerald-500 hover:bg-emerald-500/10',
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/20',
    icon: 'text-amber-500',
    title: 'text-amber-600 dark:text-amber-400',
    description: 'text-amber-600/80 dark:text-amber-400/80',
    action: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
    dismiss: 'text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10',
  },
  error: {
    container: 'bg-red-500/10 border-red-500/20',
    icon: 'text-red-500',
    title: 'text-red-600 dark:text-red-400',
    description: 'text-red-600/80 dark:text-red-400/80',
    action: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
    dismiss: 'text-red-500/60 hover:text-red-500 hover:bg-red-500/10',
  },
};

// =============================================================================
// Gap Classes
// =============================================================================

export const gapClasses: Record<string, string> = {
  sm: 'space-y-2',
  md: 'space-y-3',
  lg: 'space-y-4',
};
