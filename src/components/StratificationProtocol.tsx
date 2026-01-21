import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Palette, Sparkles } from 'lucide-react';

interface StratificationLayer {
  layer: number;
  material: string;
  thickness: string;
  area: string;
}

interface ColorAnalysis {
  base_shade: string;
  cervical: string;
  body: string;
  incisal: string;
  effects: string[];
}

interface StratificationProtocolData {
  color_analysis: ColorAnalysis;
  stratification_layers: StratificationLayer[];
  texture_notes: string;
  surface_characteristics: string[];
  recommendations: string;
}

interface StratificationProtocolProps {
  protocol: StratificationProtocolData;
}

export default function StratificationProtocol({ protocol }: StratificationProtocolProps) {
  return (
    <div className="space-y-4">
      {/* Color Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Análise de Cor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Cor Base</span>
              <p className="font-medium">{protocol.color_analysis.base_shade}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cervical</span>
              <p className="font-medium">{protocol.color_analysis.cervical}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Corpo</span>
              <p className="font-medium">{protocol.color_analysis.body}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Incisal</span>
              <p className="font-medium">{protocol.color_analysis.incisal}</p>
            </div>
          </div>

          {protocol.color_analysis.effects && protocol.color_analysis.effects.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Efeitos especiais</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {protocol.color_analysis.effects.map((effect, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {effect}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stratification Layers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Protocolo de Camadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {protocol.stratification_layers.map((layer) => (
              <div
                key={layer.layer}
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {layer.layer}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{layer.material}</p>
                  <p className="text-xs text-muted-foreground">
                    {layer.thickness} • {layer.area}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Surface Characteristics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Textura e Acabamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {protocol.texture_notes && (
            <div>
              <span className="text-sm text-muted-foreground">Notas de textura</span>
              <p className="text-sm mt-1">{protocol.texture_notes}</p>
            </div>
          )}

          {protocol.surface_characteristics && protocol.surface_characteristics.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Características</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {protocol.surface_characteristics.map((char, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {char}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {protocol.recommendations && (
            <div className="pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Recomendações</span>
              <p className="text-sm mt-1">{protocol.recommendations}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
