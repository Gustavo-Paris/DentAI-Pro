import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, MapPin, Layers, Palette, Info } from "lucide-react";
import { getTreatmentConfig } from "@/lib/treatment-config";

// Procedimentos gengivais/teciduais que não exibem cor
const TISSUE_PROCEDURES = ['gengivoplastia', 'recobrimento_radicular'];

// Procedimentos estéticos que não usam classificação de cavidade tradicional
const AESTHETIC_PROCEDURES = [
  'Faceta Direta',
  'Recontorno Estético',
  'Fechamento de Diastema',
  'Reparo de Restauração',
  'Lente de Contato',
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
  /** Patient whitening preference text — when present, used as target color for non-resin treatments */
  whiteningGoal?: string | null;
  /** Optional secondary photos (45° / face) shown as thumbnails */
  secondaryPhotos?: { angle45?: string | null; face?: string | null };
}

// Map whitening preference text to target shade (2 levels: natural / hollywood)
function getTargetShade(whiteningGoal: string | null | undefined, originalColor: string): { shade: string; isTarget: boolean; alreadyInRange: boolean } {
  if (!whiteningGoal) return { shade: originalColor, isTarget: false, alreadyInRange: false };
  const lower = whiteningGoal.toLowerCase();
  const upper = originalColor.toUpperCase().trim();
  if (lower.includes('hollywood') || lower.includes('intenso') || lower.includes('bl1') || lower.includes('bl2') || lower.includes('bl3')) {
    const alreadyInRange = ['BL1', 'BL2', 'BL3'].some(s => upper === s);
    return { shade: 'BL1/BL2/BL3', isTarget: true, alreadyInRange };
  }
  if (lower.includes('natural') || lower.includes('a1') || lower.includes('a2') || lower.includes('b1') || lower.includes('sutil') || lower.includes('discreto')) {
    const alreadyInRange = ['A1', 'A2', 'B1'].some(s => upper === s);
    return { shade: 'A1/A2/B1', isTarget: true, alreadyInRange };
  }
  // Legacy fallback for old 3-level 'white'/'notável' values
  if (lower.includes('notável') || lower.includes('branco') || lower.includes('white')) {
    const alreadyInRange = ['BL1', 'BL2', 'BL3'].some(s => upper === s);
    return { shade: 'BL1/BL2/BL3', isTarget: true, alreadyInRange };
  }
  return { shade: originalColor, isTarget: false, alreadyInRange: false };
}

function CaseSummaryBox({
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
  whiteningGoal,
  secondaryPhotos,
}: CaseSummaryBoxProps) {
  const config = getTreatmentConfig(treatmentType);
  const showCavityInfo = config.showCavityInfo;
  const isTissueProcedure = TISSUE_PROCEDURES.includes(treatmentType);
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
        <div className={`grid grid-cols-2 ${showCavityInfo ? 'md:grid-cols-4' : isTissueProcedure ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 sm:gap-4`}>
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
            <p className="font-medium text-sm sm:text-base">{tooth === 'GENGIVO' ? 'Gengiva' : tooth}</p>
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
          
          {!isTissueProcedure && (
          <div className="space-y-0.5 sm:space-y-1">
            {(() => {
              const { shade, isTarget, alreadyInRange } = !showCavityInfo
                ? getTargetShade(whiteningGoal, toothColor)
                : { shade: toothColor, isTarget: false, alreadyInRange: false };
              return (
                <>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
                    <Palette className="w-3 h-3" />
                    Cor {showCavityInfo ? 'VITA' : 'Alvo'}
                  </div>
                  <p className="font-mono font-medium text-sm sm:text-base">{shade}</p>
                  {isTarget && alreadyInRange && (
                    <p className="text-xs text-green-600">Cor atual já na faixa desejada</p>
                  )}
                  {isTarget && !alreadyInRange && (
                    <p className="text-xs text-muted-foreground">Original: {toothColor}</p>
                  )}
                </>
              );
            })()}
          </div>
          )}
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

        {/* Secondary photo thumbnails */}
        {secondaryPhotos && (secondaryPhotos.angle45 || secondaryPhotos.face) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            {[secondaryPhotos.angle45, secondaryPhotos.face].filter(Boolean).map((url, i) => (
              <div key={i} className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                <img src={url!} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(CaseSummaryBox);
