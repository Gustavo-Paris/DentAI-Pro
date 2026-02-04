import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, MapPin, Layers, Palette, Crown, Stethoscope, ArrowUpRight, CircleX, Info } from "lucide-react";

// Treatment type configuration
const treatmentConfig: Record<string, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
  showCavityInfo: boolean;
}> = {
  resina: { label: 'Resina Composta', icon: Layers, showCavityInfo: true },
  porcelana: { label: 'Faceta de Porcelana', icon: Crown, showCavityInfo: false },
  coroa: { label: 'Coroa Total', icon: Crown, showCavityInfo: false },
  implante: { label: 'Implante', icon: CircleX, showCavityInfo: false },
  endodontia: { label: 'Endodontia', icon: Stethoscope, showCavityInfo: false },
  encaminhamento: { label: 'Encaminhamento', icon: ArrowUpRight, showCavityInfo: false },
};

// Procedimentos estéticos que não usam classificação de cavidade tradicional
const AESTHETIC_PROCEDURES = [
  'Faceta Direta', 
  'Recontorno Estético', 
  'Fechamento de Diastema', 
  'Reparo de Restauração'
];

// Explicações dos níveis estéticos
const aestheticExplanations: Record<string, string> = {
  'básico': 'Restauração funcional, estética secundária',
  'alto': 'Mimetismo natural exigido, paciente atento aos detalhes',
  'muito alto': 'DSD ativo, harmonização completa, estética de excelência'
};

interface CaseSummaryBoxProps {
  treatmentType?: 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | string;
  patientAge: number;
  tooth: string;
  region: string;
  toothColor: string;
  aestheticLevel: string;
  bruxism: boolean;
  stratificationNeeded: boolean;
  // Resina-specific
  cavityClass?: string;
  restorationSize?: string;
  // Non-resina specific
  indicationReason?: string | null;
}

export default function CaseSummaryBox({
  treatmentType = 'resina',
  patientAge,
  tooth,
  region,
  cavityClass,
  restorationSize,
  toothColor,
  aestheticLevel,
  bruxism,
  stratificationNeeded,
  indicationReason,
}: CaseSummaryBoxProps) {
  const config = treatmentConfig[treatmentType] || treatmentConfig.resina;
  const showCavityInfo = config.showCavityInfo;
  const TreatmentIcon = config.icon;
  
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <User className="w-4 h-4" />
          Resumo do Caso
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        <div className={`grid grid-cols-2 ${showCavityInfo ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 sm:gap-4`}>
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
          
          {/* Conditional: Cavity info for resina only */}
          {showCavityInfo && cavityClass && restorationSize && (
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
                <Layers className="w-3 h-3" />
                {AESTHETIC_PROCEDURES.includes(cavityClass) ? 'Procedimento' : 'Classificação (Black)'}
              </div>
              <p className="font-medium text-sm sm:text-base">{cavityClass}</p>
              {!AESTHETIC_PROCEDURES.includes(cavityClass) && (
                <p className="text-xs text-muted-foreground capitalize">{restorationSize}</p>
              )}
            </div>
          )}
          
          {/* Conditional: Treatment type for non-resina */}
          {!showCavityInfo && (
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
                <TreatmentIcon className="w-3 h-3" />
                Tratamento
              </div>
              <p className="font-medium text-sm sm:text-base">{config.label}</p>
              {indicationReason && (
                <p className="text-xs text-muted-foreground line-clamp-2">{indicationReason}</p>
              )}
            </div>
          )}
          
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
              <Palette className="w-3 h-3" />
              Cor {showCavityInfo ? 'VITA' : 'Alvo'}
            </div>
            <p className="font-mono font-medium text-sm sm:text-base">{toothColor}</p>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="capitalize text-xs cursor-help gap-1">
                <Info className="w-3 h-3" />
                Estética: {aestheticLevel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs max-w-[200px]">
                {aestheticExplanations[aestheticLevel.toLowerCase()] || 'Nível estético selecionado'}
              </p>
            </TooltipContent>
          </Tooltip>
          {bruxism && (
            <Badge variant="destructive" className="text-xs">
              Bruxismo
            </Badge>
          )}
          {stratificationNeeded && showCavityInfo && (
            <Badge variant="secondary" className="text-xs">
              Estratificação
            </Badge>
          )}
          {!showCavityInfo && (
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
