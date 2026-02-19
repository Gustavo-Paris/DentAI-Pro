import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface EvaluationToothInfo {
  tooth: string;
  treatmentType: string;
  treatmentLabel: string;
  treatmentIcon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'planned';
  aiIndication?: string;
}

export interface EvaluationToothCardProps {
  evaluation: EvaluationToothInfo;
  onSelect?: (tooth: string) => void;
  className?: string;
  completedLabel?: string;
  plannedLabel?: string;
}

export function EvaluationToothCard({
  evaluation,
  onSelect,
  className,
  completedLabel = 'Completed',
  plannedLabel = 'Planned',
}: EvaluationToothCardProps) {
  const { tooth, treatmentLabel, treatmentIcon: TreatmentIcon, status, aiIndication } = evaluation;
  const isCompleted = status === 'completed';

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(
        'rounded-xl border border-border bg-card shadow-sm',
        onSelect && 'cursor-pointer transition-colors hover:bg-accent/5',
        className,
      )}
      onClick={onSelect ? () => onSelect(tooth) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(tooth);
              }
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded-md border border-border px-2 py-0.5 text-sm font-mono text-foreground">
            {tooth}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <TreatmentIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{treatmentLabel}</span>
            </div>
            {aiIndication && (
              <p className="text-xs text-muted-foreground mt-1">{aiIndication}</p>
            )}
          </div>
        </div>
        <Badge variant={isCompleted ? 'default' : 'outline'}>
          {isCompleted ? completedLabel : plannedLabel}
        </Badge>
      </div>
    </div>
  );
}
