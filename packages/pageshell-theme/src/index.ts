/**
 * @pageshell/theme
 *
 * Theme context and configuration for PageShell composites.
 *
 * @example
 * ```tsx
 * import { PageShellProvider, usePageShellContext } from '@pageshell/theme';
 *
 * function App() {
 *   return (
 *     <PageShellProvider theme="creator">
 *       <MyPage />
 *     </PageShellProvider>
 *   );
 * }
 *
 * function MyPage() {
 *   const { theme, config } = usePageShellContext();
 *   return <div className={config.animate}>Content</div>;
 * }
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Types
// =============================================================================
export type {
  PageShellTheme,
  PageShellSpacing,
  ThemeConfig,
  PageShellContextValue,
  PageShellProviderProps,
  WizardStepContextValue,
  WizardStepProviderProps,
} from './types';

// =============================================================================
// Theme Configuration
// =============================================================================
export {
  themeConfigs,
  getThemeConfig,
  iconColorClasses,
} from './theme-config';

// =============================================================================
// Context & Hooks
// =============================================================================
export {
  PageShellProvider,
  usePageShellContext,
  usePageShellContextOptional,
  WizardStepProvider,
  useWizardStepContext,
} from './context';
