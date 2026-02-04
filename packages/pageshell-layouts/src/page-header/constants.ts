/**
 * PageHeader Constants
 *
 * @package @pageshell/layouts
 */

import type { PageHeaderSize } from './types';

// =============================================================================
// Size Configurations
// =============================================================================

export const sizeConfig: Record<
  PageHeaderSize,
  {
    titleClass: string;
    descriptionClass: string;
    iconSize: string;
    spacing: string;
    metaSize: string;
  }
> = {
  sm: {
    titleClass: 'text-lg sm:text-xl',
    descriptionClass: 'text-xs sm:text-sm',
    iconSize: 'h-5 w-5',
    spacing: 'gap-2',
    metaSize: 'text-xs',
  },
  md: {
    titleClass: 'text-xl sm:text-2xl',
    descriptionClass: 'text-sm sm:text-base',
    iconSize: 'h-6 w-6',
    spacing: 'gap-3',
    metaSize: 'text-sm',
  },
  lg: {
    titleClass: 'text-2xl sm:text-3xl lg:text-4xl',
    descriptionClass: 'text-base sm:text-lg',
    iconSize: 'h-8 w-8',
    spacing: 'gap-4',
    metaSize: 'text-sm',
  },
};
