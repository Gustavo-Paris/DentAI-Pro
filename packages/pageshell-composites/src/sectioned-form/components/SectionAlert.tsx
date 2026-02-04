/**
 * SectionAlert Component
 *
 * Alert wrapper for form alerts with data-driven visibility.
 *
 * @module sectioned-form/components/SectionAlert
 */

'use client';

import * as React from 'react';
import { PageAlert } from '@pageshell/primitives';
import type { SectionedFormAlertConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface SectionAlertProps<TData = unknown> {
  /** Alert configuration */
  config: SectionedFormAlertConfig<TData>;
  /** Data for resolving show condition */
  data?: TData;
  /** Animation delay class */
  animationDelay?: number;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SectionAlert<TData = unknown>({
  config,
  data,
  animationDelay = 1,
  className,
}: SectionAlertProps<TData>) {
  // Resolve show condition
  const shouldShow = typeof config.show === 'function'
    ? config.show(data as TData)
    : config.show;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`portal-animate-in portal-animate-in-delay-${animationDelay} ${className ?? ''}`}>
      <PageAlert
        variant={config.variant}
        icon={config.icon}
        title={config.title}
        description={config.description}
      />
    </div>
  );
}
