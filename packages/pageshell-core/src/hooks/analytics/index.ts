/**
 * Analytics Logic Module
 *
 * @module hooks/analytics
 */

// Main hook
export { useAnalyticsLogic } from './useAnalyticsLogicCore';

// Types
export type {
  AnalyticsIconComponent,
  AnalyticsDateRangeConfig,
  AnalyticsDateRangeResult,
  AnalyticsKPIConfig,
  AnalyticsKPIComputed,
  AnalyticsTrend,
  UseAnalyticsLogicOptions,
  UseAnalyticsLogicReturn,
} from './types';

// Utilities (for extension)
export { formatAnalyticsValue, calculateAnalyticsTrend } from './utils';
