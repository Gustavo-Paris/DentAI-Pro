import { useState } from 'react';
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
import { AlertTriangle, Check, Info, Sparkles, CircleDot, RefreshCw, Loader2, Plus, Wrench, Wand2, Crown, CalendarIcon, Zap, Package, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PatientAutocomplete } from '@/components/PatientAutocomplete';
import { calculateAge } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Expanded treatment types
export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento';

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

// Treatment type labels and icons mapping
export const TREATMENT_LABELS: Record<TreatmentType, string> = {
  resina: 'Resina Composta',
  porcelana: 'Faceta de Porcelana',
  coroa: 'Coroa Total',
  implante: 'Implante',
  endodontia: 'Tratamento de Canal',
  encaminhamento: 'Encaminhamento',
};

export const TREATMENT_DESCRIPTIONS: Record<TreatmentType, string> = {
  resina: 'Protocolo de estratificação',
  porcelana: 'Protocolo de cimentação',
  coroa: 'Protocolo de preparo e cimentação',
  implante: 'Checklist de avaliação para implante',
  endodontia: 'Tratamento endodôntico necessário',
  encaminhamento: 'Encaminhamento para especialista',
};

// Treatment border colors
const TREATMENT_BORDER_COLORS: Record<TreatmentType, string> = {
  resina: 'border-l-primary',
  porcelana: 'border-l-amber-500',
  coroa: 'border-l-blue-500',
  implante: 'border-l-emerald-500',
  endodontia: 'border-l-red-500',
  encaminhamento: 'border-l-purple-500',
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
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualTooth, setManualTooth] = useState('');
  const [internalDobError, setInternalDobError] = useState(false);
  const [dobInputText, setDobInputText] = useState('');
  const [dobCalendarOpen, setDobCalendarOpen] = useState(false);

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
  const confidenceColor = confidence >= 80 ? 'text-green-600 dark:text-green-400' : confidence >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
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

  // Build summary data
  const treatmentBreakdown = (() => {
    const counts: Record<TreatmentType, number> = {
      resina: 0, porcelana: 0, coroa: 0, implante: 0, endodontia: 0, encaminhamento: 0,
    };
    for (const tooth of selectedTeeth) {
      const treatment = toothTreatments[tooth] || detectedTeeth.find(t => t.tooth === tooth)?.treatment_indication || 'resina';
      counts[treatment]++;
    }
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
            <span className="font-semibold text-sm">Dente {tooth.tooth}</span>
            <Badge
              variant={tooth.priority === 'alta' ? 'destructive' : tooth.priority === 'média' ? 'secondary' : 'outline'}
              className="text-[10px]"
            >
              {tooth.priority}
            </Badge>
          </div>

          {/* Treatment badge */}
          <Badge variant="outline" className="text-[10px] mb-1.5">
            {TREATMENT_LABELS[treatment]}
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
                      <p>Restaurar sugestão da IA ({TREATMENT_LABELS[originalToothTreatments[tooth.tooth]]})</p>
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
                    IA: {tooth.indication_reason}
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
        <h2 className="text-2xl font-semibold font-display mb-2">Revisão da Análise</h2>
        <p className="text-muted-foreground">
          {hasMultipleTeeth
            ? `Detectados ${detectedTeeth.length} dentes com problema. Selecione qual tratar primeiro.`
            : 'Confirme ou ajuste os dados detectados pela IA'
          }
        </p>
      </div>

      {/* 1. AI Confidence Banner */}
      {analysisResult && (
        <Card className={`card-elevated border-l-4 ${confidence >= 80 ? 'border-l-green-500' : confidence >= 60 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
          <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm">Análise por IA</span>
            </div>
            <div className="flex items-center gap-3">
              {hasMultipleTeeth && (
                <Badge variant="outline" className="text-xs">
                  {detectedTeeth.length} dentes detectados
                </Badge>
              )}
              <Badge variant="secondary" className={confidenceColor}>
                {confidence}% de confiança
              </Badge>
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
                  <span className="ml-1 hidden sm:inline">Reanalisar</span>
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
            <span className="text-sm text-muted-foreground">Nível de clareamento:</span>
            <Badge variant="secondary" className="font-medium">
              {whiteningLevel === 'hollywood' ? 'Hollywood (BL1)' :
               whiteningLevel === 'white' ? 'Branco (BL2/BL3)' : 'Natural (A1/A2)'}
            </Badge>
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
                Você não tem resinas cadastradas. As recomendações são genéricas.
              </span>
            </div>
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 btn-press">
                Cadastrar resinas
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
                  Indicação: Facetas de Porcelana
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {analysisResult.indication_reason || 'Este caso pode se beneficiar de facetas cerâmicas para melhor resultado estético e durabilidade.'}
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
          <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Pontos de atenção</h4>
                  <ul className="mt-2 space-y-1">
                    {correctedWarnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300">• {warning}</li>
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
              Selecione os Dentes para o Protocolo
              <Badge variant="secondary" className="ml-2">
                {selectedTeeth.length > 0 ? `${selectedTeeth.length} selecionado(s)` : detectedTeeth.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Marque os dentes que deseja incluir no protocolo. Cada dente gerará um caso separado.
            </p>

            {/* Quick selection buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => handleSelectCategory('restorative')} className="text-xs btn-press">
                <Wrench className="w-3 h-3 mr-1" />
                Apenas Necessários ({restorativeTeeth.length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSelectCategory('all')} className="text-xs btn-press">
                <Check className="w-3 h-3 mr-1" />
                Selecionar Todos ({detectedTeeth.length})
              </Button>
              {aestheticTeeth.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => handleSelectCategory('aesthetic')} className="text-xs btn-press">
                  <Wand2 className="w-3 h-3 mr-1" />
                  Apenas Estéticos ({aestheticTeeth.length})
                </Button>
              )}
              {selectedTeeth.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onSelectedTeethChange?.([])} className="text-xs text-muted-foreground">
                  Limpar seleção
                </Button>
              )}
            </div>

            {/* Restorative teeth section */}
            {restorativeTeeth.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-destructive" />
                  <h4 className="font-medium text-sm">Tratamentos Necessários</h4>
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
                  <h4 className="font-medium text-sm">Melhorias Estéticas (Opcionais)</h4>
                  <Badge variant="secondary" className="text-xs">{aestheticTeeth.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Sugestões para harmonização do sorriso detectadas pela IA
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aestheticTeeth.map((tooth, index) => renderToothCard(tooth, index, 'aesthetic'))}
                </div>
              </div>
            )}

            {/* Manually added teeth */}
            {(() => {
              const detectedToothNumbers = detectedTeeth.map(t => t.tooth);
              const manualTeeth = selectedTeeth.filter(t => !detectedToothNumbers.includes(t));
              if (manualTeeth.length === 0) return null;
              return (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Plus className="w-3 h-3" />
                    Dentes adicionados manualmente
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
                            <span className="font-semibold text-sm">Dente {toothNum}</span>
                            <Badge variant="outline" className="text-xs">manual</Badge>
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
                Adicionar dente manualmente
              </Button>
            ) : (
              <div className="mt-4 flex gap-2">
                <Select value={manualTooth} onValueChange={setManualTooth}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o dente" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Superior</div>
                    {TEETH.upper.map((t) => (
                      <SelectItem key={t} value={t} disabled={selectedTeeth.includes(t)}>
                        {t} {selectedTeeth.includes(t) && '(já adicionado)'}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Inferior</div>
                    {TEETH.lower.map((t) => (
                      <SelectItem key={t} value={t} disabled={selectedTeeth.includes(t)}>
                        {t} {selectedTeeth.includes(t) && '(já adicionado)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddManualTooth} disabled={!manualTooth} className="btn-press">
                  Adicionar
                </Button>
                <Button variant="ghost" onClick={() => setShowManualAdd(false)}>
                  Cancelar
                </Button>
              </div>
            )}

            {selectedTeeth.length > 0 && (
              <p className="text-sm text-primary mt-4 text-center font-medium">
                {selectedTeeth.length} dente(s) selecionado(s) para gerar protocolo
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
              <p className="text-sm font-medium mb-1">Observações da IA</p>
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
            Dados do Paciente
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
              placeholder="Nome do paciente"
              label="Nome (opcional)"
            />

            {/* Birth date + calculated age */}
            <div className="space-y-2">
              <Label>
                Data de Nascimento <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
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
                      {calculateAge(patientBirthDate)} anos
                    </span>
                  </div>
                )}
              </div>

              {dobError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Informe a data de nascimento para gerar o caso
                </p>
              )}

              {selectedPatientId && !patientBirthDate && !dobError && (
                <p className="text-xs text-muted-foreground">
                  Adicione para preencher automaticamente nas próximas vezes
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
              <span className="text-sm font-medium">Foto & Observações</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <img
                src={imageBase64}
                alt="Foto analisada"
                className="w-full rounded-lg ring-1 ring-border mb-4"
              />

              {/* DSD Aesthetic Notes */}
              {(dsdObservations?.length || dsdSuggestions?.length) ? (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    Notas Estéticas (DSD)
                  </h4>
                  {dsdSuggestions && dsdSuggestions.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {dsdSuggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <span className="font-medium">Dente {s.tooth}:</span> {s.proposed_change}
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
            <span className="text-sm font-medium">Estética e Orçamento</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label className="text-sm">Nível de exigência estética</Label>
                <PillToggle
                  options={[
                    { value: 'muito alto', label: 'Muito Alto' },
                    { value: 'alto', label: 'Alto' },
                    { value: 'médio', label: 'Médio' },
                    { value: 'baixo', label: 'Baixo' },
                  ]}
                  value={formData.aestheticLevel}
                  onChange={(value) => onFormChange({ aestheticLevel: value })}
                  columns={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Orçamento</Label>
                <PillToggle
                  options={[
                    { value: 'premium', label: 'Premium' },
                    { value: 'moderado', label: 'Moderado' },
                    { value: 'econômico', label: 'Econômico' },
                  ]}
                  value={formData.budget}
                  onChange={(value) => onFormChange({ budget: value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Expectativa de longevidade</Label>
                <PillToggle
                  options={[
                    { value: 'longo', label: 'Longo' },
                    { value: 'médio', label: 'Médio' },
                    { value: 'curto', label: 'Curto' },
                  ]}
                  value={formData.longevityExpectation}
                  onChange={(value) => onFormChange({ longevityExpectation: value })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 7. Notas Clínicas */}
        <AccordionItem value="notes" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-sm font-medium">Notas Clínicas</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              <Textarea
                placeholder="Adicione observações clínicas, histórico relevante, ou detalhes específicos do caso..."
                value={formData.clinicalNotes}
                onChange={(e) => onFormChange({ clinicalNotes: e.target.value })}
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 8. Summary Card (NEW) */}
      {selectedTeeth.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Resumo do Caso
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Dentes</p>
              <p className="font-semibold text-gradient-gold">{selectedTeeth.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Tipos</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {treatmentBreakdown.map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-[10px] font-normal">
                    {count} {type === 'resina' ? 'Resina' : type === 'porcelana' ? 'Faceta' : type === 'coroa' ? 'Coroa' : type}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Paciente</p>
              <p className="font-medium text-sm truncate">
                {formData.patientName || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Idade</p>
              <p className="font-medium text-sm">
                {patientBirthDate ? `${calculateAge(patientBirthDate)} anos` : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
