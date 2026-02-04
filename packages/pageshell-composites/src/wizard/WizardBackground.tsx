/**
 * WizardBackground Component
 *
 * Decorative background variants for WizardPage.
 *
 * @module wizard/WizardBackground
 */

import * as React from 'react';

export type WizardBackgroundVariant = 'none' | 'gradient-mesh' | 'grid' | 'noise';

interface WizardBackgroundProps {
  variant?: WizardBackgroundVariant;
}

const backgroundStyles: Record<WizardBackgroundVariant, React.CSSProperties> = {
  none: {},
  'gradient-mesh': {
    background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.1) 0%, transparent 50%)',
  },
  grid: {
    backgroundImage: `linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
  },
  noise: {
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
    opacity: 0.03,
  },
};

/**
 * Decorative background component for wizard pages.
 *
 * @example
 * ```tsx
 * <WizardBackground variant="gradient-mesh" />
 * ```
 */
export function WizardBackground({ variant = 'none' }: WizardBackgroundProps) {
  if (variant === 'none') return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        ...backgroundStyles[variant],
      }}
    />
  );
}

WizardBackground.displayName = 'WizardBackground';
