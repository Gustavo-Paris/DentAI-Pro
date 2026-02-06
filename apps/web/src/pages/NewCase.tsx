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

// =============================================================================
// Page Adapter
// =============================================================================

export default function NewCase() {
  const wizard = useWizardFlow();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <WizardPage
        title="Novo Caso"
        currentStep={wizard.step - 1}
        keyboardNavigation={false}
        showStepIndicator={true}
        scrollToTop={true}
        containerVariant="shell"
        steps={[
          {
            id: 'foto',
            title: 'Foto',
            icon: Camera,
            children: (
              <div key="step-foto" className="wizard-step-enter">
                <PhotoUploadStep
                  imageBase64={wizard.imageBase64}
                  onImageChange={wizard.setImageBase64}
                  onAnalyze={wizard.goToPreferences}
                  isUploading={false}
                  additionalPhotos={wizard.additionalPhotos}
                  onAdditionalPhotosChange={wizard.setAdditionalPhotos}
                />
              </div>
            ),
          },
          {
            id: 'preferencias',
            title: 'Preferências',
            icon: Heart,
            children: (
              <div key="step-prefs" className="wizard-step-enter">
                <PatientPreferencesStep
                  preferences={wizard.patientPreferences}
                  onPreferencesChange={wizard.setPatientPreferences}
                  onContinue={wizard.handlePreferencesContinue}
                />
              </div>
            ),
          },
          {
            id: 'analise',
            title: 'Análise',
            icon: Brain,
            children: (
              <div key="step-analysis" className="wizard-step-enter">
                <AnalyzingStep
                  imageBase64={wizard.imageBase64}
                  isAnalyzing={wizard.isAnalyzing}
                  analysisError={wizard.analysisError}
                  onRetry={wizard.handleRetryAnalysis}
                  onSkipToReview={wizard.handleSkipToReview}
                  onBack={wizard.handleBack}
                />
              </div>
            ),
          },
          {
            id: 'dsd',
            title: 'DSD',
            icon: Smile,
            children: (
              <div key="step-dsd" className="wizard-step-enter">
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
                />
              </div>
            ),
          },
          {
            id: 'revisao',
            title: 'Revisão',
            icon: ClipboardCheck,
            children: (
              <div key="step-review" className="wizard-step-enter">
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
          },
          {
            id: 'resultado',
            title: 'Resultado',
            icon: FileText,
            children: (
              <div key="step-result" className="wizard-step-enter">
                <LoadingOverlay
                  isLoading={wizard.isSubmitting}
                  message="Gerando Caso Clínico"
                  steps={wizard.submissionSteps}
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
          },
        ]}
        slots={{
          stepIndicator: (
            <AuriaStepIndicator
              currentStep={wizard.step - 1}
              totalSteps={6}
              onStepClick={(index) => {
                // Only allow clicking completed steps
                if (index < wizard.step - 1) {
                  // Navigate back through proper handlers
                  // For simplicity, we only support going back one step at a time
                  // The WizardPage composite handles step navigation
                }
              }}
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
