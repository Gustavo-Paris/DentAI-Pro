import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { PhotoAnalysisResult } from '../ReviewAnalysisStep';

interface AnalysisWarningsProps {
  analysisResult: PhotoAnalysisResult;
}

export function AnalysisWarnings({ analysisResult }: AnalysisWarningsProps) {
  const { t } = useTranslation();
  const warnings = analysisResult.warnings;
  const actualCount = analysisResult.detected_teeth.length;

  if (!warnings || warnings.length === 0) return null;

  const correctedWarnings = warnings.map(w =>
    w.replace(/Detectados?\s+\d+\s+dentes?/i, `Detectados ${actualCount} dentes`)
  );

  return (
    <Card className="border-warning/50 bg-warning/10 dark:bg-warning/10">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <h4 className="font-medium text-warning-foreground dark:text-warning">{t('components.wizard.review.attentionPoints')}</h4>
            <ul className="mt-2 space-y-1">
              {correctedWarnings.map((warning, i) => (
                <li key={i} className="text-sm text-warning">• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
