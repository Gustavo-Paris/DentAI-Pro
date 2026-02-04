/**
 * HelpCenterFAQ Component
 *
 * FAQ accordion sections for help center.
 *
 * @module help-center/components/HelpCenterFAQ
 */

'use client';

import * as React from 'react';
import { PageFAQ, type FAQSection } from '@pageshell/features';
import { PageHeading } from '@pageshell/layouts';
import type { HelpCenterFAQSection } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterFAQProps {
  /** FAQ sections */
  sections: HelpCenterFAQSection[];
  /** Section title */
  title?: string;
  /** Grid columns */
  columns?: 1 | 2;
  /** Animation delay */
  animationDelay?: number;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterFAQ({
  sections,
  title,
  columns = 2,
  animationDelay = 4,
  testId = 'faq-categories',
}: HelpCenterFAQProps) {
  if (sections.length === 0) return null;

  // Map to PageFAQ format
  const faqSections: FAQSection[] = sections.map((section) => ({
    id: section.id,
    category: section.category,
    title: section.title,
    items: section.items,
  }));

  return (
    <div
      className={`space-y-4 portal-animate-in portal-animate-in-delay-${animationDelay}`}
      data-testid={testId}
    >
      {title && (
        <PageHeading title={title} size="sm" />
      )}
      <PageFAQ sections={faqSections} columns={columns} animationDelay={0} />
    </div>
  );
}
