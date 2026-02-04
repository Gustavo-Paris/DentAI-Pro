/**
 * Deprecation Warning Utilities for ListPage
 *
 * Development-only warnings for deprecated props.
 * Uses the shared deprecation utility for consistency.
 *
 * Supports strictMode for enforcing deprecation warnings as errors.
 *
 * @module list/utils/deprecationWarnings
 */

import {
  warnDeprecatedProp,
  handleDeprecatedProp,
  type DeprecationLevel,
} from '../../shared/utils/deprecation';

// Re-export for backward compatibility
export { warnDeprecatedProp };

/**
 * Removal version for all deprecated ListPage props
 */
const REMOVAL_VERSION = 'v2.0.0';

/**
 * Check and warn for all deprecated ListPage props
 *
 * @param props - ListPage props object (includes strictMode if provided)
 */
export function warnDeprecatedListPageProps(props: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') return;

  // Extract strictMode from props (default: 'warn')
  const strictMode = (props.strictMode as DeprecationLevel) ?? 'warn';

  // query → useQuery or procedure
  if (props.query !== undefined && props.useQuery === undefined && props.procedure === undefined) {
    handleDeprecatedProp('ListPage', 'query', 'useQuery', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use `useQuery={(state) => api.users.list.useQuery(state)}` for reactive queries.',
    });
  }

  // rowActions → actions
  if (props.rowActions !== undefined && props.actions === undefined) {
    handleDeprecatedProp('ListPage', 'rowActions', 'actions', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Define actions at the ListPage level. Actions work for both table and card modes.',
    });
  }

  // cardActions → actions
  if (props.cardActions !== undefined && props.actions === undefined) {
    handleDeprecatedProp('ListPage', 'cardActions', 'actions', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use the unified `actions` prop which works for both table and card modes.',
    });
  }

  // cardFilters → filters
  if (props.cardFilters !== undefined && props.filters === undefined) {
    handleDeprecatedProp('ListPage', 'cardFilters', 'filters', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use the unified `filters` prop. Add `cardRenderAs: "buttons"` for button style.',
    });
  }

  // cardSortConfig → sort
  if (props.cardSortConfig !== undefined && props.sort === undefined) {
    handleDeprecatedProp('ListPage', 'cardSortConfig', 'sort', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use the unified `sort` prop which works for both table and card modes.',
    });
  }

  // defaultSort → sort
  if (props.defaultSort !== undefined && props.sort === undefined) {
    handleDeprecatedProp('ListPage', 'defaultSort', 'sort', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use `sort={{ options: [...], default: "key" }}` for sort configuration.',
    });
  }

  // cardHref → itemHref
  if (props.cardHref !== undefined && props.itemHref === undefined) {
    handleDeprecatedProp('ListPage', 'cardHref', 'itemHref', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use the unified `itemHref` prop which works for both table and card modes.',
    });
  }

  // onRowClick → itemHref + onItemClick
  if (props.onRowClick !== undefined && props.itemHref === undefined && props.onItemClick === undefined) {
    handleDeprecatedProp('ListPage', 'onRowClick', 'itemHref', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use `itemHref` for navigation or `onItemClick` for side effects.',
    });
  }

  // columns → fields (soft warning, columns still supported)
  if (props.columns !== undefined && props.fields === undefined) {
    handleDeprecatedProp('ListPage', 'columns', 'fields', {
      removalVersion: REMOVAL_VERSION,
      strictMode: strictMode === 'error' ? 'warn' : strictMode, // Downgrade to warn for columns
      hint: 'Consider using `fields` for unified table+card configuration. Columns still work.',
    });
  }

  // Legacy slot props → slots object
  const slots = props.slots as Record<string, unknown> | undefined;

  if (props.headerSlot !== undefined && slots?.headerSlot === undefined) {
    handleDeprecatedProp('ListPage', 'headerSlot', 'slots.headerSlot', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use `slots={{ headerSlot: ... }}` for slot customization.',
    });
  }

  if (props.beforeTableSlot !== undefined && slots?.beforeTableSlot === undefined) {
    handleDeprecatedProp('ListPage', 'beforeTableSlot', 'slots.beforeTableSlot', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use `slots={{ beforeTableSlot: ... }}` for slot customization.',
    });
  }

  if (props.afterTableSlot !== undefined && slots?.afterTableSlot === undefined) {
    handleDeprecatedProp('ListPage', 'afterTableSlot', 'slots.afterTableSlot', {
      removalVersion: REMOVAL_VERSION,
      strictMode,
      hint: 'Use `slots={{ afterTableSlot: ... }}` for slot customization.',
    });
  }
}
