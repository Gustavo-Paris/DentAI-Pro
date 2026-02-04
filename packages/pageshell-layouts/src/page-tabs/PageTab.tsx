/**
 * PageTab Component
 *
 * Tab definition component for PageTabs.
 * This component doesn't render directly - it's used by PageTabs
 * to extract tab configuration.
 *
 * @package @pageshell/layouts
 *
 * @example Basic
 * <PageTab id="overview" label="Visão Geral" icon={BarChart3}>
 *   <OverviewContent />
 * </PageTab>
 *
 * @example With badge
 * <PageTab id="notifications" label="Notificações" badge={5} badgeVariant="error">
 *   <NotificationsContent />
 * </PageTab>
 *
 * @example Disabled
 * <PageTab id="premium" label="Premium" disabled>
 *   <PremiumContent />
 * </PageTab>
 */

import type React from 'react';
import type { PageTabProps } from './types';

// =============================================================================
// Component
// =============================================================================

export function PageTab(_props: PageTabProps): React.ReactNode {
  // This component doesn't render - it's just used for type-safe tab definitions
  // PageTabs extracts the props and renders the tabs itself
  return null;
}

// Mark PageTab for identification
PageTab.displayName = 'PageTab';
