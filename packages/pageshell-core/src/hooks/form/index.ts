/**
 * Form Hooks Module
 *
 * Reusable form utilities extracted from composite form hooks.
 *
 * NOTE: useNavigationGuard is NOT exported here because it has Next.js dependencies.
 * Import it directly: import { useNavigationGuard } from '@pageshell/core/hooks/form/useNavigationGuard'
 *
 * @module hooks/form
 */

// Types only (no runtime imports with Next.js deps)
export type {
  UseNavigationGuardOptions,
  UseNavigationGuardReturn,
} from './useNavigationGuard';

// Auto-save (framework-agnostic)
export {
  useAutoSave,
  type AutoSaveStatus,
  type UseAutoSaveOptions,
  type UseAutoSaveReturn,
} from './useAutoSave';
