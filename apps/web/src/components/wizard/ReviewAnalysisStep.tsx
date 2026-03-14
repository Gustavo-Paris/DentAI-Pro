import { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, ClipboardCheck, Mic, MicOff, Sparkles } from 'lucide-react';
import { Label, Textarea, Button } from '@parisgroup-ai/pageshell/primitives';
import type { Patient } from '@/components/PatientAutocomplete';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { ComponentSkeleton } from '@/components/skeletons';
import { cn } from '@/lib/utils';
import { PillToggle } from '@/components/pill-toggle';

// Re-export constants for backward compatibility
export { TREATMENT_LABEL_KEYS, TREATMENT_DESC_KEYS } from './review/review-constants';

// Sub-components
import { AiConfidenceBanner } from './review/AiConfidenceBanner';
import { TreatmentBanners } from './review/TreatmentBanners';
import { AnalysisWarnings } from './review/AnalysisWarnings';
const ToothSelectionCard = lazy(() => import('./review/ToothSelectionCard'));
import { PatientDataSection } from './review/PatientDataSection';
import { TreatmentGroupView } from './review/TreatmentGroupView';
import { CaseSummaryCard } from './review/CaseSummaryCard';

// Types re-exported from canonical location for backward compatibility
export type { TreatmentType, DetectedTooth, PhotoAnalysisResult, ReviewFormData } from '@/types/wizard';
import type { TreatmentType, PhotoAnalysisResult, ReviewFormData } from '@/types/wizard';

type ReviewTab = 'dentes' | 'tratamento' | 'paciente' | 'resumo';

const REVIEW_TABS: { key: ReviewTab; labelKey: string }[] = [
  { key: 'dentes', labelKey: 'components.wizard.review.tabs.teeth' },
  { key: 'tratamento', labelKey: 'components.wizard.review.tabs.treatment' },
  { key: 'paciente', labelKey: 'components.wizard.review.tabs.patient' },
  { key: 'resumo', labelKey: 'components.wizard.review.tabs.summary' },
];

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
  patients?: Patient[];
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
  patients = [],
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
  const [internalDobError, setInternalDobError] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>('dentes');
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

  const detectedTeeth = useMemo(() => analysisResult?.detected_teeth || [], [analysisResult?.detected_teeth]);
  const hasMultipleTeeth = detectedTeeth.length > 1;
  const realSelectedTeeth = selectedTeeth.filter(st => st !== 'GENGIVO');

  // Count unique treatment types for tab badge
  const treatmentTypeCount = useMemo(() => {
    const types = new Set<string>();
    for (const tooth of realSelectedTeeth) {
      types.add(toothTreatments[tooth] || detectedTeeth.find(dt => dt.tooth === tooth)?.treatment_indication || 'resina');
    }
    return types.size;
  }, [realSelectedTeeth, toothTreatments, detectedTeeth]);

  const tabBadges: Record<ReviewTab, string | null> = {
    dentes: realSelectedTeeth.length > 0 ? String(realSelectedTeeth.length) : null,
    tratamento: treatmentTypeCount > 0 ? t('components.wizard.review.treatmentTypes', { count: treatmentTypeCount }) : null,
    paciente: formData.patientName ? '✓' : null,
    resumo: null,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center glow-icon">
          <ClipboardCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold font-display mb-2 neon-text">{t('components.wizard.review.title')}</h2>
        <p className="text-muted-foreground">
          {hasMultipleTeeth
            ? t('components.wizard.review.multiTeethSubtitle', { count: detectedTeeth.length })
            : t('components.wizard.review.singleToothSubtitle')
          }
        </p>
      </div>

      {/* AI Confidence Banner — always visible above tabs */}
      {analysisResult && (
        <AiConfidenceBanner
          analysisResult={analysisResult}
          onReanalyze={onReanalyze}
          isReanalyzing={isReanalyzing}
        />
      )}

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border overflow-x-auto" role="tablist">
        {REVIEW_TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {t(tab.labelKey)}
            {tabBadges[tab.key] && (
              <span className="ml-1.5 text-xs opacity-70">{tabBadges[tab.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dentes' && (
        <div className="space-y-4">
          <TreatmentBanners
            analysisResult={analysisResult}
            selectedTeeth={selectedTeeth}
            hasInventory={hasInventory}
            whiteningLevel={whiteningLevel}
            dsdSuggestions={dsdSuggestions}
          />
          {analysisResult && (
            <AnalysisWarnings analysisResult={analysisResult} />
          )}
          {hasMultipleTeeth ? (
            <Suspense fallback={<ComponentSkeleton height="280px" />}>
              <ToothSelectionCard
                analysisResult={analysisResult!}
                selectedTeeth={selectedTeeth}
                onSelectedTeethChange={onSelectedTeethChange}
                toothTreatments={toothTreatments}
                onToothTreatmentChange={onToothTreatmentChange}
                originalToothTreatments={originalToothTreatments}
                onRestoreAiSuggestion={onRestoreAiSuggestion}
              />
            </Suspense>
          ) : detectedTeeth.length === 1 && (
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {detectedTeeth[0].tooth}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {t('components.wizard.review.archTooth', { toothId: detectedTeeth[0].tooth })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detectedTeeth[0].cavity_class} &middot; {t(`treatments.${toothTreatments[detectedTeeth[0].tooth] || detectedTeeth[0].treatment_indication || 'resina'}.label`)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tratamento' && (
        <TreatmentGroupView
          selectedTeeth={selectedTeeth}
          toothTreatments={toothTreatments}
          detectedTeeth={detectedTeeth}
        />
      )}

      {activeTab === 'paciente' && (
        <div className="space-y-4">
          <div className="relative z-10">
          <PatientDataSection
            formData={formData}
            onFormChange={onFormChange}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onPatientSelect={onPatientSelect}
            patientBirthDate={patientBirthDate}
            onPatientBirthDateChange={onPatientBirthDateChange}
            dobError={dobError}
            setDobError={setDobError}
          />
          </div>
          {/* Observations */}
          {analysisResult?.observations && analysisResult.observations.length > 0 && (
            <div className="glass-panel rounded-xl p-4">
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
          {/* Clinical Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('components.wizard.review.clinicalNotes')}</Label>
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
                    'absolute bottom-2 right-2 h-10 w-10',
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
        </div>
      )}

      {activeTab === 'resumo' && (
        <div className="space-y-4">
          {/* Photo + DSD notes side-by-side on desktop */}
          {imageBase64 && (
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={imageBase64}
                alt={t('components.wizard.review.analyzedPhoto')}
                className="w-full sm:w-48 sm:h-48 object-cover rounded-lg ring-1 ring-border shrink-0"
              />
              {/* DSD per-tooth suggestions only (observations moved to Paciente tab) */}
              {dsdSuggestions && dsdSuggestions.length > 0 && (
                <div className="flex-1 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    {t('components.wizard.review.aestheticNotesDSD')}
                  </h4>
                  <ul className="space-y-1">
                    {dsdSuggestions.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        <span className="font-medium">{t('components.wizard.review.tooth', { number: s.tooth })}:</span> {s.proposed_change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {/* Budget toggle */}
          <div>
            <Label className="text-sm font-medium mb-1 block">{t('components.wizard.review.budget')}</Label>
            <p className="text-xs text-muted-foreground mb-2">{t('components.wizard.review.budgetHint')}</p>
            <PillToggle
              options={[
                { value: 'padrão', label: t('components.wizard.review.standard') },
                { value: 'premium', label: t('components.wizard.review.premium') },
              ]}
              value={formData.budget}
              onChange={(value) => onFormChange({ budget: value })}
              columns={2}
            />
          </div>
          {/* Case Summary */}
          <CaseSummaryCard
            selectedTeeth={selectedTeeth}
            toothTreatments={toothTreatments}
            detectedTeeth={detectedTeeth}
            formData={formData}
            patientBirthDate={patientBirthDate}
          />
        </div>
      )}
    </div>
  );
}
