'use client';

/**
 * useNavigationGuard Hook
 *
 * Reusable navigation guard for forms with unsaved changes.
 * Shows a confirmation dialog before navigating away from dirty forms.
 *
 * @module hooks/form/useNavigationGuard
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';

// =============================================================================
// Types
// =============================================================================

export interface UseNavigationGuardOptions {
  /** Whether to warn on unsaved changes */
  enabled?: boolean;
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Router instance (optional, uses Next.js router by default) */
  router?: { push: (url: string) => void };
}

export interface UseNavigationGuardReturn {
  /** Whether the leave dialog is visible */
  showLeaveDialog: boolean;
  /** Pending navigation URL */
  pendingHref: string | null;
  /** Navigate with guard check */
  handleNavigate: (href: string) => void;
  /** Confirm navigation and proceed */
  confirmNavigation: () => void;
  /** Cancel navigation and stay */
  cancelNavigation: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useNavigationGuard(
  options: UseNavigationGuardOptions
): UseNavigationGuardReturn {
  const { enabled = true, isDirty, router: routerProp } = options;

  const nextRouter = useRouter();
  const router = routerProp ?? nextRouter;

  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const handleNavigate = React.useCallback(
    (href: string) => {
      if (enabled && isDirty) {
        setPendingHref(href);
        setShowLeaveDialog(true);
      } else {
        router.push(href);
      }
    },
    [enabled, isDirty, router]
  );

  const confirmNavigation = React.useCallback(() => {
    setShowLeaveDialog(false);
    if (pendingHref) {
      router.push(pendingHref);
      setPendingHref(null);
    }
  }, [pendingHref, router]);

  const cancelNavigation = React.useCallback(() => {
    setShowLeaveDialog(false);
    setPendingHref(null);
  }, []);

  return {
    showLeaveDialog,
    pendingHref,
    handleNavigate,
    confirmNavigation,
    cancelNavigation,
  };
}
