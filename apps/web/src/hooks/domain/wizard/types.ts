import type { AdditionalPhotos } from '@/hooks/useWizardDraft';
import type { WizardDraft } from '@/hooks/useWizardDraft';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  TreatmentType,
} from '@/types/wizard';
import type { Patient } from '@/types/patient';
import type { DSDResult } from '@/types/dsd';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';

export interface SubmissionStep {
  label: string;
  completed: boolean;
}

export interface CreditConfirmData {
  operation: string;
  operationLabel: string;
  cost: number;
  remaining: number;
}

export interface WizardFlowState {
  // Current step (1-6)
  step: number;
  stepDirection: 'forward' | 'backward';

  // Credit confirmation
  creditConfirmData: CreditConfirmData | null;

  // Photo step
  imageBase64: string | null;
  additionalPhotos: AdditionalPhotos;

  // Preferences step
  patientPreferences: PatientPreferences;

  // Analysis step
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisResult: PhotoAnalysisResult | null;

  // DSD step
  dsdResult: DSDResult | null;

  // Review step
  formData: ReviewFormData;
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  originalToothTreatments: Record<string, TreatmentType>;
  selectedPatientId: string | null;
  patientBirthDate: string | null;
  originalPatientBirthDate: string | null;
  dobValidationError: boolean;
  isReanalyzing: boolean;
  hasInventory: boolean;
  patients: Patient[];

  // Submission
  isSubmitting: boolean;
  submissionComplete: boolean;
  completedSessionId: string | null;
  submissionStep: number;
  submissionSteps: SubmissionStep[];

  // Upload
  uploadedPhotoPath: string | null;

  // Draft
  showRestoreModal: boolean;
  pendingDraft: WizardDraft | null;
  isSaving: boolean;
  lastSavedAt: string | null;

  // Credits
  creditsRemaining: number;
  creditsTotal: number;

  // Quick Case
  isQuickCase: boolean;

  // Sample Case
  isSampleCase: boolean;

  // Navigation
  canGoBack: boolean;

  // Early photo quality score (from check-photo-quality, before full analysis)
  earlyPhotoQualityScore: number | null;
}

export interface WizardFlowActions {
  // Photo
  setImageBase64: (base64: string | null) => void;
  setAdditionalPhotos: (photos: AdditionalPhotos) => void;

  // Preferences
  setPatientPreferences: (prefs: PatientPreferences) => void;

  // Navigation
  goToStep: (targetStep: number) => void;
  goToPreferences: () => void;
  goToQuickCase: () => void;
  handlePreferencesContinue: () => void;
  handleBack: () => void;
  handleRetryAnalysis: () => void;
  handleSkipToReview: () => void;
  cancelAnalysis: () => void;

  // DSD
  handleDSDComplete: (result: DSDResult | null) => void;
  handleDSDSkip: () => void;
  handleDSDResultChange: (result: DSDResult | null) => void;

  // Review
  updateFormData: (updates: Partial<ReviewFormData>) => void;
  setSelectedTeeth: (teeth: string[]) => void;
  handleToothTreatmentChange: (tooth: string, treatment: TreatmentType) => void;
  handleRestoreAiSuggestion: (tooth: string) => void;
  handleReanalyze: () => void;
  handlePatientSelect: (name: string, patientId?: string, birthDate?: string | null) => void;
  handlePatientBirthDateChange: (date: string | null) => void;
  setDobValidationError: (v: boolean) => void;

  // Submission
  handleSubmit: () => Promise<void>;

  // Credit confirmation
  handleCreditConfirm: (confirmed: boolean) => void;

  // Draft
  handleRestoreDraft: () => Promise<void>;
  handleDiscardDraft: () => void;

  // Photo quality
  setEarlyPhotoQualityScore: (score: number | null) => void;
}
