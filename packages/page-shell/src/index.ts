/**
 * @repo/page-shell
 *
 * Unified barrel package for PageShell.
 *
 * ## Recommended Import Pattern
 *
 * For best tree-shaking and to avoid naming conflicts, import from subpaths:
 *
 * ```tsx
 * // Page composites (recommended for most use cases)
 * import { ListPage, FormModal, DetailPage, DashboardPage } from '@repo/page-shell/composites';
 *
 * // Core utilities
 * import { cn, formatCurrency, useFormLogic } from '@repo/page-shell/core';
 *
 * // UI primitives
 * import { Button, Card, Badge, PageModal } from '@repo/page-shell/primitives';
 *
 * // Layout components
 * import { PageHeader, PageStats, AppShell } from '@repo/page-shell/layouts';
 *
 * // Interactive components
 * import { PageFilters, PageSearch, PageDrawer } from '@repo/page-shell/interactions';
 *
 * // Feature components
 * import { PageStatsCard, PageFAQ } from '@repo/page-shell/features';
 *
 * // Theme
 * import { PageShellProvider, usePageShellContext } from '@repo/page-shell/theme';
 * ```
 *
 * The main export below provides composites (the highest-level API):
 *
 * @packageDocumentation
 */

// =============================================================================
// MAIN EXPORT: Composites (L5) - Declarative page patterns
// This is the primary API for building pages
// =============================================================================
export * from '@pageshell/composites';
