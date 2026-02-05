import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Zap,
} from 'lucide-react';

import { useWizardFlow } from '@/hooks/domain/useWizardFlow';
import { PhotoUploadStep } from '@/components/wizard/PhotoUploadStep';
import { PatientPreferencesStep } from '@/components/wizard/PatientPreferencesStep';
import { AnalyzingStep } from '@/components/wizard/AnalyzingStep';
import { DSDStep } from '@/components/wizard/DSDStep';
import { ReviewAnalysisStep } from '@/components/wizard/ReviewAnalysisStep';
import { DraftRestoreModal } from '@/components/wizard/DraftRestoreModal';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ThemeToggle } from '@/components/ThemeToggle';

// =============================================================================
// Step definitions (presentation only)
// =============================================================================

const steps = [
  { id: 1, name: 'Foto', icon: Camera },
  { id: 2, name: 'Preferências', icon: Heart },
  { id: 3, name: 'Análise', icon: Brain },
  { id: 4, name: 'DSD', icon: Smile },
  { id: 5, name: 'Revisão', icon: ClipboardCheck },
  { id: 6, name: 'Resultado', icon: FileText },
];

const totalSteps = 6;

// =============================================================================
// Page Adapter
// =============================================================================

export default function NewCase() {
  const wizard = useWizardFlow();
  const progress = (wizard.step / totalSteps) * 100;

  return (
    <div id="main-content" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <span className="text-lg sm:text-xl font-semibold tracking-tight">Novo Caso</span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Badge
                variant="outline"
                className={`text-xs gap-1 ${
                  wizard.creditsRemaining <= 2
                    ? 'border-red-300 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                    : wizard.creditsRemaining <= 5
                      ? 'border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                      : ''
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{wizard.creditsRemaining}</span>
                <span className="hidden sm:inline">
                  crédito{wizard.creditsRemaining !== 1 ? 's' : ''}
                </span>
              </Badge>

              {wizard.step >= 4 && (
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
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Passo {wizard.step} de {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {steps.find((s) => s.id === wizard.step)?.name}
            </span>
          </div>

          <Progress value={progress} className="h-2 mb-4" />

          <div className="flex justify-between">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col items-center ${wizard.step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-colors ${
                    wizard.step > s.id
                      ? 'bg-primary/20 text-primary'
                      : wizard.step === s.id
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'bg-secondary'
                  }`}
                >
                  {wizard.step > s.id ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <span className="text-xs hidden sm:block">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {wizard.step === 1 && (
          <PhotoUploadStep
            imageBase64={wizard.imageBase64}
            onImageChange={wizard.setImageBase64}
            onAnalyze={wizard.goToPreferences}
            isUploading={false}
            additionalPhotos={wizard.additionalPhotos}
            onAdditionalPhotosChange={wizard.setAdditionalPhotos}
          />
        )}

        {wizard.step === 2 && (
          <PatientPreferencesStep
            preferences={wizard.patientPreferences}
            onPreferencesChange={wizard.setPatientPreferences}
            onContinue={wizard.handlePreferencesContinue}
          />
        )}

        {wizard.step === 3 && (
          <AnalyzingStep
            imageBase64={wizard.imageBase64}
            isAnalyzing={wizard.isAnalyzing}
            analysisError={wizard.analysisError}
            onRetry={wizard.handleRetryAnalysis}
            onSkipToReview={wizard.handleSkipToReview}
            onBack={wizard.handleBack}
          />
        )}

        {wizard.step === 4 && (
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
        )}

        {wizard.step === 5 && (
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
        )}

        {wizard.step === 6 && (
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
        )}

        {/* Navigation */}
        {wizard.canGoBack && (
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
        )}
      </main>

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
