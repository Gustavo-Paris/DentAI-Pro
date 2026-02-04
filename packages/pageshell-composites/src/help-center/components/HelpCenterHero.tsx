/**
 * HelpCenterHero Component
 *
 * Hero section with title and description for help center.
 *
 * @module help-center/components/HelpCenterHero
 */

'use client';

import * as React from 'react';
import { PageQuickAction } from '@pageshell/primitives';
import type { HelpCenterHeroConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterHeroProps {
  /** Hero configuration */
  config: HelpCenterHeroConfig;
  /** Animation delay */
  animationDelay?: number;
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterHero({
  config,
  animationDelay = 1,
}: HelpCenterHeroProps) {
  // PageQuickAction expects specific variants, 'help' is valid but 'default' is not
  const variant = config.variant === 'default' ? 'help' : (config.variant || 'help');

  return (
    <div className={`portal-animate-in portal-animate-in-delay-${animationDelay}`}>
      <PageQuickAction
        layout="hero"
        variant={variant}
        title={config.title}
        description={config.description}
        animationDelay={0}
      />
    </div>
  );
}
