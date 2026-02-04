/**
 * TabbedListPage Utilities
 *
 * Defaults and helper functions for TabbedListPage.
 *
 * @module tabbed-list/utils
 * @see Code Quality Audit - Consolidated to use shared/utils
 */

import { EMPTY_STATE_DEFAULTS } from '../shared/defaults';

// =============================================================================
// Defaults
// =============================================================================

export const tabbedListPageDefaults = {
  theme: 'default' as const,
  containerVariant: 'shell' as const,
  emptyState: EMPTY_STATE_DEFAULTS.data,
  emptyFilteredState: EMPTY_STATE_DEFAULTS.filter,
  wrapInCard: true,
  listClassName: 'divide-y divide-border',
  groupClassName: 'space-y-2',
};
