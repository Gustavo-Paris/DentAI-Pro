/**
 * PageShell Composites - Label Types
 *
 * i18n label interfaces for composite components.
 * All labels have English defaults.
 *
 * @module shared/types/labels
 */

import { createLabelResolver } from '../utils/labels';

// =============================================================================
// Shared Action Labels (Common across composites)
// =============================================================================

/**
 * Labels for common actions
 */
export interface ActionLabels {
  /** Back button */
  back?: string;
  /** Save/Submit button */
  save?: string;
  /** Cancel button */
  cancel?: string;
  /** Next step */
  next?: string;
  /** Previous step */
  previous?: string;
  /** Edit action */
  edit?: string;
  /** Delete action */
  delete?: string;
  /** Confirm action */
  confirm?: string;
  /** Clear/Reset action */
  clear?: string;
  /** Continue action */
  continue?: string;
}

/**
 * Labels for loading states
 */
export interface LoadingLabels {
  /** Generic loading text */
  loading?: string;
  /** Saving in progress */
  saving?: string;
  /** Saved successfully */
  saved?: string;
  /** Save failed */
  saveFailed?: string;
  /** Please wait text */
  pleaseWait?: string;
}

/**
 * Labels for error states
 */
export interface ErrorLabels {
  /** Generic error title */
  error?: string;
  /** Warning title */
  warning?: string;
  /** Critical error title */
  critical?: string;
  /** Network error title */
  network?: string;
  /** Error loading data message */
  errorLoadingData?: string;
}

/**
 * Default shared action labels (English)
 */
export const DEFAULT_ACTION_LABELS: Required<ActionLabels> = {
  back: 'Back',
  save: 'Save',
  cancel: 'Cancel',
  next: 'Next',
  previous: 'Previous',
  edit: 'Edit',
  delete: 'Delete',
  confirm: 'Confirm',
  clear: 'Clear',
  continue: 'Continue',
};

/**
 * Default loading labels (English)
 */
export const DEFAULT_LOADING_LABELS: Required<LoadingLabels> = {
  loading: 'Loading...',
  saving: 'Saving...',
  saved: 'Saved',
  saveFailed: 'Save failed',
  pleaseWait: 'Please wait...',
};

/**
 * Default error labels (English)
 */
export const DEFAULT_ERROR_LABELS: Required<ErrorLabels> = {
  error: 'Error loading',
  warning: 'Warning',
  critical: 'Critical error',
  network: 'Connection error',
  errorLoadingData: 'Error loading data',
};

// =============================================================================
// List Page Labels
// =============================================================================

/**
 * Labels for search functionality
 */
export interface SearchLabels {
  /** Search input placeholder */
  placeholder?: string;
}

/**
 * Labels for pagination display
 */
export interface PaginationLabels {
  /** "Showing" text (e.g., "Showing 1 to 10") */
  showing?: string;
  /** "to" text (e.g., "1 to 10") */
  to?: string;
  /** "of" text (e.g., "of 100") */
  of?: string;
  /** "items" text (e.g., "100 items") */
  items?: string;
}

/**
 * Labels for selection state
 */
export interface SelectionLabels {
  /** Singular: "item selected" */
  itemSelected?: string;
  /** Plural: "items selected" */
  itemsSelected?: string;
}

/**
 * Labels for navigation actions
 */
export interface NavigationLabels {
  /** Previous page button aria-label */
  previousPage?: string;
  /** Next page button aria-label */
  nextPage?: string;
}

/**
 * Labels for empty states
 */
export interface EmptyStateLabels {
  /** Default empty title */
  title?: string;
  /** Default empty description */
  description?: string;
}

/**
 * Complete labels configuration for ListPage
 */
export interface ListPageLabels {
  /** Search labels */
  search?: SearchLabels;
  /** Pagination labels */
  pagination?: PaginationLabels;
  /** Selection labels */
  selection?: SelectionLabels;
  /** Navigation labels */
  navigation?: NavigationLabels;
  /** Empty state labels */
  emptyState?: EmptyStateLabels;
}

// =============================================================================
// Default Labels (English)
// =============================================================================

/**
 * Default English labels for ListPage
 */
export const DEFAULT_LIST_PAGE_LABELS: Required<ListPageLabels> = {
  search: {
    placeholder: 'Search...',
  },
  pagination: {
    showing: 'Showing',
    to: 'to',
    of: 'of',
    items: 'items',
  },
  selection: {
    itemSelected: 'item selected',
    itemsSelected: 'items selected',
  },
  navigation: {
    previousPage: 'Previous page',
    nextPage: 'Next page',
  },
  emptyState: {
    title: 'No items found',
    description: 'Get started by creating a new item.',
  },
};

/**
 * Merge user labels with defaults
 */
export function resolveLabels(
  userLabels?: ListPageLabels
): Required<ListPageLabels> {
  if (!userLabels) return DEFAULT_LIST_PAGE_LABELS;

  return {
    search: { ...DEFAULT_LIST_PAGE_LABELS.search, ...userLabels.search },
    pagination: { ...DEFAULT_LIST_PAGE_LABELS.pagination, ...userLabels.pagination },
    selection: { ...DEFAULT_LIST_PAGE_LABELS.selection, ...userLabels.selection },
    navigation: { ...DEFAULT_LIST_PAGE_LABELS.navigation, ...userLabels.navigation },
    emptyState: { ...DEFAULT_LIST_PAGE_LABELS.emptyState, ...userLabels.emptyState },
  };
}

// =============================================================================
// Form Page Labels
// =============================================================================

/**
 * Labels for FormPage/FormModal
 */
export interface FormLabels {
  /** Submit button text */
  submit?: string;
  /** Cancel button text */
  cancel?: string;
  /** Back link text */
  back?: string;
  /** Error banner title */
  errorTitle?: string;
  /** Saving status */
  saving?: string;
  /** Saved status */
  saved?: string;
  /** Save failed status */
  saveFailed?: string;
  /** Unsaved changes indicator */
  unsavedChanges?: string;
}

/**
 * Default form labels (English)
 */
export const DEFAULT_FORM_LABELS: Required<FormLabels> = {
  submit: 'Save',
  cancel: 'Cancel',
  back: 'Back',
  errorTitle: 'Error',
  saving: 'Saving...',
  saved: 'Saved',
  saveFailed: 'Save failed',
  unsavedChanges: 'Unsaved changes',
};

/**
 * Resolve form labels with defaults
 */
export const resolveFormLabels = createLabelResolver(DEFAULT_FORM_LABELS);

// =============================================================================
// Detail Page Labels
// =============================================================================

/**
 * Labels for DetailPage
 */
export interface DetailPageLabels {
  /** Back button text */
  back?: string;
  /** Error loading data message */
  errorLoadingData?: string;
  /** Breadcrumb navigation ARIA label */
  breadcrumb?: string;
}

/**
 * Default detail page labels (English)
 */
export const DEFAULT_DETAIL_PAGE_LABELS: Required<DetailPageLabels> = {
  back: 'Back',
  errorLoadingData: 'Error loading data',
  breadcrumb: 'Breadcrumb',
};

/**
 * Resolve detail page labels with defaults
 */
export const resolveDetailPageLabels = createLabelResolver(DEFAULT_DETAIL_PAGE_LABELS);

// =============================================================================
// Wizard Page Labels
// =============================================================================

/**
 * Labels for WizardPage
 */
export interface WizardLabels {
  /** Next step button */
  next?: string;
  /** Previous step button */
  previous?: string;
  /** Cancel button */
  cancel?: string;
  /** Complete button (final step) */
  complete?: string;
  /** Back button (EnhancedWizard) */
  back?: string;
}

/**
 * Default wizard labels (English)
 */
export const DEFAULT_WIZARD_LABELS: Required<WizardLabels> = {
  next: 'Next',
  previous: 'Previous',
  cancel: 'Cancel',
  complete: 'Complete',
  back: 'Back',
};

/**
 * Resolve wizard labels with defaults
 */
export const resolveWizardLabels = createLabelResolver(DEFAULT_WIZARD_LABELS);

// =============================================================================
// Config Page Labels
// =============================================================================

/**
 * Labels for ConfigPage
 */
export interface ConfigLabels {
  /** Save button text */
  save?: string;
}

/**
 * Default config labels (English)
 */
export const DEFAULT_CONFIG_LABELS: Required<ConfigLabels> = {
  save: 'Save',
};

/**
 * Resolve config labels with defaults
 */
export const resolveConfigLabels = createLabelResolver(DEFAULT_CONFIG_LABELS);

// =============================================================================
// Infinite Card List Labels
// =============================================================================

/**
 * Labels for InfiniteCardList
 */
export interface InfiniteCardListLabels {
  /** Loading indicator text */
  loading?: string;
  /** Clear filters button */
  clearFilters?: string;
}

/**
 * Default infinite card list labels (English)
 */
export const DEFAULT_INFINITE_CARD_LIST_LABELS: Required<InfiniteCardListLabels> = {
  loading: 'Loading...',
  clearFilters: 'Clear filters',
};

/**
 * Resolve infinite card list labels with defaults
 */
export const resolveInfiniteCardListLabels = createLabelResolver(DEFAULT_INFINITE_CARD_LIST_LABELS);

// =============================================================================
// Calendar Page Labels
// =============================================================================

/**
 * Labels for CalendarPage
 */
export interface CalendarLabels {
  /** Loading calendar accessibility text */
  loadingCalendar?: string;
}

/**
 * Default calendar labels (English)
 */
export const DEFAULT_CALENDAR_LABELS: Required<CalendarLabels> = {
  loadingCalendar: 'Loading calendar...',
};

/**
 * Resolve calendar labels with defaults
 */
export const resolveCalendarLabels = createLabelResolver(DEFAULT_CALENDAR_LABELS);

// =============================================================================
// Progressive Extraction Labels
// =============================================================================

/**
 * Labels for ProgressiveExtractionPage
 */
export interface ExtractionLabels {
  /** Back button text */
  back?: string;
  /** Cancel button text */
  cancel?: string;
  /** Please wait text */
  pleaseWait?: string;
}

/**
 * Default extraction labels (English)
 */
export const DEFAULT_EXTRACTION_LABELS: Required<ExtractionLabels> = {
  back: 'Back',
  cancel: 'Cancel',
  pleaseWait: 'Please wait...',
};

/**
 * Resolve extraction labels with defaults
 */
export const resolveExtractionLabels = createLabelResolver(DEFAULT_EXTRACTION_LABELS);

// =============================================================================
// Linear Flow Labels
// =============================================================================

/**
 * Labels for LinearFlowPage
 */
export interface LinearFlowLabels {
  /** Back button text */
  back?: string;
  /** Continue button text */
  continue?: string;
}

/**
 * Default linear flow labels (English)
 */
export const DEFAULT_LINEAR_FLOW_LABELS: Required<LinearFlowLabels> = {
  back: 'Back',
  continue: 'Continue',
};

/**
 * Resolve linear flow labels with defaults
 */
export const resolveLinearFlowLabels = createLabelResolver(DEFAULT_LINEAR_FLOW_LABELS);

// =============================================================================
// Card Settings Labels
// =============================================================================

/**
 * Labels for CardSettingsPage
 */
export interface CardSettingsLabels {
  /** Back link text */
  back?: string;
}

/**
 * Default card settings labels (English)
 */
export const DEFAULT_CARD_SETTINGS_LABELS: Required<CardSettingsLabels> = {
  back: 'Back',
};

/**
 * Resolve card settings labels with defaults
 */
export const resolveCardSettingsLabels = createLabelResolver(DEFAULT_CARD_SETTINGS_LABELS);

// =============================================================================
// Split Panel Labels
// =============================================================================

/**
 * Labels for SplitPanelPage
 */
export interface SplitPanelLabels {
  /** Back button text */
  back?: string;
}

/**
 * Default split panel labels (English)
 */
export const DEFAULT_SPLIT_PANEL_LABELS: Required<SplitPanelLabels> = {
  back: 'Back',
};

/**
 * Resolve split panel labels with defaults
 */
export const resolveSplitPanelLabels = createLabelResolver(DEFAULT_SPLIT_PANEL_LABELS);

// =============================================================================
// Skeleton Labels (ARIA Accessibility)
// =============================================================================

/**
 * Labels for skeleton loading states (ARIA accessibility)
 */
export interface SkeletonLabels {
  /** Loading list content */
  loadingList?: string;
  /** Loading tabbed list */
  loadingTabbedList?: string;
  /** Loading detail page */
  loadingDetail?: string;
  /** Loading configuration */
  loadingConfig?: string;
  /** Loading calendar */
  loadingCalendar?: string;
  /** Loading flow */
  loadingLinearFlow?: string;
  /** Loading panel list */
  loadingPanelList?: string;
  /** Loading panel content */
  loadingPanelContent?: string;
  /** Loading extraction */
  loadingExtraction?: string;
  /** Loading dashboard */
  loadingDashboard?: string;
}

/**
 * Default skeleton labels (English)
 */
export const DEFAULT_SKELETON_LABELS: Required<SkeletonLabels> = {
  loadingList: 'Loading list content',
  loadingTabbedList: 'Loading tabbed list',
  loadingDetail: 'Loading detail page',
  loadingConfig: 'Loading configuration',
  loadingCalendar: 'Loading calendar',
  loadingLinearFlow: 'Loading flow',
  loadingPanelList: 'Loading panel list',
  loadingPanelContent: 'Loading panel content',
  loadingExtraction: 'Loading extraction',
  loadingDashboard: 'Loading dashboard content',
};

/**
 * Resolve skeleton labels with defaults
 */
export const resolveSkeletonLabels = createLabelResolver(DEFAULT_SKELETON_LABELS);
