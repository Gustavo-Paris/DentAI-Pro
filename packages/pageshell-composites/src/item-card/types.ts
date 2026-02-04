/**
 * ItemCard Types
 *
 * Type definitions for the ItemCard composite component.
 *
 * @module item-card/types
 */

import type { ReactNode } from 'react';
import type { StatusVariant } from '@pageshell/primitives';

// =============================================================================
// Action Types
// =============================================================================

/**
 * Action button configuration
 */
export interface ItemCardAction {
  /** Action label */
  label: string;
  /** Icon name */
  icon?: string;
  /** Click handler (alternative to href) */
  onClick?: () => void;
  /** Navigation href (alternative to onClick) */
  href?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (shows spinner) */
  loading?: boolean;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
}

/**
 * Dropdown menu action
 */
export interface ItemCardMenuAction {
  /** Action label */
  label: string;
  /** Icon name */
  icon?: string;
  /** Click handler */
  onClick: () => void;
  /** Destructive action (red text) */
  destructive?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

// =============================================================================
// Stat Types
// =============================================================================

/**
 * Stat item for stats row
 */
export interface ItemCardStat {
  /** Icon name */
  icon?: string;
  /** Stat label/value */
  label: string | number;
  /** Optional tooltip */
  tooltip?: string;
}

// =============================================================================
// Status Badge Types
// =============================================================================

/**
 * Status badge configuration
 */
export interface ItemCardStatus {
  /** Display label */
  label: string;
  /** Status variant */
  variant: StatusVariant;
  /** Animated (spinning icon) */
  animate?: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * ItemCard component props
 */
export interface ItemCardProps {
  // === Identity ===
  /** Card title */
  title: string;
  /** Card description/subtitle */
  description?: string;

  // === Visual ===
  /** Icon name for header */
  icon?: string;
  /** Icon background color */
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted';
  /** Status badge */
  status?: ItemCardStatus;
  /** Avatar image URL (alternative to icon) */
  avatar?: string;

  // === Content ===
  /** Stats row items */
  stats?: ItemCardStat[];
  /** Timestamp display */
  timestamp?: string | Date;
  /** Timestamp icon (default: clock) */
  timestampIcon?: string;
  /** Custom content below description */
  children?: ReactNode;

  // === Actions ===
  /** Primary action in footer */
  primaryAction?: ItemCardAction;
  /** Secondary action in footer */
  secondaryAction?: ItemCardAction;
  /** Dropdown menu actions */
  menuActions?: ItemCardMenuAction[];

  // === Link Mode ===
  /** Navigation href (makes card clickable) */
  href?: string;
  /** Custom Link component (for Next.js) */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;

  // === Variants ===
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Card variant */
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (shows skeleton) */
  loading?: boolean;

  // === Styling ===
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Sub-component Props
// =============================================================================

export interface ItemCardHeaderProps {
  icon?: string;
  iconColor?: ItemCardProps['iconColor'];
  avatar?: string;
  status?: ItemCardStatus;
  menuActions?: ItemCardMenuAction[];
  children?: ReactNode;
  className?: string;
}

export interface ItemCardTitleProps {
  children: ReactNode;
  className?: string;
  truncate?: boolean | number;
}

export interface ItemCardDescriptionProps {
  children: ReactNode;
  className?: string;
  truncate?: boolean | number;
}

export interface ItemCardStatsProps {
  stats: ItemCardStat[];
  className?: string;
}

export interface ItemCardFooterProps {
  timestamp?: string | Date;
  timestampIcon?: string;
  primaryAction?: ItemCardAction;
  secondaryAction?: ItemCardAction;
  children?: ReactNode;
  className?: string;
  LinkComponent?: ItemCardProps['LinkComponent'];
}

export interface ItemCardActionsProps {
  menuActions: ItemCardMenuAction[];
  className?: string;
}
