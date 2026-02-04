/**
 * Icon Registry - Combined
 *
 * Merges all category-specific icon registries into a single registry.
 *
 * @module icons/registry
 */

import { actionIcons } from './actions';
import { navigationIcons } from './navigation';
import { statusIcons } from './status';
import { contentIcons } from './content';
import { userIcons } from './users';
import { dataIcons } from './data';
import { financeIcons } from './finance';
import { timeIcons } from './time';
import { mediaIcons } from './media';
import { miscIcons } from './misc';
import { communicationIcons } from './communication';

/**
 * Registry of available icons mapped by name.
 * Combines all category-specific registries.
 */
export const iconRegistry = {
  ...actionIcons,
  ...navigationIcons,
  ...statusIcons,
  ...contentIcons,
  ...userIcons,
  ...dataIcons,
  ...financeIcons,
  ...timeIcons,
  ...mediaIcons,
  ...miscIcons,
  ...communicationIcons,
} as const;

// Re-export category registries for selective imports
export {
  actionIcons,
  navigationIcons,
  statusIcons,
  contentIcons,
  userIcons,
  dataIcons,
  financeIcons,
  timeIcons,
  mediaIcons,
  miscIcons,
  communicationIcons,
};
