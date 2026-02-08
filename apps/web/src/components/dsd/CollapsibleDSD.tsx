import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Smile, Sparkles, Eye } from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { ProportionsCard } from './ProportionsCard';
import type { DSDAnalysis, SimulationLayer } from '@/types/dsd';

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
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  // Quick summary metrics for collapsed state
  const symmetryScore = analysis.symmetry_score;
  const goldenRatio = analysis.golden_ratio_compliance;
  const suggestionsCount = analysis.suggestions?.length || 0;

  const hasLayers = layers && layers.length > 0;
  const activeLayer = hasLayers ? layers[activeLayerIndex] : null;
  const activeAfterImage = activeLayer
    ? layerUrls[activeLayer.type] || afterImage
    : afterImage;

  const hasAnySimulation = !!(afterImage || (hasLayers && Object.keys(layerUrls).length > 0));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Collapsed Preview Header */}
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <CardContent className="py-4 cursor-pointer hover:bg-secondary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smile className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    Planejamento Digital do Sorriso (DSD)
                    {suggestionsCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestionsCount} sugestões
                      </Badge>
                    )}
                    {hasLayers && layers.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {layers.length} camadas
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {symmetryScore !== undefined && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Simetria: {symmetryScore}%
                      </span>
                    )}
                    {goldenRatio !== undefined && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Proporção áurea: {goldenRatio}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isOpen && beforeImage && hasAnySimulation && (
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver simulação
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
                    : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {layer.label}
                {layer.includes_gengivoplasty && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    Gengiva
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Comparison Slider */}
        {beforeImage && activeAfterImage && (
          <ComparisonSlider
            beforeImage={beforeImage}
            afterImage={activeAfterImage}
            afterLabel={activeLayer?.label || 'Simulação DSD'}
          />
        )}

        {/* Proportions */}
        <ProportionsCard analysis={analysis} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CollapsibleDSD;
