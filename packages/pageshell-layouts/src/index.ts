/**
 * @pageshell/layouts
 *
 * Layout components for PageShell applications.
 * Includes sidebar, header, user menu, and complete shell composites.
 *
 * @packageDocumentation
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // Navigation
  NavItem,
  NavSection,
  // User
  UserProfile,
  UserMenuItem,
  // Brand
  BrandConfig,
  // Quick Switch
  QuickSwitchConfig,
  // Render Props
  LinkRenderProps,
  AvatarRenderProps,
  RenderLink,
  RenderAvatar,
  IsActiveHook,
  // Theme
  LayoutTheme,
  // Context
  LayoutContextValue,
  LayoutBaseProps,
} from './types';

// =============================================================================
// Primitives
// =============================================================================

export {
  // Context & Hooks
  LayoutProvider,
  useLayout,
  useLayoutAdapters,
  useIsActive,
  type LayoutProviderProps,
  type LayoutAdaptersValue,
  // Sidebar
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  type SidebarProps,
  type SidebarHeaderProps,
  type SidebarContentProps,
  type SidebarFooterProps,
  // SidebarNav
  SidebarNav,
  SidebarNavSection,
  SidebarNavItem,
  type SidebarNavProps,
  type SidebarNavSectionProps,
  type SidebarNavItemProps,
  // SidebarBrand
  SidebarBrand,
  type SidebarBrandProps,
  // UserMenu
  UserMenu,
  type UserMenuProps,
  // ThemeSelector
  ThemeSelector,
  type ThemeSelectorProps,
  type ThemeMode,
  // Header
  Header,
  DesktopHeader,
  type HeaderProps,
  type DesktopHeaderProps,
  // QuickSwitch
  QuickSwitch,
  type QuickSwitchProps,
} from './primitives';

// =============================================================================
// Composites
// =============================================================================

export {
  // AppShell
  AppShell,
  type AppShellProps,
  type SidebarFeaturesConfig,
  // Themed Shells
  AdminShell,
  CreatorShell,
  StudentShell,
} from './composites';

// =============================================================================
// Page Section & Heading
// =============================================================================

export {
  PageSection,
  PageHeading,
  type PageSectionProps,
  type PageSectionBadge,
  type ContentGap,
  type IconColor,
  type PageHeadingProps,
  type HeadingSize,
  type MarginBottom,
  type BadgeVariant,
} from './page-section';

// =============================================================================
// Page Stats
// =============================================================================

export {
  PageStats,
  type PageStatsProps,
  type PageStatsVariant,
  type StatItem,
  type StatTrend,
  type TrendDirection,
  type StatsBarItemVariant,
  type LiveStatVariant,
  type GridStatVariant,
  type StatsLabel,
  type StatsTimestamp,
} from './page-stats';

// =============================================================================
// Skeletons
// =============================================================================

export {
  // Skeleton Components
  DashboardSkeleton,
  LinearFlowSkeleton,
  PageListSkeleton,
  ListSkeleton,
  CardGridSkeleton,
  PageLeaderboardSkeleton,
  WizardSkeleton,
  // Skeleton Presets
  SkeletonPreset,
  getSkeletonPreset,
  // Types
  type DashboardSkeletonProps,
  type LinearFlowSkeletonProps,
  type PageListSkeletonProps,
  type CardGridSkeletonProps,
  type PageLeaderboardSkeletonProps,
  type SkeletonConfig,
  type DashboardSkeletonConfig,
  type ListSkeletonConfig,
  type CardGridSkeletonConfig,
  type DetailSkeletonConfig,
  type FormSkeletonConfig,
  type LinearFlowSkeletonConfig,
  type LeaderboardSkeletonConfig,
  type SkeletonBaseProps,
  type SkeletonAnimationConfig,
  type SkeletonVariant,
  defaultAnimationConfig,
} from './skeletons';

// =============================================================================
// Page Hero (ADR-0033: Domain Primitive Consolidation)
// =============================================================================

export {
  PageHero,
  type PageHeroProps,
  type PageHeroBaseProps,
  type PageHeroProgressVariantProps,
  type PageHeroBalanceVariantProps,
  type PageHeroWelcomeVariantProps,
  type PageHeroTiersVariantProps,
  type PageHeroInlineStat,
  type PageHeroAction,
  type HeroStatVariant,
  type TierCounts,
  type IconProp,
  isProgressVariant,
  isBalanceVariant,
  isWelcomeVariant,
  isTiersVariant,
} from './page-hero';

// =============================================================================
// Page Breadcrumbs
// =============================================================================

export {
  PageBreadcrumbs,
  type PageBreadcrumbsProps,
  // Note: PageBreadcrumb type is exported from page-header
} from './page-breadcrumbs';

// =============================================================================
// Page Collapsible & Accordion
// =============================================================================

export {
  PageCollapsible,
  PageAccordion,
  type PageCollapsibleProps,
  type PageAccordionProps,
  type PageAccordionItemProps,
} from './page-collapsible';

// =============================================================================
// Page Header
// =============================================================================

export {
  PageHeader,
  PageHeaderAction,
  PageHeaderActions,
  type PageHeaderProps,
  type PageHeaderSize,
  type PageHeaderAlign,
  type PageBadge,
  type PageBreadcrumb,
  type PageHeaderMeta,
  type HeaderActionConfig,
  type ActionProp,
} from './page-header';

// =============================================================================
// Page Quick Actions
// =============================================================================

export {
  PageQuickActions,
  type PageQuickActionsProps,
  type QuickAction,
  type QuickActionBadge,
  type LinkComponentType,
} from './page-quick-actions';

// =============================================================================
// Page Split
// =============================================================================

export {
  PageSplit,
  type PageSplitProps,
  type PageSplitDirection,
} from './page-split';

// =============================================================================
// Page Steps
// =============================================================================

export {
  PageSteps,
  type PageStepsProps,
  type PageStepsColor,
  type PageStep,
} from './page-steps';

// =============================================================================
// Page Tabs
// =============================================================================

export {
  PageTabs,
  PageTab,
  type PageTabsProps,
  type PageTabProps,
  type PageTabsVariant,
  type PageTabsOrientation,
  type PageTabsSize,
} from './page-tabs';

// =============================================================================
// Page Timeline
// =============================================================================

export {
  PageTimeline,
  type PageTimelineProps,
  type PageTimelineItemProps,
  type PageTimelineVariant,
  type PageTimelineGroupBy,
  type PageTimelineIconColor,
  type PageTimelineAvatar,
  type PageTimelineEmptyState,
  type TimelineActionConfig,
  type TimelineActionProp,
} from './page-timeline';

// =============================================================================
// Page Toolbar
// =============================================================================

export {
  PageToolbar,
  type PageToolbarProps,
  type PageToolbarAction,
  type PageToolbarBulkAction,
  type PageToolbarSearch,
  type PageToolbarViewMode,
  type PageToolbarVariant,
  type PageToolbarSectionProps,
} from './page-toolbar';

// =============================================================================
// Page Grid
// =============================================================================

export {
  PageGrid,
  type PageGridProps,
  type PageGridColumns,
  type PageGridGap,
  type PageGridAnimation,
  type PageGridResponsive,
  type PageGridEmptyState,
  type PageGridActionConfig,
  type PageGridActionProp,
} from './page-grid';

// =============================================================================
// Page Back Link
// =============================================================================

export {
  PageBackLink,
  type PageBackLinkProps,
} from './page-back-link';

// =============================================================================
// Portal Layouts (TopBar, Sidebar)
// =============================================================================

export {
  // Portal TopBar
  PortalTopBar,
  type PortalTopBarProps,
  // Portal Sidebar
  PortalSidebar,
  usePortalSidebarConfig,
  type PortalSidebarProps,
  type SidebarIconProp,
  type PortalSidebarBrand,
  type PortalQuickSwitch,
  type PortalNavItem,
  type PortalNavSection,
  type PortalUserMenuLink,
  type PortalSidebarUser,
  type PortalSidebarConfig,
  type UsePortalSidebarConfigOptions,
  type PortalSidebarNavigationProps,
} from './portal';
