/**
 * PageToolbar Type Definitions
 *
 * @package @pageshell/layouts
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Basic Types
// =============================================================================

/** View mode options */
export type PageToolbarViewMode = 'grid' | 'list' | 'table';

/** Toolbar visual variants */
export type PageToolbarVariant = 'default' | 'compact';

// =============================================================================
// Action Types
// =============================================================================

/** Toolbar action */
export interface PageToolbarAction {
  /** Action icon */
  icon: IconProp;
  /** Action label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive';
  /** Disable action */
  disabled?: boolean;
  /** Show label on desktop */
  showLabel?: boolean;
}

/** Bulk action */
export interface PageToolbarBulkAction {
  /** Action icon */
  icon: IconProp;
  /** Action label */
  label: string;
  /** Action handler (receives selected count for confirmation) */
  onAction: () => void | Promise<void>;
  /** Button variant */
  variant?: 'default' | 'destructive';
  /** Disable action */
  disabled?: boolean;
}

// =============================================================================
// Search Types
// =============================================================================

/** Search configuration */
export interface PageToolbarSearch {
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Submit handler (on Enter) */
  onSubmit?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * PageToolbar component props
 */
export interface PageToolbarProps {
  // Content slots
  /** Left content slot */
  leftContent?: ReactNode;
  /** Center content slot */
  centerContent?: ReactNode;
  /** Right content slot */
  rightContent?: ReactNode;

  // Actions
  /** Toolbar actions */
  actions?: PageToolbarAction[];

  // Search
  /** Search configuration */
  search?: PageToolbarSearch;

  // View mode
  /** Current view mode */
  viewMode?: PageToolbarViewMode;
  /** View mode change handler */
  onViewModeChange?: (mode: PageToolbarViewMode) => void;
  /** Available view mode options */
  viewModeOptions?: PageToolbarViewMode[];

  // Bulk mode
  /** Enable bulk selection mode */
  bulkMode?: boolean;
  /** Number of selected items */
  selectedCount?: number;
  /** Bulk actions */
  bulkActions?: PageToolbarBulkAction[];
  /** Cancel bulk selection */
  onBulkCancel?: () => void;
  /** Select all handler */
  onSelectAll?: () => void;
  /** Total items (for "select all" display) */
  totalItems?: number;

  // Layout
  /** Sticky positioning */
  sticky?: boolean;
  /** Visual variant */
  variant?: PageToolbarVariant;
  /** Background blur effect */
  blur?: boolean;

  // Accessibility
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageToolbar.Section component props
 */
export interface PageToolbarSectionProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}
