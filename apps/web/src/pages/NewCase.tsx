import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button, Badge } from '@parisgroup-ai/pageshell/primitives';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Brain,
  ClipboardCheck,
  FileText,
  Loader2,
  Smile,
  Check,
  Save,
  Heart,
  Sparkles,
  Eye,
} from 'lucide-react';

import { PageShellWizard } from '@parisgroup-ai/pageshell/interactions';
import { trackEvent } from '@/lib/analytics';
import { useWizardFlow } from '@/hooks/domain/useWizardFlow';
import { DraftRestoreModal } from '@/components/wizard/DraftRestoreModal';
import { CreditConfirmDialog } from '@/components/CreditConfirmDialog';
import { useAiDisclaimer, AiDisclaimerModal } from '@/components/AiDisclaimerModal';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import {
  FotoStepWrapper,
  PrefsStepWrapper,
  AnalysisStepWrapper,
  DSDStepWrapper,
  ReviewStepWrapper,
  ResultStepWrapper,
} from '@/components/wizard/steps';

// Step definitions for full flow: [1:foto, 2:prefs, 3:analysis, 4:dsd, 5:review, 6:result]
// Step definitions for quick case: [1:foto, 3:analysis, 5:review, 6:result]

// Maps internal wizard.step (1-6) to display index for quick case
const QUICK_STEP_MAP: Record<number, number> = { 1: 0, 3: 1, 5: 2, 6: 3 };
// Resolved at render time via t() — see stepsMeta useMemo
const QUICK_LABEL_KEYS = ['wizard.stepPhoto', 'wizard.stepAnalysis', 'wizard.stepReview', 'wizard.stepResult'] as const;
const QUICK_ICONS = [Camera, Brain, ClipboardCheck, FileText];

// Full flow step metadata (id, key, label key, icon) — no children, no deps beyond t()
const FULL_STEP_META = [
  { id: 1, key: 'foto',         labelKey: 'wizard.stepPhoto',       icon: Camera },
  { id: 2, key: 'preferencias', labelKey: 'wizard.stepPreferences', icon: Heart },
  { id: 3, key: 'analise',      labelKey: 'wizard.stepAnalysis',    icon: Brain },
  { id: 4, key: 'dsd',          labelKey: 'wizard.stepDSD',         icon: Smile },
  { id: 5, key: 'revisao',      labelKey: 'wizard.stepReview',      icon: ClipboardCheck },
  { id: 6, key: 'resultado',    labelKey: 'wizard.stepResult',      icon: FileText },
] as const;

const QUICK_STEP_META = [
  { id: 1, key: 'foto',      labelKey: 'wizard.stepPhoto',    icon: Camera },
  { id: 2, key: 'analise',   labelKey: 'wizard.stepAnalysis', icon: Brain },
  { id: 3, key: 'revisao',   labelKey: 'wizard.stepReview',   icon: ClipboardCheck },
  { id: 4, key: 'resultado', labelKey: 'wizard.stepResult',   icon: FileText },
] as const;

// =============================================================================
// Active step content — renders only the current step via memoized wrappers
// =============================================================================

function ActiveStepContent({ wizard }: { wizard: ReturnType<typeof useWizardFlow> }) {
  const {
    step, stepDirection, imageBase64, setImageBase64, goToPreferences, goToQuickCase,
    additionalPhotos, setAdditionalPhotos, patientPreferences, setPatientPreferences,
    handlePreferencesContinue, isAnalyzing, analysisError, handleRetryAnalysis,
    handleSkipToReview, handleBack, cancelAnalysis, handleDSDComplete, handleDSDSkip,
    analysisResult, dsdResult, handleDSDResultChange, formData, updateFormData,
    handleReanalyze, isReanalyzing, selectedTeeth, setSelectedTeeth, toothTreatments,
    handleToothTreatmentChange, originalToothTreatments, handleRestoreAiSuggestion,
    hasInventory, patients, selectedPatientId, patientBirthDate,
    handlePatientBirthDateChange, dobValidationError, setDobValidationError,
    handlePatientSelect, submissionComplete, completedSessionId, isSubmitting,
  } = wizard;

  switch (step) {
    case 1:
      return (
        <FotoStepWrapper
          stepDirection={stepDirection}
          imageBase64={imageBase64}
          setImageBase64={setImageBase64}
          goToPreferences={goToPreferences}
          goToQuickCase={goToQuickCase}
          additionalPhotos={additionalPhotos}
          setAdditionalPhotos={setAdditionalPhotos}
        />
      );
    case 2:
      return (
        <PrefsStepWrapper
          stepDirection={stepDirection}
          patientPreferences={patientPreferences}
          setPatientPreferences={setPatientPreferences}
          handlePreferencesContinue={handlePreferencesContinue}
        />
      );
    case 3:
      return (
        <AnalysisStepWrapper
          stepDirection={stepDirection}
          imageBase64={imageBase64}
          isAnalyzing={isAnalyzing}
          analysisError={analysisError}
          handleRetryAnalysis={handleRetryAnalysis}
          handleSkipToReview={handleSkipToReview}
          handleBack={handleBack}
          cancelAnalysis={cancelAnalysis}
        />
      );
    case 4:
      return (
        <DSDStepWrapper
          stepDirection={stepDirection}
          imageBase64={imageBase64}
          handleDSDComplete={handleDSDComplete}
          handleDSDSkip={handleDSDSkip}
          additionalPhotos={additionalPhotos}
          patientPreferences={patientPreferences}
          analysisResult={analysisResult}
          dsdResult={dsdResult}
          handleDSDResultChange={handleDSDResultChange}
          setPatientPreferences={setPatientPreferences}
        />
      );
    case 5:
      return (
        <ReviewStepWrapper
          stepDirection={stepDirection}
          analysisResult={analysisResult}
          formData={formData}
          updateFormData={updateFormData}
          imageBase64={imageBase64}
          handleReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
          selectedTeeth={selectedTeeth}
          setSelectedTeeth={setSelectedTeeth}
          toothTreatments={toothTreatments}
          handleToothTreatmentChange={handleToothTreatmentChange}
          originalToothTreatments={originalToothTreatments}
          handleRestoreAiSuggestion={handleRestoreAiSuggestion}
          hasInventory={hasInventory}
          patients={patients}
          dsdResult={dsdResult}
          selectedPatientId={selectedPatientId}
          patientBirthDate={patientBirthDate}
          handlePatientBirthDateChange={handlePatientBirthDateChange}
          dobValidationError={dobValidationError}
          setDobValidationError={setDobValidationError}
          patientPreferences={patientPreferences}
          handlePatientSelect={handlePatientSelect}
        />
      );
    case 6:
      return (
        <ResultStepWrapper
          stepDirection={stepDirection}
          submissionComplete={submissionComplete}
          completedSessionId={completedSessionId}
          isSubmitting={isSubmitting}
          handleBack={handleBack}
        />
      );
    default:
      return null;
  }
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function NewCase() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.newCase'));
  const wizard = useWizardFlow();
  const disclaimer = useAiDisclaimer();
  const navigate = useNavigate();

  const stepContentRef = useRef<HTMLDivElement>(null);

  // Track wizard_started on mount
  useEffect(() => {
    trackEvent('wizard_started');
  }, []);

  // Compute display step index (0-indexed) from internal step (1-indexed)
  const displayStep = wizard.isQuickCase
    ? (QUICK_STEP_MAP[wizard.step] ?? 0)
    : wizard.step - 1;

  const totalSteps = wizard.isQuickCase ? 4 : 6;

  // Focus step content after step transition (a11y)
  useEffect(() => {
    const timer = setTimeout(() => {
      stepContentRef.current?.focus();
    }, 300); // Wait for animation to complete
    return () => clearTimeout(timer);
  }, [displayStep]);

  // Arrow key navigation between completed wizard steps (a11y)
  const { step: internalStep, isQuickCase: isQuick, goToStep } = wizard;
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      // Don't capture arrows when user is typing in form inputs
      const active = document.activeElement;
      const isFormInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (active?.tagName ?? '')
      ) || active?.getAttribute('contenteditable') === 'true';
      if (isFormInput) return;

      // Don't navigate during auto-processing step (step 3 internal)
      if (internalStep === 3) return;

      e.preventDefault();

      if (e.key === 'ArrowLeft' && displayStep > 0) {
        // Go to previous display step
        if (isQuick) {
          const internalSteps = [1, 3, 5, 6];
          goToStep(internalSteps[displayStep - 1]);
        } else {
          goToStep(displayStep); // displayStep is 0-indexed, goToStep is 1-indexed
        }
      } else if (e.key === 'ArrowRight' && displayStep < totalSteps - 1) {
        // Go to next display step (goToStep only allows visited steps)
        if (isQuick) {
          const internalSteps = [1, 3, 5, 6];
          goToStep(internalSteps[displayStep + 1]);
        } else {
          goToStep(displayStep + 2); // display 0-indexed + 2 = next internal step
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayStep, totalSteps, internalStep, isQuick, goToStep]);

  // Build steps metadata array — only id, key, label, icon (no children).
  // Deps: only t() and isQuickCase. Step content is rendered via ActiveStepContent.
  const quickLabels = useMemo(() => QUICK_LABEL_KEYS.map(k => t(k)), [t]);

  const stepsMeta = useMemo(() => {
    const source = wizard.isQuickCase ? QUICK_STEP_META : FULL_STEP_META;
    return source.map(s => ({
      id: s.id,
      key: s.key,
      label: t(s.labelKey),
      icon: s.icon,
    }));
  }, [t, wizard.isQuickCase]);

  // Map display index back to internal step for step indicator clicks
  const handleStepClick = (displayIndex: number) => {
    if (wizard.isQuickCase) {
      // Reverse map: display [0,1,2,3] → internal [1,3,5,6]
      const internalSteps = [1, 3, 5, 6];
      wizard.goToStep(internalSteps[displayIndex]);
    } else {
      wizard.goToStep(displayIndex + 1);
    }
  };

  return (
    <>
    <AiDisclaimerModal
      open={!disclaimer.accepted}
      onAccept={disclaimer.accept}
    />
    <LoadingOverlay
      isLoading={wizard.isSubmitting}
      message={t('wizard.generatingCase')}
      steps={wizard.submissionSteps}
      progress={wizard.submissionSteps.filter(s => s.completed).length / Math.max(wizard.submissionSteps.length, 1) * 100}
    />
    <div ref={stepContentRef} tabIndex={-1} className="outline-none">
      {/* Targeted sr-only announcer for step changes — avoids aria-live on entire wizard tree */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {t('wizard.stepAnnounce', {
          current: displayStep + 1,
          total: totalSteps,
          label: stepsMeta[displayStep]?.label ?? '',
          })}
      </div>
      <div className="relative section-glow-bg overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="glow-orb-slow absolute top-20 -left-40 w-72 h-72 bg-primary/10 dark:bg-primary/15 rounded-full pointer-events-none" aria-hidden="true" />
        <div className="glow-orb-reverse absolute bottom-20 -right-40 w-60 h-60 bg-accent/8 dark:bg-accent/12 rounded-full pointer-events-none" aria-hidden="true" />
        {/* Subtle AI dot grid overlay */}
        <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />

        <div className="relative z-10">
          <PageShellWizard
            theme="odonto-ai"
            title={t('wizard.newCase')}
            currentStep={displayStep + 1}
            totalSteps={totalSteps}
            enableKeyboardNav={false} // Disabled: wizard steps contain form inputs that need arrow/tab keys
            showProgress={true}
            scrollToTop={true}
            containerVariant="narrow"
            hideNavigation={true}
            steps={stepsMeta}
            slots={{
              progress: (
                <StepIndicator
                  currentStep={displayStep}
                  totalSteps={totalSteps}
                  onStepClick={handleStepClick}
                  stepLabels={wizard.isQuickCase ? quickLabels : undefined}
                  stepIcons={wizard.isQuickCase ? QUICK_ICONS : undefined}
                />
              ),
              beforeContent: (
                <div className="flex items-center justify-between mb-2">
                  {wizard.isSampleCase ? (
                    <Badge variant="secondary" className="text-xs gap-1.5 bg-primary/10 text-primary border-primary/20">
                      <Eye className="w-3 h-3" />
                      {t('wizard.sampleCase')}
                    </Badge>
                  ) : <span />}
                  {wizard.step >= 4 && !wizard.isSampleCase ? (
                    <Badge variant="outline" className="text-xs gap-1.5">
                      {wizard.isSaving ? (
                        <>
                          <Save className="w-3 h-3 animate-pulse" />
                          <span className="hidden sm:inline">{t('common.saving')}</span>
                        </>
                      ) : wizard.lastSavedAt ? (
                        <>
                          <Check className="w-3 h-3 text-primary" />
                          <span className="hidden sm:inline">{t('common.saved')}</span>
                        </>
                      ) : null}
                    </Badge>
                  ) : <span />}
                </div>
              ),
              footer: wizard.canGoBack ? (
                <div className="wizard-nav-sticky">
                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 pb-2 sm:pt-4 sm:pb-0">
                    <Button variant="outline" onClick={wizard.handleBack} disabled={wizard.isSubmitting} className="w-full sm:w-auto btn-press">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t('common.back')}
                    </Button>

                    {wizard.step === 5 && (
                      wizard.isSampleCase ? (
                        <Button
                          onClick={() => navigate('/new-case')}
                          className="w-full sm:w-auto btn-glow btn-press font-semibold"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t('wizard.createMyOwnCase')}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={wizard.handleSubmit}
                          disabled={wizard.isSubmitting}
                          className="w-full sm:w-auto btn-glow btn-press font-semibold"
                        >
                          {wizard.isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('common.processing')}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {t('wizard.generateCase')}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ) : <></>,
            }}
          >
            {/* Active step content — only the current step renders */}
            <ActiveStepContent wizard={wizard} />
          </PageShellWizard>
        </div>{/* /relative z-10 */}
      </div>{/* /section-glow-bg */}

      {/* Draft Restore Modal */}
      <DraftRestoreModal
        open={wizard.showRestoreModal}
        onOpenChange={(open) => {
          if (!open) wizard.handleDiscardDraft();
        }}
        lastSavedAt={wizard.pendingDraft?.lastSavedAt || null}
        onRestore={wizard.handleRestoreDraft}
        onDiscard={wizard.handleDiscardDraft}
      />

      {/* Credit Confirmation Dialog */}
      <CreditConfirmDialog
        data={wizard.creditConfirmData}
        onConfirm={wizard.handleCreditConfirm}
      />
    </div>
    </>
  );
}
