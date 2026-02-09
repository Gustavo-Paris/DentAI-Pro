import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingProgress } from '@/hooks/domain/useOnboardingProgress';

export function OnboardingProgress() {
  const { steps, completionPercentage, allComplete, loading } = useOnboardingProgress();

  if (loading || allComplete) return null;

  const completedCount = steps.filter(s => s.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Primeiros passos
        </p>
        <span className="text-xs text-muted-foreground">
          {completedCount} de {steps.length} completos
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {steps.map((step) => {
          const isNext = !step.completed && steps.findIndex(s => !s.completed) === steps.indexOf(step);
          return (
            <Link
              key={step.id}
              to={step.href}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                step.completed
                  ? 'border-primary/20 bg-primary/5'
                  : isNext
                    ? 'border-primary/40 bg-background shadow-sm hover:border-primary/60'
                    : 'border-border bg-background hover:border-muted-foreground/30'
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  step.completed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step.completed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  steps.indexOf(step) + 1
                )}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  step.completed && 'text-muted-foreground line-through'
                )}>
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
