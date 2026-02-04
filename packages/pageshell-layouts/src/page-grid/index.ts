/**
 * PageGrid Module
 *
 * @package @pageshell/layouts
 */

// Main component
export { PageGrid } from './PageGridComponent';

// Types
export type {
  PageGridColumns,
  PageGridGap,
  PageGridAnimation,
  PageGridResponsive,
  PageGridActionConfig,
  PageGridActionProp,
  PageGridEmptyState,
  PageGridProps,
} from './types';

// Constants (for advanced customization)
export {
  columnClasses,
  responsiveColumnClasses,
  gapClasses,
  colSpanClasses,
  animationClasses,
  defaultResponsive,
} from './constants';

// Utilities (for advanced customization)
export { isActionConfig, buildColumnClasses } from './utils';
