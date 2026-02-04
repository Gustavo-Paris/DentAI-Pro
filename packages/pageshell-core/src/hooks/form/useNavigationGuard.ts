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
import { useNavigate } from 'react-router-dom';

// =============================================================================
// Types
// =============================================================================

export interface UseNavigationGuardOptions {
  /** Whether to warn on unsaved changes */
  enabled?: boolean;
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Navigate function (optional, uses react-router-dom useNavigate by default) */
  navigate?: (url: string) => void;
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
  const { enabled = true, isDirty, navigate: navigateProp } = options;

  const defaultNavigate = useNavigate();
  const nav = navigateProp ?? defaultNavigate;

  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const handleNavigate = React.useCallback(
    (href: string) => {
      if (enabled && isDirty) {
        setPendingHref(href);
        setShowLeaveDialog(true);
      } else {
        nav(href);
      }
    },
    [enabled, isDirty, nav]
  );

  const confirmNavigation = React.useCallback(() => {
    setShowLeaveDialog(false);
    if (pendingHref) {
      nav(pendingHref);
      setPendingHref(null);
    }
  }, [pendingHref, nav]);

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
