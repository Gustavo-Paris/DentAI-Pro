/**
 * HelpCenterQuickLinks Component
 *
 * Quick links grid for help center.
 *
 * @module help-center/components/HelpCenterQuickLinks
 */

'use client';

import * as React from 'react';
import { PageGrid, PageHeading } from '@pageshell/layouts';
import { PageQuickAction } from '@pageshell/primitives';
import type { HelpCenterQuickLinkConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterQuickLinksProps {
  /** Quick links */
  links: HelpCenterQuickLinkConfig[];
  /** Section title */
  title?: string;
  /** Grid columns */
  columns?: 2 | 3 | 4;
  /** Animation delay */
  animationDelay?: number;
  /** ARIA label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterQuickLinks({
  links,
  title,
  columns = 3,
  animationDelay = 2,
  ariaLabel = 'Quick links',
  testId = 'quick-links',
}: HelpCenterQuickLinksProps) {
  if (links.length === 0) return null;

  return (
    <div
      className={`portal-animate-in portal-animate-in-delay-${animationDelay}`}
      data-testid={testId}
    >
      {title && (
        <PageHeading title={title} size="sm" marginBottom="md" />
      )}
      <PageGrid
        items={links}
        columns={columns}
        gap={3}
        animated={false}
        keyExtractor={(link) => link.href}
        aria-label={ariaLabel}
        renderItem={(link) => (
          <PageQuickAction
            layout="card"
            variant={link.variant}
            title={link.title}
            description={link.description}
            href={link.href}
          />
        )}
      />
    </div>
  );
}
