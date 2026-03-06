import { memo, useState, lazy, Suspense } from 'react';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Popover, PopoverContent, PopoverTrigger } from '@parisgroup-ai/pageshell/primitives';
import { Check, Loader2, RefreshCw, Eye, User, Ruler, Ratio, SmilePlus, Columns2, SlidersHorizontal, SplitSquareHorizontal, Image, ImageOff } from 'lucide-react';
import type { ComparisonViewMode } from '@/components/dsd/ComparisonSlider';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { AnnotationOverlay } from '@/components/dsd/AnnotationOverlay';
import { ProportionOverlay, type ProportionLayerType } from '@/components/dsd/ProportionOverlay';
import { useProportionLines } from '@/hooks/domain/dsd/useProportionLines';
import { trackEvent } from '@/lib/analytics';
import type {
  DSDAnalysis,
  DSDSuggestion,
  SimulationLayer,
  SimulationLayerType,
  ToothBoundsPct,
} from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

const LayerComparisonModal = lazy(() => import('@/components/dsd/LayerComparisonModal'));

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
  annotationContainerRef: Ref<HTMLDivElement>;
  annotationDimensions: { width: number; height: number };
  analysis?: DSDAnalysis;
  visibleProportionLayers: Set<ProportionLayerType>;
  onToggleProportionLayer: (layer: ProportionLayerType) => void;
  midlineOffset?: number;
  isMidlineAdjusted?: boolean;
  onMidlineOffsetChange?: (deltaX: number) => void;
  onResetMidline?: () => void;
  gingivoplastyApproved?: boolean | null;
  hasFacePhoto?: boolean;
  isFaceMockupGenerating?: boolean;
  faceMockupError?: string | null;
  onGenerateFaceMockup?: () => void;
  facePhotoBase64?: string | null;
  onSelectLayer: (idx: number, layerType: string) => void;
  onRetryFailedLayer: (layerType: SimulationLayerType) => void;
  onRegenerateSimulation: () => void;
  onToggleAnnotations: () => void;
  layerUrls?: Record<string, string>;
}

export const DSDSimulationViewer = memo(function DSDSimulationViewer({
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
  analysis,
  visibleProportionLayers,
  onToggleProportionLayer,
  midlineOffset,
  isMidlineAdjusted,
  onMidlineOffsetChange,
  onResetMidline,
  gingivoplastyApproved,
  hasFacePhoto,
  isFaceMockupGenerating,
  faceMockupError,
  onGenerateFaceMockup,
  facePhotoBase64,
  onSelectLayer,
  onRetryFailedLayer,
  onRegenerateSimulation,
  onToggleAnnotations,
  layerUrls,
}: DSDSimulationViewerProps) {
  const { t } = useTranslation();
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<ComparisonViewMode>('split');

  const hasFaceMockupLayer = layers.some(l => l.type === 'face-mockup');
  const isActiveFaceMockup = layers[activeLayerIndex]?.type === 'face-mockup';
  const beforeImage = isActiveFaceMockup && facePhotoBase64 ? facePhotoBase64 : imageBase64;

  // Proportion overlay lines — computed from tooth bounds, analysis, and manual midline offset
  const proportionLines = useProportionLines(toothBounds, analysis, midlineOffset);

  return (
    <div className="space-y-3">
      {/* HERO: Image first */}
      <div ref={annotationContainerRef} className="relative">
        <ComparisonSlider
          beforeImage={beforeImage}
          afterImage={simulationImageUrl || ''}
          afterLabel={layers.length > 0 ? layers[activeLayerIndex]?.label || t('components.wizard.dsd.simulationViewer.defaultLabel') : t('components.wizard.dsd.simulationViewer.defaultLabel')}
          viewMode={viewMode}
          annotationOverlay={!isActiveFaceMockup && (showAnnotations || visibleProportionLayers.size > 0) ? (
            <>
              {showAnnotations && (
                <AnnotationOverlay
                  suggestions={suggestions || []}
                  toothBounds={toothBounds}
                  visible={showAnnotations}
                  containerWidth={annotationDimensions.width}
                  containerHeight={annotationDimensions.height}
                />
              )}
              {visibleProportionLayers.size > 0 && (
                <ProportionOverlay
                  lines={proportionLines}
                  visibleLayers={visibleProportionLayers}
                  containerWidth={annotationDimensions.width}
                  containerHeight={annotationDimensions.height}
                  isMidlineAdjusted={isMidlineAdjusted}
                  onMidlineOffsetChange={onMidlineOffsetChange}
                />
              )}
            </>
          ) : undefined}
        />
        {/* Floating toolbar (top-left, inside image) */}
        <div className="absolute top-2 left-2 z-20">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="bg-background/80 backdrop-blur-sm hover:bg-background text-xs gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t('components.wizard.dsd.simulationViewer.analysisTools')}
                {(showAnnotations || visibleProportionLayers.size > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1">
              {/* Annotations toggle */}
              {suggestions?.length > 0 && (
                <button
                  onClick={onToggleAnnotations}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                    showAnnotations ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t('components.wizard.dsd.simulationViewer.annotations')}
                  {showAnnotations && <Check className="w-3 h-3 ml-auto" />}
                </button>
              )}
              {/* Midline toggle */}
              {toothBounds.length >= 2 && (
                <>
                  <button
                    onClick={() => onToggleProportionLayer('midline')}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      visibleProportionLayers.has('midline') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    {t('components.wizard.dsd.proportionOverlay.midline')}
                    {visibleProportionLayers.has('midline') && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                  {isMidlineAdjusted && visibleProportionLayers.has('midline') && onResetMidline && (
                    <button
                      onClick={onResetMidline}
                      className="w-full flex items-center gap-2 px-2 py-1.5 pl-6 rounded text-xs transition-colors hover:bg-secondary text-muted-foreground"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t('components.wizard.dsd.proportionOverlay.resetMidline')}
                    </button>
                  )}
                  {/* Golden Ratio toggle */}
                  <button
                    onClick={() => onToggleProportionLayer('goldenRatio')}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      visibleProportionLayers.has('goldenRatio') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <Ratio className="w-3.5 h-3.5" />
                    {t('components.wizard.dsd.proportionOverlay.goldenRatio')}
                    {visibleProportionLayers.has('goldenRatio') && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                  {/* Smile Arc toggle */}
                  <button
                    onClick={() => onToggleProportionLayer('smileArc')}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      visibleProportionLayers.has('smileArc') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <SmilePlus className="w-3.5 h-3.5" />
                    {t('components.wizard.dsd.proportionOverlay.smileArc')}
                    {visibleProportionLayers.has('smileArc') && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
        {/* Floating view mode toggle — bottom center, inside image */}
        {simulationImageUrl && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
              {([
                { mode: 'before' as ComparisonViewMode, icon: ImageOff, labelKey: 'components.wizard.dsd.simulationViewer.viewBefore' },
                { mode: 'split' as ComparisonViewMode, icon: SplitSquareHorizontal, labelKey: 'components.wizard.dsd.simulationViewer.viewSplit' },
                { mode: 'after' as ComparisonViewMode, icon: Image, labelKey: 'components.wizard.dsd.simulationViewer.viewAfter' },
              ] as const).map(({ mode, icon: ModeIcon, labelKey }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewMode(mode); }}
                  aria-pressed={viewMode === mode}
                  aria-label={t(labelKey, { defaultValue: mode === 'before' ? 'Antes' : mode === 'split' ? 'Dividir' : 'Depois' })}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <ModeIcon className="w-3.5 h-3.5" />
                  {t(labelKey, { defaultValue: mode === 'before' ? 'Antes' : mode === 'split' ? 'Dividir' : 'Depois' })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Layer tabs */}
      {(layers.length > 0 || failedLayers.length > 0) && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('components.wizard.dsd.simulationViewer.layerTabs')}>
          {layers.map((layer, idx) => (
            <button
              key={layer.type}
              role="tab"
              aria-selected={activeLayerIndex === idx}
              onClick={() => {
                trackEvent('dsd_layer_toggled', { layer_type: layer.type, visible: activeLayerIndex !== idx });
                onSelectLayer(idx, layer.type);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeLayerIndex === idx
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              <Check className="w-3 h-3" />
              {layer.label}
              {layer.includes_gengivoplasty && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                  {t('components.wizard.dsd.simulationViewer.gingiva')}
                </Badge>
              )}
            </button>
          ))}
          {/* Generating tab: shown when complete-treatment is approved + generating but not yet in layers/failedLayers */}
          {retryingLayer === 'complete-treatment' &&
            !layers.some(l => l.type === 'complete-treatment') &&
            !failedLayers.includes('complete-treatment') && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/5 text-primary animate-pulse"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              {getLayerLabel('complete-treatment', t)}
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                {t('components.wizard.dsd.simulationViewer.gingiva')}
              </Badge>
            </span>
          )}
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
              {getLayerLabel(layerType, t)}
            </button>
          ))}
          {/* "Simular no rosto" button — shown when face photo exists but face-mockup layer not yet generated */}
          {hasFacePhoto && !hasFaceMockupLayer && onGenerateFaceMockup && (
            <button
              onClick={onGenerateFaceMockup}
              disabled={isFaceMockupGenerating || layersGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {isFaceMockupGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('components.wizard.dsd.generatingFaceMockup')}
                </>
              ) : (
                <>
                  <User className="w-3 h-3" />
                  {t('components.wizard.dsd.simulateOnFace')}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div>
          {layers.length >= 2 && (
            <Button variant="outline" size="sm" onClick={() => setShowComparison(true)} className="text-xs">
              <Columns2 className="w-3 h-3 mr-1" />
              {t('components.wizard.dsd.layerComparison.button')}
            </Button>
          )}
        </div>
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

      {showComparison && (
        <Suspense fallback={null}>
          <LayerComparisonModal
            open={showComparison}
            onOpenChange={setShowComparison}
            originalImage={imageBase64}
            facePhotoBase64={facePhotoBase64}
            layers={layers
              .filter(l => l.simulation_url && layerUrls?.[l.type])
              .map(l => ({ ...l, resolvedUrl: layerUrls![l.type] }))}
          />
        </Suspense>
      )}
    </div>
  );
});

export default DSDSimulationViewer;
