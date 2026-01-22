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
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <User className="w-4 h-4" />
          Resumo do Caso
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
              <User className="w-3 h-3" />
              Paciente
            </div>
            <p className="font-medium text-sm sm:text-base">{patientAge} anos</p>
          </div>
          
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
              <MapPin className="w-3 h-3" />
              Dente
            </div>
            <p className="font-medium text-sm sm:text-base">{tooth}</p>
            <p className="text-xs text-muted-foreground">{region}</p>
          </div>
          
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
              <Layers className="w-3 h-3" />
              Cavidade
            </div>
            <p className="font-medium text-sm sm:text-base">{cavityClass}</p>
            <p className="text-xs text-muted-foreground capitalize">{restorationSize}</p>
          </div>
          
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
              <Palette className="w-3 h-3" />
              Cor VITA
            </div>
            <p className="font-mono font-medium text-sm sm:text-base">{toothColor}</p>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
          <Badge variant="outline" className="capitalize text-xs">
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
