import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
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
import { AlertTriangle, Check, Info, Sparkles, CircleDot, RefreshCw, Loader2 } from 'lucide-react';

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
}

export interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
}

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
}

interface ReviewAnalysisStepProps {
  analysisResult: PhotoAnalysisResult | null;
  formData: ReviewFormData;
  onFormChange: (data: Partial<ReviewFormData>) => void;
  imageBase64: string | null;
  onToothSelect?: (tooth: DetectedTooth) => void;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
}

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
}: ReviewAnalysisStepProps) {
  const confidence = analysisResult?.confidence ?? 0;
  const confidenceColor = confidence >= 80 ? 'text-green-600' : confidence >= 60 ? 'text-yellow-600' : 'text-red-600';
  const detectedTeeth = analysisResult?.detected_teeth || [];
  const hasMultipleTeeth = detectedTeeth.length > 1;

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

      {/* Multi-tooth Selection */}
      {hasMultipleTeeth && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-primary" />
              Dentes Detectados
              <Badge variant="secondary" className="ml-2">{detectedTeeth.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em um dente para preencher os dados automaticamente. Cada dente pode gerar um caso separado.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {detectedTeeth.map((tooth, index) => (
                <Button
                  key={`${tooth.tooth}-${index}`}
                  variant={formData.tooth === tooth.tooth ? "default" : "outline"}
                  className="h-auto py-3 px-4 flex flex-col items-start relative"
                  onClick={() => handleSelectDetectedTooth(tooth)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-lg">Dente {tooth.tooth}</span>
                    <Badge 
                      variant={tooth.priority === 'alta' ? 'destructive' : tooth.priority === 'baixa' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {tooth.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-left mt-1 opacity-80">
                    {tooth.cavity_class && <span>{tooth.cavity_class}</span>}
                    {tooth.restoration_size && <span> • {tooth.restoration_size}</span>}
                  </div>
                  {formData.tooth === tooth.tooth && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              💡 Dica: Complete este caso primeiro, depois volte para criar os demais.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview Image */}
        {imageBase64 && (
          <Card className="lg:row-span-2">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nome (opcional)</Label>
                  <Input
                    id="patientName"
                    placeholder="Nome do paciente"
                    value={formData.patientName}
                    onChange={(e) => onFormChange({ patientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientAge">Idade *</Label>
                  <Input
                    id="patientAge"
                    type="number"
                    placeholder="Ex: 35"
                    value={formData.patientAge}
                    onChange={(e) => onFormChange({ patientAge: e.target.value })}
                    required
                  />
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
      <Accordion type="single" collapsible className="w-full">
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
                  className="grid grid-cols-3 gap-2"
                >
                  {[
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
                  {['premium', 'intermediário', 'econômico'].map((budget) => (
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
                  {['alta', 'média', 'baixa'].map((exp) => (
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