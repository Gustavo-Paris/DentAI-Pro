/**
 * PageShellCore Module
 *
 * Tree-shakeable core component with modular variants.
 *
 * @module page-shell-core
 */

import { PageSection, PageQuickActions, PageTabs, PageTab, PageBreadcrumbs, PageHeader } from '@pageshell/layouts';
import {
  PageShellWizard,
  WizardStep,
  WizardProgress,
  WizardNavigation,
  WizardSkeleton,
  PageModal,
  PageModalFooter,
  PageModalTrigger,
  PageConfirmDialog,
} from '@pageshell/interactions';
import { PageShellLinearFlow } from '../PageShellLinearFlow';
import { BackButton } from '../components';
import { PageShellRoot } from './PageShellRoot';
import { PageShellStatic } from './PageShellStatic';
import { PageShellMulti } from './PageShellMulti';

// =============================================================================
// Types
// =============================================================================

export type {
  PageShellExtendedProps,
  PageShellStaticExtendedProps,
  PageShellMultiExtendedProps,
} from './types';

// Re-export PageBreadcrumb as BreadcrumbItem for backward compatibility
export type { PageBreadcrumb as BreadcrumbItem } from '../types';

// Export ContainerVariant type
export type { ContainerVariant } from '../lib/class-maps';

// =============================================================================
// Variants
// =============================================================================

export { PageShellRoot } from './PageShellRoot';
export { PageShellStatic } from './PageShellStatic';
export { PageShellMulti } from './PageShellMulti';

// =============================================================================
// Compound Component
// =============================================================================

/**
 * PageShellCore - Tree-shakeable variant with only essential building blocks.
 *
 * Use this instead of PageShell when you need to minimize bundle size.
 * Import composites (ListPage, FormModal, etc.) directly when needed.
 *
 * @example
 * import { PageShellCore } from '@pageshell/shell';
 * import { ListPage } from '@pageshell/composites';
 *
 * // Basic layout (tree-shakeable)
 * <PageShellCore.Static title="Settings">
 *   <SettingsForm />
 * </PageShellCore.Static>
 *
 * // Composite (import directly)
 * <ListPage ... />
 */
export const PageShellCore = Object.assign(PageShellRoot, {
  /** Static variant for pages without data fetching */
  Static: PageShellStatic,
  /** Alias for Static (backward compatibility) */
  Single: PageShellStatic,
  /** Multi-query variant for pages with multiple data sources */
  Multi: PageShellMulti,
  /** Wizard variant for multi-step wizards */
  Wizard: PageShellWizard,
  /** Linear flow variant for page-to-page navigation */
  LinearFlow: PageShellLinearFlow,
  /** WizardStep for conditional step rendering */
  WizardStep: WizardStep,
  /** Wizard progress indicator */
  WizardProgress: WizardProgress,
  /** Wizard navigation footer */
  WizardNavigation: WizardNavigation,
  /** Wizard loading skeleton */
  WizardSkeleton: WizardSkeleton,
  /** Section component with title and icon */
  Section: PageSection,
  /** Tabs container */
  Tabs: PageTabs,
  /** Tab definition (used inside Tabs) */
  Tab: PageTab,
  /** Quick actions grid */
  QuickActions: PageQuickActions,
  /** Header component (usually auto-rendered) */
  Header: PageHeader,
  /** Theme-aware modal dialog */
  Modal: PageModal,
  /** Footer component for modals */
  ModalFooter: PageModalFooter,
  /** Trigger component for modals (wraps button) */
  ModalTrigger: PageModalTrigger,
  /** Theme-aware confirmation dialog (delete, publish, etc.) */
  ConfirmDialog: PageConfirmDialog,
  /** Breadcrumbs navigation */
  Breadcrumbs: PageBreadcrumbs,
  /** Back button for navigation */
  BackButton: BackButton,
});
