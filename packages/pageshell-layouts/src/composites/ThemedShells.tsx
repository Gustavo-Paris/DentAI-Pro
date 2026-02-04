/**
 * Themed Shell Composites
 *
 * Pre-configured AppShell variants for different portal themes.
 *
 * @module composites/ThemedShells
 */

'use client';

import * as React from 'react';
import { AppShell, type AppShellProps } from './AppShell';

// =============================================================================
// Types
// =============================================================================

type ThemedShellProps = Omit<AppShellProps, 'theme'>;

// =============================================================================
// AdminShell
// =============================================================================

/**
 * Admin portal shell with cyan theme.
 *
 * @example
 * ```tsx
 * <AdminShell
 *   brand={{ icon: "shield", title: "Admin", subtitle: "Manage platform" }}
 *   navigation={adminNav}
 *   user={currentUser}
 *   onSignOut={handleSignOut}
 *   renderLink={...}
 *   isActive={...}
 * >
 *   {children}
 * </AdminShell>
 * ```
 */
export function AdminShell(props: ThemedShellProps) {
  return <AppShell {...props} theme="admin" />;
}

AdminShell.displayName = 'AdminShell';

// =============================================================================
// CreatorShell
// =============================================================================

/**
 * Creator portal shell with violet theme.
 *
 * @example
 * ```tsx
 * <CreatorShell
 *   brand={{ icon: "sparkles", title: "Creator Portal", subtitle: "Build courses" }}
 *   navigation={creatorNav}
 *   user={currentUser}
 *   onSignOut={handleSignOut}
 *   renderLink={...}
 *   isActive={...}
 * >
 *   {children}
 * </CreatorShell>
 * ```
 */
export function CreatorShell(props: ThemedShellProps) {
  return <AppShell {...props} theme="creator" />;
}

CreatorShell.displayName = 'CreatorShell';

// =============================================================================
// StudentShell
// =============================================================================

/**
 * Student portal shell with default theme.
 *
 * @example
 * ```tsx
 * <StudentShell
 *   brand={{ icon: "graduation-cap", title: "Learning", subtitle: "Your courses" }}
 *   navigation={studentNav}
 *   user={currentUser}
 *   onSignOut={handleSignOut}
 *   renderLink={...}
 *   isActive={...}
 * >
 *   {children}
 * </StudentShell>
 * ```
 */
export function StudentShell(props: ThemedShellProps) {
  return <AppShell {...props} theme="student" />;
}

StudentShell.displayName = 'StudentShell';
