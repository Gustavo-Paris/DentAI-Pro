import { Palette, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WhiteningPreferenceAlertProps {
  originalColor: string;
  hasWhiteningPreference: boolean;
}

// Map VITA shades to lighter alternatives
const whiteningColorMap: Record<string, string[]> = {
  'A4': ['A3', 'A2'],
  'A3.5': ['A2', 'A1'],
  'A3': ['A2', 'A1'],
  'A2': ['A1', 'BL4'],
  'A1': ['BL4', 'BL3'],
  'B4': ['B3', 'B2'],
  'B3': ['B2', 'B1'],
  'B2': ['B1', 'A1'],
  'B1': ['A1', 'BL4'],
  'C4': ['C3', 'C2'],
  'C3': ['C2', 'C1'],
  'C2': ['C1', 'B1'],
  'C1': ['B1', 'A1'],
  'D4': ['D3', 'D2'],
  'D3': ['D2', 'A3'],
  'D2': ['A2', 'A1'],
  'BL4': ['BL3', 'BL2'],
  'BL3': ['BL2', 'BL1'],
  'BL2': ['BL1'],
  'BL1': [],
};

export default function WhiteningPreferenceAlert({ 
  originalColor, 
  hasWhiteningPreference 
}: WhiteningPreferenceAlertProps) {
  if (!hasWhiteningPreference) return null;

  const suggestedColors = whiteningColorMap[originalColor.toUpperCase()] || [];
  const isAlreadyLightest = suggestedColors.length === 0;

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
            
            {!isAlreadyLightest && (
              <>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Protocolo usa:</span>
                  <div className="flex gap-1">
                    {suggestedColors.map((color) => (
                      <Badge 
                        key={color} 
                        variant="default" 
                        className="font-mono"
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {isAlreadyLightest && (
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
