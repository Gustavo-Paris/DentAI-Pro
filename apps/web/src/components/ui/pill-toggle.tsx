import { cn } from '@/lib/utils';

interface PillToggleProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}

export function PillToggle({
  options,
  value,
  onChange,
  columns = 3,
}: PillToggleProps) {
  return (
    <div className={cn('grid gap-2', columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')} role="radiogroup">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 btn-press border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card border-border hover:border-primary/50 text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
