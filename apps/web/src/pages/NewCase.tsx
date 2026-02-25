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
import { PhotoUploadStep } from '@/components/wizard/PhotoUploadStep';
import { PatientPreferencesStep } from '@/components/wizard/PatientPreferencesStep';
import { AnalyzingStep } from '@/components/wizard/AnalyzingStep';
import { DSDStep } from '@/components/wizard/DSDStep';
import { ReviewAnalysisStep } from '@/components/wizard/ReviewAnalysisStep';
import { DraftRestoreModal } from '@/components/wizard/DraftRestoreModal';
import { CreditConfirmDialog } from '@/components/CreditConfirmDialog';
import { useAiDisclaimer, AiDisclaimerModal } from '@/components/AiDisclaimerModal';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { StepIndicator } from '@/components/wizard/StepIndicator';

// Step definitions for full flow: [1:foto, 2:prefs, 3:analysis, 4:dsd, 5:review, 6:result]
// Step definitions for quick case: [1:foto, 3:analysis, 5:review, 6:result]

// Maps internal wizard.step (1-6) to display index for quick case
const QUICK_STEP_MAP: Record<number, number> = { 1: 0, 3: 1, 5: 2, 6: 3 };
// Resolved at render time via t() — see allSteps useMemo
const QUICK_LABEL_KEYS = ['wizard.stepPhoto', 'wizard.stepAnalysis', 'wizard.stepReview', 'wizard.stepResult'] as const;
const QUICK_ICONS = [Camera, Brain, ClipboardCheck, FileText];

// =============================================================================
// Page Adapter
// =============================================================================

export default function NewCase() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.newCase', { defaultValue: 'Novo Caso' }));
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

  // Build steps array conditionally
  const quickLabels = useMemo(() => QUICK_LABEL_KEYS.map(k => t(k)), [t]);

  const {
    stepDirection, imageBase64, setImageBase64, goToPreferences, goToQuickCase,
    additionalPhotos, setAdditionalPhotos, patientPreferences, setPatientPreferences,
    handlePreferencesContinue, isAnalyzing, analysisError, handleRetryAnalysis,
    handleSkipToReview, handleBack, cancelAnalysis, handleDSDComplete, handleDSDSkip,
    analysisResult, dsdResult, handleDSDResultChange, formData, updateFormData,
    handleReanalyze, isReanalyzing, selectedTeeth, setSelectedTeeth, toothTreatments,
    handleToothTreatmentChange, originalToothTreatments, handleRestoreAiSuggestion,
    hasInventory, patients, selectedPatientId, patientBirthDate,
    handlePatientBirthDateChange, dobValidationError, setDobValidationError,
    handlePatientSelect, submissionComplete, completedSessionId, isSubmitting, isQuickCase,
  } = wizard;

  const allSteps = useMemo(() => {
    const fotoStep = {
      id: 1,
      key: 'foto',
      label: t('wizard.stepPhoto'),
      icon: Camera,
      children: (
        <div key="step-foto" className={`wizard-step-${stepDirection}`}>
          <PhotoUploadStep
            imageBase64={imageBase64}
            onImageChange={setImageBase64}
            onAnalyze={goToPreferences}
            onQuickCase={goToQuickCase}
            isUploading={false}
            additionalPhotos={additionalPhotos}
            onAdditionalPhotosChange={setAdditionalPhotos}
          />
        </div>
      ),
    };

    const prefsStep = {
      id: 2,
      key: 'preferencias',
      label: t('wizard.stepPreferences'),
      icon: Heart,
      children: (
        <div key="step-prefs" className={`wizard-step-${stepDirection}`}>
          <PatientPreferencesStep
            preferences={patientPreferences}
            onPreferencesChange={setPatientPreferences}
            onContinue={handlePreferencesContinue}
          />
        </div>
      ),
    };

    const analysisStep = {
      id: 3,
      key: 'analise',
      label: t('wizard.stepAnalysis'),
      icon: Brain,
      children: (
        <div key="step-analysis" className={`wizard-step-${stepDirection}`}>
          <AnalyzingStep
            imageBase64={imageBase64}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            onRetry={handleRetryAnalysis}
            onSkipToReview={handleSkipToReview}
            onBack={handleBack}
            onCancel={cancelAnalysis}
          />
        </div>
      ),
    };

    const dsdStep = {
      id: 4,
      key: 'dsd',
      label: t('wizard.stepDSD'),
      icon: Smile,
      children: (
        <div key="step-dsd" className={`wizard-step-${stepDirection}`}>
          <DSDStep
            imageBase64={imageBase64}
            onComplete={handleDSDComplete}
            onSkip={handleDSDSkip}
            additionalPhotos={additionalPhotos}
            patientPreferences={patientPreferences}
            detectedTeeth={analysisResult?.detected_teeth}
            initialResult={dsdResult}
            clinicalObservations={analysisResult?.observations}
            clinicalTeethFindings={analysisResult?.detected_teeth?.map((t) => ({
              tooth: t.tooth,
              indication_reason: t.indication_reason,
              treatment_indication: t.treatment_indication,
            }))}
            onResultChange={handleDSDResultChange}
            onPreferencesChange={setPatientPreferences}
          />
        </div>
      ),
    };

    const reviewStep = {
      id: 5,
      key: 'revisao',
      label: t('wizard.stepReview'),
      icon: ClipboardCheck,
      children: (
        <div key="step-review" className={`wizard-step-${stepDirection}`}>
          <ReviewAnalysisStep
            analysisResult={analysisResult}
            formData={formData}
            onFormChange={updateFormData}
            imageBase64={imageBase64}
            onReanalyze={handleReanalyze}
            isReanalyzing={isReanalyzing}
            selectedTeeth={selectedTeeth}
            onSelectedTeethChange={setSelectedTeeth}
            toothTreatments={toothTreatments}
            onToothTreatmentChange={handleToothTreatmentChange}
            originalToothTreatments={originalToothTreatments}
            onRestoreAiSuggestion={handleRestoreAiSuggestion}
            hasInventory={hasInventory}
            patients={patients}
            dsdObservations={dsdResult?.analysis?.observations}
            dsdSuggestions={dsdResult?.analysis?.suggestions}
            selectedPatientId={selectedPatientId}
            patientBirthDate={patientBirthDate}
            onPatientBirthDateChange={handlePatientBirthDateChange}
            dobError={dobValidationError}
            onDobErrorChange={setDobValidationError}
            whiteningLevel={patientPreferences.whiteningLevel}
            onPatientSelect={handlePatientSelect}
          />
        </div>
      ),
    };

    const resultStep = {
      id: 6,
      key: 'resultado',
      label: t('wizard.stepResult'),
      icon: FileText,
      children: (
        <div key="step-result" className={`wizard-step-${stepDirection}`}>
          {submissionComplete ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground animate-fade-in-up">
                {t('wizard.caseCreated')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up">
                <Button
                  onClick={() => navigate(`/evaluation/${completedSessionId}`)}
                  className="btn-press"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('result.viewCase')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="print:hidden btn-press"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('result.recalculate')}
                </Button>
              </div>
            </div>
          ) : isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 sm:space-y-6" role="status" aria-live="polite">
              <div className="text-center flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('common.processing')}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <p className="text-muted-foreground">{t('wizard.preparingCase')}</p>
              <Button variant="outline" onClick={handleBack} className="btn-press">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </Button>
            </div>
          )}
        </div>
      ),
    };

    if (isQuickCase) {
      // Re-number IDs sequentially (1-4) for quick case
      return [fotoStep, analysisStep, reviewStep, resultStep].map((step, i) => ({ ...step, id: i + 1 }));
    }
    return [fotoStep, prefsStep, analysisStep, dsdStep, reviewStep, resultStep];
  }, [
    stepDirection, imageBase64, setImageBase64, goToPreferences, goToQuickCase,
    additionalPhotos, setAdditionalPhotos, patientPreferences, setPatientPreferences,
    handlePreferencesContinue, isAnalyzing, analysisError, handleRetryAnalysis,
    handleSkipToReview, handleBack, cancelAnalysis, handleDSDComplete, handleDSDSkip,
    analysisResult, dsdResult, handleDSDResultChange, formData, updateFormData,
    handleReanalyze, isReanalyzing, selectedTeeth, setSelectedTeeth, toothTreatments,
    handleToothTreatmentChange, originalToothTreatments, handleRestoreAiSuggestion,
    hasInventory, patients, selectedPatientId, patientBirthDate,
    handlePatientBirthDateChange, dobValidationError, setDobValidationError,
    handlePatientSelect, submissionComplete, completedSessionId, isSubmitting, isQuickCase,
    navigate, t,
  ]);

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
    <div ref={stepContentRef} tabIndex={-1} aria-live="polite" className="outline-none">
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
        steps={allSteps}
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
                      className="w-full sm:w-auto btn-glow-gold btn-press font-semibold"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('wizard.createMyOwnCase')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={wizard.handleSubmit}
                      disabled={wizard.isSubmitting}
                      className="w-full sm:w-auto btn-glow-gold btn-press font-semibold"
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
      />

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
