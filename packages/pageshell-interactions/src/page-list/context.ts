/**
 * PageList Context
 *
 * Provides item context for PageList.Item components.
 *
 * @package @pageshell/interactions
 */

import { createContext, useContext } from 'react';
import type { PageListVariant } from './types';

// =============================================================================
// Context Types
// =============================================================================

export interface PageListItemContext {
  variant: PageListVariant;
  isSelected: boolean;
  isSelectable: boolean;
  isClickable: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

// =============================================================================
// Context
// =============================================================================

export const ListItemContext = createContext<PageListItemContext | null>(null);

export function useListItemContext() {
  return useContext(ListItemContext);
}
