import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { AnnotationOverlay } from '@/components/dsd/AnnotationOverlay';
import type {
  DSDAnalysis,
  DSDSuggestion,
  SimulationLayer,
  SimulationLayerType,
  ToothBoundsPct,
} from '@/types/dsd';
import { LAYER_LABELS } from '@/types/dsd';

interface DSDSimulationViewerProps {
  imageBase64: string;
  simulationImageUrl: string | null;
  layers: SimulationLayer[];
  activeLayerIndex: number;
  failedLayers: SimulationLayerType[];
  retryingLayer: SimulationLayerType | null;
  isRegeneratingSimulation: boolean;
  isCompositing: boolean;
  layersGenerating: boolean;
  showAnnotations: boolean;
  toothBounds: ToothBoundsPct[];
  suggestions: DSDSuggestion[];
  annotationContainerRef: RefObject<HTMLDivElement | null>;
  annotationDimensions: { width: number; height: number };
  onSelectLayer: (idx: number, layerType: string) => void;
  onRetryFailedLayer: (layerType: SimulationLayerType) => void;
  onRegenerateSimulation: () => void;
  onToggleAnnotations: () => void;
}

export function DSDSimulationViewer({
  imageBase64,
  simulationImageUrl,
  layers,
  activeLayerIndex,
  failedLayers,
  retryingLayer,
  isRegeneratingSimulation,
  isCompositing,
  layersGenerating,
  showAnnotations,
  toothBounds,
  suggestions,
  annotationContainerRef,
  annotationDimensions,
  onSelectLayer,
  onRetryFailedLayer,
  onRegenerateSimulation,
  onToggleAnnotations,
}: DSDSimulationViewerProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">{t('components.wizard.dsd.simulationViewer.beforeAfter')}</h3>
        <div className="flex items-center gap-2">
          {/* Annotation toggle (E5) */}
          {toothBounds.length > 0 && suggestions?.length > 0 && (
            <Button
              variant={showAnnotations ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleAnnotations}
              className="text-xs"
            >
              {showAnnotations ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {t('components.wizard.dsd.simulationViewer.annotations')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateSimulation}
            disabled={isRegeneratingSimulation || isCompositing || layersGenerating}
          >
            {isRegeneratingSimulation || isCompositing || layersGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {isCompositing ? t('components.wizard.dsd.simulationViewer.adjusting') : t('components.wizard.dsd.simulationViewer.generating')}
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                {t('components.wizard.dsd.simulationViewer.newSimulation')}
                <span className="text-xs opacity-60 ml-0.5">{t('components.wizard.dsd.simulationViewer.free')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Layer tabs */}
      {(layers.length > 0 || failedLayers.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {layers.map((layer, idx) => (
            <button
              key={layer.type}
              onClick={() => onSelectLayer(idx, layer.type)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeLayerIndex === idx
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {layer.label}
              {layer.includes_gengivoplasty && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {t('components.wizard.dsd.simulationViewer.gingiva')}
                </Badge>
              )}
            </button>
          ))}
          {failedLayers.map((layerType) => (
            <button
              key={layerType}
              onClick={() => onRetryFailedLayer(layerType)}
              disabled={retryingLayer === layerType}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            >
              {retryingLayer === layerType ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {LAYER_LABELS[layerType]}
            </button>
          ))}
        </div>
      )}

      <div ref={annotationContainerRef} className="relative">
        <ComparisonSlider
          beforeImage={imageBase64}
          afterImage={simulationImageUrl || ''}
          afterLabel={layers.length > 0 ? layers[activeLayerIndex]?.label || t('components.wizard.dsd.simulationViewer.defaultLabel') : t('components.wizard.dsd.simulationViewer.defaultLabel')}
          annotationOverlay={showAnnotations ? (
            <AnnotationOverlay
              suggestions={suggestions || []}
              toothBounds={toothBounds}
              visible={showAnnotations}
              containerWidth={annotationDimensions.width}
              containerHeight={annotationDimensions.height}
            />
          ) : undefined}
        />
      </div>
    </div>
  );
}
