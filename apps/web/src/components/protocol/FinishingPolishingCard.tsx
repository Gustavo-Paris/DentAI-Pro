import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface PolishingStep {
  order: number;
  tool: string;
  grit?: string;
  speed: string;
  time: string;
  tip: string;
}

export interface FinishingProtocol {
  contouring: PolishingStep[];
  polishing: PolishingStep[];
  final_glaze?: string;
  maintenance_advice: string;
}

interface FinishingPolishingCardProps {
  protocol: FinishingProtocol;
}

export function FinishingPolishingCard({ protocol }: FinishingPolishingCardProps) {
  const { t } = useTranslation();
  if (!protocol) return null;

  const renderStep = (step: PolishingStep) => (
    <div
      key={step.order}
      className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg"
    >
      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium shrink-0">
        {step.order}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{step.tool}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {step.grit && (
            <Badge variant="outline" className="text-xs">
              {step.grit}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            ⏱ {step.time}
          </span>
          <span className="text-xs text-muted-foreground">
            🔄 {step.speed}
          </span>
        </div>
        {step.tip && (
          <p className="text-xs text-muted-foreground mt-1.5 italic">
            💡 {step.tip}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {t('components.protocol.finishingPolishing.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contouring */}
        {protocol.contouring && protocol.contouring.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t('components.protocol.finishingPolishing.contouring')}
            </h4>
            <div className="space-y-2">
              {protocol.contouring.map(renderStep)}
            </div>
          </div>
        )}

        {/* Polishing */}
        {protocol.polishing && protocol.polishing.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t('components.protocol.finishingPolishing.sequentialPolishing')}
            </h4>
            <div className="space-y-2">
              {protocol.polishing.map(renderStep)}
            </div>
          </div>
        )}

        {/* Final Glaze */}
        {protocol.final_glaze && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{t('components.protocol.finishingPolishing.finalGlaze')}</span>
              {protocol.final_glaze}
            </p>
          </div>
        )}

        {/* Maintenance Advice */}
        {protocol.maintenance_advice && (
          <div className="pt-3 border-t border-primary/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t('components.protocol.finishingPolishing.maintenance')}</span>
              {protocol.maintenance_advice}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FinishingPolishingCard;
