/**
 * PageTimeline Module
 *
 * @package @pageshell/layouts
 */

// Main component
export { PageTimeline } from './PageTimelineComponent';

// Types
export type {
  PageTimelineVariant,
  PageTimelineGroupBy,
  PageTimelineIconColor,
  PageTimelineAvatar,
  TimelineActionConfig,
  TimelineActionProp,
  PageTimelineEmptyState,
  PageTimelineProps,
  PageTimelineItemProps,
} from './types';

// Constants (for advanced customization)
export { variantStyles, iconColorClasses } from './constants';

// Utilities (for advanced customization)
export { formatGroupDate, getGroupKey, renderAction } from './utils';
