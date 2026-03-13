import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { tEnum } from '@/lib/clinical-enums';
import {
  Badge,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from '@parisgroup-ai/pageshell/primitives';
import { FormModal } from '@parisgroup-ai/pageshell/composites';
import { Plus, Wrench, Wand2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toI18nKeySuffix } from '@/lib/utils';

// Types re-exported from canonical location for backward compatibility
export type { TreatmentType, PendingTooth, SubmitTeethPayload } from '@/types/evaluation';
import type { TreatmentType, PendingTooth, SubmitTeethPayload } from '@/types/evaluation';

interface AddTeethModalProps {
  open: boolean;
  onClose: () => void;
  pendingTeeth: PendingTooth[];
  onSubmitTeeth: (payload: SubmitTeethPayload) => Promise<void>;
}

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

  const toothPickerContent = (
    <div className="space-y-4">
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
                <label
                  key={tooth.id}
                  htmlFor={`restorative-tooth-${tooth.tooth}`}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    id={`restorative-tooth-${tooth.tooth}`}
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
                        {t(`common.priority${toI18nKeySuffix(tooth.priority || 'média')}`)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {tooth.cavity_class && <span>{tEnum(t, 'cavityClass', tooth.cavity_class)}</span>}
                      {tooth.restoration_size && <span> • {tEnum(t, 'restorationSize', tooth.restoration_size)}</span>}
                      {tooth.depth && <span> • {tEnum(t, 'depth', tooth.depth)}</span>}
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
                    )}
                  </div>
                </label>
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
                <label
                  key={tooth.id}
                  htmlFor={`aesthetic-tooth-${tooth.tooth}`}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    id={`aesthetic-tooth-${tooth.tooth}`}
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
                          <SelectItem value="resina">{t('treatments.resina.label')}</SelectItem>
                          <SelectItem value="porcelana">{t('treatments.porcelana.label')}</SelectItem>
                          <SelectItem value="coroa">{t('treatments.coroa.label')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <FormModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={t('components.addTeeth.title')}
      description={t('components.addTeeth.description')}
      icon={<Plus className="w-5 h-5 text-primary" />}
      size="md"
      fields={[]}
      defaultValues={{}}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isSubmitDisabled={selectedTeeth.length === 0}
      closeOnSuccess={false}
      submitText={t('components.addTeeth.addCount', { count: selectedTeeth.length })}
      cancelText={t('components.addTeeth.cancel')}
      loadingText={t('components.addTeeth.generating')}
      slots={{
        beforeFields: toothPickerContent,
      }}
    />
  );
}

export default AddTeethModal;
