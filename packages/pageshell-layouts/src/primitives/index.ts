/**
 * Layout Primitives
 *
 * Building blocks for creating custom layouts.
 *
 * @module primitives
 */

// Context & Hooks
export {
  LayoutProvider,
  useLayout,
  useSidebarState,
  useLayoutTheme,
  useLayoutAdapters,
  useIsActive,
  type LayoutProviderProps,
  type LayoutAdaptersValue,
} from './LayoutContext';

// Portal Theme Styles (ADR-0043)
export {
  useSidebarPortalStyles,
  type SidebarPortalStyles,
} from './useSidebarPortalStyles';

// Sidebar
export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  type SidebarProps,
  type SidebarHeaderProps,
  type SidebarContentProps,
  type SidebarFooterProps,
} from './Sidebar';

// SidebarNav
export {
  SidebarNav,
  SidebarNavSection,
  SidebarNavItem,
  type SidebarNavProps,
  type SidebarNavSectionProps,
  type SidebarNavItemProps,
} from './SidebarNav';

// SidebarBrand
export { SidebarBrand, type SidebarBrandProps } from './SidebarBrand';

// UserMenu
export { UserMenu, type UserMenuProps } from './UserMenu';

// ThemeSelector
export {
  ThemeSelector,
  type ThemeSelectorProps,
  type ThemeMode,
} from './ThemeSelector';

// Header
export {
  Header,
  DesktopHeader,
  type HeaderProps,
  type DesktopHeaderProps,
} from './Header';

// QuickSwitch
export { QuickSwitch, type QuickSwitchProps } from './QuickSwitch';

// SidebarSkeleton
export {
  SidebarSkeleton,
  SidebarNavItemSkeleton,
  type SidebarSkeletonProps,
  type SidebarNavItemSkeletonProps,
} from './SidebarSkeleton';

// CollapsibleSidebar
export {
  CollapsibleSidebar,
  CollapsibleSidebarHeader,
  CollapsibleSidebarContent,
  CollapsibleSidebarFooter,
  CollapsibleNavItem,
  useCollapsibleSidebar,
  useCollapsibleSidebarOptional,
  type CollapsibleSidebarProps,
  type CollapsibleContextValue,
  type CollapsibleSidebarHeaderProps,
  type CollapsibleSidebarContentProps,
  type CollapsibleSidebarFooterProps,
  type CollapsibleNavItemProps,
} from './CollapsibleSidebar';

// SidebarRecent
export {
  SidebarRecent,
  useTrackRecent,
  type SidebarRecentProps,
  type UseTrackRecentOptions,
} from './SidebarRecent';

// SidebarSearch
export {
  SidebarSearch,
  type SidebarSearchProps,
} from './SidebarSearch';

// SidebarFavorites
export {
  SidebarFavorites,
  PinButton,
  type SidebarFavoritesProps,
  type PinButtonProps,
} from './SidebarFavorites';
