/**
 * Card Skeleton Presets
 *
 * Pre-configured skeleton configurations for common card types.
 *
 * @module skeleton-factory/presets
 */

import type { CardSkeletonConfig, CardSkeletonPreset } from './types';

/**
 * Preset configurations for common card types
 */
export const CARD_SKELETON_PRESETS: Record<CardSkeletonPreset, CardSkeletonConfig> = {
  /**
   * Brainstorm card skeleton
   * Compact variant with icon, title, badges, and metadata
   */
  brainstorm: {
    variant: 'compact',
    header: {
      icon: true,
      iconSize: 'md',
      lines: 2,
      lineWidths: ['60%', '80%'],
      badge: true,
    },
    content: {
      lines: 3,
      widths: ['30%', '40%', '50%'],
      gap: 'tight',
    },
    footer: {
      showAction: true,
      actionWidth: '7rem',
    },
    responsive: true,
  },

  /**
   * Course card skeleton
   * Editorial variant with image, rating, title, creator, and price
   */
  course: {
    variant: 'editorial',
    image: {
      aspectRatio: '4/3',
      showBadge: true,
    },
    header: {
      icon: false,
      lines: 2,
      lineWidths: ['100%', '75%'],
    },
    content: {
      lines: 1,
      widths: ['50%'],
    },
    footer: {
      showStats: true,
      statCount: 1,
    },
    responsive: true,
  },

  /**
   * Mentor card skeleton
   * Avatar variant with image, name, expertise, stats
   */
  mentor: {
    variant: 'avatar',
    image: {
      aspectRatio: '1/1',
    },
    header: {
      lines: 2,
      lineWidths: ['75%', '100%'],
    },
    content: {
      lines: 2,
      widths: ['40%', '50%'],
      gap: 'tight',
    },
    footer: {
      showStats: true,
      statCount: 2,
    },
    responsive: true,
  },

  /**
   * Service card skeleton
   * Compact variant for mentorship services
   */
  service: {
    variant: 'compact',
    header: {
      icon: true,
      iconSize: 'sm',
      lines: 2,
      lineWidths: ['70%', '100%'],
      badge: true,
    },
    content: {
      lines: 2,
      widths: ['40%', '60%'],
      gap: 'normal',
    },
    footer: {
      showAction: true,
      actionWidth: '5rem',
      showStats: true,
      statCount: 1,
    },
    responsive: true,
  },

  /**
   * Package card skeleton
   * Compact variant for mentorship packages
   */
  package: {
    variant: 'compact',
    header: {
      icon: true,
      iconSize: 'md',
      lines: 2,
      lineWidths: ['60%', '80%'],
      badge: true,
    },
    content: {
      lines: 4,
      widths: ['30%', '50%', '40%', '60%'],
      gap: 'tight',
    },
    footer: {
      showAction: true,
      actionWidth: '6rem',
    },
    responsive: true,
  },
};

/**
 * Gets a preset configuration by name
 */
export function getCardSkeletonPreset(preset: CardSkeletonPreset): CardSkeletonConfig {
  return CARD_SKELETON_PRESETS[preset];
}
