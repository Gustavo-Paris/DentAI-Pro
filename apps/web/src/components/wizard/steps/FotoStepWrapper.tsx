import { memo } from 'react';
import type { AdditionalPhotos } from '@/hooks/useWizardDraft';
import { PhotoUploadStep } from '@/components/wizard/PhotoUploadStep';

interface FotoStepWrapperProps {
  stepDirection: 'forward' | 'backward';
  imageBase64: string | null;
  setImageBase64: (base64: string | null) => void;
  goToPreferences: () => void;
  goToQuickCase: () => void;
  additionalPhotos: AdditionalPhotos;
  setAdditionalPhotos: (photos: AdditionalPhotos) => void;
}

export const FotoStepWrapper = memo(function FotoStepWrapper({
  stepDirection,
  imageBase64,
  setImageBase64,
  goToPreferences,
  goToQuickCase,
  additionalPhotos,
  setAdditionalPhotos,
}: FotoStepWrapperProps) {
  return (
    <div className={`wizard-step-${stepDirection}`}>
      <div className="wizard-stage">
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
    </div>
  );
});
