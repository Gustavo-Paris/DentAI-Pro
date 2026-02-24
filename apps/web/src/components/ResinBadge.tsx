import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { getTypeColorClasses } from './ResinTypeLegend';
import { getVitaShadeColor, isGradient } from '@/lib/vitaShadeColors';

interface ResinBadgeProps {
  shade: string;
  type: string;
  selected?: boolean;
  onClick?: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  showColorSwatch?: boolean;
}

function ResinBadgeInner({
  shade,
  type,
  selected = false,
  onClick,
  disabled = false,
  size = 'md',
  showColorSwatch = true,
}: ResinBadgeProps) {
  const colorClasses = getTypeColorClasses(type);
  const isClickable = !!onClick && !disabled;
  
  // Get visual color for the shade
  const shadeColor = getVitaShadeColor(shade);
  const isGradientColor = isGradient(shadeColor);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium transition-all',
        colorClasses,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm',
        isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
        selected && 'ring-2 ring-primary ring-offset-1',
        disabled && 'opacity-50 cursor-not-allowed',
        !isClickable && 'cursor-default'
      )}
    >
      {selected && <Check className="h-3 w-3" />}
      {showColorSwatch && (
        <span
          className={cn(
            'inline-block rounded-full border border-border/50 shadow-sm',
            size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
          )}
          style={{
            background: shadeColor,
            ...(isGradientColor ? {} : { backgroundColor: shadeColor }),
          }}
          title={`Cor aproximada: ${shade}`}
        />
      )}
      <span>{shade}</span>
      <span className="text-[10px] opacity-80">({type})</span>
    </button>
  );
}

export const ResinBadge = memo(ResinBadgeInner);
