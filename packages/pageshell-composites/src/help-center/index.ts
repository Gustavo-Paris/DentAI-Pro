/**
 * HelpCenterPage Composite
 *
 * Complete help center page with search, quick links, FAQ, articles, and contact.
 *
 * @module help-center
 */

// Main component
export { HelpCenterPage } from './HelpCenterPage';

// Types
export type {
  HelpCenterPageProps,
  HelpCenterQuickLinkConfig,
  HelpCenterFAQSection,
  HelpCenterFAQItem,
  HelpCenterArticleConfig,
  HelpCenterContactConfig,
  HelpCenterHeroConfig,
  HelpCenterPageSlots,
  HelpCenterLabels,
  HelpCenterAriaLabels,
  QuickLinkVariant,
  FAQCategory,
} from './types';
export { helpCenterPageDefaults, helpCenterAriaDefaults } from './types';

// Components (for advanced customization)
export {
  HelpCenterHero,
  HelpCenterSearch,
  HelpCenterQuickLinks,
  HelpCenterFAQ,
  HelpCenterArticles,
  HelpCenterContact,
  HelpCenterSkeleton,
  HelpCenterSearchResults,
} from './components';
export type {
  HelpCenterHeroProps,
  HelpCenterSearchProps,
  HelpCenterQuickLinksProps,
  HelpCenterFAQProps,
  HelpCenterArticlesProps,
  HelpCenterContactProps,
  HelpCenterSkeletonProps,
  HelpCenterSearchResultsProps,
} from './components';

// Hooks (for advanced customization)
export { useHelpCenterSearch } from './hooks';
export type {
  UseHelpCenterSearchOptions,
  UseHelpCenterSearchResult,
} from './hooks';
