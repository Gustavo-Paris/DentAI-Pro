import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/hooks/domain/useWizardFlow', () => ({
  useWizardFlow: vi.fn(() => ({
    step: 1,
    stepDirection: 'forward',
    isQuickCase: false,
    isSampleCase: false,
    isSubmitting: false,
    isSaving: false,
    lastSavedAt: null,
    canGoBack: false,
    imageBase64: null,
    setImageBase64: vi.fn(),
    additionalPhotos: {},
    setAdditionalPhotos: vi.fn(),
    anamnesis: {},
    setAnamnesis: vi.fn(),
    patientPreferences: {},
    setPatientPreferences: vi.fn(),
    goToPreferences: vi.fn(),
    goToQuickCase: vi.fn(),
    goToStep: vi.fn(),
    handleBack: vi.fn(),
    handleSubmit: vi.fn(),
    handlePreferencesContinue: vi.fn(),
    isAnalyzing: false,
    analysisError: null,
    handleRetryAnalysis: vi.fn(),
    handleSkipToReview: vi.fn(),
    cancelAnalysis: vi.fn(),
    handleDSDComplete: vi.fn(),
    handleDSDSkip: vi.fn(),
    analysisResult: null,
    dsdResult: null,
    handleDSDResultChange: vi.fn(),
    formData: {},
    updateFormData: vi.fn(),
    handleReanalyze: vi.fn(),
    isReanalyzing: false,
    selectedTeeth: [],
    setSelectedTeeth: vi.fn(),
    toothTreatments: {},
    handleToothTreatmentChange: vi.fn(),
    originalToothTreatments: {},
    handleRestoreAiSuggestion: vi.fn(),
    hasInventory: false,
    patients: [],
    selectedPatientId: null,
    patientBirthDate: null,
    handlePatientBirthDateChange: vi.fn(),
    dobValidationError: null,
    setDobValidationError: vi.fn(),
    handlePatientSelect: vi.fn(),
    submissionComplete: false,
    completedSessionId: null,
    submissionSteps: [],
    showRestoreModal: false,
    handleRestoreDraft: vi.fn(),
    handleDiscardDraft: vi.fn(),
    pendingDraft: null,
    creditConfirmData: null,
    handleCreditConfirm: vi.fn(),
    earlyPhotoQualityScore: null,
    setEarlyPhotoQualityScore: vi.fn(),
  })),
}));

vi.mock('@/components/AiDisclaimerModal', () => ({
  useAiDisclaimer: () => ({ accepted: true, accept: vi.fn() }),
  AiDisclaimerModal: () => null,
}));

vi.mock('@/components/LoadingOverlay', () => ({
  LoadingOverlay: () => null,
}));

vi.mock('@/components/wizard/DraftRestoreModal', () => ({
  DraftRestoreModal: () => null,
}));

vi.mock('@/components/CreditConfirmDialog', () => ({
  CreditConfirmDialog: () => null,
}));

vi.mock('@/components/wizard/steps', () => ({
  FotoStepWrapper: () => <div data-testid="foto-step" />,
  PrefsStepWrapper: () => <div data-testid="prefs-step" />,
  AnalysisStepWrapper: () => <div data-testid="analysis-step" />,
  DSDStepWrapper: () => <div data-testid="dsd-step" />,
  ReviewStepWrapper: () => <div data-testid="review-step" />,
  ResultStepWrapper: () => <div data-testid="result-step" />,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Badge: ({ children }: any) => <span>{children}</span>,
  StepIndicator: () => <div data-testid="step-indicator" />,
}));

vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  PageShellWizard: ({ children, slots }: any) => (
    <div data-testid="wizard">
      {slots?.progress}
      {slots?.beforeContent}
      {children}
      {slots?.footer}
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  ArrowRight: () => null,
  Camera: () => null,
  Brain: () => null,
  ClipboardCheck: () => null,
  FileText: () => null,
  Loader2: () => null,
  Smile: () => null,
  Check: () => null,
  Save: () => null,
  Heart: () => null,
  Sparkles: () => null,
  Eye: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('NewCase', () => {
  it('renders without crashing', async () => {
    const NewCase = (await import('../NewCase')).default;
    const { getByTestId } = render(<NewCase />, { wrapper });
    expect(getByTestId('wizard')).toBeTruthy();
  });

  it('renders step 1 (foto) by default', async () => {
    const NewCase = (await import('../NewCase')).default;
    const { getByTestId } = render(<NewCase />, { wrapper });
    expect(getByTestId('foto-step')).toBeTruthy();
  });
});
