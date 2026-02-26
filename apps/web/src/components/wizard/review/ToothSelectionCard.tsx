import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Checkbox,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@parisgroup-ai/pageshell/primitives';
import { Check, CircleDot, Plus, Wrench, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import type { DetectedTooth, TreatmentType } from '../ReviewAnalysisStep';
import { TEETH, TREATMENT_LABEL_KEYS, TREATMENT_BORDER_COLORS } from './review-constants';

interface ToothSelectionCardProps {
  analysisResult: {
    detected_teeth: DetectedTooth[];
  };
  selectedTeeth: string[];
  onSelectedTeethChange?: (teeth: string[]) => void;
  toothTreatments: Record<string, TreatmentType>;
  onToothTreatmentChange?: (tooth: string, treatment: TreatmentType) => void;
  originalToothTreatments: Record<string, TreatmentType>;
  onRestoreAiSuggestion?: (tooth: string) => void;
}

export const ToothSelectionCard = memo(function ToothSelectionCard({
  analysisResult,
  selectedTeeth,
  onSelectedTeethChange,
  toothTreatments,
  onToothTreatmentChange,
  originalToothTreatments,
  onRestoreAiSuggestion,
}: ToothSelectionCardProps) {
  const { t } = useTranslation();
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualTooth, setManualTooth] = useState('');

  const detectedTeeth = analysisResult.detected_teeth || [];
  const restorativeTeeth = detectedTeeth.filter(dt => dt.priority === 'alta' || dt.priority === 'média');
  const aestheticTeeth = detectedTeeth.filter(dt => dt.priority === 'baixa');
  const realSelectedTeeth = selectedTeeth.filter(st => st !== 'GENGIVO');
  const hasGengivoplasty = selectedTeeth.includes('GENGIVO');

  const handleToggleTooth = (tooth: string, checked: boolean) => {
    if (!onSelectedTeethChange) return;
    if (checked) {
      const treatment = toothTreatments[tooth] || detectedTeeth.find(dt => dt.tooth === tooth)?.treatment_indication || 'resina';
      trackEvent('tooth_selected', { tooth, treatment_type: treatment });
      onSelectedTeethChange([...selectedTeeth, tooth]);
    } else {
      onSelectedTeethChange(selectedTeeth.filter(st => st !== tooth));
    }
  };

  const handleSelectCategory = (category: 'restorative' | 'aesthetic' | 'all') => {
    if (!onSelectedTeethChange) return;
    if (category === 'restorative') {
      onSelectedTeethChange(restorativeTeeth.map(dt => dt.tooth));
    } else if (category === 'aesthetic') {
      onSelectedTeethChange(aestheticTeeth.map(dt => dt.tooth));
    } else {
      onSelectedTeethChange(detectedTeeth.map(dt => dt.tooth));
    }
  };

  const handleAddManualTooth = () => {
    if (!manualTooth || !onSelectedTeethChange) return;
    if (!selectedTeeth.includes(manualTooth)) {
      onSelectedTeethChange([...selectedTeeth, manualTooth]);
    }
    setManualTooth('');
    setShowManualAdd(false);
  };

  const renderToothCard = (tooth: DetectedTooth, index: number, prefix: string) => {
    const isSelected = selectedTeeth.includes(tooth.tooth);
    const treatment = toothTreatments[tooth.tooth] || tooth.treatment_indication || 'resina';
    const borderColor = TREATMENT_BORDER_COLORS[treatment] || 'border-l-primary';

    return (
      <div
        key={`${prefix}-${tooth.tooth}-${index}`}
        role="checkbox"
        aria-checked={isSelected}
        aria-label={t('components.wizard.review.toggleTooth', { number: tooth.tooth })}
        tabIndex={0}
        className={cn(
          'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 border-l-4 text-left w-full',
          borderColor,
          isSelected ? 'card-elevated border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30',
        )}
        onClick={(e) => {
          // Only toggle if the click wasn't on an interactive child (Select, Button, etc.)
          const target = e.target as HTMLElement;
          if (target.closest('button, [role="combobox"], [role="listbox"], [data-radix-collection-item]')) return;
          handleToggleTooth(tooth.tooth, !isSelected);
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleToggleTooth(tooth.tooth, !isSelected);
          }
        }}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => handleToggleTooth(tooth.tooth, !!checked)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm">{t('components.wizard.review.tooth', { number: tooth.tooth })}</span>
            <Badge
              variant={tooth.priority === 'alta' ? 'destructive' : tooth.priority === 'média' ? 'secondary' : 'outline'}
              className="text-[10px] gap-1"
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                tooth.priority === 'alta' && 'bg-destructive',
                tooth.priority === 'média' && 'bg-warning',
                tooth.priority === 'baixa' && 'bg-muted-foreground',
              )} />
              {t(`common.priority${tooth.priority.charAt(0).toUpperCase() + tooth.priority.slice(1)}`)}
            </Badge>
          </div>

          {/* Treatment badge */}
          <Badge variant="outline" className="text-[10px] mb-1.5">
            {t(TREATMENT_LABEL_KEYS[treatment])}
          </Badge>

          {/* Per-tooth treatment selector */}
          {isSelected && onToothTreatmentChange && (
            <div className="flex items-center gap-1 mt-2">
              <Select
                value={toothTreatments[tooth.tooth] || tooth.treatment_indication || 'resina'}
                onValueChange={(value) => {
                  const fromType = toothTreatments[tooth.tooth] || tooth.treatment_indication || 'resina';
                  trackEvent('treatment_changed', { tooth: tooth.tooth, from_type: fromType, to_type: value });
                  onToothTreatmentChange(tooth.tooth, value as TreatmentType);
                }}
              >
                <SelectTrigger className="h-8 text-xs border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resina">{t('treatments.resina.label')}</SelectItem>
                  <SelectItem value="porcelana">{t('treatments.porcelana.label')}</SelectItem>
                  <SelectItem value="coroa">{t('treatments.coroa.label')}</SelectItem>
                  <SelectItem value="implante">{t('treatments.implante.label')}</SelectItem>
                  <SelectItem value="endodontia">{t('treatments.endodontia.label')}</SelectItem>
                  <SelectItem value="encaminhamento">{t('treatments.encaminhamento.label')}</SelectItem>
                  <SelectItem value="gengivoplastia">{t('treatments.gengivoplastia.label')}</SelectItem>
                  <SelectItem value="recobrimento_radicular">{t('treatments.recobrimento_radicular.label')}</SelectItem>
                </SelectContent>
              </Select>
              {onRestoreAiSuggestion && originalToothTreatments[tooth.tooth] &&
               toothTreatments[tooth.tooth] !== originalToothTreatments[tooth.tooth] && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label={t('components.wizard.review.restoreAI', { treatment: t(TREATMENT_LABEL_KEYS[originalToothTreatments[tooth.tooth]]) })}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreAiSuggestion(tooth.tooth);
                        }}
                      >
                        <Wand2 className="w-4 h-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('components.wizard.review.restoreAI', { treatment: t(TREATMENT_LABEL_KEYS[originalToothTreatments[tooth.tooth]]) })}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          {/* AI notes in tooltip (compact) */}
          {tooth.indication_reason && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[10px] text-muted-foreground mt-1 italic truncate cursor-help">
                    {t('components.wizard.review.aiNote', { note: tooth.indication_reason })}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{tooth.indication_reason}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="card-elevated border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-primary" />
          {t('components.wizard.review.selectTeethTitle')}
          <Badge variant="secondary" className="ml-2">
            {realSelectedTeeth.length > 0 ? t('components.wizard.review.selected', { count: realSelectedTeeth.length }) : detectedTeeth.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {t('components.wizard.review.selectTeethDesc')}
        </p>

        {/* Quick selection buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => handleSelectCategory('restorative')} className="text-xs btn-press">
            <Wrench className="w-3 h-3 mr-1" />
            {t('components.wizard.review.onlyRequired', { count: restorativeTeeth.length })}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSelectCategory('all')} className="text-xs btn-press">
            <Check className="w-3 h-3 mr-1" />
            {t('components.wizard.review.selectAll', { count: detectedTeeth.length })}
          </Button>
          {aestheticTeeth.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => handleSelectCategory('aesthetic')} className="text-xs btn-press">
              <Wand2 className="w-3 h-3 mr-1" />
              {t('components.wizard.review.onlyAesthetic', { count: aestheticTeeth.length })}
            </Button>
          )}
          {selectedTeeth.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onSelectedTeethChange?.([])} className="text-xs text-muted-foreground">
              {t('components.wizard.review.clearSelection')}
            </Button>
          )}
        </div>

        {/* Restorative teeth section */}
        {restorativeTeeth.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-destructive" />
              <h4 className="font-medium text-sm">{t('components.wizard.review.requiredTreatments')}</h4>
              <Badge variant="destructive" className="text-xs">{restorativeTeeth.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {restorativeTeeth.map((tooth, index) => renderToothCard(tooth, index, 'restorative'))}
            </div>
          </div>
        )}

        {/* Aesthetic improvements section */}
        {aestheticTeeth.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-sm">{t('components.wizard.review.aestheticImprovements')}</h4>
              <Badge variant="secondary" className="text-xs">{aestheticTeeth.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {t('components.wizard.review.aestheticDesc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aestheticTeeth.map((tooth, index) => renderToothCard(tooth, index, 'aesthetic'))}
            </div>
          </div>
        )}

        {/* Manually added teeth */}
        {(() => {
          const detectedToothNumbers = detectedTeeth.map(dt => dt.tooth);
          const manualTeeth = selectedTeeth.filter(st => !detectedToothNumbers.includes(st) && st !== 'GENGIVO');
          if (manualTeeth.length === 0) return null;
          return (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Plus className="w-3 h-3" />
                {t('components.wizard.review.manuallyAdded')}
              </h4>
              <div className="space-y-2">
                {manualTeeth.map((toothNum) => (
                  <div
                    key={toothNum}
                    className="flex items-center gap-3 p-3 border rounded-lg border-primary bg-primary/5 border-l-4 border-l-primary"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggleTooth(toothNum, false)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{t('components.wizard.review.tooth', { number: toothNum })}</span>
                        <Badge variant="outline" className="text-xs">{t('components.wizard.review.manual')}</Badge>
                      </div>
                      {onToothTreatmentChange && (
                        <Select
                          value={toothTreatments[toothNum] || 'resina'}
                          onValueChange={(value) => onToothTreatmentChange(toothNum, value as TreatmentType)}
                        >
                          <SelectTrigger className="h-8 text-xs border-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resina">{t('treatments.resina.label')}</SelectItem>
                            <SelectItem value="porcelana">{t('treatments.porcelana.label')}</SelectItem>
                            <SelectItem value="coroa">{t('treatments.coroa.label')}</SelectItem>
                            <SelectItem value="implante">{t('treatments.implante.label')}</SelectItem>
                            <SelectItem value="endodontia">{t('treatments.endodontia.label')}</SelectItem>
                            <SelectItem value="encaminhamento">{t('treatments.encaminhamento.label')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Add manual tooth button */}
        {!showManualAdd ? (
          <Button variant="outline" size="sm" className="mt-4 w-full btn-press" onClick={() => setShowManualAdd(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('components.wizard.review.addManually')}
          </Button>
        ) : (
          <div className="mt-4 flex gap-2">
            <Select value={manualTooth} onValueChange={setManualTooth}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('components.wizard.review.selectTooth')} />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{t('components.wizard.review.upper')}</div>
                {TEETH.upper.map((toothNum) => (
                  <SelectItem key={toothNum} value={toothNum} disabled={selectedTeeth.includes(toothNum)}>
                    {toothNum} {selectedTeeth.includes(toothNum) && t('components.wizard.review.alreadyAdded')}
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{t('components.wizard.review.lower')}</div>
                {TEETH.lower.map((toothNum) => (
                  <SelectItem key={toothNum} value={toothNum} disabled={selectedTeeth.includes(toothNum)}>
                    {toothNum} {selectedTeeth.includes(toothNum) && t('components.wizard.review.alreadyAdded')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddManualTooth} disabled={!manualTooth} className="btn-press">
              {t('components.wizard.review.add')}
            </Button>
            <Button variant="ghost" onClick={() => setShowManualAdd(false)}>
              {t('components.wizard.review.cancel')}
            </Button>
          </div>
        )}

        {selectedTeeth.length > 0 && (
          <p className="text-sm text-primary mt-4 text-center font-medium">
            {t('components.wizard.review.teethSelectedCount', { count: realSelectedTeeth.length })}{hasGengivoplasty ? t('components.wizard.review.plusGingivoplasty') : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

export default ToothSelectionCard;
