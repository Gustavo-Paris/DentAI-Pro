/**
 * CardSettingsPage Types
 *
 * @module card-settings/types
 */

import type { ReactNode } from 'react';
import type { PageShellTheme } from '../shared/types';

/**
 * Key-value list item for CardSettingsPage sections
 */
export interface CardSettingsItem {
  /** Unique item identifier */
  id: string;
  /** Item label */
  label: string;
  /** Item value (string or ReactNode) */
  value: string | ReactNode;
}

/**
 * Section configuration for CardSettingsPage
 */
export interface CardSettingsSectionConfig {
  /** Unique section identifier */
  id: string;
  /** Section title (PageCard title) */
  title: string;
  /** Section description (PageCard description) */
  description?: string;
  /** Section icon (Lucide icon name or component) */
  icon?: string | React.ComponentType<{ className?: string }>;
  /** Key-value list items (rendered as list) */
  items?: CardSettingsItem[];
  /** Custom content (ReactNode) */
  content?: ReactNode;
  /** Condition to show section */
  showWhen?: boolean;
}

/**
 * Slots for CardSettingsPage customization
 */
export interface CardSettingsPageSlots {
  /** Content before sections */
  beforeSections?: ReactNode;
  /** Content after sections */
  afterSections?: ReactNode;
  /** Custom footer content */
  footer?: ReactNode;
}

/**
 * Breadcrumb item for navigation
 */
export interface CardSettingsBreadcrumb {
  /** Breadcrumb label */
  label: string;
  /** Breadcrumb href (optional) */
  href?: string;
}

/**
 * CardSettingsPage component props
 */
export interface CardSettingsPageProps {
  /** Theme variant (for theming context) */
  theme?: PageShellTheme;
  /**
   * Container variant for width control
   * @default 'shell' (full width)
   */
  containerVariant?: 'shell' | 'card';
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Back navigation href */
  backHref?: string;
  /** Back button label */
  backLabel?: string;
  /** Breadcrumb items */
  breadcrumbs?: CardSettingsBreadcrumb[];
  /** Section configurations */
  sections: CardSettingsSectionConfig[];
  /** Slot overrides */
  slots?: CardSettingsPageSlots;
  /** Content before sections (shorthand for slots.beforeSections) */
  beforeSections?: ReactNode;
  /** Content after sections (shorthand for slots.afterSections) */
  afterSections?: ReactNode;
  /** Additional container CSS classes */
  className?: string;
  /** Link component for navigation (Next.js Link or other) */
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
  }>;
}
