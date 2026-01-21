import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { getTypeColorClasses } from './ResinTypeLegend';

interface ResinBadgeProps {
  shade: string;
  type: string;
  selected?: boolean;
  onClick?: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function ResinBadge({
  shade,
  type,
  selected = false,
  onClick,
  disabled = false,
  size = 'md',
}: ResinBadgeProps) {
  const colorClasses = getTypeColorClasses(type);
  const isClickable = !!onClick && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium transition-all',
        colorClasses,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm',
        isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
        selected && 'ring-2 ring-primary ring-offset-1',
        disabled && 'opacity-50 cursor-not-allowed',
        !isClickable && 'cursor-default'
      )}
    >
      {selected && <Check className="h-3 w-3" />}
      {shade}
    </button>
  );
}
