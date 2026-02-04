/**
 * PageToolbar Constants
 *
 * @package @pageshell/layouts
 */

import { LayoutGrid, List, Table2, type LucideIcon } from 'lucide-react';
import type { PageToolbarVariant, PageToolbarViewMode } from './types';

// =============================================================================
// Style Constants
// =============================================================================

export const variantStyles: Record<PageToolbarVariant, string> = {
  default: 'py-3 px-4',
  compact: 'py-2 px-3',
};

// =============================================================================
// View Mode Constants
// =============================================================================

export const viewModeIcons: Record<PageToolbarViewMode, LucideIcon> = {
  grid: LayoutGrid,
  list: List,
  table: Table2,
};

export const viewModeLabels: Record<PageToolbarViewMode, string> = {
  grid: 'Grade',
  list: 'Lista',
  table: 'Tabela',
};
