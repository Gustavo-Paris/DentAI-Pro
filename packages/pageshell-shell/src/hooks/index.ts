/**
 * Internal hooks for PageShell components.
 * These are used internally and not part of the public API.
 */

export { useDocumentTitle } from './useDocumentTitle';
export { useScrollToTop } from './useScrollToTop';
export { useContainerSetup, type ContainerSetupConfig, type ContainerSetupResult } from './useContainerSetup';
export {
  usePageShellSetup,
  type PageShellSetupConfig,
  type HeaderPropsConfig,
  type PageShellSetupResult,
} from './usePageShellSetup';
