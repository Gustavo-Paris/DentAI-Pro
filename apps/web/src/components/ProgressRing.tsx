interface ProgressRingProps {
  progress: number;         // 0-100
  size?: number;            // default 128
  strokeWidth?: number;     // default 8
  showPercentage?: boolean; // default true
  className?: string;
}

export function ProgressRing({
  progress,
  size = 128,
  strokeWidth = 8,
  showPercentage = true,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={`-rotate-90 ${className ?? ''}`}
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.4s ease-out' }}
      />
      {/* Percentage text */}
      {showPercentage && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground tabular-nums font-semibold"
          fontSize={size * 0.18}
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {Math.round(progress)}%
        </text>
      )}
    </svg>
  );
}
