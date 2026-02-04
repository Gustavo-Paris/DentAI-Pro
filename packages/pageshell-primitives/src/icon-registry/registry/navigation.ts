/**
 * Navigation Icons Registry
 *
 * @module icons/registry/navigation
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Home,
  Menu,
  LayoutDashboard,
} from 'lucide-react';

export const navigationIcons = {
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-up-right': ArrowUpRight,
  home: Home,
  menu: Menu,
  'layout-dashboard': LayoutDashboard,
  dashboard: LayoutDashboard,
} as const;
