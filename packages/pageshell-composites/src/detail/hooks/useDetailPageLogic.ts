/**
 * useDetailPageLogic Hook
 *
 * Extracted logic from DetailPage for better separation of concerns.
 * Handles data resolution, tab state, and action visibility.
 *
 * @module detail/hooks/useDetailPageLogic
 */

'use client';

import * as React from 'react';
import type { DetailPageBadge, FooterActionConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UseDetailPageLogicOptions<TData> {
  // Data
  data?: TData;
  // Title/description resolvers
  title: string | ((data: TData) => string);
  description?: string | ((data: TData) => string);
  badge?: DetailPageBadge | ((data: TData) => DetailPageBadge);
  // Tabs
  tabs?: Array<{ id: string }>;
  defaultTab?: string;
  // Footer actions
  footerActions?: FooterActionConfig<TData>[];
}

export interface UseDetailPageLogicReturn<TData> {
  // Resolved values
  resolvedTitle: string;
  resolvedDescription: string | undefined;
  resolvedBadge: DetailPageBadge | undefined;
  // Tab state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Footer actions
  visibleFooterActions: FooterActionConfig<TData>[];
}

// =============================================================================
// Hook
// =============================================================================

export function useDetailPageLogic<TData>(
  options: UseDetailPageLogicOptions<TData>
): UseDetailPageLogicReturn<TData> {
  const {
    data,
    title,
    description,
    badge,
    tabs,
    defaultTab,
    footerActions,
  } = options;

  // ===========================================================================
  // Tab State
  // ===========================================================================

  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs?.[0]?.id || '');

  // ===========================================================================
  // Data Resolution
  // ===========================================================================

  const resolvedTitle = React.useMemo(() => {
    if (typeof title === 'function' && data) {
      return title(data);
    }
    return typeof title === 'string' ? title : '';
  }, [title, data]);

  const resolvedDescription = React.useMemo(() => {
    if (!description) return undefined;
    if (typeof description === 'function' && data) {
      return description(data);
    }
    return description as string;
  }, [description, data]);

  const resolvedBadge = React.useMemo(() => {
    if (!badge) return undefined;
    if (typeof badge === 'function' && data) {
      return badge(data);
    }
    return badge as DetailPageBadge;
  }, [badge, data]);

  // ===========================================================================
  // Footer Actions Visibility
  // ===========================================================================

  const visibleFooterActions = React.useMemo(() => {
    if (!footerActions || footerActions.length === 0 || !data) return [];
    return footerActions.filter(
      (action) => !action.showWhen || action.showWhen(data)
    );
  }, [footerActions, data]);

  return {
    // Resolved values
    resolvedTitle,
    resolvedDescription,
    resolvedBadge,
    // Tab state
    activeTab,
    setActiveTab,
    // Footer actions
    visibleFooterActions,
  };
}
