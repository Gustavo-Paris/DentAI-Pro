import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Loader2, Plus, Wrench, Wand2 } from 'lucide-react';
import { logger } from '@/lib/logger';

export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia';

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

export interface SubmitTeethPayload {
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  pendingTeeth: PendingTooth[];
}

interface AddTeethModalProps {
  open: boolean;
  onClose: () => void;
  pendingTeeth: PendingTooth[];
  onSubmitTeeth: (payload: SubmitTeethPayload) => Promise<void>;
}

const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.treatmentResina',
  porcelana: 'components.wizard.review.treatmentPorcelana',
  coroa: 'components.wizard.review.treatmentCoroa',
  implante: 'components.wizard.review.treatmentImplante',
  endodontia: 'components.wizard.review.treatmentEndodontia',
  encaminhamento: 'components.wizard.review.treatmentEncaminhamento',
  gengivoplastia: 'components.wizard.review.treatmentGengivoplastia',
};


const priorityStyles: Record<string, string> = {
  alta: 'bg-destructive text-destructive-foreground',
  média: 'bg-warning text-warning-foreground border border-warning-foreground/20',
  baixa: 'bg-secondary text-secondary-foreground',
};

export function AddTeethModal({
  open,
  onClose,
  pendingTeeth,
  onSubmitTeeth,
}: AddTeethModalProps) {
  const { t } = useTranslation();
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
    if (selectedTeeth.length === 0) return;

    setIsSubmitting(true);

    try {
      await onSubmitTeeth({
        selectedTeeth,
        toothTreatments,
        pendingTeeth,
      });

      onClose();
    } catch (error) {
      logger.error('Error adding teeth:', error);
      toast.error(t('components.addTeeth.addError'));
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
            {t('components.addTeeth.title')}
          </DialogTitle>
          <DialogDescription>
            {t('components.addTeeth.description')}
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
              {t('components.addTeeth.selectAll', { count: pendingTeeth.length })}
            </Button>
            {selectedTeeth.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-xs text-muted-foreground"
              >
                {t('components.addTeeth.clearSelection')}
              </Button>
            )}
          </div>

          {/* Restorative teeth section */}
          {restorativeTeeth.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-destructive" />
                <h4 className="font-medium text-sm">{t('components.addTeeth.requiredTreatments')}</h4>
                <Badge variant="destructive" className="text-xs">{restorativeTeeth.length}</Badge>
              </div>
              <div className="space-y-2">
                {restorativeTeeth.map((tooth) => {
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
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{t('components.addTeeth.tooth', { number: tooth.tooth })}</span>
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
                              <SelectItem value="resina">{t('components.addTeeth.treatmentResina')}</SelectItem>
                              <SelectItem value="porcelana">{t('components.addTeeth.treatmentPorcelana')}</SelectItem>
                              <SelectItem value="coroa">{t('components.addTeeth.treatmentCoroa')}</SelectItem>
                              <SelectItem value="implante">{t('components.addTeeth.treatmentImplante')}</SelectItem>
                              <SelectItem value="endodontia">{t('components.addTeeth.treatmentEndodontia')}</SelectItem>
                              <SelectItem value="encaminhamento">{t('components.addTeeth.treatmentEncaminhamento')}</SelectItem>
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
                <h4 className="font-medium text-sm">{t('components.addTeeth.aestheticImprovements')}</h4>
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
                          <span className="font-semibold">{t('components.addTeeth.tooth', { number: tooth.tooth })}</span>
                          <Badge variant="secondary" className="text-xs">{t('components.addTeeth.aestheticLabel')}</Badge>
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
                              <SelectItem value="resina">{t('components.addTeeth.treatmentResina')}</SelectItem>
                              <SelectItem value="porcelana">{t('components.addTeeth.treatmentPorcelana')}</SelectItem>
                              <SelectItem value="coroa">{t('components.addTeeth.treatmentCoroa')}</SelectItem>
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
            {t('components.addTeeth.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedTeeth.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('components.addTeeth.generating')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {t('components.addTeeth.addCount', { count: selectedTeeth.length })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddTeethModal;
