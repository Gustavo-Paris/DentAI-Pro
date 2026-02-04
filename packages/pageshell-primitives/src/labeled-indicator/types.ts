/**
 * LabeledIndicator Types
 *
 * Compact indicator with icon, label, and optional value.
 */

import type { IconName } from '../icons';

export type IndicatorVariant = 'default' | 'success' | 'warning' | 'destructive' | 'muted' | 'info';

export type IndicatorSize = 'sm' | 'md' | 'lg';

export interface LabeledIndicatorProps {
  /**
   * Icon to display (optional)
   */
  icon?: IconName;

  /**
   * Label text
   */
  label: string;

  /**
   * Optional value to display alongside label
   */
  value?: string | number;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: IndicatorVariant;

  /**
   * Size variant
   * @default 'md'
   */
  size?: IndicatorSize;

  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Tooltip text
   */
  title?: string;
}
