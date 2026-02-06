import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { AlertTriangle, Check, Info, Sparkles, CircleDot, RefreshCw, Loader2, Plus, Wrench, Wand2, Crown, CalendarIcon, Zap, Package } from 'lucide-react';
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
  /** Original AI-suggested treatments per tooth (for undo) */
  originalToothTreatments?: Record<string, TreatmentType>;
  /** Restore a tooth to its original AI suggestion */
  onRestoreAiSuggestion?: (tooth: string) => void;
  /** Whether the user has inventory items */
  hasInventory?: boolean;
  selectedPatientId?: string | null;
  onPatientSelect?: (name: string, patientId?: string, birthDate?: string | null) => void;
  patientBirthDate?: string | null;
  onPatientBirthDateChange?: (date: string | null) => void;
  dobError?: boolean;
  onDobErrorChange?: (hasError: boolean) => void;
  /** Patient's whitening preference from step 2 */
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
  /** DSD aesthetic observations (complementary info, not a separate tooth list) */
  dsdObservations?: string[];
  /** DSD suggestions for context (displayed as aesthetic notes) */
  dsdSuggestions?: { tooth: string; current_issue: string; proposed_change: string }[];
}

const TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

// Cavity class options for restorative procedures
const CAVITY_OPTIONS_RESTORATIVE = [
  { value: 'Classe I', label: 'Classe I' },
  { value: 'Classe II', label: 'Classe II' },
  { value: 'Classe III', label: 'Classe III' },
  { value: 'Classe IV', label: 'Classe IV' },
  { value: 'Classe V', label: 'Classe V' },
  { value: 'Classe VI', label: 'Classe VI' },
];

// Procedure options for purely aesthetic cases (no cavity)
const PROCEDURE_OPTIONS_AESTHETIC = [
  { value: 'Faceta Direta', label: 'Faceta Direta' },
  { value: 'Recontorno Estético', label: 'Recontorno Estético' },
  { value: 'Fechamento de Diastema', label: 'Fechamento de Diastema' },
  { value: 'Reparo de Restauração', label: 'Reparo de Restauração' },
];

// Helper to detect if AI indication suggests aesthetic procedure
const isAestheticProcedure = (indicationReason: string | undefined | null, priority: string | undefined | null): boolean => {
  if (!indicationReason) return priority === 'baixa';
  const lower = indicationReason.toLowerCase();
  const aestheticKeywords = ['faceta', 'recontorno', 'diastema', 'estético', 'estética', 'harmonia', 'melhoria estética', 'textura'];
  return aestheticKeywords.some(kw => lower.includes(kw)) || priority === 'baixa';
};

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

      {/* Whitening Level Badge */}
      {whiteningLevel && whiteningLevel !== 'natural' && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Nível de clareamento:</span>
            <Badge variant="secondary" className="font-medium">
              {whiteningLevel === 'hollywood' ? '✨ Hollywood (BL1)' :
               whiteningLevel === 'white' ? '🦷 Branco (BL2/BL3)' : 'Natural (A1/A2)'}
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
              <Button variant="outline" size="sm" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                Cadastrar resinas
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* AI Confidence Banner */}
      {analysisResult && (
        <Card className={`border-l-4 ${confidence >= 80 ? 'border-l-green-500' : confidence >= 60 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
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
                  className="h-7 px-2"
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
        // Fix stale tooth count in warnings (clinical analysis wrote "6 dentes"
        // but DSD union may have added more, making actual count 8)
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

      {/* Multi-tooth Selection with Categories */}
      {hasMultipleTeeth && (
        <Card className="border-primary/50">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectCategory('restorative')}
                className="text-xs"
              >
                <Wrench className="w-3 h-3 mr-1" />
                Apenas Necessários ({restorativeTeeth.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectCategory('all')}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Selecionar Todos ({detectedTeeth.length})
              </Button>
              {aestheticTeeth.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectCategory('aesthetic')}
                  className="text-xs"
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Apenas Estéticos ({aestheticTeeth.length})
                </Button>
              )}
              {selectedTeeth.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectedTeethChange?.([])}
                  className="text-xs text-muted-foreground"
                >
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
                  {restorativeTeeth.map((tooth, index) => {
                    const isSelected = selectedTeeth.includes(tooth.tooth);
                    return (
                      <div
                        key={`restorative-${tooth.tooth}-${index}`}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleToggleTooth(tooth.tooth, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleTooth(tooth.tooth, !!checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Dente {tooth.tooth}</span>
                            <Badge 
                              variant={tooth.priority === 'alta' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {tooth.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {(() => {
                              const showCavity = tooth.cavity_class && !['coroa', 'implante', 'encaminhamento'].includes(tooth.treatment_indication || '');
                              const parts: string[] = [];
                              if (showCavity) parts.push(tooth.cavity_class!);
                              if (tooth.restoration_size) parts.push(tooth.restoration_size);
                              if (tooth.depth) parts.push(tooth.depth);
                              return parts.join(' • ');
                            })()}
                          </div>
                          
                          {/* Per-tooth treatment selector */}
                          {isSelected && onToothTreatmentChange && (
                            <div className="flex items-center gap-1">
                              <Select
                                value={toothTreatments[tooth.tooth] || tooth.treatment_indication || 'resina'}
                                onValueChange={(value) => onToothTreatmentChange(tooth.tooth, value as TreatmentType)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="resina">🔧 Resina Composta</SelectItem>
                                  <SelectItem value="porcelana">👑 Faceta de Porcelana</SelectItem>
                                  <SelectItem value="coroa">💎 Coroa Total</SelectItem>
                                  <SelectItem value="implante">🦷 Implante</SelectItem>
                                  <SelectItem value="endodontia">🩺 Tratamento de Canal</SelectItem>
                                  <SelectItem value="encaminhamento">↗️ Encaminhamento</SelectItem>
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

                          {/* Treatment indication from AI */}
                          {tooth.indication_reason && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              IA: {tooth.indication_reason}
                            </p>
                          )}
                          {tooth.notes && !tooth.indication_reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{tooth.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  {aestheticTeeth.map((tooth, index) => {
                    const isSelected = selectedTeeth.includes(tooth.tooth);
                    return (
                      <div
                        key={`aesthetic-${tooth.tooth}-${index}`}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleToggleTooth(tooth.tooth, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleTooth(tooth.tooth, !!checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Dente {tooth.tooth}</span>
                            <Badge variant="secondary" className="text-xs">estética</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {tooth.notes || 'Melhoria estética opcional'}
                          </div>
                          
                          {/* Per-tooth treatment selector for aesthetic */}
                          {isSelected && onToothTreatmentChange && (
                            <div className="flex items-center gap-1">
                              <Select
                                value={toothTreatments[tooth.tooth] || tooth.treatment_indication || 'resina'}
                                onValueChange={(value) => onToothTreatmentChange(tooth.tooth, value as TreatmentType)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="resina">🔧 Resina Composta</SelectItem>
                                  <SelectItem value="porcelana">👑 Faceta de Porcelana</SelectItem>
                                  <SelectItem value="coroa">💎 Coroa Total</SelectItem>
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

                          {tooth.indication_reason && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              IA: {tooth.indication_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manually added teeth (not from AI detection) */}
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
                        className="flex items-center gap-3 p-3 border rounded-lg border-primary bg-primary/5"
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
                              <SelectTrigger className="h-8 text-xs">
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
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => setShowManualAdd(true)}
              >
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
                <Button onClick={handleAddManualTooth} disabled={!manualTooth}>
                  Adicionar
                </Button>
                <Button variant="ghost" onClick={() => setShowManualAdd(false)}>
                  Cancelar
                </Button>
              </div>
            )}

            {selectedTeeth.length > 0 && (
              <p className="text-sm text-primary mt-4 text-center font-medium">
                ✓ {selectedTeeth.length} dente(s) selecionado(s) para gerar protocolo
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Preview Image */}
        {imageBase64 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Foto Analisada</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={imageBase64}
                alt="Foto analisada"
                className="w-full rounded-lg"
              />
              {analysisResult?.observations && analysisResult.observations.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Observações da IA
                  </h4>
                  <ul className="space-y-1">
                    {analysisResult.observations.map((obs, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {obs}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* DSD Aesthetic Notes */}
              {(dsdObservations?.length || dsdSuggestions?.length) ? (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    Notas Estéticas (DSD)
                  </h4>
                  {dsdSuggestions && dsdSuggestions.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {dsdSuggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • <span className="font-medium">Dente {s.tooth}:</span> {s.proposed_change}
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
            </CardContent>
          </Card>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Patient Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dados do Paciente</CardTitle>
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
                          // Auto-insert slashes as user types
                          const digits = value.replace(/\//g, '');
                          if (digits.length >= 4) {
                            value = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
                          } else if (digits.length >= 2) {
                            value = digits.slice(0, 2) + '/' + digits.slice(2);
                          }
                          setDobInputText(value);
                          // Parse complete date (DD/MM/YYYY)
                          const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                          if (match) {
                            const [, dd, mm, yyyy] = match;
                            const day = parseInt(dd, 10);
                            const month = parseInt(mm, 10);
                            const year = parseInt(yyyy, 10);
                            const date = new Date(year, month - 1, day);
                            // Validate: real date, not in future, reasonable range
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
                          // On blur, if we have a valid date, clear the input text to show formatted value
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

                    {/* Show calculated age */}
                    {patientBirthDate && (
                      <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary/10 text-primary min-w-[80px] justify-center">
                        <span className="text-sm font-medium">
                          {calculateAge(patientBirthDate)} anos
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Error message for DOB */}
                  {dobError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Informe a data de nascimento para gerar o caso
                    </p>
                  )}

                  {/* Hint for existing patients */}
                  {selectedPatientId && !patientBirthDate && !dobError && (
                    <p className="text-xs text-muted-foreground">
                      Adicione para preencher automaticamente nas próximas vezes
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical data auto-filled from AI analysis */}
        </div>
      </div>

      {/* Aesthetic and Budget - Separate Accordion */}
      <Accordion type="single" collapsible defaultValue="aesthetic" className="w-full">
        <AccordionItem value="aesthetic">
          <AccordionTrigger>Estética e Orçamento</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <Label>Nível de exigência estética</Label>
                <RadioGroup
                  value={formData.aestheticLevel}
                  onValueChange={(value) => onFormChange({ aestheticLevel: value })}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {[
                    { value: 'muito alto', label: 'Muito Alto' },
                    { value: 'alto', label: 'Alto' },
                    { value: 'médio', label: 'Médio' },
                    { value: 'baixo', label: 'Baixo' },
                  ].map((level) => (
                    <div key={level.value}>
                      <RadioGroupItem
                        value={level.value}
                        id={`aes-${level.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`aes-${level.value}`}
                        className="flex items-center justify-center p-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Orçamento</Label>
                <RadioGroup
                  value={formData.budget}
                  onValueChange={(value) => onFormChange({ budget: value })}
                  className="grid grid-cols-3 gap-2"
                >
                  {['premium', 'moderado', 'econômico'].map((budget) => (
                    <div key={budget}>
                      <RadioGroupItem
                        value={budget}
                        id={`budget-${budget}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`budget-${budget}`}
                        className="flex items-center justify-center p-3 border rounded-lg cursor-pointer capitalize peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {budget}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Expectativa de longevidade</Label>
                <RadioGroup
                  value={formData.longevityExpectation}
                  onValueChange={(value) => onFormChange({ longevityExpectation: value })}
                  className="grid grid-cols-3 gap-2"
                >
                  {['longo', 'médio', 'curto'].map((exp) => (
                    <div key={exp}>
                      <RadioGroupItem
                        value={exp}
                        id={`long-${exp}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`long-${exp}`}
                        className="flex items-center justify-center p-3 border rounded-lg cursor-pointer capitalize peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {exp}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notes">
          <AccordionTrigger>Notas Clínicas</AccordionTrigger>
          <AccordionContent>
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
    </div>
  );
}