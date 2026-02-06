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
              <PhotoUploadStep
                imageBase64={wizard.imageBase64}
                onImageChange={wizard.setImageBase64}
                onAnalyze={wizard.goToPreferences}
                isUploading={false}
                additionalPhotos={wizard.additionalPhotos}
                onAdditionalPhotosChange={wizard.setAdditionalPhotos}
              />
            ),
          },
          {
            id: 'preferencias',
            title: 'Preferências',
            icon: Heart,
            children: (
              <PatientPreferencesStep
                preferences={wizard.patientPreferences}
                onPreferencesChange={wizard.setPatientPreferences}
                onContinue={wizard.handlePreferencesContinue}
              />
            ),
          },
          {
            id: 'analise',
            title: 'Análise',
            icon: Brain,
            children: (
              <AnalyzingStep
                imageBase64={wizard.imageBase64}
                isAnalyzing={wizard.isAnalyzing}
                analysisError={wizard.analysisError}
                onRetry={wizard.handleRetryAnalysis}
                onSkipToReview={wizard.handleSkipToReview}
                onBack={wizard.handleBack}
              />
            ),
          },
          {
            id: 'dsd',
            title: 'DSD',
            icon: Smile,
            children: (
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
            ),
          },
          {
            id: 'revisao',
            title: 'Revisão',
            icon: ClipboardCheck,
            children: (
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
            ),
          },
          {
            id: 'resultado',
            title: 'Resultado',
            icon: FileText,
            children: (
              <>
                <LoadingOverlay
                  isLoading={wizard.isSubmitting}
                  message="Gerando Caso Clínico"
                  steps={wizard.submissionSteps}
                />
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Processando...</p>
                  </div>
                </div>
              </>
            ),
          },
        ]}
        slots={{
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
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 sm:mt-8">
              <Button variant="outline" onClick={wizard.handleBack} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {wizard.step === 5 && (
                <Button
                  onClick={wizard.handleSubmit}
                  disabled={wizard.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {wizard.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Gerar Caso
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
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
