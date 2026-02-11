/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertTriangle, Check, Info, Sparkles, CircleDot, RefreshCw, Loader2, Plus, Wrench, Wand2, Crown, CalendarIcon, Zap, Package, User, Mic, MicOff, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PatientAutocomplete } from '@/components/PatientAutocomplete';
import { calculateAge } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { calculateComplexity } from '@/lib/complexity-score';
import { useSpeechToText } from '@/hooks/useSpeechToText';

// Expanded treatment types
export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia' | 'recobrimento_radicular';

// Multi-tooth detection structure
export interface DetectedTooth {
  tooth: string;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  priority: "alta" | "média" | "baixa";
  notes: string | null;
  treatment_indication?: TreatmentType;
  indication_reason?: string;
  tooth_bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
  treatment_indication?: TreatmentType;
  indication_reason?: string;
}

// Treatment type translation key mapping
export const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.treatmentResina',
  porcelana: 'components.wizard.review.treatmentPorcelana',
  coroa: 'components.wizard.review.treatmentCoroa',
  implante: 'components.wizard.review.treatmentImplante',
  endodontia: 'components.wizard.review.treatmentEndodontia',
  encaminhamento: 'components.wizard.review.treatmentEncaminhamento',
  gengivoplastia: 'components.wizard.review.treatmentGengivoplastia',
  recobrimento_radicular: 'components.wizard.review.treatmentRecobrimentoRadicular',
};

export const TREATMENT_DESC_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.descResina',
  porcelana: 'components.wizard.review.descPorcelana',
  coroa: 'components.wizard.review.descCoroa',
  implante: 'components.wizard.review.descImplante',
  endodontia: 'components.wizard.review.descEndodontia',
  encaminhamento: 'components.wizard.review.descEncaminhamento',
  gengivoplastia: 'components.wizard.review.descGengivoplastia',
  recobrimento_radicular: 'components.wizard.review.descRecobrimentoRadicular',
};

// Treatment border colors
const TREATMENT_BORDER_COLORS: Record<TreatmentType, string> = {
  resina: 'border-l-primary',
  porcelana: 'border-l-amber-500',
  coroa: 'border-l-blue-500',
  implante: 'border-l-emerald-500',
  endodontia: 'border-l-red-500',
  encaminhamento: 'border-l-purple-500',
  gengivoplastia: 'border-l-pink-500',
  recobrimento_radicular: 'border-l-teal-500',
};

export interface ReviewFormData {
  patientName: string;
  patientAge: string;
  tooth: string;
  toothRegion: string;
  cavityClass: string;
  restorationSize: string;
  vitaShade: string;
  substrate: string;
  substrateCondition: string;
  enamelCondition: string;
  depth: string;
  bruxism: boolean;
  aestheticLevel: string;
  budget: string;
  longevityExpectation: string;
  clinicalNotes: string;
  treatmentType: TreatmentType;
}

interface ReviewAnalysisStepProps {
  analysisResult: PhotoAnalysisResult | null;
  formData: ReviewFormData;
  onFormChange: (data: Partial<ReviewFormData>) => void;
  imageBase64: string | null;
  onToothSelect?: (tooth: DetectedTooth) => void;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
  selectedTeeth?: string[];
  onSelectedTeethChange?: (teeth: string[]) => void;
  toothTreatments?: Record<string, TreatmentType>;
  onToothTreatmentChange?: (tooth: string, treatment: TreatmentType) => void;
  originalToothTreatments?: Record<string, TreatmentType>;
  onRestoreAiSuggestion?: (tooth: string) => void;
  hasInventory?: boolean;
  selectedPatientId?: string | null;
  onPatientSelect?: (name: string, patientId?: string, birthDate?: string | null) => void;
  patientBirthDate?: string | null;
  onPatientBirthDateChange?: (date: string | null) => void;
  dobError?: boolean;
  onDobErrorChange?: (hasError: boolean) => void;
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
  dsdObservations?: string[];
  dsdSuggestions?: { tooth: string; current_issue: string; proposed_change: string }[];
}

const TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

// Pill Toggle component for radio groups
function PillToggle({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}) {
  return (
    <div className={cn('grid gap-2', columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 btn-press border',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card border-border hover:border-primary/50 text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ReviewAnalysisStep({
  analysisResult,
  formData,
  onFormChange,
  imageBase64,
  onReanalyze,
  isReanalyzing = false,
  selectedTeeth = [],
  onSelectedTeethChange,
  toothTreatments = {},
  onToothTreatmentChange,
  originalToothTreatments = {},
  onRestoreAiSuggestion,
  hasInventory = true,
  selectedPatientId,
  onPatientSelect,
  patientBirthDate,
  onPatientBirthDateChange,
  dobError: externalDobError,
  onDobErrorChange,
  whiteningLevel,
  dsdObservations,
  dsdSuggestions,
}: Omit<ReviewAnalysisStepProps, 'onToothSelect'>) {
  const { t } = useTranslation();
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualTooth, setManualTooth] = useState('');
  const [internalDobError, setInternalDobError] = useState(false);
  const [dobInputText, setDobInputText] = useState('');
  const [dobCalendarOpen, setDobCalendarOpen] = useState(false);
  const speech = useSpeechToText('pt-BR');

  // Append transcript to clinical notes when user stops recording
  const prevListeningRef = useRef(false);
  useEffect(() => {
    if (prevListeningRef.current && !speech.isListening && speech.transcript) {
      const existing = formData.clinicalNotes;
      const separator = existing ? '\n' : '';
      onFormChange({ clinicalNotes: existing + separator + speech.transcript });
    }
    prevListeningRef.current = speech.isListening;
  }, [speech.isListening, speech.transcript, formData.clinicalNotes, onFormChange]);

  // Use external dobError if provided, otherwise use internal state
  const dobError = externalDobError ?? internalDobError;
  const setDobError = (value: boolean) => {
    setInternalDobError(value);
    onDobErrorChange?.(value);
  };

  // Clear DOB error when date is provided
  const handleBirthDateChange = (date: string | null) => {
    if (date) setDobError(false);
    onPatientBirthDateChange?.(date);
  };

  const confidence = analysisResult?.confidence ?? 0;
  const confidenceColor = confidence >= 80 ? 'text-success' : confidence >= 60 ? 'text-warning' : 'text-destructive';
  const detectedTeeth = analysisResult?.detected_teeth || [];
  const hasMultipleTeeth = detectedTeeth.length > 1;

  // Separate teeth by category: restorative needs vs aesthetic improvements
  const restorativeTeeth = detectedTeeth.filter(t => t.priority === 'alta' || t.priority === 'média');
  const aestheticTeeth = detectedTeeth.filter(t => t.priority === 'baixa');

  // Select all teeth of a category
  const handleSelectCategory = (category: 'restorative' | 'aesthetic' | 'all') => {
    if (!onSelectedTeethChange) return;

    if (category === 'restorative') {
      onSelectedTeethChange(restorativeTeeth.map(t => t.tooth));
    } else if (category === 'aesthetic') {
      onSelectedTeethChange(aestheticTeeth.map(t => t.tooth));
    } else {
      onSelectedTeethChange(detectedTeeth.map(t => t.tooth));
    }
  };

  // Toggle tooth selection for multi-protocol generation
  const handleToggleTooth = (tooth: string, checked: boolean) => {
    if (!onSelectedTeethChange) return;
    if (checked) {
      onSelectedTeethChange([...selectedTeeth, tooth]);
    } else {
      onSelectedTeethChange(selectedTeeth.filter(t => t !== tooth));
    }
  };

  // Add manual tooth
  const handleAddManualTooth = () => {
    if (!manualTooth || !onSelectedTeethChange) return;
    if (!selectedTeeth.includes(manualTooth)) {
      onSelectedTeethChange([...selectedTeeth, manualTooth]);
    }
    setManualTooth('');
    setShowManualAdd(false);
  };

  // Complexity score
  const complexity = calculateComplexity(detectedTeeth.filter(t => selectedTeeth.includes(t.tooth)));

  // Real teeth count (exclude virtual "GENGIVO" entry)
  const realSelectedTeeth = selectedTeeth.filter(t => t !== 'GENGIVO');
  const hasGengivoplasty = selectedTeeth.includes('GENGIVO');

  // Build summary data (only real teeth)
  const treatmentBreakdown = (() => {
    const counts: Record<TreatmentType, number> = {
      resina: 0, porcelana: 0, coroa: 0, implante: 0, endodontia: 0, encaminhamento: 0, gengivoplastia: 0, recobrimento_radicular: 0,
    };
    for (const tooth of realSelectedTeeth) {
      const treatment = toothTreatments[tooth] || detectedTeeth.find(t => t.tooth === tooth)?.treatment_indication || 'resina';
      counts[treatment]++;
    }
    if (hasGengivoplasty) counts.gengivoplastia = 1;
    return Object.entries(counts).filter(([, count]) => count > 0) as [TreatmentType, number][];
  })();

  // Render a single tooth card (shared between restorative and aesthetic)
  const renderToothCard = (tooth: DetectedTooth, index: number, prefix: string) => {
    const isSelected = selectedTeeth.includes(tooth.tooth);
    const treatment = toothTreatments[tooth.tooth] || tooth.treatment_indication || 'resina';
    const borderColor = TREATMENT_BORDER_COLORS[treatment] || 'border-l-primary';

    return (
      <div
        key={`${prefix}-${tooth.tooth}-${index}`}
        className={cn(
          'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 border-l-4',
          borderColor,
          isSelected ? 'card-elevated border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30',
        )}
        onClick={() => handleToggleTooth(tooth.tooth, !isSelected)}
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
                tooth.priority === 'baixa' && 'bg-slate-400',
              )} />
              {tooth.priority}
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
                onValueChange={(value) => onToothTreatmentChange(tooth.tooth, value as TreatmentType)}
              >
                <SelectTrigger className="h-8 text-xs border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resina">Resina Composta</SelectItem>
                  <SelectItem value="porcelana">Faceta de Porcelana</SelectItem>
                  <SelectItem value="coroa">Coroa Total</SelectItem>
                  <SelectItem value="implante">Implante</SelectItem>
                  <SelectItem value="endodontia">Tratamento de Canal</SelectItem>
                  <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                  <SelectItem value="gengivoplastia">Gengivoplastia Estética</SelectItem>
                  <SelectItem value="recobrimento_radicular">Recobrimento Radicular</SelectItem>
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold font-display mb-2">{t('components.wizard.review.title')}</h2>
        <p className="text-muted-foreground">
          {hasMultipleTeeth
            ? t('components.wizard.review.multiTeethSubtitle', { count: detectedTeeth.length })
            : t('components.wizard.review.singleToothSubtitle')
          }
        </p>
      </div>

      {/* 1. AI Confidence Banner */}
      {analysisResult && (
        <Card className={`card-elevated border-l-4 ${confidence >= 80 ? 'border-l-success' : confidence >= 60 ? 'border-l-warning' : 'border-l-destructive'}`}>
          <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{t('components.wizard.review.aiAnalysis')}</span>
            </div>
            <div className="flex items-center gap-3">
              {hasMultipleTeeth && (
                <Badge variant="outline" className="text-xs">
                  {t('components.wizard.review.teethDetected', { count: detectedTeeth.length })}
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className={cn('gap-1.5 cursor-help', confidenceColor)}>
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        confidence >= 80 ? 'bg-success' : confidence >= 60 ? 'bg-warning' : 'bg-destructive',
                      )} />
                      {confidence}% — {confidence >= 80 ? t('components.wizard.review.highConfidence') : confidence >= 60 ? t('components.wizard.review.mediumConfidence') : t('components.wizard.review.lowConfidence')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t('components.wizard.review.confidenceTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {onReanalyze && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReanalyze}
                  disabled={isReanalyzing}
                  className="h-7 px-2 btn-press"
                >
                  {isReanalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="ml-1 hidden sm:inline">{t('components.wizard.review.reanalyze')}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-0.5">
                    <Zap className="w-2.5 h-2.5" />1
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Whitening Level Badge */}
      {whiteningLevel && whiteningLevel !== 'natural' && (
        <Card className="card-elevated border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">{t('components.wizard.review.whiteningLevel')}</span>
            <Badge variant="secondary" className="font-medium">
              {whiteningLevel === 'hollywood' ? t('components.wizard.review.hollywoodWhite') : t('components.wizard.review.naturalWhite')}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Gengivoplasty Banner — auto-added from DSD */}
      {selectedTeeth.includes('GENGIVO') && (
        <Card className="border-pink-500/50 bg-pink-50 dark:bg-pink-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-pink-800 dark:text-pink-200">
                    {t('components.wizard.review.gingivoplastyTitle')}
                  </h4>
                  <Badge variant="secondary" className="text-[10px] bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">
                    {t('components.wizard.review.recommendedByDSD')}
                  </Badge>
                </div>
                <p className="text-sm text-pink-700 dark:text-pink-300">
                  {t('components.wizard.review.gingivoplastyDesc')}
                </p>
                {dsdSuggestions && dsdSuggestions.filter(s => {
                  const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
                  return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
                }).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {dsdSuggestions.filter(s => {
                      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
                      return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
                    }).map((s, i) => (
                      <li key={i} className="text-xs text-pink-600 dark:text-pink-400">
                        {t('components.wizard.review.tooth', { number: s.tooth })}: {s.proposed_change}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Warning Banner */}
      {!hasInventory && (
        <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {t('components.wizard.review.noResins')}
              </span>
            </div>
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 btn-press">
                {t('components.wizard.review.registerResins')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Treatment Type Indication Banner */}
      {analysisResult?.treatment_indication === 'porcelana' && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                  {t('components.wizard.review.porcelainTitle')}
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {analysisResult.indication_reason || t('components.wizard.review.porcelainDefault')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {analysisResult?.warnings && analysisResult.warnings.length > 0 && (() => {
        const actualCount = detectedTeeth.length;
        const correctedWarnings = analysisResult.warnings.map(w =>
          w.replace(/Detectados?\s+\d+\s+dentes?/i, `Detectados ${actualCount} dentes`)
        );
        return (
          <Card className="border-warning/50 bg-warning/10 dark:bg-warning/10">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning-foreground dark:text-warning">{t('components.wizard.review.attentionPoints')}</h4>
                  <ul className="mt-2 space-y-1">
                    {correctedWarnings.map((warning, i) => (
                      <li key={i} className="text-sm text-warning">• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* 2. Tooth Selection Cards */}
      {hasMultipleTeeth && (
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
              const detectedToothNumbers = detectedTeeth.map(t => t.tooth);
              const manualTeeth = selectedTeeth.filter(t => !detectedToothNumbers.includes(t) && t !== 'GENGIVO');
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
                                <SelectItem value="resina">Resina Composta</SelectItem>
                                <SelectItem value="porcelana">Faceta de Porcelana</SelectItem>
                                <SelectItem value="coroa">Coroa Total</SelectItem>
                                <SelectItem value="implante">Implante</SelectItem>
                                <SelectItem value="endodontia">Tratamento de Canal</SelectItem>
                                <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
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
                  Cancelar
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
      )}

      {/* 3. Observations — relocated after teeth selection */}
      {analysisResult?.observations && analysisResult.observations.length > 0 && (
        <div className="border-l-2 border-primary/30 pl-4 py-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary/50 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">{t('components.wizard.review.aiObservations')}</p>
              <ul className="space-y-1">
                {analysisResult.observations.map((obs, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {obs}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. Patient Data Card */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {t('components.wizard.review.patientData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <PatientAutocomplete
              value={formData.patientName}
              onChange={(name, patientId, birthDate) => {
                onFormChange({ patientName: name });
                onPatientSelect?.(name, patientId, birthDate);
              }}
              selectedPatientId={selectedPatientId}
              placeholder={t('components.wizard.review.patientNamePlaceholder')}
              label={t('components.wizard.review.patientNameLabel')}
            />

            {/* Birth date + calculated age */}
            <div className="space-y-2">
              <Label>
                {t('components.wizard.review.birthDateLabel')}
              </Label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={t('components.wizard.review.birthDatePlaceholder')}
                    className={cn(
                      "pr-10",
                      dobError && "border-destructive ring-1 ring-destructive"
                    )}
                    disabled={!!selectedPatientId && !!patientBirthDate}
                    value={
                      patientBirthDate && !dobInputText
                        ? format(new Date(patientBirthDate), "dd/MM/yyyy", { locale: ptBR })
                        : dobInputText
                    }
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d/]/g, '');
                      const digits = value.replace(/\//g, '');
                      if (digits.length >= 4) {
                        value = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
                      } else if (digits.length >= 2) {
                        value = digits.slice(0, 2) + '/' + digits.slice(2);
                      }
                      setDobInputText(value);
                      const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                      if (match) {
                        const [, dd, mm, yyyy] = match;
                        const day = parseInt(dd, 10);
                        const month = parseInt(mm, 10);
                        const year = parseInt(yyyy, 10);
                        const date = new Date(year, month - 1, day);
                        if (
                          date.getDate() === day &&
                          date.getMonth() === month - 1 &&
                          date.getFullYear() === year &&
                          date <= new Date() &&
                          year >= 1900
                        ) {
                          const isoDate = date.toISOString().split('T')[0];
                          handleBirthDateChange(isoDate);
                          const age = calculateAge(isoDate);
                          onFormChange({ patientAge: String(age) });
                        }
                      }
                    }}
                    onBlur={() => {
                      if (patientBirthDate) {
                        setDobInputText('');
                      }
                    }}
                  />
                  <Popover open={dobCalendarOpen} onOpenChange={setDobCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        disabled={!!selectedPatientId && !!patientBirthDate}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={patientBirthDate ? new Date(patientBirthDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const isoDate = date.toISOString().split('T')[0];
                            handleBirthDateChange(isoDate);
                            const age = calculateAge(isoDate);
                            onFormChange({ patientAge: String(age) });
                            setDobInputText('');
                            setDobCalendarOpen(false);
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        captionLayout="dropdown-buttons"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {patientBirthDate && (
                  <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary/10 text-primary min-w-[80px] justify-center">
                    <span className="text-sm font-medium">
                      {t('components.wizard.review.yearsOld', { age: calculateAge(patientBirthDate) })}
                    </span>
                  </div>
                )}
              </div>

              {!patientBirthDate && !dobError && (
                <p className="text-xs text-muted-foreground">
                  {t('components.wizard.review.recommendedForPrecision')}
                </p>
              )}

              {selectedPatientId && !patientBirthDate && (
                <p className="text-xs text-muted-foreground">
                  {t('components.wizard.review.addForAutoFill')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5-7. Collapsible sections */}
      <Accordion type="multiple" defaultValue={[]} className="w-full space-y-2">
        {/* 5. Foto & Observações */}
        {imageBase64 && (
          <AccordionItem value="photo" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="text-sm font-medium">{t('components.wizard.review.photoAndObs')}</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <img
                src={imageBase64}
                alt={t('components.wizard.review.analyzedPhoto')}
                className="w-full rounded-lg ring-1 ring-border mb-4"
              />

              {/* DSD Aesthetic Notes */}
              {(dsdObservations?.length || dsdSuggestions?.length) ? (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    {t('components.wizard.review.aestheticNotesDSD')}
                  </h4>
                  {dsdSuggestions && dsdSuggestions.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {dsdSuggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <span className="font-medium">{t('components.wizard.review.tooth', { number: s.tooth })}:</span> {s.proposed_change}
                        </li>
                      ))}
                    </ul>
                  )}
                  {dsdObservations && dsdObservations.length > 0 && (
                    <ul className="space-y-1">
                      {dsdObservations.map((obs, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {obs}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 6. Estética e Orçamento — Pill Toggles */}
        <AccordionItem value="aesthetic" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-sm font-medium">{t('components.wizard.review.aestheticAndBudget')}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label className="text-sm">{t('components.wizard.review.aestheticLevel')}</Label>
                <PillToggle
                  options={[
                    { value: 'funcional', label: t('components.wizard.review.functional') },
                    { value: 'estético', label: t('components.wizard.review.aesthetic') },
                  ]}
                  value={formData.aestheticLevel}
                  onChange={(value) => onFormChange({ aestheticLevel: value })}
                  columns={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t('components.wizard.review.budget')}</Label>
                <PillToggle
                  options={[
                    { value: 'padrão', label: t('components.wizard.review.standard') },
                    { value: 'premium', label: t('components.wizard.review.premium') },
                  ]}
                  value={formData.budget}
                  onChange={(value) => onFormChange({ budget: value })}
                />
              </div>

              {/* Longevidade removida — Issue #11 QA V9 */}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 7. Notas Clínicas */}
        <AccordionItem value="notes" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-sm font-medium">{t('components.wizard.review.clinicalNotes')}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2 space-y-2">
              <div className="relative">
                <Textarea
                  placeholder={t('components.wizard.review.clinicalNotesPlaceholder')}
                  value={formData.clinicalNotes}
                  onChange={(e) => onFormChange({ clinicalNotes: e.target.value })}
                  rows={4}
                />
                {speech.isSupported && (
                  <Button
                    type="button"
                    variant={speech.isListening ? 'destructive' : 'ghost'}
                    size="icon"
                    className={cn(
                      'absolute bottom-2 right-2 h-8 w-8',
                      speech.isListening && 'animate-pulse',
                    )}
                    onClick={speech.toggle}
                  >
                    {speech.isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              {speech.isListening && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {t('components.wizard.review.listening')}
                  {speech.transcript && (
                    <span className="text-muted-foreground truncate">
                      {speech.transcript}
                    </span>
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 8. Summary Card (NEW) */}
      {selectedTeeth.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {t('components.wizard.review.caseSummary')}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">{t('components.wizard.review.teethLabel')}</p>
              <p className="font-semibold text-primary">{realSelectedTeeth.length}{hasGengivoplasty ? t('components.wizard.review.plusGengivo') : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('components.wizard.review.typesLabel')}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {treatmentBreakdown.map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-[10px] font-normal">
                    {count} {type === 'resina' ? t('components.wizard.review.typeResina') : type === 'porcelana' ? t('components.wizard.review.typeFaceta') : type === 'coroa' ? t('components.wizard.review.typeCoroa') : type}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('components.wizard.review.patientLabel')}</p>
              <p className="font-medium text-sm truncate">
                {formData.patientName || t('components.wizard.review.notInformed')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('components.wizard.review.ageLabel')}</p>
              <p className="font-medium text-sm">
                {patientBirthDate ? t('components.wizard.review.yearsOld', { age: calculateAge(patientBirthDate) }) : '—'}
              </p>
            </div>
            {detectedTeeth.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs">{t('components.wizard.review.complexityLabel')}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-0.5 gap-1',
                    complexity.level === 'simples' && 'border-success text-success',
                    complexity.level === 'moderado' && 'border-warning text-warning',
                    complexity.level === 'complexo' && 'border-destructive text-destructive',
                  )}
                >
                  {complexity.level === 'simples' && <ShieldCheck className="w-3 h-3" />}
                  {complexity.level === 'moderado' && <Shield className="w-3 h-3" />}
                  {complexity.level === 'complexo' && <ShieldAlert className="w-3 h-3" />}
                  {complexity.level === 'simples' ? t('components.wizard.review.simple') : complexity.level === 'moderado' ? t('components.wizard.review.moderate') : t('components.wizard.review.complex')}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
