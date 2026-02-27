import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Smile, Sparkles, Eye, Scissors, ArrowUp, ArrowDown, ShieldCheck } from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { ProportionsCard } from './ProportionsCard';
import type { DSDAnalysis, DSDSuggestion, SimulationLayer } from '@/types/dsd';

interface CollapsibleDSDProps {
  analysis: DSDAnalysis;
  beforeImage: string | null;
  afterImage: string | null;
  defaultOpen?: boolean;
  /** Multi-layer simulation data */
  layers?: SimulationLayer[] | null;
  /** Signed URLs keyed by layer type */
  layerUrls?: Record<string, string>;
}

export function CollapsibleDSD({
  analysis,
  beforeImage,
  afterImage,
  defaultOpen = false,
  layers,
  layerUrls = {},
}: CollapsibleDSDProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  // Quick summary metrics for collapsed state
  const symmetryScore = analysis.symmetry_score;
  const goldenRatio = analysis.golden_ratio_compliance;
  const suggestionsCount = analysis.suggestions?.length || 0;

  const hasLayers = layers && layers.length > 0;
  const activeLayer = hasLayers ? layers[activeLayerIndex] : null;
  const activeAfterImage = activeLayer
    ? layerUrls[activeLayer.type] || (activeLayerIndex === 0 ? afterImage : null)
    : afterImage;

  const hasAnySimulation = !!(afterImage || (hasLayers && Object.keys(layerUrls).length > 0));

  // Gingival suggestions from DSD analysis
  const gingivalSuggestions = analysis.suggestions?.filter(
    (s: DSDSuggestion) =>
      s.treatment_indication === 'gengivoplastia' ||
      s.treatment_indication === 'recobrimento_radicular',
  ) || [];
  const hasGingivalFromLayers = hasLayers && layers.some(l => l.includes_gengivoplasty);
  const hasGingival = gingivalSuggestions.length > 0 || hasGingivalFromLayers;
  const gingivalLayerIndex = hasLayers
    ? layers.findIndex(l => l.includes_gengivoplasty)
    : -1;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Collapsed Preview Header */}
      <Card className="border-primary/20 ai-glow">
        <CollapsibleTrigger asChild>
          <CardContent className="py-4 cursor-pointer hover:bg-secondary/30 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smile className="w-5 h-5 text-primary ai-dot" />
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    {t('components.dsd.collapsible.title')}
                    {suggestionsCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {t('components.dsd.collapsible.suggestions', { count: suggestionsCount })}
                      </Badge>
                    )}
                    {hasLayers && layers.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {t('components.dsd.collapsible.layers', { count: layers.length })}
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {symmetryScore !== undefined && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t('components.dsd.collapsible.symmetry')}: {symmetryScore}%
                      </span>
                    )}
                    {goldenRatio !== undefined && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t('components.dsd.collapsible.goldenRatio')}: {goldenRatio}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isOpen && beforeImage && hasAnySimulation && (
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    <Eye className="w-3 h-3 mr-1" />
                    {t('components.dsd.collapsible.viewSimulation')}
                  </Button>
                )}
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
      </Card>

      {/* Expanded Content */}
      <CollapsibleContent className="mt-4 space-y-4">
        {/* Layer tabs — show when multiple layers exist */}
        {hasLayers && layers.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {layers.map((layer, idx) => (
              <button
                key={layer.type}
                onClick={() => setActiveLayerIndex(idx)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  activeLayerIndex === idx
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {layer.label}
                {layer.includes_gengivoplasty && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    {t('components.dsd.collapsible.gingivaLabel')}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Preservation badges for gingival layers */}
        {activeLayer?.includes_gengivoplasty && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-muted-foreground">{t('components.dsd.collapsible.areas')}</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-success/40 text-success">
              {t('components.dsd.collapsible.lipPreserved')}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
              {t('components.dsd.collapsible.gingivaAltered')}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
              {t('components.dsd.collapsible.teethAltered')}
            </Badge>
          </div>
        )}

        {/* Comparison Slider — face-mockup has no before image, show result only */}
        {activeLayer?.type === 'face-mockup' && activeAfterImage ? (
          <div className="relative w-full overflow-hidden rounded-lg">
            <img
              src={activeAfterImage}
              alt={t('dsd.layers.faceMockup')}
              className="w-full rounded-lg"
            />
          </div>
        ) : beforeImage && activeAfterImage ? (
          <ComparisonSlider
            beforeImage={beforeImage}
            afterImage={activeAfterImage}
            afterLabel={activeLayer?.label || t('dsd.simulation')}
          />
        ) : null}

        {/* Gingival changes section */}
        {hasGingival && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-destructive" />
                  {t('components.dsd.collapsible.gingivalChanges')}
                </h4>
                {gingivalLayerIndex >= 0 && activeLayerIndex !== gingivalLayerIndex && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setActiveLayerIndex(gingivalLayerIndex)}
                  >
                    {t('components.dsd.collapsible.viewWithGingiva')}
                  </Button>
                )}
              </div>
              {gingivalSuggestions.length > 0 ? (
                <div className="grid gap-2">
                  {gingivalSuggestions.map((s: DSDSuggestion) => (
                    <div key={s.tooth} className="flex items-start gap-2 text-xs">
                      <span className="flex items-center gap-1 font-mono font-medium text-destructive min-w-[2.5rem]">
                        {s.treatment_indication === 'gengivoplastia' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {s.tooth}
                      </span>
                      <span className="text-muted-foreground">
                        {s.proposed_change}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t('components.dsd.collapsible.gingivoplastyIncluded')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Proportions */}
        <ProportionsCard analysis={analysis} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CollapsibleDSD;
