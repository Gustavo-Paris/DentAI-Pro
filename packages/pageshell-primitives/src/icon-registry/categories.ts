/**
 * Icon Categories
 *
 * Categories for documentation and icon pickers.
 *
 * @module icons/categories
 */

import type { IconName } from './types';

/**
 * Get icons by category for documentation/pickers.
 */
export const iconCategories = {
  navigation: [
    'home',
    'arrow-left',
    'arrow-right',
    'chevron-left',
    'chevron-right',
    'menu',
    'close',
    'external-link',
  ] as IconName[],
  actions: [
    'plus',
    'edit',
    'delete',
    'copy',
    'check',
    'save',
    'download',
    'upload',
    'share',
    'refresh',
  ] as IconName[],
  communication: ['message', 'mail', 'bell', 'send'] as IconName[],
  user: ['user', 'users', 'lock', 'eye'] as IconName[],
  content: [
    'file',
    'document',
    'folder',
    'image',
    'book',
    'bookmark',
    'tag',
    'link',
    'package',
  ] as IconName[],
  data: [
    'bar-chart',
    'trending-up',
    'trending-down',
    'activity',
    'database',
    'target',
  ] as IconName[],
  status: [
    'success',
    'error',
    'warning',
    'info',
    'help',
    'clock',
    'loading',
    'sparkles',
  ] as IconName[],
  commerce: [
    'credit-card',
    'dollar',
    'cart',
    'gift',
    'wallet',
    'award',
    'trophy',
    'crown',
  ] as IconName[],
  layout: ['dashboard', 'grid', 'list', 'layers'] as IconName[],
  forms: ['search', 'filter', 'settings'] as IconName[],
  editor: ['code', 'list'] as IconName[],
  datetime: ['calendar', 'clock', 'timer'] as IconName[],
  ai: ['bot', 'sparkles', 'lightbulb', 'zap', 'rocket'] as IconName[],
  social: ['heart', 'star', 'thumbs-up', 'flame', 'globe'] as IconName[],
} as const;

/**
 * Category names for iteration
 */
export type IconCategory = keyof typeof iconCategories;

/**
 * Get all category names
 */
export function getIconCategories(): IconCategory[] {
  return Object.keys(iconCategories) as IconCategory[];
}

/**
 * Get icons for a specific category
 */
export function getIconsInCategory(category: IconCategory): IconName[] {
  return iconCategories[category];
}
