'use client';

/**
 * PageShellCore - Tree-Shakeable Core Component
 *
 * @deprecated Import from './page-shell-core' for modular access.
 * This file re-exports from the modular structure for backward compatibility.
 *
 * @see ADR-0017 for the decision to split PageShell into Core + Facade
 *
 * @example Tree-shakeable import
 * import { PageShellCore } from '@pageshell/shell';
 * import { ListPage } from '@pageshell/composites';
 *
 * // Use PageShellCore for basic layouts
 * <PageShellCore.Static title="Settings">
 *   <SettingsForm />
 * </PageShellCore.Static>
 *
 * // Import composites directly when needed
 * <ListPage ... />
 */

// Re-export everything from the modular structure
export {
  PageShellCore,
  PageShellRoot,
  PageShellStatic,
  PageShellMulti,
} from './page-shell-core';

export type {
  PageShellExtendedProps,
  PageShellStaticExtendedProps,
  PageShellMultiExtendedProps,
  BreadcrumbItem,
  ContainerVariant,
} from './page-shell-core';
