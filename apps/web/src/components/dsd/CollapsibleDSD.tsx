import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Smile, Sparkles, Eye } from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { ProportionsCard } from './ProportionsCard';
import type { DSDAnalysis } from '@/components/wizard/DSDStep';

interface CollapsibleDSDProps {
  analysis: DSDAnalysis;
  beforeImage: string | null;
  afterImage: string | null;
  defaultOpen?: boolean;
}

export function CollapsibleDSD({
  analysis,
  beforeImage,
  afterImage,
  defaultOpen = false,
}: CollapsibleDSDProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Quick summary metrics for collapsed state
  const symmetryScore = analysis.symmetry_score;
  const goldenRatio = analysis.golden_ratio_compliance;
  const suggestionsCount = analysis.suggestions?.length || 0;

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
                {!isOpen && beforeImage && afterImage && (
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
        {/* Comparison Slider */}
        {beforeImage && afterImage && (
          <ComparisonSlider
            beforeImage={beforeImage}
            afterImage={afterImage}
          />
        )}
        
        {/* Proportions */}
        <ProportionsCard analysis={analysis} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CollapsibleDSD;
