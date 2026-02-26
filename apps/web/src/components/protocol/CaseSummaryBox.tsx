import { memo } from 'react';
import { useTranslation } from 'react-i18next';
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

// Map aesthetic level keys to i18n keys
const aestheticExplanationKeys: Record<string, string> = {
  'funcional': 'components.caseSummary.aestheticFunctional',
  'estético': 'components.caseSummary.aestheticEsthetic',
  'básico': 'components.caseSummary.aestheticBasic',
  'alto': 'components.caseSummary.aestheticHigh',
  'muito alto': 'components.caseSummary.aestheticVeryHigh',
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
  const { t } = useTranslation();
  const config = getTreatmentConfig(treatmentType);
  const showCavityInfo = config.showCavityInfo;
  const isTissueProcedure = TISSUE_PROCEDURES.includes(treatmentType);
  const TreatmentIcon = config.icon;
  
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <User className="w-4 h-4" />
          {t('components.protocol.caseSummary.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        <div className={`grid grid-cols-2 ${showCavityInfo ? 'md:grid-cols-4' : isTissueProcedure ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 sm:gap-4`}>
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
              <User className="w-3 h-3" />
              {t('components.protocol.caseSummary.patient')}
            </div>
            <p className="font-medium text-sm sm:text-base">{t('components.protocol.caseSummary.yearsOld', { age: patientAge })}</p>
          </div>
          
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
              <MapPin className="w-3 h-3" />
              {t('components.protocol.caseSummary.tooth')}
            </div>
            <p className="font-medium text-sm sm:text-base">{tooth === 'GENGIVO' ? t('components.protocol.caseSummary.gingiva') : tooth}</p>
            <p className="text-xs text-muted-foreground">{region}</p>
          </div>
          
          {/* Conditional: Cavity info for resina only */}
          {showCavityInfo && cavityClass && restorationSize && (
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs">
                <Layers className="w-3 h-3" />
                {AESTHETIC_PROCEDURES.includes(cavityClass) ? t('components.protocol.caseSummary.procedure') : t('components.protocol.caseSummary.classification')}
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
                {t('components.protocol.caseSummary.treatment')}
              </div>
              <p className="font-medium text-sm sm:text-base">{t(config.labelKey)}</p>
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
                    {showCavityInfo ? t('components.protocol.caseSummary.vitaColor') : t('components.protocol.caseSummary.targetColor')}
                  </div>
                  <p className="font-medium text-sm sm:text-base">{shade}</p>
                  {isTarget && alreadyInRange && (
                    <p className="text-xs text-success">{t('components.protocol.caseSummary.colorInRange')}</p>
                  )}
                  {isTarget && !alreadyInRange && (
                    <p className="text-xs text-muted-foreground">{t('components.protocol.caseSummary.originalColor', { color: toothColor })}</p>
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
              <span className="inline-flex">
                <Badge variant="outline" className="capitalize text-xs cursor-help gap-1">
                  <Info className="w-3 h-3" />
                  {t('components.protocol.caseSummary.aestheticLabel', { level: aestheticLevel })}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs max-w-[200px]">
                {t(aestheticExplanationKeys[aestheticLevel.toLowerCase()] || 'components.caseSummary.aestheticDefault')}
              </p>
            </TooltipContent>
          </Tooltip>
          {bruxism && (
            <Badge variant="destructive" className="text-xs">
              {t('components.protocol.caseSummary.bruxism')}
            </Badge>
          )}
          {stratificationNeeded && showCavityInfo && (
            <Badge variant="secondary" className="text-xs">
              {t('components.protocol.caseSummary.stratification')}
            </Badge>
          )}
          {!showCavityInfo && (
            <Badge variant="secondary" className="text-xs">
              {t(config.labelKey)}
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
