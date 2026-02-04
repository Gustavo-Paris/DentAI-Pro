/**
 * PageAlert Types
 *
 * @module page-alert
 */

import type { ReactNode } from 'react';
import type { IconName } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

/** Alert variants */
export type PageAlertVariant = 'info' | 'success' | 'warning' | 'error';

/** Alert action configuration */
export interface PageAlertAction {
  /** Action label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Disable action */
  disabled?: boolean;
}

/**
 * PageAlert component props
 */
export interface PageAlertProps {
  /** Alert variant */
  variant: PageAlertVariant;
  /** Alert title */
  title: string;
  /** Alert description */
  description?: string;
  /** Custom icon (overrides default) */
  icon?: IconName;

  // Action
  /** Optional action button */
  action?: PageAlertAction;

  // Link mode
  /** Navigation href - when provided, renders alert as a clickable link */
  href?: string;
  /** Show arrow indicator when href is provided */
  showArrow?: boolean;
  /** Custom Link component for framework-agnostic navigation */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;

  // Dismiss
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** LocalStorage key to persist dismissed state */
  persistKey?: string;

  // Animation
  /** Enable entrance animation */
  animated?: boolean;

  // Layout
  /** Full width (no border radius) */
  fullWidth?: boolean;

  // Accessibility
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional content */
  children?: ReactNode;
}

/**
 * PageAlertGroup component props
 */
export interface PageAlertGroupProps {
  /** Alerts to display */
  children: ReactNode;
  /** Gap between alerts */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}
