import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

import { WizardPage } from '@parisgroup-ai/pageshell/composites';
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
  const wizard = useWizardFlow();
  const disclaimer = useAiDisclaimer();
  const navigate = useNavigate();

  // Track wizard_started on mount
  useEffect(() => {
    trackEvent('wizard_started');
  }, []);

  // Compute display step index (0-indexed) from internal step (1-indexed)
  const displayStep = wizard.isQuickCase
    ? (QUICK_STEP_MAP[wizard.step] ?? 0)
    : wizard.step - 1;

  const totalSteps = wizard.isQuickCase ? 4 : 6;

  // Build steps array conditionally
  const quickLabels = useMemo(() => QUICK_LABEL_KEYS.map(k => t(k)), [t]);

  const allSteps = useMemo(() => {
    const fotoStep = {
      id: 'foto',
      title: t('wizard.stepPhoto'),
      icon: Camera,
      children: (
        <div key="step-foto" className={`wizard-step-${wizard.stepDirection}`}>
          <PhotoUploadStep
            imageBase64={wizard.imageBase64}
            onImageChange={wizard.setImageBase64}
            onAnalyze={wizard.goToPreferences}
            onQuickCase={wizard.goToQuickCase}
            isUploading={false}
            additionalPhotos={wizard.additionalPhotos}
            onAdditionalPhotosChange={wizard.setAdditionalPhotos}
          />
        </div>
      ),
    };

    const prefsStep = {
      id: 'preferencias',
      title: t('wizard.stepPreferences'),
      icon: Heart,
      children: (
        <div key="step-prefs" className={`wizard-step-${wizard.stepDirection}`}>
          <PatientPreferencesStep
            preferences={wizard.patientPreferences}
            onPreferencesChange={wizard.setPatientPreferences}
            onContinue={wizard.handlePreferencesContinue}
          />
        </div>
      ),
    };

    const analysisStep = {
      id: 'analise',
      title: t('wizard.stepAnalysis'),
      icon: Brain,
      children: (
        <div key="step-analysis" className={`wizard-step-${wizard.stepDirection}`}>
          <AnalyzingStep
            imageBase64={wizard.imageBase64}
            isAnalyzing={wizard.isAnalyzing}
            analysisError={wizard.analysisError}
            onRetry={wizard.handleRetryAnalysis}
            onSkipToReview={wizard.handleSkipToReview}
            onBack={wizard.handleBack}
            onCancel={wizard.cancelAnalysis}
          />
        </div>
      ),
    };

    const dsdStep = {
      id: 'dsd',
      title: t('wizard.stepDSD'),
      icon: Smile,
      children: (
        <div key="step-dsd" className={`wizard-step-${wizard.stepDirection}`}>
          <DSDStep
            imageBase64={wizard.imageBase64}
            onComplete={wizard.handleDSDComplete}
            onSkip={wizard.handleDSDSkip}
            additionalPhotos={wizard.additionalPhotos}
            patientPreferences={wizard.patientPreferences}
            detectedTeeth={wizard.analysisResult?.detected_teeth}
            initialResult={wizard.dsdResult}
            clinicalObservations={wizard.analysisResult?.observations}
            clinicalTeethFindings={wizard.analysisResult?.detected_teeth?.map((t) => ({
              tooth: t.tooth,
              indication_reason: t.indication_reason,
              treatment_indication: t.treatment_indication,
            }))}
            onResultChange={wizard.handleDSDResultChange}
            onPreferencesChange={wizard.setPatientPreferences}
          />
        </div>
      ),
    };

    const reviewStep = {
      id: 'revisao',
      title: t('wizard.stepReview'),
      icon: ClipboardCheck,
      children: (
        <div key="step-review" className={`wizard-step-${wizard.stepDirection}`}>
          <ReviewAnalysisStep
            analysisResult={wizard.analysisResult}
            formData={wizard.formData}
            onFormChange={wizard.updateFormData}
            imageBase64={wizard.imageBase64}
            onReanalyze={wizard.handleReanalyze}
            isReanalyzing={wizard.isReanalyzing}
            selectedTeeth={wizard.selectedTeeth}
            onSelectedTeethChange={wizard.setSelectedTeeth}
            toothTreatments={wizard.toothTreatments}
            onToothTreatmentChange={wizard.handleToothTreatmentChange}
            originalToothTreatments={wizard.originalToothTreatments}
            onRestoreAiSuggestion={wizard.handleRestoreAiSuggestion}
            hasInventory={wizard.hasInventory}
            patients={wizard.patients}
            dsdObservations={wizard.dsdResult?.analysis?.observations}
            dsdSuggestions={wizard.dsdResult?.analysis?.suggestions}
            selectedPatientId={wizard.selectedPatientId}
            patientBirthDate={wizard.patientBirthDate}
            onPatientBirthDateChange={wizard.handlePatientBirthDateChange}
            dobError={wizard.dobValidationError}
            onDobErrorChange={wizard.setDobValidationError}
            whiteningLevel={wizard.patientPreferences.whiteningLevel}
            onPatientSelect={wizard.handlePatientSelect}
          />
        </div>
      ),
    };

    const resultStep = {
      id: 'resultado',
      title: t('wizard.stepResult'),
      icon: FileText,
      children: (
        <div key="step-result" className={`wizard-step-${wizard.stepDirection}`}>
          <LoadingOverlay
            isLoading={wizard.isSubmitting}
            message={t('wizard.generatingCase')}
            steps={wizard.submissionSteps}
            progress={wizard.submissionSteps.filter(s => s.completed).length / Math.max(wizard.submissionSteps.length, 1) * 100}
          />
          {wizard.submissionComplete ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-lg font-semibold text-primary animate-fade-in-up">
                {t('wizard.caseCreated')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up">
                <Button
                  onClick={() => navigate(`/evaluation/${wizard.completedSessionId}`)}
                  className="btn-press"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('result.viewCase')}
                </Button>
                <Button
                  variant="outline"
                  onClick={wizard.handleBack}
                  className="print:hidden btn-press"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('result.recalculate')}
                </Button>
              </div>
            </div>
          ) : !wizard.isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 sm:space-y-6" role="status" aria-live="polite">
              <div className="text-center flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('common.processing')}</p>
              </div>
            </div>
          ) : null}
        </div>
      ),
    };

    if (wizard.isQuickCase) {
      return [fotoStep, analysisStep, reviewStep, resultStep];
    }
    return [fotoStep, prefsStep, analysisStep, dsdStep, reviewStep, resultStep];
  }, [wizard, t]);

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
    <div>
      <WizardPage
        title={t('wizard.newCase')}
        currentStep={displayStep}
        keyboardNavigation={false}
        showStepIndicator={true}
        scrollToTop={true}
        containerVariant="shell"
        steps={allSteps}
        slots={{
          stepIndicator: (
            <StepIndicator
              currentStep={displayStep}
              totalSteps={totalSteps}
              onStepClick={handleStepClick}
              stepLabels={wizard.isQuickCase ? quickLabels : undefined}
              stepIcons={wizard.isQuickCase ? QUICK_ICONS : undefined}
            />
          ),
          betweenHeaderAndContent: (
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
          navigation: wizard.canGoBack ? (
            <div className="wizard-nav-sticky">
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 pb-2 sm:mt-8 sm:pt-0 sm:pb-0">
                <Button variant="outline" onClick={wizard.handleBack} className="w-full sm:w-auto btn-press">
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
        onOpenChange={() => {/* no-op: user must explicitly choose Restore or Discard */}}
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
