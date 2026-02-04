/**
 * PageConfirmDialog Constants
 *
 * @module page-confirm-dialog
 */

import type { IconName } from '../icons';
import type { PageConfirmDialogVariant } from './types';

// =============================================================================
// Variant Configuration
// =============================================================================

export interface VariantConfig {
  iconName: IconName;
  iconBg: string;
  iconAnimation: string;
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary';
}

export function getVariantConfig(variant: PageConfirmDialogVariant): VariantConfig {
  switch (variant) {
    case 'destructive':
    case 'danger':
      return {
        iconName: 'trash',
        iconBg: 'bg-destructive/10 text-destructive',
        iconAnimation: 'animate-pulse',
        buttonVariant: 'destructive',
      };
    case 'warning':
      return {
        iconName: 'alert-triangle',
        iconBg: 'bg-warning/10 text-warning',
        iconAnimation: '',
        buttonVariant: 'default',
      };
    case 'success':
      return {
        iconName: 'check-circle',
        iconBg: 'bg-success/10 text-success',
        iconAnimation: '',
        buttonVariant: 'default',
      };
    default:
      return {
        iconName: 'info',
        iconBg: 'bg-primary/10 text-primary',
        iconAnimation: '',
        buttonVariant: 'default',
      };
  }
}
