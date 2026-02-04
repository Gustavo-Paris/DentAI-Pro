/**
 * PageTabs Constants
 *
 * @package @pageshell/layouts
 */

import type { PageTabsSize } from './types';

// =============================================================================
// Size Configuration
// =============================================================================

export const sizeConfig: Record<
  PageTabsSize,
  { padding: string; fontSize: string; iconSize: string }
> = {
  sm: { padding: 'px-3 py-1.5', fontSize: 'text-xs', iconSize: 'w-3.5 h-3.5' },
  md: { padding: 'px-4 py-2', fontSize: 'text-sm', iconSize: 'w-4 h-4' },
  lg: { padding: 'px-5 py-2.5', fontSize: 'text-base', iconSize: 'w-5 h-5' },
};

// =============================================================================
// Content Animation
// =============================================================================

export const contentAnimationClasses = 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200';
