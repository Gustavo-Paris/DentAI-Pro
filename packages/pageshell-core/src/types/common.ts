import type { ReactNode, ComponentType } from 'react';

/**
 * Theme variants for PageShell components
 */
export type PageShellTheme = 'admin' | 'creator' | 'student';

/**
 * Router adapter interface for framework-agnostic navigation
 */
export interface RouterAdapter {
  push: (url: string) => void;
  back: () => void;
  replace: (url: string) => void;
}

/**
 * Link component type for framework-agnostic links
 */
export interface LinkComponentProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export type LinkComponent = ComponentType<LinkComponentProps>;

/**
 * Query state for list-based composites
 */
export interface QueryState {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

/**
 * Pagination info returned from queries
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  variant?: 'search' | 'filter' | 'data' | 'error';
  title?: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

/**
 * Button action variants
 */
export type ActionVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';

/**
 * Button action sizes
 */
export type ActionSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * Simple button action configuration (for headers, toolbars, etc.)
 * Use this for actions that don't depend on row context.
 *
 * @example
 * const action: ButtonActionConfig = {
 *   label: 'Create',
 *   icon: 'Plus',
 *   variant: 'primary',
 *   onClick: () => openModal(),
 * };
 */
export interface ButtonActionConfig {
  /** Button label */
  label: string;
  /** Icon name or component */
  icon?: string;
  /** Button variant */
  variant?: ActionVariant;
  /** Button size */
  size?: ActionSize;
  /** Navigation URL */
  href?: string;
  /** Click handler */
  onClick?: () => void | Promise<void>;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * Generic action configuration.
 * Alias for ButtonActionConfig for backward compatibility.
 *
 * @see ButtonActionConfig - The canonical type definition
 */
export type ActionConfig = ButtonActionConfig;

// Note: RowActionConfig<T> is defined in utils/inference.ts and re-exported from types/index.ts

/**
 * Column configuration for tables
 */
export interface ColumnConfig<T = unknown> {
  key: string;
  label: string;
  format?: 'text' | 'date' | 'datetime' | 'currency' | 'number' | 'boolean' | 'status' | 'custom';
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => ReactNode;
}

/**
 * Sort state for tables
 */
export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'search' | 'date' | 'dateRange' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: unknown;
}

/**
 * Form field configuration
 */
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file' | 'custom';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: unknown; // Zod schema
  render?: (props: FieldRenderProps) => ReactNode;
}

/**
 * Props passed to custom field renderers
 */
export interface FieldRenderProps {
  field: {
    name: string;
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
  };
  fieldState: {
    error?: { message?: string };
    invalid: boolean;
    isDirty: boolean;
    isTouched: boolean;
  };
}

/**
 * Toast notification types
 */
export interface ToastConfig {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Modal state
 */
export interface ModalState<T = unknown> {
  isOpen: boolean;
  data?: T;
}
