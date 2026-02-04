/**
 * PageList Component
 *
 * @deprecated Import from './page-list' instead. This file will be removed in a future version.
 * @package @pageshell/interactions
 */

// Re-export everything from the modular structure
export {
  PageList,
  PageListItem,
  PageListSkeleton,
  type PageListProps,
  type PageListItemProps,
  type PageListSkeletonProps,
  type PageListVariant,
  type PageListIconColor,
  type PageListBadge,
  type PageListItemAction,
  type PageListAvatar,
  type PageListEmptyState,
  type PageIconVariant,
  type ActionProp,
  type ActionConfig,
} from './page-list';

// Backward compatibility alias
export type { PageListItemProps as PageListItemComponentProps } from './page-list';
