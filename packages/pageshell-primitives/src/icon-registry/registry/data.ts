/**
 * Data & Charts Icons Registry
 *
 * @module icons/registry/data
 */

import {
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';

export const dataIcons = {
  'bar-chart': BarChart,
  'line-chart': LineChart,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  activity: Activity,
  'sliders-horizontal': SlidersHorizontal,
  sliders: SlidersHorizontal,
} as const;
