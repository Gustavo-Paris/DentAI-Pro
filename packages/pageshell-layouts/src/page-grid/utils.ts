/**
 * PageGrid Utilities
 *
 * @package @pageshell/layouts
 */

import { isValidElement } from 'react';
import { responsiveColumnClasses, defaultResponsive } from './constants';
import type {
  PageGridColumns,
  PageGridResponsive,
  PageGridActionConfig,
  PageGridActionProp,
} from './types';

// =============================================================================
// Action Type Guard
// =============================================================================

export function isActionConfig(
  action: PageGridActionProp
): action is PageGridActionConfig | PageGridActionConfig[] {
  if (action === null || action === undefined) return false;
  if (Array.isArray(action)) {
    return action.length > 0 && typeof action[0] === 'object' && 'label' in action[0];
  }
  return typeof action === 'object' && !isValidElement(action) && 'label' in action;
}

// =============================================================================
// Column Classes Builder
// =============================================================================

export function buildColumnClasses(
  autoFit: boolean,
  responsive: PageGridResponsive | undefined,
  columns: PageGridColumns
): string {
  // Auto-fit mode
  if (autoFit) {
    return '';
  }

  // Responsive mode
  if (responsive) {
    const classes: string[] = ['grid-cols-1'];

    if (responsive.sm) {
      classes.push(responsiveColumnClasses.sm[responsive.sm]);
    }
    if (responsive.md) {
      classes.push(responsiveColumnClasses.md[responsive.md]);
    }
    if (responsive.lg) {
      classes.push(responsiveColumnClasses.lg[responsive.lg]);
    }
    if (responsive.xl) {
      classes.push(responsiveColumnClasses.xl[responsive.xl]);
    }
    if (responsive['2xl']) {
      classes.push(responsiveColumnClasses['2xl'][responsive['2xl']]);
    }

    return classes.join(' ');
  }

  // Fixed columns with default responsive behavior
  return defaultResponsive[columns];
}
