/**
 * PageShell Composites - ARIA Label Types
 *
 * i18n-ready ARIA label interfaces for accessibility.
 * All labels have English defaults per ADR-0055.
 * Components accept optional ariaLabels prop for i18n override.
 *
 * @module shared/types/aria-labels
 */

import { createLabelResolver } from '../utils/labels';

// =============================================================================
// Common ARIA Labels (Shared across composites)
// =============================================================================

/**
 * Common ARIA labels shared across primitives and composites
 */
export interface CommonAriaLabels {
  /** Close button */
  close?: string;
  /** Loading indicator */
  loading?: string;
  /** Clear/reset action */
  clear?: string;
  /** Expand action */
  expand?: string;
  /** Collapse action */
  collapse?: string;
  /** Search input */
  search?: string;
  /** Navigation */
  navigation?: string;
  /** Settings */
  settings?: string;
}

/**
 * Default common ARIA labels (English)
 */
export const DEFAULT_COMMON_ARIA_LABELS: Required<CommonAriaLabels> = {
  close: 'Close',
  loading: 'Loading...',
  clear: 'Clear',
  expand: 'Expand',
  collapse: 'Collapse',
  search: 'Search',
  navigation: 'Navigation',
  settings: 'Settings',
};

/**
 * Resolve common ARIA labels with defaults
 */
export const resolveCommonAriaLabels = createLabelResolver(DEFAULT_COMMON_ARIA_LABELS);

// =============================================================================
// Split Panel ARIA Labels
// =============================================================================

/**
 * ARIA labels for SplitPanelPage
 */
export interface SplitPanelAriaLabels {
  /** Items listbox */
  itemsList?: string;
  /** Main content panel */
  mainContent?: string;
  /** Context panel */
  contextPanel?: string;
  /** Context panel collapsed state */
  contextPanelCollapsed?: string;
  /** Expand panel button */
  expandPanel?: string;
  /** Collapse panel button */
  collapsePanel?: string;
}

/**
 * Default Split Panel ARIA labels (English)
 */
export const DEFAULT_SPLIT_PANEL_ARIA_LABELS: Required<SplitPanelAriaLabels> = {
  itemsList: 'Items list',
  mainContent: 'Main content',
  contextPanel: 'Context panel',
  contextPanelCollapsed: 'Context panel (collapsed)',
  expandPanel: 'Expand panel',
  collapsePanel: 'Collapse panel',
};

/**
 * Resolve Split Panel ARIA labels with defaults
 */
export const resolveSplitPanelAriaLabels = createLabelResolver(DEFAULT_SPLIT_PANEL_ARIA_LABELS);

// =============================================================================
// Detail Page ARIA Labels
// =============================================================================

/**
 * ARIA labels for DetailPage
 */
export interface DetailPageAriaLabels {
  /** Breadcrumb navigation */
  breadcrumb?: string;
}

/**
 * Default Detail Page ARIA labels (English)
 */
export const DEFAULT_DETAIL_PAGE_ARIA_LABELS: Required<DetailPageAriaLabels> = {
  breadcrumb: 'Breadcrumb',
};

/**
 * Resolve Detail Page ARIA labels with defaults
 */
export const resolveDetailPageAriaLabels = createLabelResolver(DEFAULT_DETAIL_PAGE_ARIA_LABELS);

// =============================================================================
// Calendar ARIA Labels
// =============================================================================

/**
 * ARIA labels for CalendarPage and calendar components
 */
export interface CalendarAriaLabels {
  /** Calendar grid/table */
  calendar?: string;
  /** Go to previous period */
  previousPeriod?: string;
  /** Go to next period */
  nextPeriod?: string;
  /** Go to today */
  goToToday?: string;
  /** Select calendar view */
  selectView?: string;
  /** Month view */
  monthView?: string;
  /** Week view */
  weekView?: string;
  /** Day view */
  dayView?: string;
  /** Event item */
  event?: string;
}

/**
 * Default Calendar ARIA labels (English)
 */
export const DEFAULT_CALENDAR_ARIA_LABELS: Required<CalendarAriaLabels> = {
  calendar: 'Calendar',
  previousPeriod: 'Go to previous period',
  nextPeriod: 'Go to next period',
  goToToday: 'Go to today',
  selectView: 'Select calendar view',
  monthView: 'Month',
  weekView: 'Week',
  dayView: 'Day',
  event: 'Event',
};

/**
 * Resolve Calendar ARIA labels with defaults
 */
export const resolveCalendarAriaLabels = createLabelResolver(DEFAULT_CALENDAR_ARIA_LABELS);

// =============================================================================
// Analytics ARIA Labels
// =============================================================================

/**
 * ARIA labels for Analytics components
 */
export interface AnalyticsAriaLabels {
  /** Select period tabs */
  selectPeriod?: string;
  /** Loading analytics data */
  loadingAnalytics?: string;
  /** Analytics chart */
  chart?: string;
}

/**
 * Default Analytics ARIA labels (English)
 */
export const DEFAULT_ANALYTICS_ARIA_LABELS: Required<AnalyticsAriaLabels> = {
  selectPeriod: 'Select period',
  loadingAnalytics: 'Loading analytics data',
  chart: 'Analytics chart',
};

/**
 * Resolve Analytics ARIA labels with defaults
 */
export const resolveAnalyticsAriaLabels = createLabelResolver(DEFAULT_ANALYTICS_ARIA_LABELS);

// =============================================================================
// Wizard ARIA Labels
// =============================================================================

/**
 * ARIA labels for WizardPage
 */
export interface WizardAriaLabels {
  /** Wizard progress navigation */
  wizardProgress?: string;
  /** Wizard content */
  wizardContent?: string;
  /** Step progress indicator */
  stepProgress?: string;
}

/**
 * Default Wizard ARIA labels (English)
 */
export const DEFAULT_WIZARD_ARIA_LABELS: Required<WizardAriaLabels> = {
  wizardProgress: 'Wizard progress',
  wizardContent: 'Wizard content',
  stepProgress: 'Flow progress',
};

/**
 * Resolve Wizard ARIA labels with defaults
 */
export const resolveWizardAriaLabels = createLabelResolver(DEFAULT_WIZARD_ARIA_LABELS);

// =============================================================================
// List ARIA Labels
// =============================================================================

/**
 * ARIA labels for ListPage
 */
export interface ListAriaLabels {
  /** Select all rows checkbox */
  selectAllRows?: string;
  /** Select row checkbox */
  selectRow?: string;
  /** View mode toggle group */
  viewMode?: string;
  /** Table view */
  tableView?: string;
  /** Cards view */
  cardsView?: string;
  /** Graph view */
  graphView?: string;
  /** Sort select */
  sort?: string;
}

/**
 * Default List ARIA labels (English)
 */
export const DEFAULT_LIST_ARIA_LABELS: Required<ListAriaLabels> = {
  selectAllRows: 'Select all rows',
  selectRow: 'Select row',
  viewMode: 'View mode',
  tableView: 'Table view',
  cardsView: 'Cards view',
  graphView: 'Graph view',
  sort: 'Sort',
};

/**
 * Resolve List ARIA labels with defaults
 */
export const resolveListAriaLabels = createLabelResolver(DEFAULT_LIST_ARIA_LABELS);

// =============================================================================
// Dashboard ARIA Labels
// =============================================================================

/**
 * ARIA labels for DashboardPage
 */
export interface DashboardAriaLabels {
  /** Dashboard modules container */
  dashboardModules?: string;
  /** Secondary modules container */
  secondaryModules?: string;
  /** Dashboard statistics */
  statistics?: string;
  /** Loading dashboard content */
  loadingDashboard?: string;
}

/**
 * Default Dashboard ARIA labels (English)
 */
export const DEFAULT_DASHBOARD_ARIA_LABELS: Required<DashboardAriaLabels> = {
  dashboardModules: 'Dashboard modules',
  secondaryModules: 'Secondary modules',
  statistics: 'Dashboard statistics',
  loadingDashboard: 'Loading dashboard content',
};

/**
 * Resolve Dashboard ARIA labels with defaults
 */
export const resolveDashboardAriaLabels = createLabelResolver(DEFAULT_DASHBOARD_ARIA_LABELS);

// =============================================================================
// Settings ARIA Labels
// =============================================================================

/**
 * ARIA labels for SettingsPage
 */
export interface SettingsAriaLabels {
  /** Settings navigation */
  settingsNavigation?: string;
  /** Settings content */
  settingsContent?: string;
}

/**
 * Default Settings ARIA labels (English)
 */
export const DEFAULT_SETTINGS_ARIA_LABELS: Required<SettingsAriaLabels> = {
  settingsNavigation: 'Settings',
  settingsContent: 'Settings content',
};

/**
 * Resolve Settings ARIA labels with defaults
 */
export const resolveSettingsAriaLabels = createLabelResolver(DEFAULT_SETTINGS_ARIA_LABELS);

// =============================================================================
// Form ARIA Labels
// =============================================================================

/**
 * ARIA labels for FormPage and FormModal
 */
export interface FormAriaLabels {
  /** Select option placeholder */
  selectOption?: string;
}

/**
 * Default Form ARIA labels (English)
 */
export const DEFAULT_FORM_ARIA_LABELS: Required<FormAriaLabels> = {
  selectOption: 'Select an option',
};

/**
 * Resolve Form ARIA labels with defaults
 */
export const resolveFormAriaLabels = createLabelResolver(DEFAULT_FORM_ARIA_LABELS);
