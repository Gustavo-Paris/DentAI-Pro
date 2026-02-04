'use client';

/**
 * Action Button Hooks
 *
 * Hooks for working with PageActionButton, including localized preset generation.
 *
 * @module action-button/hooks
 */

import { useMemo } from 'react';
import type { ActionButtonStates, ActionButtonPreset } from './types';
import { ACTION_BUTTON_PRESETS } from './types';

/**
 * Translation function type
 * Compatible with next-intl and other i18n libraries
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunction = (key: string, params?: any) => string;

/**
 * Loose translation function type for wider compatibility
 * Accepts any function that takes a string key and returns a string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslationFn = (key: string, params?: any) => string;

/**
 * Localized preset keys for each preset type
 */
export interface PresetTranslationKeys {
  follow: {
    idle: string;
    active: string;
    hover: string;
  };
  like: {
    idle: string;
    active: string;
    hover: string;
  };
  star: {
    idle: string;
    active: string;
    hover: string;
  };
  bookmark: {
    idle: string;
    active: string;
    hover: string;
  };
  subscribe: {
    idle: string;
    active: string;
    hover: string;
  };
}

/**
 * Default translation keys (can be overridden)
 */
export const DEFAULT_PRESET_KEYS: PresetTranslationKeys = {
  follow: {
    idle: 'follow',
    active: 'following',
    hover: 'unfollow',
  },
  like: {
    idle: 'like',
    active: 'liked',
    hover: 'unlike',
  },
  star: {
    idle: 'star',
    active: 'starred',
    hover: 'unstar',
  },
  bookmark: {
    idle: 'bookmark',
    active: 'saved',
    hover: 'remove',
  },
  subscribe: {
    idle: 'subscribe',
    active: 'subscribed',
    hover: 'unsubscribe',
  },
};

/**
 * Creates localized action button states from a preset
 *
 * @param preset - The preset name
 * @param t - Translation function
 * @param keys - Optional custom translation keys
 * @returns Localized ActionButtonStates
 *
 * @example
 * ```tsx
 * function FollowButton({ userId }) {
 *   const t = useTranslations('social.followButton');
 *   const states = createLocalizedPreset('follow', t);
 *
 *   return (
 *     <PageActionButton
 *       isActive={isFollowing}
 *       states={states}
 *       onToggle={handleToggle}
 *     />
 *   );
 * }
 * ```
 */
export function createLocalizedPreset(
  preset: ActionButtonPreset,
  t: TranslationFn,
  keys?: Partial<PresetTranslationKeys[typeof preset]>
): ActionButtonStates {
  const basePreset = ACTION_BUTTON_PRESETS[preset];
  const defaultKeys = DEFAULT_PRESET_KEYS[preset];
  const mergedKeys = {
    idle: keys?.idle ?? defaultKeys.idle,
    active: keys?.active ?? defaultKeys.active,
    hover: keys?.hover ?? defaultKeys.hover,
  };

  return {
    idle: {
      ...basePreset.idle,
      label: t(mergedKeys.idle),
    },
    active: {
      ...basePreset.active,
      label: t(mergedKeys.active),
    },
    hover: basePreset.hover
      ? {
          ...basePreset.hover,
          label: t(mergedKeys.hover),
        }
      : undefined,
  };
}

/**
 * Hook for creating localized action button states
 *
 * Memoizes the result to prevent unnecessary re-renders.
 *
 * @param preset - The preset name
 * @param t - Translation function
 * @param keys - Optional custom translation keys
 * @returns Memoized ActionButtonStates
 *
 * @example
 * ```tsx
 * function LikeButton({ postId }) {
 *   const t = useTranslations('post.actions');
 *   const states = useActionButtonPreset('like', t);
 *
 *   return (
 *     <PageActionButton
 *       isActive={isLiked}
 *       states={states}
 *       onToggle={handleLike}
 *     />
 *   );
 * }
 * ```
 */
export function useActionButtonPreset(
  preset: ActionButtonPreset,
  t: TranslationFn,
  keys?: Partial<PresetTranslationKeys[typeof preset]>
): ActionButtonStates {
  return useMemo(
    () => createLocalizedPreset(preset, t, keys),
    [preset, t, keys]
  );
}

/**
 * Hook for creating custom action button states with translation
 *
 * @param config - Custom state configuration with translation keys
 * @param t - Translation function
 * @returns Memoized ActionButtonStates
 *
 * @example
 * ```tsx
 * function WaitlistButton({ eventId }) {
 *   const t = useTranslations('event.waitlist');
 *   const states = useCustomActionButtonStates({
 *     idle: { labelKey: 'join', icon: 'plus', variant: 'outline' },
 *     active: { labelKey: 'onWaitlist', icon: 'check', variant: 'default' },
 *     hover: { labelKey: 'leave', icon: 'minus', variant: 'destructive' },
 *   }, t);
 *
 *   return (
 *     <PageActionButton
 *       isActive={isOnWaitlist}
 *       states={states}
 *       onToggle={handleWaitlist}
 *     />
 *   );
 * }
 * ```
 */
export function useCustomActionButtonStates(
  config: {
    idle: { labelKey: string; icon?: string; variant: ActionButtonStates['idle']['variant'] };
    active: { labelKey: string; icon?: string; variant: ActionButtonStates['active']['variant'] };
    hover?: { labelKey: string; icon?: string; variant: ActionButtonStates['idle']['variant'] };
  },
  t: TranslationFn
): ActionButtonStates {
  return useMemo(
    () => ({
      idle: {
        label: t(config.idle.labelKey),
        icon: config.idle.icon,
        variant: config.idle.variant,
      },
      active: {
        label: t(config.active.labelKey),
        icon: config.active.icon,
        variant: config.active.variant,
      },
      hover: config.hover
        ? {
            label: t(config.hover.labelKey),
            icon: config.hover.icon,
            variant: config.hover.variant,
          }
        : undefined,
    }),
    [config, t]
  );
}
