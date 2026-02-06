import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';

interface LoadingStep {
  label: string;
  completed: boolean;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  steps?: LoadingStep[];
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingOverlay({
  isLoading,
  steps,
  message = 'Processando...',
  showProgress = false,
  progress = 0
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 grain-overlay">
      <Card className="w-full max-w-sm card-elevated">
        <CardContent className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>

          <p className="font-semibold text-foreground mb-1 text-gradient-gold">{message}</p>

          {showProgress && (
            <div className="mb-4">
              <div className="progress-gold h-2 rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
            </div>
          )}

          {steps && steps.length > 0 && (
            <div className="timeline-line pl-1 space-y-3 text-left mt-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm relative">
                  {step.completed ? (
                    <div className="relative z-10 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary animate-scale-in" />
                    </div>
                  ) : (
                    <div className="relative z-10 w-6 h-6 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                  <span className={step.completed ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4 animate-pulse">
            Não feche esta página
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
