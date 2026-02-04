/**
 * PageCompletionRing - Circular progress indicator for completion percentage
 *
 * A declarative primitive for showing completion progress with animated ring.
 * Uses portal-profile-completion CSS classes for consistent styling.
 *
 * @example Basic usage with percentage
 * ```tsx
 * <PageCompletionRing percentage={75} />
 * ```
 *
 * @example With value/max (alternative to percentage)
 * ```tsx
 * <PageCompletionRing
 *   value={3}
 *   max={10}
 *   label="Completo"
 *   showLabel
 * />
 * ```
 *
 * @example With custom size and raw value display
 * ```tsx
 * <PageCompletionRing
 *   value={15}
 *   max={20}
 *   customSize={140}
 *   displayValue="raw"
 *   label="Conquistas"
 *   showLabel
 *   variant="accent"
 * />
 * ```
 *
 * @example With size preset
 * ```tsx
 * <PageCompletionRing
 *   percentage={50}
 *   size="xl"
 *   variant="accent"
 *   showLabel
 *   label="Completo"
 * />
 * ```
 */

export type PageCompletionRingSize = 'sm' | 'md' | 'lg' | 'xl';
export type PageCompletionRingVariant = 'primary' | 'accent' | 'success';
export type PageCompletionRingDisplayValue = 'percentage' | 'raw';

export interface PageCompletionRingProps {
  /** Percentage value (0-100). Use this OR value/max, not both. */
  percentage?: number;
  /** Current value. Use with max as alternative to percentage. */
  value?: number;
  /** Maximum value. Use with value as alternative to percentage. */
  max?: number;
  /** Size of the ring (preset) */
  size?: PageCompletionRingSize;
  /** Custom size in pixels (overrides size preset) */
  customSize?: number;
  /** Custom stroke width in pixels (default calculated from size) */
  strokeWidth?: number;
  /** Color variant */
  variant?: PageCompletionRingVariant;
  /** What to display as the main value */
  displayValue?: PageCompletionRingDisplayValue;
  /** Show value label inside ring */
  showValue?: boolean;
  /** Show optional label below value */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Animation delay for staggered reveals (in animation delay units) */
  animationDelay?: number;
}

const SIZE_CONFIG: Record<PageCompletionRingSize, { width: number; radius: number; strokeWidth: number; fontSize: string }> = {
  sm: { width: 48, radius: 18, strokeWidth: 3, fontSize: '0.75rem' },
  md: { width: 72, radius: 28, strokeWidth: 4, fontSize: '1rem' },
  lg: { width: 96, radius: 38, strokeWidth: 5, fontSize: '1.25rem' },
  xl: { width: 140, radius: 54, strokeWidth: 16, fontSize: '1.5rem' },
};

const VARIANT_CLASSES: Record<PageCompletionRingVariant, string> = {
  primary: '',
  accent: 'portal-radial-progress-accent',
  success: 'portal-radial-progress-success',
};

export function PageCompletionRing({
  percentage,
  value,
  max,
  size = 'md',
  customSize,
  strokeWidth: customStrokeWidth,
  variant = 'primary',
  displayValue = 'percentage',
  showValue = true,
  showLabel = false,
  label,
  animationDelay,
}: PageCompletionRingProps) {
  // Calculate percentage from value/max if provided, otherwise use percentage prop
  const computedPercentage = value !== undefined && max !== undefined && max > 0
    ? Math.round((value / max) * 100)
    : percentage ?? 0;

  // Get size config, with customSize override
  const baseConfig = SIZE_CONFIG[size];
  const width = customSize ?? baseConfig.width;
  const currentStrokeWidth = customStrokeWidth ?? baseConfig.strokeWidth;
  const radius = (width - currentStrokeWidth) / 2;
  const fontSize = customSize ? `${Math.max(width / 5.5, 14)}px` : baseConfig.fontSize;

  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, computedPercentage)) / 100) * circumference;
  const center = width / 2;

  // Determine display text
  const displayText = displayValue === 'raw' && value !== undefined
    ? String(value)
    : `${computedPercentage}%`;

  const animationClass = animationDelay
    ? `portal-animate-in portal-animate-in-delay-${animationDelay}`
    : '';

  return (
    <div
      className={`portal-profile-completion ${VARIANT_CLASSES[variant]} ${animationClass}`.trim()}
      role="progressbar"
      aria-valuenow={computedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${computedPercentage}% completo`}
    >
      <svg
        width={width}
        height={width}
        viewBox={`0 0 ${width} ${width}`}
      >
        <circle
          className="portal-profile-completion-bg"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={currentStrokeWidth}
        />
        <circle
          className="portal-profile-completion-fill"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={currentStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {(showValue || showLabel) && (
        <div className="portal-profile-completion-content">
          {showValue && (
            <span
              className="portal-profile-completion-value"
              style={{ fontSize }}
            >
              {displayText}
            </span>
          )}
          {showLabel && label && (
            <span className="portal-radial-progress-label">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
