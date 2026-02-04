/**
 * PageHeader Module
 *
 * @package @pageshell/layouts
 */

// Main component
export { PageHeader } from './PageHeaderComponent';

// Sub-components
export {
  PageHeaderAction,
  PageHeaderActions,
  type PageHeaderActionProps,
  type PageHeaderActionsProps,
} from './PageHeaderAction';

// Types
export type {
  PageHeaderProps,
  PageHeaderSize,
  PageHeaderAlign,
  PageBadge,
  PageBreadcrumb,
  PageHeaderMeta,
  HeaderActionConfig,
  HeaderActionProp,
  HeaderActionsProp,
  ActionProp,
  MutationLike,
} from './types';

// Constants (internal, but exported for extension)
export { sizeConfig } from './constants';

// Sub-component exports for advanced use cases
export {
  HeaderSkeleton,
  MetaRow,
  renderBadges,
  renderAction,
  isHeaderActionConfig,
  SingleActionButton,
} from './components';
