/**
 * Dashboard subdomain
 *
 * Clinic overview, daily agenda, KPIs, and quick actions.
 *
 * @example
 * ```tsx
 * import { PageClinicKPICards, PageDailyAgendaWidget } from '@parisgroup-ai/domain-odonto-ai/dashboard';
 * ```
 */

// Types
export type {
  KPICardData,
  AgendaWidgetItem,
  ActivityFeedItem,
  QuickAction,
  RevenueChartData,
  OccupancyData,
  ClinicAlert,
} from './types';

// Components
export { PageClinicKPICards } from './PageClinicKPICards';
export type { PageClinicKPICardsProps } from './PageClinicKPICards';

export { PageDailyAgendaWidget } from './PageDailyAgendaWidget';
export type { PageDailyAgendaWidgetProps } from './PageDailyAgendaWidget';

export { PageClinicActivityFeed } from './PageClinicActivityFeed';
export type { PageClinicActivityFeedProps } from './PageClinicActivityFeed';

export { PageQuickActionsPanel } from './PageQuickActionsPanel';
export type { PageQuickActionsPanelProps } from './PageQuickActionsPanel';

export { PageRevenueChart } from './PageRevenueChart';
export type { PageRevenueChartProps, ChartPeriod } from './PageRevenueChart';

export { PageOccupancyGauge } from './PageOccupancyGauge';
export type { PageOccupancyGaugeProps } from './PageOccupancyGauge';

export { PageClinicAlerts } from './PageClinicAlerts';
export type { PageClinicAlertsProps } from './PageClinicAlerts';
