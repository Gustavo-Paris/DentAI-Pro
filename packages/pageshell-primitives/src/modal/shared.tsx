/**
 * Modal Shared Utilities
 *
 * Common utilities, styles, and constants used across PageModal,
 * PageConfirmDialog, and PageDrawer components.
 *
 * @module modal/shared
 */

'use client';

import { useMemo } from 'react';
import type { CSSProperties } from 'react';

// =============================================================================
// Theme Types
// =============================================================================

/** Portal theme variants */
export type PortalTheme = 'creator' | 'admin' | 'student';

/** Portal theme detection result */
export interface PortalThemeResult {
  /** Detected theme variant (creator, admin, student) */
  theme: PortalTheme | undefined;
  /** Whether dark mode is active */
  isDarkMode: boolean;
  /** Combined theme class string ("ui-theme ui-theme-{theme}") */
  themeClass: string;
  /** Dark/light mode class for ancestors */
  modeClass: 'dark' | 'light';
}

// =============================================================================
// Theme Detection Hook
// =============================================================================

/**
 * Detect portal theme from DOM
 *
 * Used by modal/dialog components that render in Radix portals outside
 * the main DOM hierarchy. This hook detects both the theme variant
 * (creator/admin/student) and dark mode state.
 *
 * @param themeProp - Optional theme prop to override detection
 * @param isOpen - Whether the modal is open (triggers re-detection on open)
 * @returns Theme detection result with theme, isDarkMode, themeClass, and modeClass
 *
 * @example
 * ```tsx
 * function MyModal({ open, theme: themeProp }) {
 *   const { theme, isDarkMode, themeClass, modeClass } = useDetectedPortalTheme(themeProp, open);
 *
 *   return (
 *     <Portal>
 *       <div className={modeClass}>
 *         <div className={themeClass}>
 *           {content}
 *         </div>
 *       </div>
 *     </Portal>
 *   );
 * }
 * ```
 */
export function useDetectedPortalTheme(
  themeProp?: PortalTheme,
  isOpen?: boolean
): PortalThemeResult {
  // Detect theme from DOM if not provided via prop
  const theme = useMemo(() => {
    if (themeProp) return themeProp;
    if (typeof document === 'undefined') return undefined;

    // Look for ui-theme-* class in the DOM
    const themeElement = document.querySelector(
      '.ui-theme-creator, .ui-theme-admin, .ui-theme-student'
    );
    if (themeElement?.classList.contains('ui-theme-creator')) return 'creator';
    if (themeElement?.classList.contains('ui-theme-admin')) return 'admin';
    if (themeElement?.classList.contains('ui-theme-student')) return 'student';
    return undefined;
  }, [themeProp]);

  // Detect dark mode using multiple methods for robustness
  // CRITICAL: Portals render outside normal DOM hierarchy, won't inherit from <html class="dark">
  const isDarkMode = useMemo(() => {
    if (typeof document === 'undefined') return true; // SSR default to dark

    // Method 1: Check .dark class on html
    if (document.documentElement.classList.contains('dark')) return true;

    // Method 2: Check colorScheme style (set by ThemeProvider)
    if (document.documentElement.style.colorScheme === 'dark') return true;

    // Method 3: Check system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return true;

    return false;
  }, [isOpen]); // Re-check when modal opens

  // Build theme class (ui-theme + theme variant)
  const themeClass = theme ? `ui-theme ui-theme-${theme}` : '';
  const modeClass = isDarkMode ? 'dark' : 'light';

  return { theme, isDarkMode, themeClass, modeClass };
}

// =============================================================================
// Z-Index Constants
// =============================================================================

/** Z-index for modal/dialog overlays */
export const MODAL_OVERLAY_Z_INDEX = 1000;

/** Z-index for modal/dialog content */
export const MODAL_CONTENT_Z_INDEX = 1010;

// =============================================================================
// Size Type
// =============================================================================

/** Modal/drawer size variants */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// =============================================================================
// Theme Styles (for Radix Portals)
// =============================================================================

/**
 * Get inline styles for modal/dialog portal content
 *
 * Required because Radix portals render outside the themed DOM tree,
 * breaking Tailwind's CSS variable syntax. We use inline styles with
 * CSS variables to maintain theme inheritance.
 *
 * @see https://www.radix-ui.com/primitives/docs/components/dialog#portals
 */
export function getModalThemeStyles(): CSSProperties {
  return {
    zIndex: MODAL_CONTENT_Z_INDEX,
    backgroundColor: 'var(--color-popover, #14141c)',
    color: 'var(--color-popover-foreground, #e4e4eb)',
    borderColor: 'var(--color-border, #27272a)',
  };
}

/**
 * Get inline styles for drawer portal content
 *
 * Drawers use background color instead of popover for better
 * visual integration with the page.
 */
export function getDrawerThemeStyles(): CSSProperties {
  return {
    zIndex: MODAL_CONTENT_Z_INDEX,
    backgroundColor: 'var(--color-background, #08080c)',
    color: 'var(--color-foreground, #e4e4eb)',
    borderColor: 'var(--color-border, #27272a)',
  };
}

// =============================================================================
// Common Class Utilities
// =============================================================================

/**
 * Base overlay classes used by all modals/dialogs
 *
 * Features:
 * - Fixed full-screen overlay
 * - Semi-transparent black background with blur
 * - Fade in/out animations
 */
export const MODAL_OVERLAY_CLASSES = [
  'fixed inset-0',
  `z-[${MODAL_OVERLAY_Z_INDEX}]`,
  'bg-black/60 backdrop-blur-sm',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'duration-200',
].join(' ');

/**
 * Base content classes for centered modals (PageModal, PageConfirmDialog)
 *
 * Features:
 * - Mobile: slide up from bottom, rounded top corners
 * - Desktop: centered with full rounded corners
 * - Smooth slide + fade + zoom animations
 */
export const MODAL_CONTENT_BASE_CLASSES = [
  // Base positioning
  'fixed',
  `z-[${MODAL_CONTENT_Z_INDEX}]`,

  // Mobile: slide up from bottom
  'inset-x-0 bottom-0 top-auto',
  'max-h-[90vh] rounded-t-2xl',

  // Layout
  'flex flex-col border bg-popover shadow-2xl',

  // Animation
  'duration-300 ease-out',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',

  // Desktop: centered modal (explicit overrides for all inset properties)
  'sm:left-1/2 sm:top-1/2 sm:right-auto sm:bottom-auto',
  'sm:-translate-x-1/2 sm:-translate-y-1/2',
  'sm:max-h-[85vh] sm:rounded-xl',
  'sm:data-[state=closed]:slide-out-to-bottom-2 sm:data-[state=open]:slide-in-from-bottom-2',
  'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
].join(' ');

/**
 * Size variant classes for modal width
 *
 * Used by PageModal and PageConfirmDialog.
 */
export const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'sm:w-full sm:max-w-sm',   // 384px
  md: 'sm:w-full sm:max-w-md',   // 448px
  lg: 'sm:w-full sm:max-w-lg',   // 512px
  xl: 'sm:w-full sm:max-w-2xl',  // 672px
  full: 'sm:w-full sm:max-w-4xl', // 896px
};

/**
 * Size variant classes for confirm dialogs (smaller scale)
 */
export const CONFIRM_DIALOG_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'sm:w-full sm:max-w-sm',  // 384px
  md: 'sm:w-full sm:max-w-md',  // 448px
  lg: 'sm:w-full sm:max-w-lg',  // 512px
};

// =============================================================================
// Mobile Drag Indicator
// =============================================================================

/**
 * Mobile drag indicator component
 *
 * Visual affordance for mobile users to swipe/drag to close.
 * Hidden on desktop (sm: breakpoint and up).
 */
export function MobileDragIndicator() {
  return (
    <div className="flex justify-center pt-3 pb-1 sm:hidden">
      <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
    </div>
  );
}

// =============================================================================
// Common Drawer Utilities
// =============================================================================

/** Drawer side variants */
export type DrawerSide = 'left' | 'right';

/** Size classes for drawer width */
export const DRAWER_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'w-full sm:max-w-xs',  // 320px
  md: 'w-full sm:max-w-md',  // 448px
  lg: 'w-full sm:max-w-lg',  // 512px
  xl: 'w-full sm:max-w-xl',  // 576px
  full: 'w-full',            // 100%
};

/** Slide animation classes by drawer side */
export const DRAWER_SLIDE_ANIMATIONS: Record<DrawerSide, string> = {
  left: 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  right: 'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
};

/** Position and border classes by drawer side */
export const DRAWER_POSITION_CLASSES: Record<DrawerSide, string> = {
  left: 'left-0 border-r',
  right: 'right-0 border-l',
};
