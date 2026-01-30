import { Palette, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProtocolLayer } from "@/types/protocol";

interface WhiteningPreferenceAlertProps {
  originalColor: string;
  hasWhiteningPreference: boolean;
  protocolLayers?: ProtocolLayer[];
}

// Extract unique shades from protocol layers
function extractProtocolShades(layers: ProtocolLayer[]): string[] {
  const shades = new Set<string>();
  
  for (const layer of layers) {
    if (layer.shade) {
      // Normalize shade: extract base color (e.g., OA1 -> A1, EA2 -> A2)
      const shade = layer.shade.toUpperCase();
      // Add the actual shade used
      shades.add(shade);
    }
  }
  
  return Array.from(shades);
}

export default function WhiteningPreferenceAlert({ 
  originalColor, 
  hasWhiteningPreference,
  protocolLayers = [],
}: WhiteningPreferenceAlertProps) {
  if (!hasWhiteningPreference) return null;

  // Get the actual shades used in the protocol
  const usedShades = extractProtocolShades(protocolLayers);
  
  // Check if any shade is different from the original (indicating whitening was applied)
  const originalNormalized = originalColor.toUpperCase();
  const hasWhiteningApplied = usedShades.length > 0 && 
    usedShades.some(shade => {
      // Extract base shade for comparison (OA1 -> A1, DA2 -> A2, BL4 -> BL4)
      const baseShade = shade.replace(/^[ODE]/, '');
      return baseShade !== originalNormalized && !shade.includes(originalNormalized);
    });

  return (
    <div className="rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-primary">
              Preferência de Clareamento Aplicada
            </h4>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              <Palette className="w-3 h-3 mr-1" />
              Cores Ajustadas
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            O paciente indicou preferência por <span className="font-medium text-primary">dentes mais brancos</span>.
          </p>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Cor detectada:</span>
              <Badge variant="secondary" className="font-mono">
                {originalColor}
              </Badge>
            </div>
            
            {usedShades.length > 0 && (
              <>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Protocolo usa:</span>
                  <div className="flex gap-1 flex-wrap">
                    {usedShades.map((shade) => (
                      <Badge 
                        key={shade} 
                        variant="default" 
                        className="font-mono"
                      >
                        {shade}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {!hasWhiteningApplied && usedShades.length === 0 && (
              <span className="text-xs text-primary">
                Cor mais clara disponível - mantida no protocolo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
