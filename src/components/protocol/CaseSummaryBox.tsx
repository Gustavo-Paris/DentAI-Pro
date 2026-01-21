import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Layers, Palette } from "lucide-react";

interface CaseSummaryBoxProps {
  patientAge: number;
  tooth: string;
  region: string;
  cavityClass: string;
  restorationSize: string;
  toothColor: string;
  aestheticLevel: string;
  bruxism: boolean;
  stratificationNeeded: boolean;
}

export default function CaseSummaryBox({
  patientAge,
  tooth,
  region,
  cavityClass,
  restorationSize,
  toothColor,
  aestheticLevel,
  bruxism,
  stratificationNeeded,
}: CaseSummaryBoxProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4" />
          Resumo do Caso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <User className="w-3 h-3" />
              Paciente
            </div>
            <p className="font-medium">{patientAge} anos</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <MapPin className="w-3 h-3" />
              Dente
            </div>
            <p className="font-medium">{tooth}</p>
            <p className="text-xs text-muted-foreground">{region}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Layers className="w-3 h-3" />
              Cavidade
            </div>
            <p className="font-medium">{cavityClass}</p>
            <p className="text-xs text-muted-foreground capitalize">{restorationSize}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Palette className="w-3 h-3" />
              Cor VITA
            </div>
            <p className="font-mono font-medium">{toothColor}</p>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
          <Badge variant="outline" className="capitalize">
            Estética: {aestheticLevel}
          </Badge>
          {bruxism && (
            <Badge variant="destructive" className="text-xs">
              Bruxismo
            </Badge>
          )}
          {stratificationNeeded && (
            <Badge variant="secondary" className="text-xs">
              Estratificação
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
