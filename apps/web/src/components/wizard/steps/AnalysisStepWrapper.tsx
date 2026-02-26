import { memo } from 'react';
import { AnalyzingStep } from '@/components/wizard/AnalyzingStep';

interface AnalysisStepWrapperProps {
  stepDirection: 'forward' | 'backward';
  imageBase64: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  handleRetryAnalysis: () => void;
  handleSkipToReview: () => void;
  handleBack: () => void;
  cancelAnalysis: () => void;
}

export const AnalysisStepWrapper = memo(function AnalysisStepWrapper({
  stepDirection,
  imageBase64,
  isAnalyzing,
  analysisError,
  handleRetryAnalysis,
  handleSkipToReview,
  handleBack,
  cancelAnalysis,
}: AnalysisStepWrapperProps) {
  return (
    <div className={`wizard-step-${stepDirection}`}>
      <div className={`wizard-stage${isAnalyzing ? ' ai-shimmer-border' : ''}`}>
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
    </div>
  );
});
