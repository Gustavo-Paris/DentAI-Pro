import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Wrench, Crown, Stethoscope, CircleX, ArrowUpRight, Wand2 } from 'lucide-react';

export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento';

// Interface for pending teeth from database - allows Json type for tooth_bounds
export interface PendingTooth {
  id: string;
  session_id: string;
  user_id: string;
  tooth: string;
  priority: string | null;
  treatment_indication: string | null;
  indication_reason: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  tooth_region: string | null;
  tooth_bounds: unknown; // Json type from database
  created_at?: string;
}

interface AddTeethModalProps {
  open: boolean;
  onClose: () => void;
  pendingTeeth: PendingTooth[];
  sessionId: string;
  patientData: {
    name: string | null;
    age: number;
    id: string | null;
    vitaShade: string;
    bruxism: boolean;
    aestheticLevel: string;
    budget: string;
    longevityExpectation: string;
    photoPath: string | null;
  };
  onSuccess: () => void;
}

const TREATMENT_LABELS: Record<TreatmentType, string> = {
  resina: 'Resina Composta',
  porcelana: 'Faceta de Porcelana',
  coroa: 'Coroa Total',
  implante: 'Implante',
  endodontia: 'Tratamento de Canal',
  encaminhamento: 'Encaminhamento',
};

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

const priorityStyles: Record<string, string> = {
  alta: 'bg-destructive text-destructive-foreground',
  média: 'bg-warning text-warning-foreground border border-warning-foreground/20',
  baixa: 'bg-secondary text-secondary-foreground',
};

// Helper to determine full region format
const getFullRegion = (tooth: string): string => {
  const toothNum = parseInt(tooth);
  const isUpper = toothNum >= 10 && toothNum <= 28;
  const anteriorTeeth = ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'];
  const isAnterior = anteriorTeeth.includes(tooth);
  
  if (isAnterior) {
    return isUpper ? 'anterior-superior' : 'anterior-inferior';
  }
  return isUpper ? 'posterior-superior' : 'posterior-inferior';
};

// Generate generic protocol for non-restorative treatments
const getGenericProtocol = (treatmentType: TreatmentType, tooth: string, toothData: PendingTooth) => {
  const protocols: Record<string, { summary: string; checklist: string[]; alerts: string[]; recommendations: string[] }> = {
    implante: {
      summary: `Dente ${tooth} indicado para extração e reabilitação com implante.`,
      checklist: [
        'Solicitar tomografia computadorizada cone beam',
        'Avaliar quantidade e qualidade óssea disponível',
        'Verificar espaço protético adequado',
        'Avaliar condição periodontal dos dentes adjacentes',
        'Planejar tempo de osseointegração',
        'Discutir opções de prótese provisória',
        'Encaminhar para cirurgião implantodontista',
        'Agendar retorno para acompanhamento',
      ],
      alerts: [
        'Avaliar contraindicações sistêmicas para cirurgia',
        'Verificar uso de bifosfonatos ou anticoagulantes',
      ],
      recommendations: [
        'Manter higiene oral adequada',
        'Evitar fumar durante o tratamento',
      ],
    },
    coroa: {
      summary: `Dente ${tooth} indicado para restauração com coroa total.`,
      checklist: [
        'Realizar preparo coronário seguindo princípios biomecânicos',
        'Avaliar necessidade de núcleo/pino intrarradicular',
        'Selecionar material da coroa',
        'Moldagem de trabalho',
        'Confecção de provisório adequado',
        'Prova da infraestrutura',
        'Seleção de cor com escala VITA',
        'Cimentação definitiva',
        'Ajuste oclusal',
        'Orientações de higiene',
      ],
      alerts: [
        'Verificar saúde pulpar antes do preparo',
        'Avaliar relação coroa-raiz',
      ],
      recommendations: [
        'Proteger o provisório durante a espera',
        'Evitar alimentos duros e pegajosos',
      ],
    },
    endodontia: {
      summary: `Dente ${tooth} necessita de tratamento endodôntico antes de restauração definitiva.`,
      checklist: [
        'Confirmar diagnóstico pulpar',
        'Solicitar radiografia periapical',
        'Avaliar anatomia radicular',
        'Planejamento do acesso endodôntico',
        'Instrumentação e irrigação dos canais',
        'Medicação intracanal se necessário',
        'Obturação dos canais radiculares',
        'Radiografia de controle pós-obturação',
        'Agendar restauração definitiva',
      ],
      alerts: [
        'Avaliar necessidade de retratamento',
        'Verificar presença de lesão periapical',
      ],
      recommendations: [
        'Evitar mastigar do lado tratado até restauração definitiva',
        'Retornar imediatamente se houver dor intensa ou inchaço',
      ],
    },
    encaminhamento: {
      summary: `Dente ${tooth} requer avaliação especializada.`,
      checklist: [
        'Documentar achados clínicos',
        'Realizar radiografias necessárias',
        'Preparar relatório para o especialista',
        'Identificar especialidade adequada',
        'Orientar paciente sobre próximos passos',
        'Agendar retorno para acompanhamento',
      ],
      alerts: [
        'Urgência do encaminhamento depende do diagnóstico',
        'Manter comunicação com especialista',
      ],
      recommendations: [
        'Levar exames e relatório ao especialista',
        'Informar sobre medicamentos em uso',
      ],
    },
  };

  const protocol = protocols[treatmentType] || protocols.encaminhamento;
  
  return {
    treatment_type: treatmentType,
    tooth: tooth,
    ai_reason: toothData?.indication_reason || null,
    ...protocol,
  };
};

export function AddTeethModal({
  open,
  onClose,
  pendingTeeth,
  sessionId,
  patientData,
  onSuccess,
}: AddTeethModalProps) {
  const { user } = useAuth();
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [toothTreatments, setToothTreatments] = useState<Record<string, TreatmentType>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize treatments from AI indications
  const getToothTreatment = (tooth: PendingTooth): TreatmentType => {
    return (toothTreatments[tooth.tooth] || tooth.treatment_indication || 'resina') as TreatmentType;
  };

  const handleToggleTooth = (tooth: string, checked: boolean) => {
    if (checked) {
      setSelectedTeeth([...selectedTeeth, tooth]);
    } else {
      setSelectedTeeth(selectedTeeth.filter(t => t !== tooth));
    }
  };

  const handleTreatmentChange = (tooth: string, treatment: TreatmentType) => {
    setToothTreatments(prev => ({ ...prev, [tooth]: treatment }));
  };

  const handleSelectAll = () => {
    setSelectedTeeth(pendingTeeth.map(t => t.tooth));
  };

  const handleClearSelection = () => {
    setSelectedTeeth([]);
  };

  const handleSubmit = async () => {
    if (!user || selectedTeeth.length === 0) return;
    
    setIsSubmitting(true);
    const createdIds: string[] = [];
    const treatmentCounts: Record<string, number> = {};

    try {
      for (const toothNumber of selectedTeeth) {
        const toothData = pendingTeeth.find(t => t.tooth === toothNumber);
        if (!toothData) continue;

        const treatmentType = getToothTreatment(toothData);
        treatmentCounts[treatmentType] = (treatmentCounts[treatmentType] || 0) + 1;

        // Create evaluation record
        const insertData = {
          user_id: user.id,
          session_id: sessionId,
          patient_id: patientData.id || null,
          patient_name: patientData.name || null,
          patient_age: patientData.age,
          tooth: toothNumber,
          region: toothData.tooth_region || getFullRegion(toothNumber),
          cavity_class: toothData.cavity_class || 'Classe I',
          restoration_size: toothData.restoration_size || 'Média',
          substrate: toothData.substrate || 'Esmalte e Dentina',
          tooth_color: patientData.vitaShade,
          depth: toothData.depth || 'Média',
          substrate_condition: toothData.substrate_condition || 'Saudável',
          enamel_condition: toothData.enamel_condition || 'Íntegro',
          bruxism: patientData.bruxism,
          aesthetic_level: patientData.aestheticLevel,
          budget: patientData.budget,
          longevity_expectation: patientData.longevityExpectation,
          photo_frontal: patientData.photoPath,
          status: 'analyzing',
          treatment_type: treatmentType,
          desired_tooth_shape: 'natural',
          ai_treatment_indication: toothData.treatment_indication,
          ai_indication_reason: toothData.indication_reason,
          tooth_bounds: toothData.tooth_bounds,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase typing requires cast for dynamic data
        const { data: evaluation, error: evalError } = await supabase
          .from('evaluations')
          .insert(insertData as never)
          .select()
          .single();

        if (evalError) throw evalError;
        createdIds.push(evaluation.id);

        // Call appropriate edge function based on treatment type
        switch (treatmentType) {
          case 'porcelana':
            const { error: cementError } = await supabase.functions.invoke('recommend-cementation', {
              body: {
                evaluationId: evaluation.id,
                teeth: [toothNumber],
                shade: patientData.vitaShade,
                ceramicType: 'Dissilicato de lítio',
                substrate: toothData.substrate || 'Esmalte e Dentina',
                substrateCondition: toothData.substrate_condition || 'Saudável',
              },
            });
            if (cementError) throw cementError;
            break;

          case 'resina':
            const { error: aiError } = await supabase.functions.invoke('recommend-resin', {
              body: {
                evaluationId: evaluation.id,
                userId: user.id,
                patientAge: String(patientData.age),
                tooth: toothNumber,
                region: getFullRegion(toothNumber),
                cavityClass: toothData.cavity_class || 'Classe I',
                restorationSize: toothData.restoration_size || 'Média',
                substrate: toothData.substrate || 'Esmalte e Dentina',
                bruxism: patientData.bruxism,
                aestheticLevel: patientData.aestheticLevel,
                toothColor: patientData.vitaShade,
                stratificationNeeded: true,
                budget: patientData.budget,
                longevityExpectation: patientData.longevityExpectation,
              },
            });
            if (aiError) throw aiError;
            break;

          case 'implante':
          case 'coroa':
          case 'endodontia':
          case 'encaminhamento':
            const genericProtocol = getGenericProtocol(treatmentType, toothNumber, toothData);
            await supabase
              .from('evaluations')
              .update({ 
                generic_protocol: genericProtocol,
                recommendation_text: genericProtocol.summary,
              })
              .eq('id', evaluation.id);
            break;
        }

        // Update status to draft
        await supabase
          .from('evaluations')
          .update({ status: 'draft' })
          .eq('id', evaluation.id);
      }

      // Remove created teeth from session_detected_teeth
      const { error: deleteError } = await supabase
        .from('session_detected_teeth')
        .delete()
        .eq('session_id', sessionId)
        .in('tooth', selectedTeeth);

      if (deleteError) {
        console.error('Error deleting pending teeth:', deleteError);
      }

      // Build success message
      const treatmentMessages = Object.entries(treatmentCounts)
        .map(([type, count]) => `${count} ${TREATMENT_LABELS[type as TreatmentType] || type}`)
        .join(', ');
      
      toast.success(`Casos adicionados: ${treatmentMessages}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding teeth:', error);
      toast.error('Erro ao adicionar casos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const restorativeTeeth = pendingTeeth.filter(t => t.priority === 'alta' || t.priority === 'média');
  const aestheticTeeth = pendingTeeth.filter(t => t.priority === 'baixa');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Adicionar Mais Dentes
          </DialogTitle>
          <DialogDescription>
            Dentes detectados pela IA que não foram selecionados anteriormente. 
            Escolha quais deseja adicionar à avaliação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick selection buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              Selecionar todos ({pendingTeeth.length})
            </Button>
            {selectedTeeth.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-xs text-muted-foreground"
              >
                Limpar seleção
              </Button>
            )}
          </div>

          {/* Restorative teeth section */}
          {restorativeTeeth.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-destructive" />
                <h4 className="font-medium text-sm">Tratamentos Necessários</h4>
                <Badge variant="destructive" className="text-xs">{restorativeTeeth.length}</Badge>
              </div>
              <div className="space-y-2">
                {restorativeTeeth.map((tooth) => {
                  const isSelected = selectedTeeth.includes(tooth.tooth);
                  const TreatmentIcon = getTreatmentIcon(getToothTreatment(tooth));
                  
                  return (
                    <div
                      key={tooth.id}
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
                            className={`text-xs ${priorityStyles[tooth.priority || 'média']}`}
                          >
                            {tooth.priority || 'média'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {tooth.cavity_class && <span>{tooth.cavity_class}</span>}
                          {tooth.restoration_size && <span> • {tooth.restoration_size}</span>}
                          {tooth.depth && <span> • {tooth.depth}</span>}
                        </div>
                        
                        {/* Per-tooth treatment selector */}
                        {isSelected && (
                          <Select
                            value={getToothTreatment(tooth)}
                            onValueChange={(value) => handleTreatmentChange(tooth.tooth, value as TreatmentType)}
                          >
                            <SelectTrigger className="h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="resina">🔧 Resina Composta</SelectItem>
                              <SelectItem value="porcelana">👑 Faceta de Porcelana</SelectItem>
                              <SelectItem value="coroa">💎 Coroa Total</SelectItem>
                              <SelectItem value="implante">🦷 Implante</SelectItem>
                              <SelectItem value="endodontia">🔬 Tratamento de Canal</SelectItem>
                              <SelectItem value="encaminhamento">➡️ Encaminhamento</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aesthetic teeth section */}
          {aestheticTeeth.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-sm">Melhorias Estéticas</h4>
                <Badge variant="secondary" className="text-xs">{aestheticTeeth.length}</Badge>
              </div>
              <div className="space-y-2">
                {aestheticTeeth.map((tooth) => {
                  const isSelected = selectedTeeth.includes(tooth.tooth);
                  
                  return (
                    <div
                      key={tooth.id}
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
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">Dente {tooth.tooth}</span>
                          <Badge variant="secondary" className="text-xs">estético</Badge>
                        </div>
                        {tooth.indication_reason && (
                          <p className="text-xs text-muted-foreground">{tooth.indication_reason}</p>
                        )}
                        
                        {/* Per-tooth treatment selector */}
                        {isSelected && (
                          <Select
                            value={getToothTreatment(tooth)}
                            onValueChange={(value) => handleTreatmentChange(tooth.tooth, value as TreatmentType)}
                          >
                            <SelectTrigger className="h-8 text-xs mt-2" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="resina">🔧 Resina Composta</SelectItem>
                              <SelectItem value="porcelana">👑 Faceta de Porcelana</SelectItem>
                              <SelectItem value="coroa">💎 Coroa Total</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || selectedTeeth.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar {selectedTeeth.length} dente(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
