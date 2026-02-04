export { DashboardPage } from './DashboardPage';
export { dashboardPageDefaults } from './defaults';
export type {
  DashboardPageProps,
  DashboardPageSlots,
  DashboardTab,
  ModuleConfig,
  QuickActionConfig,
  BreakdownCardConfig,
  BreakdownCardItem,
  // New types
  HeroConfig,
  HeroInlineStat,
  WeeklyChartConfig,
  WeeklyChartBarConfig,
  GoalConfig,
  GoalsConfig,
  MultiQueryConfig,
} from './types';

// Export sub-components for advanced use
export {
  DashboardHero,
  DashboardChart,
  DashboardGoals,
  DashboardStats,
  DashboardModuleCard,
  DashboardQuickActions,
  DashboardPageSkeleton,
} from './components';
