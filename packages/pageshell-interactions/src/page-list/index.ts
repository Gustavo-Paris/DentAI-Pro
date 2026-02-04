/**
 * PageList Module
 *
 * @package @pageshell/interactions
 */

// Main component
export { PageList } from './PageList';
export { PageListItem } from './PageListItem';
export { PageListSkeleton } from './PageListSkeleton';

// Types
export type {
  PageIconVariant,
  ActionProp,
  ActionConfig,
  PageListVariant,
  PageListIconColor,
  PageListBadge,
  PageListItemAction,
  PageListAvatar,
  PageListEmptyState,
  PageListProps,
  PageListItemProps,
  PageListSkeletonProps,
} from './types';

// Context (for advanced usage)
export { ListItemContext, useListItemContext, type PageListItemContext } from './context';

// Constants (for advanced customization)
export { ANIMATION_DELAY_CLASSES, variantStyles, iconColorClasses } from './constants';
