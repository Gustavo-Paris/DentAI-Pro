/**
 * PageActionButton Types
 *
 * Type definitions for the PageActionButton component.
 * Used for stateful toggle buttons like Follow, Like, Star, Bookmark.
 *
 * @module action-button/types
 */

import type { ButtonHTMLAttributes } from 'react';

/**
 * Button variant type
 */
export type ActionButtonVariant =
  | 'default'
  | 'outline'
  | 'ghost'
  | 'secondary'
  | 'destructive';

/**
 * State configuration for each button state
 */
export interface ActionButtonStateConfig {
  /** Button label text */
  label: string;
  /** Icon name */
  icon?: string;
  /** Button variant */
  variant: ActionButtonVariant;
}

/**
 * Complete state configuration for all button states
 */
export interface ActionButtonStates {
  /** State when action is not active (e.g., "Follow") */
  idle: ActionButtonStateConfig;
  /** State when action is active (e.g., "Following") */
  active: ActionButtonStateConfig;
  /** State when hovering on active state (e.g., "Unfollow") */
  hover?: ActionButtonStateConfig;
}

/**
 * PageActionButton component props
 */
export interface PageActionButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onClick'
  > {
  /** Whether the action is currently active */
  isActive: boolean;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** State configurations */
  states: ActionButtonStates;
  /** Toggle handler (sync or async) */
  onToggle: () => void | Promise<void>;
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Preset State Configurations
// =============================================================================

/**
 * Preset states for common action patterns
 */
export const ACTION_BUTTON_PRESETS = {
  follow: {
    idle: { label: 'Follow', icon: 'user-plus', variant: 'outline' as const },
    active: { label: 'Following', icon: 'user-check', variant: 'default' as const },
    hover: { label: 'Unfollow', icon: 'user-minus', variant: 'destructive' as const },
  },
  like: {
    idle: { label: 'Like', icon: 'heart', variant: 'ghost' as const },
    active: { label: 'Liked', icon: 'heart', variant: 'default' as const },
    hover: { label: 'Unlike', icon: 'heart-off', variant: 'ghost' as const },
  },
  star: {
    idle: { label: 'Star', icon: 'star', variant: 'ghost' as const },
    active: { label: 'Starred', icon: 'star', variant: 'default' as const },
    hover: { label: 'Unstar', icon: 'star-off', variant: 'ghost' as const },
  },
  bookmark: {
    idle: { label: 'Bookmark', icon: 'bookmark', variant: 'ghost' as const },
    active: { label: 'Saved', icon: 'bookmark', variant: 'default' as const },
    hover: { label: 'Remove', icon: 'bookmark-minus', variant: 'ghost' as const },
  },
  subscribe: {
    idle: { label: 'Subscribe', icon: 'bell', variant: 'outline' as const },
    active: { label: 'Subscribed', icon: 'bell', variant: 'default' as const },
    hover: { label: 'Unsubscribe', icon: 'bell-off', variant: 'destructive' as const },
  },
} as const;

export type ActionButtonPreset = keyof typeof ACTION_BUTTON_PRESETS;
