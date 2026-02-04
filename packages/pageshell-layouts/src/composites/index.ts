/**
 * Layout Composites
 *
 * Pre-configured layout components for common portal patterns.
 *
 * @module composites
 */

// AppShell - Base configurable layout
export {
  AppShell,
  type AppShellProps,
  type SidebarFeaturesConfig,
} from './AppShell';

// Themed Shells - Pre-configured variants
export { AdminShell, CreatorShell, StudentShell } from './ThemedShells';
