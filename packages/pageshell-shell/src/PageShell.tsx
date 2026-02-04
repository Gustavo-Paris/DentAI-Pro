'use client';

/**
 * PageShell - Full-Featured Facade with All Composites
 *
 * This file is a facade that re-exports PageShellCore with all composites
 * attached as static properties. This maintains full backward compatibility
 * with the `PageShell.ListPage` syntax.
 *
 * @see ADR-0017 for the decision to split PageShell into Core + Facade
 *
 * ## Bundle Size Considerations
 *
 * When you import `PageShell`, ALL composites are included in your bundle
 * (~15KB+ minified). For tree-shakeable imports, use one of:
 *
 * 1. Import `PageShellCore` for basic layouts:
 *    ```tsx
 *    import { PageShellCore } from '@pageshell/shell';
 *    <PageShellCore.Static title="Settings" />
 *    ```
 *
 * 2. Import composites directly:
 *    ```tsx
 *    import { ListPage, FormModal } from '@pageshell/composites';
 *    ```
 *
 * ## Static Property Syntax (Backward Compatible but Discouraged)
 *
 * @deprecated The `PageShell.ListPage` syntax is deprecated in favor of direct imports.
 * This syntax prevents tree-shaking and will be removed in the next major version.
 *
 * Before (deprecated):
 * ```tsx
 * import { PageShell } from '@pageshell/shell';
 * <PageShell.ListPage ... />
 * ```
 *
 * After (recommended):
 * ```tsx
 * import { ListPage } from '@pageshell/composites';
 * <ListPage ... />
 * ```
 */

// Import the core component (basic building blocks)
import { PageShellCore } from './PageShellCore';

// Re-export types from Core
export type { BreadcrumbItem, ContainerVariant } from './PageShellCore';

// Import all composites from @pageshell/composites
import {
  ListPage,
  FormModal,
  DetailPage,
  DashboardPage,
  FormPage,
  SettingsPage,
  ConfigPage,
  LinearFlowPage,
  SplitPanelPage,
  CalendarPage,
  ProgressiveExtractionPage,
  CardSettingsPage,
  warnDeprecated,
} from '@pageshell/composites';

// WizardPage from @pageshell/composites (has Next.js router integration)
// For backward compat, we use EnhancedWizardPage as WizardPage in the facade
import { EnhancedWizardPage as WizardPage } from '@pageshell/composites';

// =============================================================================
// Deprecation Warning Helper
// =============================================================================

/**
 * Create a deprecated composite getter that logs a warning on first access
 */
function createDeprecatedGetter<T>(name: string, composite: T): T {
  // In production, return the composite directly for performance
  if (process.env.NODE_ENV === 'production') return composite;

  // Create a proxy that warns on first access
  let warned = false;
  return new Proxy(composite as object, {
    apply(target, thisArg, args) {
      if (!warned) {
        warned = true;
        warnDeprecated(
          `PageShell.${name}`,
          `PageShell.${name} is deprecated. Import directly for better tree-shaking:\n\n` +
            `  // Before (deprecated)\n` +
            `  import { PageShell } from '@pageshell/shell';\n` +
            `  <PageShell.${name} ... />\n\n` +
            `  // After (recommended)\n` +
            `  import { ${name} } from '@pageshell/composites';\n` +
            `  <${name} ... />\n\n` +
            `This syntax will be removed in v0.3.0.`
        );
      }
      return Reflect.apply(target as (...args: unknown[]) => unknown, thisArg, args);
    },
    get(target, prop) {
      // For accessing static properties like displayName
      return Reflect.get(target, prop);
    },
  }) as T;
}

// =============================================================================
// Compound Component Export (Full Facade with All Composites)
// =============================================================================

/**
 * PageShell with all sub-components and composites attached.
 *
 * @deprecated Using composites via `PageShell.ListPage` is deprecated.
 * Import composites directly for better tree-shaking:
 *
 * ```tsx
 * // Before (deprecated)
 * import { PageShell } from '@pageshell/shell';
 * <PageShell.ListPage ... />
 *
 * // After (recommended)
 * import { ListPage } from '@pageshell/composites';
 * <ListPage ... />
 * ```
 *
 * For basic layouts without composites, use `PageShellCore`:
 *
 * ```tsx
 * import { PageShellCore } from '@pageshell/shell';
 * <PageShellCore.Static title="Settings" />
 * ```
 *
 * @example Full usage (deprecated but supported)
 * <PageShell theme="creator" title="Dashboard" query={...} skeleton={...}>
 *   {(data) => (
 *     <>
 *       <PageShell.Section title="Stats" icon={BarChart3}>
 *         <StatsGrid stats={data.stats} />
 *       </PageShell.Section>
 *
 *       <PageShell.Tabs defaultTab="courses">
 *         <PageShell.Tab id="courses" label="Cursos">
 *           <CoursesList />
 *         </PageShell.Tab>
 *       </PageShell.Tabs>
 *     </>
 *   )}
 * </PageShell>
 */
// Create a callable wrapper function that preserves React component behavior
// Object.create(PageShellCore) was creating an object (not a function), which
// caused SSG failures: "Element type is invalid: expected a string or class/function but got: object"
//
// We use Object.assign to copy PageShellCore properties to a new function wrapper,
// which avoids mutating PageShellCore itself while maintaining callability.
//
// Using function declaration (not arrow) to avoid JSX interpretation of generics.
// Generic type parameter flows through to enable type inference for children render function.
function PageShellWrapper<TData>(
  props: Parameters<typeof PageShellCore<TData>>[0]
) {
  return PageShellCore(props);
}

export const PageShell = Object.assign(
  // Callable wrapper - delegates to PageShellCore but is a separate function
  // This preserves the ability to render <PageShell> as a component
  PageShellWrapper as typeof PageShellCore,
  // Copy all properties from PageShellCore (Static, Multi, Wizard, Section, etc.)
  PageShellCore,
  // Add all composites with runtime deprecation warnings
  {
    /**
     * @deprecated Use direct import instead: `import { ListPage } from '@pageshell/composites'`
     */
    ListPage: createDeprecatedGetter('ListPage', ListPage),
    /**
     * @deprecated Use direct import instead: `import { FormModal } from '@pageshell/composites'`
     */
    FormModal: createDeprecatedGetter('FormModal', FormModal),
    /**
     * @deprecated Use direct import instead: `import { DetailPage } from '@pageshell/composites'`
     */
    DetailPage: createDeprecatedGetter('DetailPage', DetailPage),
    /**
     * @deprecated Use direct import instead: `import { DashboardPage } from '@pageshell/composites'`
     */
    DashboardPage: createDeprecatedGetter('DashboardPage', DashboardPage),
    /**
     * @deprecated Use direct import instead: `import { FormPage } from '@pageshell/composites'`
     */
    FormPage: createDeprecatedGetter('FormPage', FormPage),
    /**
     * @deprecated Use direct import instead: `import { SettingsPage } from '@pageshell/composites'`
     */
    SettingsPage: createDeprecatedGetter('SettingsPage', SettingsPage),
    /**
     * @deprecated Use direct import instead: `import { ConfigPage } from '@pageshell/composites'`
     */
    ConfigPage: createDeprecatedGetter('ConfigPage', ConfigPage),
    /**
     * @deprecated Use direct import instead: `import { LinearFlowPage } from '@pageshell/composites'`
     */
    LinearFlowPage: createDeprecatedGetter('LinearFlowPage', LinearFlowPage),
    /**
     * @deprecated Use direct import instead: `import { WizardPage } from '@pageshell/composites'`
     */
    WizardPage: createDeprecatedGetter('WizardPage', WizardPage),
    /**
     * @deprecated Use direct import instead: `import { SplitPanelPage } from '@pageshell/composites'`
     */
    SplitPanelPage: createDeprecatedGetter('SplitPanelPage', SplitPanelPage),
    /**
     * @deprecated Use direct import instead: `import { CalendarPage } from '@pageshell/composites'`
     */
    CalendarPage: createDeprecatedGetter('CalendarPage', CalendarPage),
    /**
     * @deprecated Use direct import instead: `import { ProgressiveExtractionPage } from '@pageshell/composites'`
     */
    ProgressiveExtractionPage: createDeprecatedGetter(
      'ProgressiveExtractionPage',
      ProgressiveExtractionPage
    ),
    /**
     * @deprecated Use direct import instead: `import { CardSettingsPage } from '@pageshell/composites'`
     */
    CardSettingsPage: createDeprecatedGetter('CardSettingsPage', CardSettingsPage),
  }
);
