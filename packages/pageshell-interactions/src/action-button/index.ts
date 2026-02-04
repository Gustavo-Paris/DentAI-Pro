/**
 * PageActionButton Module
 *
 * Stateful toggle button for Follow, Like, Star, Bookmark actions.
 *
 * @module action-button
 */

export { PageActionButton } from './PageActionButton';
export {
  ACTION_BUTTON_PRESETS,
  type PageActionButtonProps,
  type ActionButtonStates,
  type ActionButtonStateConfig,
  type ActionButtonVariant,
  type ActionButtonPreset,
} from './types';

// Hooks for localized presets
export {
  createLocalizedPreset,
  useActionButtonPreset,
  useCustomActionButtonStates,
  DEFAULT_PRESET_KEYS,
  type TFunction,
  type TranslationFn,
  type PresetTranslationKeys,
} from './hooks';
