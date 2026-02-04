import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          
          <p className="font-medium text-foreground mb-2">{message}</p>
          
          {showProgress && (
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
            </div>
          )}
          
          {steps && steps.length > 0 && (
            <div className="space-y-2 text-left mt-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {step.completed ? (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <span className={step.completed ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
