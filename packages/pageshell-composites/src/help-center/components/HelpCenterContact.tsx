/**
 * HelpCenterContact Component
 *
 * Contact support banner for help center.
 *
 * @module help-center/components/HelpCenterContact
 */

'use client';

import * as React from 'react';
import { PageQuickAction } from '@pageshell/primitives';
import type { HelpCenterContactConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterContactProps {
  /** Contact configuration */
  config: HelpCenterContactConfig;
  /** Animation delay */
  animationDelay?: number;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterContact({
  config,
  animationDelay = 5,
  testId = 'contact-email',
}: HelpCenterContactProps) {
  return (
    <div data-testid="contact-options">
      <PageQuickAction
        layout="banner"
        variant="contact"
        title={config.title}
        description={config.description}
        actionLabel={config.actionLabel}
        href={config.href}
        animationDelay={animationDelay}
        data-testid={testId}
      />
    </div>
  );
}
