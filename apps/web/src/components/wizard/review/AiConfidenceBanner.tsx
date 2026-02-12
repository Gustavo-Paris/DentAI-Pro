import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, RefreshCw, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import type { PhotoAnalysisResult } from '../ReviewAnalysisStep';

interface AiConfidenceBannerProps {
  analysisResult: PhotoAnalysisResult;
  onReanalyze?: () => void;
  isReanalyzing: boolean;
}

export function AiConfidenceBanner({
  analysisResult,
  onReanalyze,
  isReanalyzing,
}: AiConfidenceBannerProps) {
  const { t } = useTranslation();
  const confidence = analysisResult.confidence ?? 0;
  const confidenceColor = confidence >= 80 ? 'text-success' : confidence >= 60 ? 'text-warning' : 'text-destructive';
  const detectedTeeth = analysisResult.detected_teeth || [];
  const hasMultipleTeeth = detectedTeeth.length > 1;

  return (
    <Card className={`card-elevated ai-glow border-l-4 ${confidence >= 80 ? 'border-l-success' : confidence >= 60 ? 'border-l-warning' : 'border-l-destructive'}`}>
      <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary ai-dot" />
          <span className="text-sm font-medium ai-text">{t('components.wizard.review.aiAnalysis')}</span>
        </div>
        <div className="flex items-center gap-3">
          {hasMultipleTeeth && (
            <Badge variant="outline" className="text-xs">
              {t('components.wizard.review.teethDetected', { count: detectedTeeth.length })}
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className={cn('gap-1.5 cursor-help', confidenceColor)}>
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    confidence >= 80 ? 'bg-success' : confidence >= 60 ? 'bg-warning' : 'bg-destructive',
                  )} />
                  {confidence}% — {confidence >= 80 ? t('components.wizard.review.highConfidence') : confidence >= 60 ? t('components.wizard.review.mediumConfidence') : t('components.wizard.review.lowConfidence')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{t('components.wizard.review.confidenceTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {onReanalyze && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                trackEvent('analysis_reanalyzed');
                onReanalyze!();
              }}
              disabled={isReanalyzing}
              className="h-7 px-2 btn-press"
              aria-label={t('components.wizard.review.reanalyze')}
            >
              {isReanalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">{t('components.wizard.review.reanalyze')}</span>
              <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-0.5">
                <Zap className="w-2.5 h-2.5" />1
              </span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
