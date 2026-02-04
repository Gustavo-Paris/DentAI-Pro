/**
 * Status Config Factory
 *
 * Creates type-safe status configurations for components that need
 * to map status values to visual properties (icons, colors, labels).
 *
 * @module utils/status-config
 */

/**
 * Variant types for status visual styling
 */
export type StatusConfigVariant =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'default'
  | 'muted'
  | 'info';

/**
 * Individual status configuration item
 */
export interface StatusConfigItem<T extends string = string> {
  /** Status key/identifier */
  key: T;
  /** Display label (resolved from labelKey) */
  label: string;
  /** Optional icon name (string for flexibility) */
  icon?: string;
  /** Visual variant for styling */
  variant: StatusConfigVariant;
  /** Optional specific color class */
  color?: string;
  /** Optional background color class */
  bgColor?: string;
  /** Optional text color class */
  textColor?: string;
}

/**
 * Input configuration for creating a status config item
 */
export interface StatusConfigInput {
  /** i18n key for the label */
  labelKey: string;
  /** Optional icon name */
  icon?: string;
  /** Visual variant for styling */
  variant: StatusConfigVariant;
  /** Optional specific color class */
  color?: string;
  /** Optional background color class */
  bgColor?: string;
  /** Optional text color class */
  textColor?: string;
}

/**
 * Result type from createStatusConfig
 */
export interface StatusConfigResult<T extends string> {
  /** Record of all status configurations */
  config: Record<T, StatusConfigItem<T>>;
  /** Get a specific status configuration */
  get: (status: T) => StatusConfigItem<T>;
  /** Resolve a status with translation function */
  resolve: (status: T, t: (key: string) => string) => StatusConfigItem<T>;
  /** Get all status keys */
  keys: T[];
}

/**
 * Creates a type-safe status configuration object
 *
 * @param input - Record of status keys to their configuration
 * @returns StatusConfigResult with helper methods
 *
 * @example
 * ```ts
 * const STATUS_CONFIG = createStatusConfig({
 *   online: { labelKey: 'status.online', icon: 'check-circle', variant: 'success' },
 *   offline: { labelKey: 'status.offline', icon: 'x-circle', variant: 'destructive' },
 *   checking: { labelKey: 'status.checking', icon: 'loader', variant: 'muted' },
 * });
 *
 * // In component:
 * const t = useTranslations('service');
 * const config = STATUS_CONFIG.resolve('online', t);
 * // { key: 'online', label: 'Online', icon: 'check-circle', variant: 'success' }
 * ```
 */
export function createStatusConfig<T extends string>(
  input: Record<T, StatusConfigInput>
): StatusConfigResult<T> {
  const keys = Object.keys(input) as T[];

  // Create resolved config with placeholder labels
  const config = {} as Record<T, StatusConfigItem<T>>;
  for (const key of keys) {
    const item = input[key];
    config[key] = {
      key,
      label: item.labelKey, // Will be resolved by translate
      icon: item.icon,
      variant: item.variant,
      color: item.color,
      bgColor: item.bgColor,
      textColor: item.textColor,
    };
  }

  return {
    config,
    keys,
    get: (status: T) => config[status],
    resolve: (status: T, t: (key: string) => string) => {
      const item = input[status];
      return {
        key: status,
        label: t(item.labelKey),
        icon: item.icon,
        variant: item.variant,
        color: item.color,
        bgColor: item.bgColor,
        textColor: item.textColor,
      };
    },
  };
}

/**
 * Default color classes for each variant
 */
export const STATUS_VARIANT_COLORS: Record<
  StatusConfigVariant,
  { text: string; bg: string; border: string }
> = {
  success: {
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  destructive: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
  },
  info: {
    text: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  default: {
    text: 'text-foreground',
    bg: 'bg-card',
    border: 'border-border',
  },
  muted: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
  },
};

/**
 * Gets color classes for a status variant
 *
 * @param variant - The status variant
 * @returns Object with text, bg, and border classes
 */
export function getStatusVariantColors(variant: StatusConfigVariant): {
  text: string;
  bg: string;
  border: string;
} {
  return STATUS_VARIANT_COLORS[variant];
}
