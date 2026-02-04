/**
 * HelpCenterPage Composite
 *
 * Complete help center page with search, quick links, FAQ, articles, and contact.
 *
 * @module help-center/HelpCenterPage
 *
 * @example Basic usage
 * ```tsx
 * <HelpCenterPage
 *   title="Help Center"
 *   description="Find answers to your questions"
 *   hero={{
 *     title: 'How can we help you?',
 *     description: 'Search our knowledge base or browse by category',
 *   }}
 *   quickLinks={[
 *     { variant: 'courses', title: 'Courses', description: 'Learn about courses', href: '/courses' },
 *     { variant: 'credits', title: 'Credits', description: 'Manage your credits', href: '/credits' },
 *   ]}
 *   faqSections={[
 *     {
 *       id: 'courses',
 *       category: 'courses',
 *       title: 'Courses & Learning',
 *       items: [
 *         { question: 'How do I start a course?', answer: 'Navigate to...' },
 *       ],
 *     },
 *   ]}
 *   contact={{
 *     title: 'Still need help?',
 *     description: 'Our support team is here to assist you.',
 *     actionLabel: 'Contact Support',
 *     href: 'mailto:support@example.com',
 *   }}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import type { HelpCenterPageProps } from './types';
import { helpCenterPageDefaults, helpCenterAriaDefaults } from './types';
import { getContainerClasses } from '../shared/styles';
import { useHelpCenterSearch } from './hooks';
import {
  HelpCenterHero,
  HelpCenterSearch,
  HelpCenterQuickLinks,
  HelpCenterFAQ,
  HelpCenterArticles,
  HelpCenterContact,
  HelpCenterSkeleton,
  HelpCenterSearchResults,
} from './components';

// =============================================================================
// Component
// =============================================================================

export function HelpCenterPage<TData = unknown>(
  props: HelpCenterPageProps<TData>
) {
  const {
    // Base
    theme = helpCenterPageDefaults.theme,
    containerVariant = helpCenterPageDefaults.containerVariant,
    title,
    description,
    className,
    testId = 'help-center',
    // Search
    searchEnabled = true,
    onSearch,
    initialSearchQuery,
    // Hero
    hero,
    // Quick Links
    quickLinks,
    quickLinksColumns = 3,
    // FAQ
    faqSections,
    faqColumns = 2,
    // Articles
    articles,
    articlesLimit,
    articlesHref,
    showViewAllArticles = true,
    // Contact
    contact,
    // Data
    query,
    // Slots
    slots,
    skeleton,
    labels: propsLabels,
    ariaLabels: propsAriaLabels,
    // Children
    children,
  } = props;

  // Merge labels and ARIA labels
  const labels = { ...helpCenterPageDefaults, ...propsLabels };
  const ariaLabels = { ...helpCenterAriaDefaults, ...propsAriaLabels };

  // Search hook
  const search = useHelpCenterSearch({
    faqSections,
    articles,
    initialQuery: initialSearchQuery,
    onSearch,
  });

  // Container classes (defined early for loading state)
  const loadingClasses = getContainerClasses(containerVariant);

  // Loading state
  if (query?.isLoading) {
    return (
      <main className={cn(loadingClasses.container, className)} data-theme={theme}>
        {skeleton || (
          <HelpCenterSkeleton
            showSearch={searchEnabled}
            quickLinksCount={quickLinks?.length}
            faqSectionsCount={faqSections?.length}
            articlesCount={articlesLimit || articles?.length}
            showContact={!!contact}
          />
        )}
      </main>
    );
  }

  const data = query?.data as TData | undefined;

  // Resolve slot content - handle both TData and TData | undefined
  const resolveSlot = (
    slot: React.ReactNode | ((data: TData) => React.ReactNode) | undefined
  ): React.ReactNode => {
    if (!slot) return null;
    if (typeof slot === 'function') {
      // Only call if data is defined
      return data !== undefined ? slot(data) : null;
    }
    return slot;
  };

  const classes = getContainerClasses(containerVariant);

  return (
    <div data-testid={testId} data-theme={theme} className={cn(classes.container, 'space-y-8', className)}>
      {/* Hidden accessible title for testing */}
      <h1 className="sr-only" data-testid="help-title">{title}</h1>

        {/* Hero with Search */}
        {hero && (
          <HelpCenterHero config={hero} animationDelay={1} />
        )}

        {/* Search */}
        {searchEnabled && (
          <HelpCenterSearch
            value={search.searchQuery}
            onChange={search.setSearchQuery}
            onSubmit={search.handleSearchSubmit}
            onClear={search.clearSearch}
            placeholder={labels.searchPlaceholder}
            ariaLabel={ariaLabels.searchInput}
          />
        )}

        {/* After Hero Slot */}
        {resolveSlot(slots?.afterHero)}

        {/* Search Results Mode */}
        {search.isSearching ? (
          <HelpCenterSearchResults
            faqSections={search.filteredFAQSections}
            articles={search.filteredArticles}
            title={labels.searchResultsTitle}
            noResultsMessage={labels.noResults}
          />
        ) : (
          <>
            {/* Quick Links */}
            {slots?.quickLinks ? (
              resolveSlot(slots.quickLinks)
            ) : quickLinks && quickLinks.length > 0 ? (
              <HelpCenterQuickLinks
                links={quickLinks}
                title={labels.quickLinksTitle}
                columns={quickLinksColumns}
                ariaLabel={ariaLabels.quickLinksRegion}
              />
            ) : null}

            {/* Articles */}
            {slots?.articles ? (
              resolveSlot(slots.articles)
            ) : articles && articles.length > 0 ? (
              <HelpCenterArticles
                articles={articles}
                title={labels.articlesTitle}
                limit={articlesLimit}
                showViewAll={showViewAllArticles}
                viewAllHref={articlesHref}
                viewAllLabel={labels.viewAllArticles}
              />
            ) : null}

            {/* Before FAQ Slot */}
            {resolveSlot(slots?.beforeFAQ)}

            {/* FAQ */}
            {slots?.faq ? (
              resolveSlot(slots.faq)
            ) : faqSections && faqSections.length > 0 ? (
              <HelpCenterFAQ
                sections={faqSections}
                title={labels.faqTitle}
                columns={faqColumns}
              />
            ) : null}

            {/* After FAQ Slot */}
            {resolveSlot(slots?.afterFAQ)}

            {/* Contact */}
            {slots?.contact ? (
              resolveSlot(slots.contact)
            ) : contact ? (
              <HelpCenterContact config={contact} />
            ) : null}

            {/* Custom Children */}
            {typeof children === 'function' && data !== undefined
              ? children(data)
              : children}
          </>
        )}
    </div>
  );
}

HelpCenterPage.displayName = 'HelpCenterPage';
