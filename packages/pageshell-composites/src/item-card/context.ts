/**
 * ItemCard Context
 *
 * Provides shared state for compound components.
 *
 * @module item-card/context
 */

import { createContext, useContext } from 'react';
import type { ItemCardProps } from './types';

// =============================================================================
// Context Type
// =============================================================================

export interface ItemCardContextValue {
  size: ItemCardProps['size'];
  orientation: ItemCardProps['orientation'];
  disabled: boolean;
  LinkComponent?: ItemCardProps['LinkComponent'];
}

// =============================================================================
// Context
// =============================================================================

export const ItemCardContext = createContext<ItemCardContextValue>({
  size: 'md',
  orientation: 'vertical',
  disabled: false,
});

export const useItemCardContext = () => useContext(ItemCardContext);
