'use client';

/**
 * WizardBackground Component
 *
 * Decorative background layers for wizard pages.
 * Supports gradient-mesh, grid, and noise patterns.
 *
 * @module wizard/WizardBackground
 */

import { cn } from '@pageshell/core';
import type { WizardBackgroundProps } from './types';

export function WizardBackground({ variant, theme }: WizardBackgroundProps) {
  if (variant === 'none') {
    return null;
  }

  // Theme-specific class prefixes
  const themePrefix = theme === 'student' ? 'dash' : theme;

  return (
    <>
      {/* Gradient mesh background */}
      {(variant === 'gradient-mesh' || variant === 'noise') && (
        <div
          className={cn(
            `${themePrefix}-gradient-mesh`,
            'fixed inset-0 pointer-events-none z-0'
          )}
        />
      )}

      {/* Grid background */}
      {variant === 'grid' && (
        <div
          className={cn(
            `${themePrefix}-grid-bg`,
            'fixed inset-0 pointer-events-none z-0'
          )}
        />
      )}

      {/* Noise overlay (can be combined with gradient-mesh) */}
      {variant === 'noise' && (
        <div
          className={cn(
            `${themePrefix}-noise-overlay`,
            'fixed inset-0 pointer-events-none z-0'
          )}
        />
      )}
    </>
  );
}
