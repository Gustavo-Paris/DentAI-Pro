/**
 * HelpCenterPage Types
 *
 * Type definitions for help center page composites.
 *
 * @module help-center/types
 */

import type { ReactNode } from 'react';
import type { CompositeBaseProps, CompositeQueryResult } from '../shared/types';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Quick Link Configuration
// =============================================================================

/**
 * Quick link variant for automatic icon/color assignment
 */
export type QuickLinkVariant =
  | 'courses'
  | 'credits'
  | 'achievements'
  | 'calendar'
  | 'settings'
  | 'profile'
  | 'help'
  | 'contact'
  | 'custom';

/**
 * Quick link configuration
 */
export interface HelpCenterQuickLinkConfig {
  /** Variant for automatic icon/color */
  variant: QuickLinkVariant;
  /** Link title */
  title: string;
  /** Link description */
  description: string;
  /** Navigation href */
  href: string;
  /** Custom icon (overrides variant) */
  icon?: IconProp;
}

// =============================================================================
// FAQ Configuration
// =============================================================================

/**
 * FAQ category for automatic icon/color
 */
export type FAQCategory =
  | 'courses'
  | 'mentorship'
  | 'account'
  | 'badges'
  | 'credits'
  | 'settings'
  | 'general';

/**
 * FAQ item
 */
export interface HelpCenterFAQItem {
  /** Question text */
  question: string;
  /** Answer text */
  answer: string;
}

/**
 * FAQ section configuration
 */
export interface HelpCenterFAQSection {
  /** Section ID (unique) */
  id: string;
  /** Category for auto icon/color */
  category: FAQCategory;
  /** Section title */
  title: string;
  /** FAQ items */
  items: HelpCenterFAQItem[];
}

// =============================================================================
// Article Configuration
// =============================================================================

/**
 * Help article configuration
 */
export interface HelpCenterArticleConfig {
  /** Article ID or slug */
  id: string;
  /** Article title */
  title: string;
  /** Navigation href */
  href: string;
  /** Category/feature tag */
  category?: string;
  /** Article description */
  description?: string;
  /** Article icon */
  icon?: IconProp;
}

// =============================================================================
// Contact Configuration
// =============================================================================

/**
 * Contact section configuration
 */
export interface HelpCenterContactConfig {
  /** Section title */
  title: string;
  /** Section description */
  description: string;
  /** Action button label */
  actionLabel: string;
  /** Action href (email, phone, or URL) */
  href: string;
  /** Action icon */
  icon?: IconProp;
}

// =============================================================================
// Hero Configuration
// =============================================================================

/**
 * Hero section configuration
 */
export interface HelpCenterHeroConfig {
  /** Hero title */
  title: string;
  /** Hero description */
  description: string;
  /** Hero variant */
  variant?: 'default' | 'help';
}

// =============================================================================
// Slots Configuration
// =============================================================================

/**
 * Slots for customization
 */
export interface HelpCenterPageSlots<TData = unknown> {
  /** Content after hero (before quick links) */
  afterHero?: ReactNode | ((data: TData) => ReactNode);
  /** Content before FAQ sections */
  beforeFAQ?: ReactNode | ((data: TData) => ReactNode);
  /** Content after FAQ sections */
  afterFAQ?: ReactNode | ((data: TData) => ReactNode);
  /** Custom quick links section */
  quickLinks?: ReactNode | ((data: TData) => ReactNode);
  /** Custom FAQ section */
  faq?: ReactNode | ((data: TData) => ReactNode);
  /** Custom articles section */
  articles?: ReactNode | ((data: TData) => ReactNode);
  /** Custom contact section */
  contact?: ReactNode | ((data: TData) => ReactNode);
}

// =============================================================================
// Labels Configuration (i18n)
// =============================================================================

/**
 * Customizable labels for i18n
 */
export interface HelpCenterLabels {
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Quick links section title */
  quickLinksTitle?: string;
  /** FAQ section title */
  faqTitle?: string;
  /** Articles section title */
  articlesTitle?: string;
  /** View all articles link */
  viewAllArticles?: string;
  /** Search results title */
  searchResultsTitle?: string;
  /** No results message */
  noResults?: string;
}

// =============================================================================
// ARIA Labels (Accessibility)
// =============================================================================

/**
 * ARIA labels for accessibility
 */
export interface HelpCenterAriaLabels {
  /** Search input label */
  searchInput?: string;
  /** Quick links region */
  quickLinksRegion?: string;
  /** FAQ region */
  faqRegion?: string;
  /** Articles region */
  articlesRegion?: string;
  /** Contact region */
  contactRegion?: string;
}

// =============================================================================
// HelpCenterPage Props
// =============================================================================

/**
 * Props for HelpCenterPage composite
 */
export interface HelpCenterPageProps<TData = unknown> extends CompositeBaseProps {
  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  /**
   * Enable search functionality
   * @default true
   */
  searchEnabled?: boolean;

  /**
   * Search callback
   */
  onSearch?: (query: string) => void;

  /**
   * Initial search query
   */
  initialSearchQuery?: string;

  // -------------------------------------------------------------------------
  // Hero
  // -------------------------------------------------------------------------

  /**
   * Hero configuration
   */
  hero?: HelpCenterHeroConfig;

  // -------------------------------------------------------------------------
  // Quick Links
  // -------------------------------------------------------------------------

  /**
   * Quick links grid configuration
   */
  quickLinks?: HelpCenterQuickLinkConfig[];

  /**
   * Quick links grid columns
   * @default 3
   */
  quickLinksColumns?: 2 | 3 | 4;

  // -------------------------------------------------------------------------
  // FAQ
  // -------------------------------------------------------------------------

  /**
   * FAQ sections
   */
  faqSections?: HelpCenterFAQSection[];

  /**
   * FAQ columns
   * @default 2
   */
  faqColumns?: 1 | 2;

  // -------------------------------------------------------------------------
  // Articles
  // -------------------------------------------------------------------------

  /**
   * Help articles
   */
  articles?: HelpCenterArticleConfig[];

  /**
   * Max articles to show (with "View all" link)
   */
  articlesLimit?: number;

  /**
   * View all articles href
   */
  articlesHref?: string;

  /**
   * Show view all link
   * @default true
   */
  showViewAllArticles?: boolean;

  // -------------------------------------------------------------------------
  // Contact
  // -------------------------------------------------------------------------

  /**
   * Contact section configuration
   */
  contact?: HelpCenterContactConfig;

  // -------------------------------------------------------------------------
  // Data
  // -------------------------------------------------------------------------

  /**
   * Query for dynamic data
   */
  query?: CompositeQueryResult<TData>;

  // -------------------------------------------------------------------------
  // Slots & Customization
  // -------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: HelpCenterPageSlots<TData>;

  /**
   * Custom skeleton for loading state
   */
  skeleton?: ReactNode;

  /**
   * Customizable labels (i18n)
   */
  labels?: HelpCenterLabels;

  /**
   * ARIA labels for accessibility
   */
  ariaLabels?: HelpCenterAriaLabels;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Test ID
   */
  testId?: string;

  /**
   * Children for custom content
   */
  children?: ReactNode | ((data: TData) => ReactNode);
}

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default labels for HelpCenterPage
 */
export const helpCenterPageDefaults = {
  // Base
  theme: 'default' as const,
  containerVariant: 'shell' as const,
  // Labels
  searchPlaceholder: 'Search for help...',
  quickLinksTitle: 'Quick Links',
  faqTitle: 'Frequently Asked Questions',
  articlesTitle: 'Help Articles',
  viewAllArticles: 'View all articles',
  searchResultsTitle: 'Search Results',
  noResults: 'No results found',
} as const;

/**
 * Default ARIA labels
 */
export const helpCenterAriaDefaults: Required<HelpCenterAriaLabels> = {
  searchInput: 'Search help center',
  quickLinksRegion: 'Quick links',
  faqRegion: 'Frequently asked questions',
  articlesRegion: 'Help articles',
  contactRegion: 'Contact support',
};
