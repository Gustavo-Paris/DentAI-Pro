import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Smile, Loader2, RefreshCw, Lightbulb, AlertCircle, Zap, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { ProportionsCard } from '@/components/dsd/ProportionsCard';
import type {
  DSDAnalysis,
  DSDResult,
  DSDSuggestion,
  SimulationLayer,
  SimulationLayerType,
  ToothBoundsPct,
  PatientPreferences,
} from '@/types/dsd';
import { DSDSimulationViewer } from './DSDSimulationViewer';
import { DSDWhiteningComparison } from './DSDWhiteningComparison';
import { memo } from 'react';
import type { RefObject } from 'react';

interface DSDAnalysisViewProps {
  result: DSDResult;
  imageBase64: string | null;
  simulationImageUrl: string | null;
  isSimulationGenerating: boolean;
  simulationError: boolean;
  layers: SimulationLayer[];
  layerUrls: Record<string, string>;
  activeLayerIndex: number;
  layersGenerating: boolean;
  layerGenerationProgress: number;
  failedLayers: SimulationLayerType[];
  retryingLayer: SimulationLayerType | null;
  isRegeneratingSimulation: boolean;
  isCompositing: boolean;
  showAnnotations: boolean;
  toothBounds: ToothBoundsPct[];
  annotationContainerRef: RefObject<HTMLDivElement | null>;
  annotationDimensions: { width: number; height: number };
  showWhiteningComparison: boolean;
  whiteningComparison: Record<string, string>;
  isComparingWhitening: boolean;
  patientPreferences?: PatientPreferences;
  determineLayersNeeded: (analysis: DSDAnalysis) => SimulationLayerType[];
  onSelectLayer: (idx: number, layerType: string) => void;
  onRetryFailedLayer: (layerType: SimulationLayerType) => void;
  onRegenerateSimulation: () => void;
  onToggleAnnotations: () => void;
  onGenerateWhiteningComparison: () => void;
  onCloseWhiteningComparison: () => void;
  onSelectWhiteningLevel: (level: 'natural' | 'white' | 'hollywood', url: string) => void;
  onGenerateAllLayers: () => void;
  onRetry: () => void;
  onContinue: () => void;
  gingivoplastyApproved: boolean | null;
  hasGingivoSuggestion: boolean;
  onApproveGingivoplasty: () => void;
  onDiscardGingivoplasty: () => void;
}

export const DSDAnalysisView = memo(function DSDAnalysisView({
  result,
  imageBase64,
  simulationImageUrl,
  isSimulationGenerating,
  simulationError,
  layers,
  activeLayerIndex,
  failedLayers,
  retryingLayer,
  isRegeneratingSimulation,
  isCompositing,
  layersGenerating,
  layerGenerationProgress,
  showAnnotations,
  toothBounds,
  annotationContainerRef,
  annotationDimensions,
  showWhiteningComparison,
  whiteningComparison,
  isComparingWhitening,
  patientPreferences,
  determineLayersNeeded,
  onSelectLayer,
  onRetryFailedLayer,
  onRegenerateSimulation,
  onToggleAnnotations,
  onGenerateWhiteningComparison,
  onCloseWhiteningComparison,
  onSelectWhiteningLevel,
  onGenerateAllLayers,
  onRetry,
  onContinue,
  gingivoplastyApproved,
  hasGingivoSuggestion,
  onApproveGingivoplasty,
  onDiscardGingivoplasty,
}: DSDAnalysisViewProps) {
  const { t } = useTranslation();
  const { analysis } = result;

  // Check for attention observations
  const attentionObservations = analysis.observations?.filter(obs =>
    obs.toUpperCase().includes('ATENÇÃO') || obs.toUpperCase().includes('ATENCAO')
  ) || [];

  // Only consider clinical limitation notes, not informational background processing messages
  const hasClinicalLimitationNote = result.simulation_note &&
    !result.simulation_note.includes('segundo plano') &&
    !result.simulation_note.includes('background');

  const hasLimitations = analysis.confidence === 'baixa' || attentionObservations.length > 0 || hasClinicalLimitationNote;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Smile className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold font-display mb-2 text-primary">{t('components.wizard.dsd.analysisView.title')}</h2>
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant={analysis.confidence === 'alta' ? 'default' : analysis.confidence === 'média' ? 'secondary' : 'outline'}
            className={
              analysis.confidence === 'alta'
                ? 'bg-primary text-primary-foreground'
                : analysis.confidence === 'baixa'
                  ? 'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30'
                  : ''
            }
          >
            {t('components.wizard.dsd.analysisView.confidence', { level: analysis.confidence })}
          </Badge>
        </div>
      </div>

      {/* Alert for low confidence or limitations */}
      {hasLimitations && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">{t('components.wizard.dsd.analysisView.limitationsTitle')}</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {result.simulation_note ||
              t('components.wizard.dsd.analysisView.limitationsDefault')}
          </AlertDescription>
        </Alert>
      )}

      {/* Attention observations from AI */}
      {attentionObservations.length > 0 && (
        <Card className="border-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4" />
              {t('components.wizard.dsd.analysisView.attentionPoints')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {attentionObservations.map((obs, index) => (
                <li key={index} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                  {obs.replace(/^ATENÇÃO:\s*/i, '')}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Overbite suspicion alert with gengivoplasty approval flow */}
      {analysis.overbite_suspicion === 'sim' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('components.wizard.dsd.analysisView.overbiteSuspicion')}</AlertTitle>
          <AlertDescription>
            {t('components.wizard.dsd.analysisView.overbiteDesc')}
          </AlertDescription>
        </Alert>
      )}

      {/* Gengivoplasty approval — shown when AI detected gingival suggestions and user hasn't decided */}
      {hasGingivoSuggestion && gingivoplastyApproved === null && (
        <Card className="border-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t('components.wizard.dsd.analysisView.gingivoplastyDetected', { defaultValue: 'Gengivoplastia detectada na análise' })}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {t('components.wizard.dsd.analysisView.gingivoplastyDesc', { defaultValue: 'A análise identificou necessidade de harmonização gengival. Deseja incluir a simulação de gengivoplastia?' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-8">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onApproveGingivoplasty}
                  className="gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  {t('components.wizard.dsd.analysisView.approveGingivoplasty', { defaultValue: 'Prosseguir com gengivoplastia' })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDiscardGingivoplasty}
                  className="gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  {t('components.wizard.dsd.analysisView.discardGingivoplasty', { defaultValue: 'Descartar gengivoplastia' })}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gengivoplasty approved confirmation — show generating state or done */}
      {hasGingivoSuggestion && gingivoplastyApproved === true && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
          retryingLayer === 'complete-treatment'
            ? 'text-primary bg-primary/5 border border-primary/30'
            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
        }`}>
          {retryingLayer === 'complete-treatment' ? (
            <>
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              <span>{t('components.wizard.dsd.analysisView.gingivoplastyGenerating', { defaultValue: 'Gerando simulação com gengivoplastia...' })}</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{t('components.wizard.dsd.analysisView.gingivoplastyApproved', { defaultValue: 'Gengivoplastia incluída na simulação' })}</span>
            </>
          )}
        </div>
      )}

      {/* Gengivoplasty discarded confirmation */}
      {hasGingivoSuggestion && gingivoplastyApproved === false && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{t('components.wizard.dsd.analysisView.gingivoplastyDiscarded', { defaultValue: 'Gengivoplastia descartada' })}</span>
        </div>
      )}

      {/* Background simulation generating card */}
      {isSimulationGenerating && !simulationImageUrl && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{t('components.wizard.dsd.analysisView.generatingLayers')}</h4>
                <p className="text-sm text-muted-foreground">
                  {layerGenerationProgress > 0
                    ? t('components.wizard.dsd.analysisView.layersProgress', { current: layerGenerationProgress, total: determineLayersNeeded(analysis).length })
                    : t('components.wizard.dsd.analysisView.reviewWhileProcessing')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Background simulation error card */}
      {simulationError && !simulationImageUrl && !isSimulationGenerating && (
        <Card className="border-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {t('components.wizard.dsd.analysisView.simulationAutoError')}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateAllLayers}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {t('components.wizard.dsd.analysisView.tryAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Slider with Layer Tabs — when simulation is ready */}
      {imageBase64 && (simulationImageUrl || layers.length > 0) && (
        <div className="space-y-3">
          <DSDSimulationViewer
            imageBase64={imageBase64}
            simulationImageUrl={simulationImageUrl}
            layers={layers}
            activeLayerIndex={activeLayerIndex}
            failedLayers={failedLayers}
            retryingLayer={retryingLayer}
            isRegeneratingSimulation={isRegeneratingSimulation}
            isCompositing={isCompositing}
            layersGenerating={layersGenerating}
            showAnnotations={showAnnotations}
            toothBounds={toothBounds}
            suggestions={analysis.suggestions || []}
            annotationContainerRef={annotationContainerRef}
            annotationDimensions={annotationDimensions}
            gingivoplastyApproved={gingivoplastyApproved}
            onSelectLayer={onSelectLayer}
            onRetryFailedLayer={onRetryFailedLayer}
            onRegenerateSimulation={onRegenerateSimulation}
            onToggleAnnotations={onToggleAnnotations}
          />

          <DSDWhiteningComparison
            imageBase64={imageBase64}
            showWhiteningComparison={showWhiteningComparison}
            whiteningComparison={whiteningComparison}
            isComparingWhitening={isComparingWhitening}
            patientPreferences={patientPreferences}
            onGenerateComparison={onGenerateWhiteningComparison}
            onCloseComparison={onCloseWhiteningComparison}
            onSelectLevel={onSelectWhiteningLevel}
          />
        </div>
      )}

      {/* If no simulation and not generating, show info */}
      {imageBase64 && !simulationImageUrl && !isSimulationGenerating && !simulationError && layers.length === 0 && (
        <div className="space-y-3">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {t('components.wizard.dsd.analysisView.simulationPreparing')}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Proportions Analysis */}
      <ProportionsCard analysis={analysis} />

      {/* Suggestions - grouped by tooth number */}
      <DSDSuggestionsCard suggestions={analysis.suggestions} />

      {/* Observations - filter out attention ones already shown above */}
      {analysis.observations && analysis.observations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('components.wizard.dsd.analysisView.generalObservations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.observations
                .filter(obs => !obs.toUpperCase().includes('ATENÇÃO') && !obs.toUpperCase().includes('ATENCAO'))
                .map((obs, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {obs}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button variant="outline" onClick={onRetry} className="sm:flex-1 btn-press">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('components.wizard.dsd.analysisView.retryAnalysis')}
          <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-1">
            <Zap className="w-3 h-3" />2
          </span>
        </Button>
        <Button onClick={onContinue} className="sm:flex-1 btn-glow-gold btn-press font-semibold group">
          {t('components.wizard.dsd.analysisView.continueToReview')}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}

// ---- Internal: Suggestions card ----

function DSDSuggestionsCard({ suggestions }: { suggestions: DSDSuggestion[] | undefined }) {
  const { t } = useTranslation();
  if (!suggestions || suggestions.length === 0) return null;

  // Keywords that indicate a gengiva-related suggestion
  const gengivaKeywords = ['gengiva', 'gengival', 'zênite', 'zenite', 'gengivoplastia', 'papila', 'contorno gengival'];
  const isGingiSuggestion = (s: DSDSuggestion) => {
    const text = `${s.current_issue} ${s.proposed_change} ${s.tooth}`.toLowerCase();
    return gengivaKeywords.some(kw => text.includes(kw));
  };

  // Group suggestions by tooth number (strip "(Gengiva)" suffix for grouping)
  const toothKey = (s: DSDSuggestion) => s.tooth.replace(/\s*\(.*\)\s*$/, '').trim();
  const grouped = new Map<string, { tooth: DSDSuggestion[]; gengiva: DSDSuggestion[] }>();
  for (const s of suggestions) {
    const key = toothKey(s);
    if (!grouped.has(key)) grouped.set(key, { tooth: [], gengiva: [] });
    const group = grouped.get(key)!;
    if (isGingiSuggestion(s)) {
      group.gengiva.push(s);
    } else {
      group.tooth.push(s);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          {t('components.wizard.dsd.analysisView.treatmentSuggestions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([tooth, group]) => (
            <div
              key={tooth}
              className="p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {t('components.wizard.dsd.analysisView.toothLabel', { tooth })}
                </Badge>
              </div>

              {/* Tooth suggestions */}
              {group.tooth.map((s, i) => (
                <div key={`t-${i}`} className={group.gengiva.length > 0 ? 'mb-2' : ''}>
                  {group.gengiva.length > 0 && (
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">{t('components.wizard.dsd.analysisView.toothSection')}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{t('components.wizard.dsd.analysisView.currentLabel')}</span> {s.current_issue}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-primary">{t('components.wizard.dsd.analysisView.proposalLabel')}</span> {s.proposed_change}
                  </p>
                </div>
              ))}

              {/* Gengiva suggestions */}
              {group.gengiva.length > 0 && (
                <>
                  {group.tooth.length > 0 && <div className="border-t border-border my-2" />}
                  {group.gengiva.map((s, i) => (
                    <div key={`g-${i}`}>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">{t('components.wizard.dsd.analysisView.gingivaSection')}</p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{t('components.wizard.dsd.analysisView.currentLabel')}</span> {s.current_issue}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-primary">{t('components.wizard.dsd.analysisView.proposalLabel')}</span> {s.proposed_change}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
