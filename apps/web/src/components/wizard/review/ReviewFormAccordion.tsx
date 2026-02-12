import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sparkles, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillToggle } from '@/components/ui/pill-toggle';
import type { ReviewFormData } from '../ReviewAnalysisStep';

interface ReviewFormAccordionProps {
  imageBase64: string | null;
  formData: ReviewFormData;
  onFormChange: (data: Partial<ReviewFormData>) => void;
  dsdObservations?: string[];
  dsdSuggestions?: { tooth: string; current_issue: string; proposed_change: string }[];
  speech: {
    isSupported: boolean;
    isListening: boolean;
    transcript: string;
    toggle: () => void;
  };
}

export function ReviewFormAccordion({
  imageBase64,
  formData,
  onFormChange,
  dsdObservations,
  dsdSuggestions,
  speech,
}: ReviewFormAccordionProps) {
  const { t } = useTranslation();

  return (
    <Accordion type="multiple" defaultValue={[]} className="w-full space-y-2">
      {/* Photo & Observations */}
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

      {/* Aesthetic & Budget */}
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
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Clinical Notes */}
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
                  aria-label={speech.isListening ? t('components.wizard.review.stopRecording') : t('components.wizard.review.startRecording')}
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
              <div className="flex items-center gap-2 text-xs text-destructive" role="status" aria-live="polite">
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
  );
}
