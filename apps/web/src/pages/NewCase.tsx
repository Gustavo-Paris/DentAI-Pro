import { useMemo } from 'react';
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
} from 'lucide-react';

import { WizardPage } from '@pageshell/composites';
import { useWizardFlow } from '@/hooks/domain/useWizardFlow';
import { PhotoUploadStep } from '@/components/wizard/PhotoUploadStep';
import { PatientPreferencesStep } from '@/components/wizard/PatientPreferencesStep';
import { AnalyzingStep } from '@/components/wizard/AnalyzingStep';
import { DSDStep } from '@/components/wizard/DSDStep';
import { ReviewAnalysisStep } from '@/components/wizard/ReviewAnalysisStep';
import { DraftRestoreModal } from '@/components/wizard/DraftRestoreModal';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AuriaStepIndicator } from '@/components/wizard/AuriaStepIndicator';

// Step definitions for full flow: [1:foto, 2:prefs, 3:analysis, 4:dsd, 5:review, 6:result]
// Step definitions for quick case: [1:foto, 3:analysis, 5:review, 6:result]

// Maps internal wizard.step (1-6) to display index for quick case
const QUICK_STEP_MAP: Record<number, number> = { 1: 0, 3: 1, 5: 2, 6: 3 };
const QUICK_LABELS = ['Foto', 'Análise', 'Revisão', 'Resultado'];
const QUICK_ICONS = [Camera, Brain, ClipboardCheck, FileText];

// =============================================================================
// Page Adapter
// =============================================================================

export default function NewCase() {
  const wizard = useWizardFlow();

  // Compute display step index (0-indexed) from internal step (1-indexed)
  const displayStep = wizard.isQuickCase
    ? (QUICK_STEP_MAP[wizard.step] ?? 0)
    : wizard.step - 1;

  const totalSteps = wizard.isQuickCase ? 4 : 6;

  // Build steps array conditionally
  const allSteps = useMemo(() => {
    const fotoStep = {
      id: 'foto',
      title: 'Foto',
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
      title: 'Preferências',
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
      title: 'Análise',
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
      title: 'DSD',
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
      title: 'Revisão',
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
      title: 'Resultado',
      icon: FileText,
      children: (
        <div key="step-result" className={`wizard-step-${wizard.stepDirection}`}>
          <LoadingOverlay
            isLoading={wizard.isSubmitting}
            message="Gerando Caso Clínico"
            steps={wizard.submissionSteps}
            progress={wizard.submissionSteps.filter(s => s.completed).length / Math.max(wizard.submissionSteps.length, 1) * 100}
          />
          {wizard.submissionComplete ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-lg font-semibold text-gradient-gold animate-fade-in-up">
                Caso criado com sucesso!
              </p>
            </div>
          ) : !wizard.isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Processando...</p>
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
  }, [wizard]);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <WizardPage
        title="Novo Caso"
        currentStep={displayStep}
        keyboardNavigation={false}
        showStepIndicator={true}
        scrollToTop={true}
        containerVariant="shell"
        steps={allSteps}
        slots={{
          stepIndicator: (
            <AuriaStepIndicator
              currentStep={displayStep}
              totalSteps={totalSteps}
              onStepClick={handleStepClick}
              stepLabels={wizard.isQuickCase ? QUICK_LABELS : undefined}
              stepIcons={wizard.isQuickCase ? QUICK_ICONS : undefined}
            />
          ),
          betweenHeaderAndContent: wizard.step >= 4 ? (
            <div className="flex justify-end mb-2">
              <Badge variant="outline" className="text-xs gap-1.5">
                {wizard.isSaving ? (
                  <>
                    <Save className="w-3 h-3 animate-pulse" />
                    <span className="hidden sm:inline">Salvando...</span>
                  </>
                ) : wizard.lastSavedAt ? (
                  <>
                    <Check className="w-3 h-3 text-primary" />
                    <span className="hidden sm:inline">Salvo</span>
                  </>
                ) : null}
              </Badge>
            </div>
          ) : null,
          navigation: wizard.canGoBack ? (
            <div className="wizard-nav-sticky">
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 pb-2 sm:mt-8 sm:pt-0 sm:pb-0">
                <Button variant="outline" onClick={wizard.handleBack} className="w-full sm:w-auto btn-press">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>

                {wizard.step === 5 && (
                  <Button
                    onClick={wizard.handleSubmit}
                    disabled={wizard.isSubmitting}
                    className="w-full sm:w-auto btn-glow-gold btn-press font-semibold"
                  >
                    {wizard.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Caso
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : null,
        }}
      />

      {/* Draft Restore Modal */}
      <DraftRestoreModal
        open={wizard.showRestoreModal}
        onOpenChange={wizard.handleDiscardDraft}
        lastSavedAt={wizard.pendingDraft?.lastSavedAt || null}
        onRestore={wizard.handleRestoreDraft}
        onDiscard={wizard.handleDiscardDraft}
      />
    </div>
  );
}
