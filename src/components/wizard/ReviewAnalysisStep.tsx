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
import { AlertTriangle, Check, Info, Sparkles, CircleDot, RefreshCw, Loader2, Plus, Wrench, Wand2, Crown, Stethoscope, CircleX, ArrowUpRight, CalendarIcon } from 'lucide-react';
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
  selectedPatientId?: string | null;
  onPatientSelect?: (name: string, patientId?: string, birthDate?: string | null) => void;
  patientBirthDate?: string | null;
  onPatientBirthDateChange?: (date: string | null) => void;
}

// Get icon for treatment type
const getTreatmentIcon = (treatment: TreatmentType) => {
  switch (treatment) {
    case 'resina': return Wrench;
    case 'porcelana': return Crown;
    case 'coroa': return Crown;
    case 'implante': return CircleX;
    case 'endodontia': return Stethoscope;
    case 'encaminhamento': return ArrowUpRight;
    default: return Wrench;
  }
};

// Get style for treatment type
const getTreatmentStyle = (treatment: TreatmentType) => {
  switch (treatment) {
    case 'resina': return 'border-primary/50 bg-primary/5';
    case 'porcelana': return 'border-warning/50 bg-warning/5';
    case 'coroa': return 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/20';
    case 'implante': return 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/20';
    case 'endodontia': return 'border-rose-500/50 bg-rose-50 dark:bg-rose-950/20';
    case 'encaminhamento': return 'border-muted bg-muted/20';
    default: return '';
  }
};

const TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

const priorityStyles = {
  alta: 'bg-destructive text-destructive-foreground',
  média: 'bg-warning text-warning-foreground border border-warning-foreground/20',
  baixa: 'bg-secondary text-secondary-foreground',
};

export function ReviewAnalysisStep({
  analysisResult,
  formData,
  onFormChange,
  imageBase64,
  onToothSelect,
  onReanalyze,
  isReanalyzing = false,
  selectedTeeth = [],
  onSelectedTeethChange,
  toothTreatments = {},
  onToothTreatmentChange,
  selectedPatientId,
  onPatientSelect,
  patientBirthDate,
  onPatientBirthDateChange,
}: ReviewAnalysisStepProps) {
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualTooth, setManualTooth] = useState('');
  
  const confidence = analysisResult?.confidence ?? 0;
  const confidenceColor = confidence >= 80 ? 'text-green-600' : confidence >= 60 ? 'text-yellow-600' : 'text-red-600';
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

  // Handle selecting a detected tooth
  const handleSelectDetectedTooth = (tooth: DetectedTooth) => {
    onFormChange({
      tooth: tooth.tooth,
      toothRegion: tooth.tooth_region || formData.toothRegion,
      cavityClass: tooth.cavity_class || formData.cavityClass,
      restorationSize: tooth.restoration_size || formData.restorationSize,
      substrate: tooth.substrate || formData.substrate,
      substrateCondition: tooth.substrate_condition || formData.substrateCondition,
      enamelCondition: tooth.enamel_condition || formData.enamelCondition,
      depth: tooth.depth || formData.depth,
    });
    if (onToothSelect) {
      onToothSelect(tooth);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Revisão da Análise</h2>
        <p className="text-muted-foreground">
          {hasMultipleTeeth 
            ? `Detectados ${detectedTeeth.length} dentes com problema. Selecione qual tratar primeiro.`
            : 'Confirme ou ajuste os dados detectados pela IA'
          }
        </p>
      </div>

      {/* AI Confidence Banner */}
      {analysisResult && (
        <Card className={`border-l-4 ${confidence >= 80 ? 'border-l-green-500' : confidence >= 60 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
          <CardContent className="py-3 flex items-center justify-between">
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
              <Crown className="w-5 h-5 text-amber-600 mt-0.5" />
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
      {analysisResult?.warnings && analysisResult.warnings.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Pontos de atenção</h4>
                <ul className="mt-2 space-y-1">
                  {analysisResult.warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300">• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                            {tooth.cavity_class && <span>{tooth.cavity_class}</span>}
                            {tooth.restoration_size && <span> • {tooth.restoration_size}</span>}
                            {tooth.depth && <span> • {tooth.depth}</span>}
                          </div>
                          
                          {/* Per-tooth treatment selector */}
                          {isSelected && onToothTreatmentChange && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Label>Data de Nascimento *</Label>
                  <div className="flex gap-2 items-start">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !patientBirthDate && "text-muted-foreground"
                          )}
                          disabled={!!selectedPatientId && !!patientBirthDate}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {patientBirthDate 
                            ? format(new Date(patientBirthDate), "dd/MM/yyyy", { locale: ptBR })
                            : "Selecionar data"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={patientBirthDate ? new Date(patientBirthDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const isoDate = date.toISOString().split('T')[0];
                              onPatientBirthDateChange?.(isoDate);
                              // Auto-calculate and set age
                              const age = calculateAge(isoDate);
                              onFormChange({ patientAge: String(age) });
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
                    
                    {/* Show calculated age */}
                    {patientBirthDate && (
                      <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary/10 text-primary min-w-[80px] justify-center">
                        <span className="text-sm font-medium">
                          {calculateAge(patientBirthDate)} anos
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Hint for existing patients */}
                  {selectedPatientId && !patientBirthDate && (
                    <p className="text-xs text-muted-foreground">
                      Adicione para preencher automaticamente nas próximas vezes
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detected Data */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Dados Detectados
                <Badge variant="outline" className="font-normal">
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dente *</Label>
                  <Select
                    value={formData.tooth}
                    onValueChange={(value) => onFormChange({ tooth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Superior</div>
                      {TEETH.upper.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Inferior</div>
                      {TEETH.lower.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select
                    value={formData.cavityClass}
                    onValueChange={(value) => onFormChange({ cavityClass: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V', 'Classe VI'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor VITA</Label>
                  <Input
                    value={formData.vitaShade}
                    onChange={(e) => onFormChange({ vitaShade: e.target.value })}
                    placeholder="Ex: A2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tamanho</Label>
                  <Select
                    value={formData.restorationSize}
                    onValueChange={(value) => onFormChange({ restorationSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Pequena', 'Média', 'Grande', 'Extensa'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Substrato</Label>
                  <Select
                    value={formData.substrate}
                    onValueChange={(value) => onFormChange({ substrate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Esmalte', 'Dentina', 'Esmalte e Dentina', 'Dentina profunda'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profundidade</Label>
                  <Select
                    value={formData.depth}
                    onValueChange={(value) => onFormChange({ depth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Superficial', 'Média', 'Profunda'].map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Details - Accordion */}
      <Accordion type="single" collapsible defaultValue="aesthetic" className="w-full">
        <AccordionItem value="clinical">
          <AccordionTrigger>Detalhes Clínicos Adicionais</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condição do Substrato</Label>
                  <Select
                    value={formData.substrateCondition}
                    onValueChange={(value) => onFormChange({ substrateCondition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Saudável', 'Esclerótico', 'Manchado', 'Cariado', 'Desidratado'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condição do Esmalte</Label>
                  <Select
                    value={formData.enamelCondition}
                    onValueChange={(value) => onFormChange({ enamelCondition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Íntegro', 'Fraturado', 'Hipoplásico', 'Fluorose', 'Erosão'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Paciente com bruxismo?</Label>
                  <p className="text-sm text-muted-foreground">Ranger ou apertar os dentes</p>
                </div>
                <RadioGroup
                  value={formData.bruxism ? 'yes' : 'no'}
                  onValueChange={(value) => onFormChange({ bruxism: value === 'yes' })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="brux-yes" />
                    <Label htmlFor="brux-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="brux-no" />
                    <Label htmlFor="brux-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

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