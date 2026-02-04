/**
 * HelpCenterSearchResults Component
 *
 * Search results display for help center.
 *
 * @module help-center/components/HelpCenterSearchResults
 */

'use client';

import * as React from 'react';
import { PageHeading } from '@pageshell/layouts';
import type { HelpCenterFAQSection, HelpCenterArticleConfig } from '../types';
import { HelpCenterFAQ } from './HelpCenterFAQ';
import { HelpCenterArticles } from './HelpCenterArticles';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterSearchResultsProps {
  /** Filtered FAQ sections */
  faqSections: HelpCenterFAQSection[];
  /** Filtered articles */
  articles: HelpCenterArticleConfig[];
  /** Results title (with count) */
  title?: string;
  /** No results message */
  noResultsMessage?: string;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterSearchResults({
  faqSections,
  articles,
  title = 'Search Results',
  noResultsMessage = 'No results found',
  testId = 'search-results',
}: HelpCenterSearchResultsProps) {
  const totalResults = faqSections.reduce(
    (acc, section) => acc + section.items.length,
    articles.length
  );

  const hasResults = totalResults > 0;

  return (
    <div data-testid={testId} className="portal-animate-in space-y-6">
      <PageHeading
        title={`${title} (${totalResults})`}
        size="sm"
        marginBottom="md"
      />

      {!hasResults ? (
        <p className="text-muted-foreground text-center py-8">
          {noResultsMessage}
        </p>
      ) : (
        <>
          {/* Article Results */}
          {articles.length > 0 && (
            <HelpCenterArticles
              articles={articles}
              animationDelay={0}
            />
          )}

          {/* FAQ Results */}
          {faqSections.length > 0 && (
            <HelpCenterFAQ
              sections={faqSections}
              columns={1}
              animationDelay={0}
            />
          )}
        </>
      )}
    </div>
  );
}
