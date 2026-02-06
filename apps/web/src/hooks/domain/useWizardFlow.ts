import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { inventory } from '@/data';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import type { WizardDraft, AdditionalPhotos } from '@/hooks/useWizardDraft';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  DetectedTooth,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';
import { TREATMENT_LABELS } from '@/components/wizard/ReviewAnalysisStep';
import type { DSDResult } from '@/components/wizard/DSDStep';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_FORM_DATA: ReviewFormData = {
  patientName: '',
  patientAge: '',
  tooth: '',
  toothRegion: 'anterior',
  cavityClass: 'Classe I',
  restorationSize: 'Média',
  vitaShade: 'A2',
  substrate: 'Esmalte e Dentina',
  substrateCondition: 'Saudável',
  enamelCondition: 'Íntegro',
  depth: 'Média',
  bruxism: false,
  aestheticLevel: 'alto',
  budget: 'moderado',
  longevityExpectation: 'médio',
  clinicalNotes: '',
  treatmentType: 'resina',
};

const ANTERIOR_TEETH = ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'];

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export interface SubmissionStep {
  label: string;
  completed: boolean;
}

export interface WizardFlowState {
  // Current step (1-6)
  step: number;

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

  // Submission
  isSubmitting: boolean;
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

  // Navigation
  canGoBack: boolean;
}

export interface WizardFlowActions {
  // Photo
  setImageBase64: (base64: string | null) => void;
  setAdditionalPhotos: (photos: AdditionalPhotos) => void;

  // Preferences
  setPatientPreferences: (prefs: PatientPreferences) => void;

  // Navigation
  goToPreferences: () => void;
  handlePreferencesContinue: () => void;
  handleBack: () => void;
  handleRetryAnalysis: () => void;
  handleSkipToReview: () => void;

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
  handlePatientSelect: (name: string, patientId: string | null, birthDate: string | null) => void;
  handlePatientBirthDateChange: (date: string | null) => void;
  setDobValidationError: (v: boolean) => void;

  // Submission
  handleSubmit: () => Promise<void>;

  // Draft
  handleRestoreDraft: () => Promise<void>;
  handleDiscardDraft: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAnterior(tooth: string): boolean {
  return ANTERIOR_TEETH.includes(tooth);
}

function getFullRegion(tooth: string): string {
  const toothNum = parseInt(tooth);
  const isUpper = toothNum >= 10 && toothNum <= 28;
  if (isAnterior(tooth)) {
    return isUpper ? 'anterior-superior' : 'anterior-inferior';
  }
  return isUpper ? 'posterior-superior' : 'posterior-inferior';
}

function getGenericProtocol(
  treatmentType: TreatmentType,
  tooth: string,
  toothData: DetectedTooth | undefined,
) {
  const protocols: Record<
    string,
    { summary: string; checklist: string[]; alerts: string[]; recommendations: string[] }
  > = {
    implante: {
      summary: `Dente ${tooth} indicado para extração e reabilitação com implante.`,
      checklist: [
        'Solicitar tomografia computadorizada cone beam',
        'Avaliar quantidade e qualidade óssea disponível',
        'Verificar espaço protético adequado',
        'Avaliar condição periodontal dos dentes adjacentes',
        'Planejar tempo de osseointegração',
        'Discutir opções de prótese provisória',
        'Encaminhar para cirurgião implantodontista',
        'Agendar retorno para acompanhamento',
      ],
      alerts: [
        'Avaliar contraindicações sistêmicas para cirurgia',
        'Verificar uso de bifosfonatos ou anticoagulantes',
        'Considerar enxerto ósseo se necessário',
      ],
      recommendations: [
        'Manter higiene oral adequada',
        'Evitar fumar durante o tratamento',
        'Seguir orientações pré e pós-operatórias',
      ],
    },
    coroa: {
      summary: `Dente ${tooth} indicado para restauração com coroa total.`,
      checklist: [
        'Realizar preparo coronário seguindo princípios biomecânicos',
        'Avaliar necessidade de núcleo/pino intrarradicular',
        'Selecionar material da coroa (metal-cerâmica, cerâmica pura, zircônia)',
        'Moldagem de trabalho',
        'Confecção de provisório adequado',
        'Prova da infraestrutura',
        'Seleção de cor com escala VITA',
        'Cimentação definitiva',
        'Ajuste oclusal',
        'Orientações de higiene',
      ],
      alerts: [
        'Verificar saúde pulpar antes do preparo',
        'Avaliar relação coroa-raiz',
        'Considerar tratamento periodontal prévio se necessário',
      ],
      recommendations: [
        'Proteger o provisório durante a espera',
        'Evitar alimentos duros e pegajosos',
      ],
    },
    endodontia: {
      summary: `Dente ${tooth} necessita de tratamento endodôntico antes de restauração definitiva.`,
      checklist: [
        'Confirmar diagnóstico pulpar',
        'Solicitar radiografia periapical',
        'Avaliar anatomia radicular',
        'Planejamento do acesso endodôntico',
        'Instrumentação e irrigação dos canais',
        'Medicação intracanal se necessário',
        'Obturação dos canais radiculares',
        'Radiografia de controle pós-obturação',
        'Agendar restauração definitiva',
        'Orientar retorno se houver dor ou inchaço',
      ],
      alerts: [
        'Avaliar necessidade de retratamento',
        'Verificar presença de lesão periapical',
        'Considerar encaminhamento para especialista em casos complexos',
      ],
      recommendations: [
        'Evitar mastigar do lado tratado até restauração definitiva',
        'Retornar imediatamente se houver dor intensa ou inchaço',
      ],
    },
    encaminhamento: (() => {
      // Infer specialty from indication_reason when available
      const reason = (toothData?.indication_reason || '').toLowerCase();
      let specialty = '';
      if (reason.includes('apinhamento') || reason.includes('ortodon') || reason.includes('maloclusão') || reason.includes('alinhamento')) {
        specialty = 'Ortodontia';
      } else if (reason.includes('canal') || reason.includes('pulp') || reason.includes('periapical') || reason.includes('endodon')) {
        specialty = 'Endodontia';
      } else if (reason.includes('perio') || reason.includes('gengiv') || reason.includes('bolsa') || reason.includes('retração')) {
        specialty = 'Periodontia';
      } else if (reason.includes('implante') || reason.includes('cirurg') || reason.includes('extração') || reason.includes('terceiro molar')) {
        specialty = 'Cirurgia Bucomaxilofacial';
      } else if (reason.includes('dtm') || reason.includes('atm') || reason.includes('articulação')) {
        specialty = 'DTM/Dor Orofacial';
      }

      // Specialty-specific checklist and recommendations
      const specialtyChecklist: Record<string, string[]> = {
        'Ortodontia': [
          'Documentar achados clínicos e fotografias intra/extraorais',
          'Solicitar radiografia panorâmica e cefalometria lateral',
          'Solicitar modelos de estudo ou escaneamento digital',
          `Encaminhar para Ortodontia — motivo: ${toothData?.indication_reason || 'correção de posicionamento'}`,
          'Informar ao ortodontista sobre o plano restaurador estético em andamento',
          'Coordenar timing: alinhamento ortodôntico antes de finalizar restaurações anteriores',
          'Orientar paciente sobre duração estimada e etapas do tratamento ortodôntico',
          'Agendar retorno para acompanhamento e reavaliação do plano restaurador',
        ],
        'Endodontia': [
          'Documentar achados clínicos e teste de vitalidade pulpar',
          'Solicitar radiografia periapical do dente',
          `Encaminhar para Endodontia — motivo: ${toothData?.indication_reason || 'comprometimento pulpar'}`,
          'Informar ao endodontista sobre plano restaurador pós-tratamento',
          'Orientar paciente sobre próximos passos',
          'Agendar retorno para restauração definitiva após tratamento endodôntico',
        ],
        'Periodontia': [
          'Documentar achados clínicos e profundidade de sondagem',
          'Solicitar radiografia periapical ou panorâmica',
          `Encaminhar para Periodontia — motivo: ${toothData?.indication_reason || 'comprometimento periodontal'}`,
          'Informar ao periodontista sobre plano restaurador',
          'Orientar paciente sobre importância do controle periodontal',
          'Agendar retorno para reavaliação após tratamento periodontal',
        ],
      };

      const specialtyRecommendations: Record<string, string[]> = {
        'Ortodontia': [
          'Levar exames radiográficos e relatório clínico ao ortodontista',
          'Estabilidade oclusal a longo prazo depende do alinhamento prévio',
          'Informar sobre medicamentos em uso e expectativas estéticas',
        ],
        'Endodontia': [
          'Levar radiografias e relatório ao endodontista',
          'Retornar imediatamente se houver dor intensa ou inchaço',
          'Evitar mastigar do lado tratado até restauração definitiva',
        ],
        'Periodontia': [
          'Levar exames e relatório ao periodontista',
          'Manter higiene bucal rigorosa durante o tratamento',
          'Retornar para controle periodontal trimestral',
        ],
      };

      const checklist = specialtyChecklist[specialty] || [
        'Documentar achados clínicos',
        'Realizar radiografias necessárias',
        'Preparar relatório para o especialista',
        specialty ? `Encaminhar para ${specialty}` : 'Identificar especialidade adequada',
        'Orientar paciente sobre próximos passos',
        'Agendar retorno para acompanhamento',
      ];

      const recommendations = specialtyRecommendations[specialty] || [
        'Levar exames e relatório ao especialista',
        'Informar sobre medicamentos em uso',
      ];

      const specialtyText = specialty ? ` Sugestão de encaminhamento: **${specialty}**.` : '';
      return {
        summary: `Dente ${tooth} requer avaliação especializada.${specialtyText}`,
        checklist,
        alerts: [
          'Urgência do encaminhamento depende do diagnóstico',
          'Manter comunicação com especialista',
        ],
        recommendations,
      };
    })(),
  };

  const protocol = protocols[treatmentType] || protocols.encaminhamento;

  return {
    treatment_type: treatmentType,
    tooth,
    ai_reason: toothData?.indication_reason || null,
    ...protocol,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizardFlow(): WizardFlowState & WizardFlowActions {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { invokeFunction } = useAuthenticatedFetch();
  const {
    canUseCredits,
    refreshSubscription,
    creditsRemaining,
    creditsTotal,
    getCreditCost,
  } = useSubscription();
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'list', 0],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { items, count } = await inventory.list({ userId: user.id, page: 0, pageSize: 30 });
      return { items, totalCount: count, hasMore: count > 30 };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const { loadDraft, saveDraft, clearDraft, isSaving, lastSavedAt } = useWizardDraft(user?.id);

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [step, setStep] = useState(1);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>(INITIAL_FORM_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [dsdResult, setDsdResult] = useState<DSDResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientBirthDate, setPatientBirthDate] = useState<string | null>(null);
  const [originalPatientBirthDate, setOriginalPatientBirthDate] = useState<string | null>(null);
  const [toothTreatments, setToothTreatments] = useState<Record<string, TreatmentType>>({});
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhotos>({
    smile45: null,
    face: null,
  });
  const [patientPreferences, setPatientPreferences] = useState<PatientPreferences>({
    whiteningLevel: 'natural',
  });
  const [dobValidationError, setDobValidationError] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null);
  const [originalToothTreatments, setOriginalToothTreatments] = useState<
    Record<string, TreatmentType>
  >({});

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------

  const hasCheckedDraftRef = useRef(false);
  const hasShownCreditWarningRef = useRef(false);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const canGoBack = step >= 1 && step <= 5;
  const hasInventory = (inventoryData?.items?.length ?? 0) > 0;

  const submissionSteps = useMemo(() => {
    const teethCount = selectedTeeth.length > 0 ? selectedTeeth.length : 1;
    return [
      { label: 'Preparando dados do paciente...', completed: submissionStep >= 1 },
      { label: `Criando ${teethCount} caso(s) clínico(s)...`, completed: submissionStep >= 2 },
      { label: 'Gerando protocolos personalizados...', completed: submissionStep >= 3 },
      { label: 'Finalizando e salvando...', completed: submissionStep >= 4 },
    ];
  }, [submissionStep, selectedTeeth.length]);

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  const getToothData = useCallback(
    (toothNumber: string) => {
      return analysisResult?.detected_teeth?.find((t) => t.tooth === toothNumber);
    },
    [analysisResult],
  );

  const getToothTreatment = useCallback(
    (tooth: string): TreatmentType => {
      return (
        toothTreatments[tooth] ||
        getToothData(tooth)?.treatment_indication ||
        formData.treatmentType ||
        'resina'
      );
    },
    [toothTreatments, getToothData, formData.treatmentType],
  );

  const uploadImageToStorage = useCallback(
    async (base64: string): Promise<string | null> => {
      if (!user) return null;
      try {
        const byteString = atob(base64.split(',')[1]);
        const mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const fileName = `${user.id}/intraoral_${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from('clinical-photos')
          .upload(fileName, blob, { upsert: true });
        if (error) throw error;
        return fileName;
      } catch (error) {
        logger.error('Upload error:', error);
        return null;
      }
    },
    [user],
  );

  const validateForm = useCallback((): boolean => {
    if (!formData.patientAge || !patientBirthDate) {
      setDobValidationError(true);
      toast.error('Informe a data de nascimento do paciente');
      return false;
    }
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    if (teethToProcess.length === 0 || !teethToProcess[0]) {
      toast.error('Selecione pelo menos um dente');
      return false;
    }
    setDobValidationError(false);
    return true;
  }, [formData.patientAge, formData.tooth, patientBirthDate, selectedTeeth]);

  // -------------------------------------------------------------------------
  // Core Actions
  // -------------------------------------------------------------------------

  const analyzePhoto = useCallback(async () => {
    if (!imageBase64) return;

    if (!canUseCredits('case_analysis')) {
      toast.error('Créditos insuficientes. Faça upgrade do seu plano para continuar.', {
        action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
      });
      return;
    }

    setStep(3);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const photoPath = await uploadImageToStorage(imageBase64);
      if (photoPath) setUploadedPhotoPath(photoPath);

      const { data, error } = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
        'analyze-dental-photo',
        { body: { imageBase64, imageType: 'intraoral' } },
      );

      if (error) throw error;

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);

        const primaryToothData =
          analysis.detected_teeth?.find((t) => t.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            tooth: primaryToothData.tooth || prev.tooth,
            toothRegion:
              primaryToothData.tooth_region ||
              (primaryToothData.tooth
                ? isAnterior(primaryToothData.tooth)
                  ? 'anterior'
                  : 'posterior'
                : prev.toothRegion),
            cavityClass: primaryToothData.cavity_class || prev.cavityClass,
            restorationSize: primaryToothData.restoration_size || prev.restorationSize,
            vitaShade: analysis.vita_shade || prev.vitaShade,
            substrate: primaryToothData.substrate || prev.substrate,
            substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
            enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
            depth: primaryToothData.depth || prev.depth,
          }));
        } else if (analysis.vita_shade) {
          setFormData((prev) => ({ ...prev, vitaShade: analysis.vita_shade || prev.vitaShade }));
        }

        setIsAnalyzing(false);
        const cost = getCreditCost('case_analysis');
        toast.success('Análise concluída', { description: `${cost} crédito utilizado.` });
        refreshSubscription();
        setStep(4);
      } else {
        throw new Error('Análise não retornou dados');
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      logger.error('Analysis error:', error);

      let errorMessage =
        'Não foi possível analisar a foto. Verifique se a imagem está nítida e tente novamente.';
      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = 'Limite de requisições excedido. Aguarde alguns minutos e tente novamente.';
      } else if (
        err.message?.includes('402') ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.code === 'PAYMENT_REQUIRED'
      ) {
        errorMessage = 'Créditos insuficientes. Faça upgrade do seu plano para continuar.';
        refreshSubscription();
      } else if (err.message?.includes('não retornou dados')) {
        errorMessage =
          'A IA não conseguiu identificar estruturas dentárias na foto. Tente uma foto com melhor iluminação.';
      }

      setAnalysisError(errorMessage);
      setIsAnalyzing(false);
    }
  }, [
    imageBase64,
    canUseCredits,
    navigate,
    uploadImageToStorage,
    invokeFunction,
    getCreditCost,
    refreshSubscription,
  ]);

  const handleReanalyze = useCallback(async () => {
    if (!imageBase64) return;

    if (!canUseCredits('case_analysis')) {
      toast.error('Créditos insuficientes. Faça upgrade do seu plano para reanalisar.', {
        action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
      });
      return;
    }

    setIsReanalyzing(true);
    try {
      const { data, error } = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
        'analyze-dental-photo',
        { body: { imageBase64, imageType: 'intraoral' } },
      );

      if (error) throw error;

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);

        const primaryToothData =
          analysis.detected_teeth?.find((t) => t.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            tooth: primaryToothData.tooth || prev.tooth,
            toothRegion:
              primaryToothData.tooth_region ||
              (primaryToothData.tooth
                ? isAnterior(primaryToothData.tooth)
                  ? 'anterior'
                  : 'posterior'
                : prev.toothRegion),
            cavityClass: primaryToothData.cavity_class || prev.cavityClass,
            restorationSize: primaryToothData.restoration_size || prev.restorationSize,
            vitaShade: analysis.vita_shade || prev.vitaShade,
            substrate: primaryToothData.substrate || prev.substrate,
            substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
            enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
            depth: primaryToothData.depth || prev.depth,
          }));
        }

        refreshSubscription();
        toast.success('Reanálise concluída', {
          description: `${analysis.detected_teeth?.length || 0} dente(s) detectado(s). 1 crédito utilizado.`,
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      logger.error('Reanalysis error:', error);
      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        toast.error('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (
        err.message?.includes('402') ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.code === 'PAYMENT_REQUIRED'
      ) {
        toast.error('Créditos insuficientes para reanálise.', {
          action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
        });
        refreshSubscription();
      } else {
        toast.error('Erro na reanálise. Tente novamente.');
      }
    } finally {
      setIsReanalyzing(false);
    }
  }, [imageBase64, canUseCredits, navigate, invokeFunction, refreshSubscription]);

  const handleSubmit = useCallback(async () => {
    if (!user || !validateForm()) return;

    setIsSubmitting(true);
    setSubmissionStep(0);
    setStep(6);

    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    const createdEvaluationIds: string[] = [];
    const sessionId = crypto.randomUUID();
    const treatmentCounts: Record<string, number> = {};

    try {
      // Step 1: Patient
      setSubmissionStep(1);
      let patientId = selectedPatientId;

      if (formData.patientName && !patientId) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            name: formData.patientName.trim(),
            birth_date: patientBirthDate || null,
          })
          .select('id')
          .single();

        if (patientError) {
          if (patientError.code === '23505') {
            const { data: existingPatient } = await supabase
              .from('patients')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', formData.patientName.trim())
              .maybeSingle();
            if (existingPatient) patientId = existingPatient.id;
          } else {
            logger.error('Error creating patient:', patientError);
          }
        } else if (newPatient) {
          patientId = newPatient.id;
        }
      }

      if (patientId && patientBirthDate && !originalPatientBirthDate) {
        await supabase
          .from('patients')
          .update({ birth_date: patientBirthDate })
          .eq('id', patientId);
      }

      // Step 2: Evaluations
      setSubmissionStep(2);

      for (const tooth of teethToProcess) {
        const toothData = getToothData(tooth);
        const treatmentType = getToothTreatment(tooth);
        // Normalize treatment type: Gemini sometimes returns English values (e.g. "porcelain" instead of "porcelana")
        const normalizedTreatment = ({
          porcelain: 'porcelana', resin: 'resina', crown: 'coroa',
          implant: 'implante', endodontics: 'endodontia', referral: 'encaminhamento',
        } as Record<string, TreatmentType>)[treatmentType] || treatmentType;
        treatmentCounts[normalizedTreatment] = (treatmentCounts[normalizedTreatment] || 0) + 1;

        const insertData = {
          user_id: user.id,
          session_id: sessionId,
          patient_id: patientId || null,
          patient_name: formData.patientName || null,
          patient_age: parseInt(formData.patientAge),
          tooth,
          region: getFullRegion(tooth),
          cavity_class: toothData?.cavity_class || formData.cavityClass,
          restoration_size: toothData?.restoration_size || formData.restorationSize,
          substrate: toothData?.substrate || formData.substrate,
          tooth_color: formData.vitaShade,
          depth: toothData?.depth || formData.depth,
          substrate_condition: toothData?.substrate_condition || formData.substrateCondition,
          enamel_condition: toothData?.enamel_condition || formData.enamelCondition,
          bruxism: formData.bruxism,
          aesthetic_level: formData.aestheticLevel,
          budget: formData.budget,
          longevity_expectation: formData.longevityExpectation,
          photo_frontal: uploadedPhotoPath,
          status: 'analyzing',
          treatment_type: normalizedTreatment,
          desired_tooth_shape: 'natural',
          ai_treatment_indication:
            toothData?.treatment_indication || analysisResult?.treatment_indication || null,
          ai_indication_reason:
            toothData?.indication_reason || analysisResult?.indication_reason || null,
          dsd_analysis: dsdResult?.analysis || null,
          dsd_simulation_url: dsdResult?.simulation_url || null,
          tooth_bounds: toothData?.tooth_bounds || null,
          patient_aesthetic_goals:
            patientPreferences.whiteningLevel === 'hollywood'
              ? 'Clareamento intenso - nível Hollywood (BL1)'
              : patientPreferences.whiteningLevel === 'white'
                ? 'Clareamento notável - dentes mais brancos (BL2/BL3)'
                : patientPreferences.whiteningLevel === 'natural'
                  ? 'Aparência natural e sutil (A1/A2)'
                  : null,
          patient_desired_changes: null,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: evaluation, error: evalError } = await supabase
          .from('evaluations')
          .insert(insertData as never)
          .select()
          .single();

        if (evalError) throw evalError;
        createdEvaluationIds.push(evaluation.id);

        // Step 3: Protocols
        setSubmissionStep(3);
        switch (normalizedTreatment) {
          case 'porcelana': {
            const { error: cementError } = await supabase.functions.invoke(
              'recommend-cementation',
              {
                body: {
                  evaluationId: evaluation.id,
                  teeth: [tooth],
                  shade: formData.vitaShade,
                  ceramicType: 'Dissilicato de lítio',
                  substrate: toothData?.substrate || formData.substrate,
                  substrateCondition:
                    toothData?.substrate_condition || formData.substrateCondition,
                  aestheticGoals:
                    patientPreferences.whiteningLevel === 'hollywood'
                      ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). A cor ALVO da faceta e do cimento deve ser BL1 ou compatível.'
                      : patientPreferences.whiteningLevel === 'white'
                        ? 'Paciente deseja clareamento NOTÁVEL (BL2/BL3). A cor ALVO da faceta e do cimento deve ser BL2/BL3 ou compatível.'
                        : patientPreferences.whiteningLevel === 'natural'
                          ? 'Paciente prefere aparência NATURAL (A1/A2).'
                          : undefined,
                },
              },
            );
            if (cementError) throw cementError;
            break;
          }
          case 'resina': {
            const { error: aiError } = await supabase.functions.invoke('recommend-resin', {
              body: {
                evaluationId: evaluation.id,
                userId: user.id,
                patientAge: formData.patientAge,
                tooth,
                region: getFullRegion(tooth),
                cavityClass: toothData?.cavity_class || formData.cavityClass,
                restorationSize: toothData?.restoration_size || formData.restorationSize,
                substrate: toothData?.substrate || formData.substrate,
                bruxism: formData.bruxism,
                aestheticLevel: formData.aestheticLevel,
                toothColor: formData.vitaShade,
                stratificationNeeded: true,
                budget: formData.budget,
                longevityExpectation: formData.longevityExpectation,
                aestheticGoals:
                  patientPreferences.whiteningLevel === 'hollywood'
                    ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). Ajustar todas as camadas 2-3 tons mais claras que a cor detectada.'
                    : patientPreferences.whiteningLevel === 'white'
                      ? 'Paciente deseja clareamento NOTÁVEL (BL2/BL3). Ajustar camadas 1-2 tons mais claras.'
                      : patientPreferences.whiteningLevel === 'natural'
                        ? 'Paciente prefere aparência NATURAL (A1/A2). Manter tons naturais.'
                        : undefined,
              },
            });
            if (aiError) throw aiError;
            break;
          }
          case 'implante':
          case 'coroa':
          case 'endodontia':
          case 'encaminhamento': {
            const genericProtocol = getGenericProtocol(treatmentType, tooth, toothData);
            await supabase
              .from('evaluations')
              .update({
                generic_protocol: genericProtocol,
                recommendation_text: genericProtocol.summary,
              })
              .eq('id', evaluation.id);
            break;
          }
        }

        await supabase.from('evaluations').update({ status: 'draft' }).eq('id', evaluation.id);
      }

      // Step 4: Save pending teeth
      setSubmissionStep(4);
      const allDetectedTeeth = analysisResult?.detected_teeth || [];
      const unselectedTeeth = allDetectedTeeth.filter((t) => !teethToProcess.includes(t.tooth));

      if (unselectedTeeth.length > 0) {
        const { error: pendingError } = await supabase.from('session_detected_teeth').insert(
          unselectedTeeth.map((t) => ({
            session_id: sessionId,
            user_id: user.id,
            tooth: t.tooth,
            priority: t.priority,
            treatment_indication: t.treatment_indication || 'resina',
            indication_reason: t.indication_reason || null,
            cavity_class: t.cavity_class,
            restoration_size: t.restoration_size,
            substrate: t.substrate,
            substrate_condition: t.substrate_condition,
            enamel_condition: t.enamel_condition,
            depth: t.depth,
            tooth_region: t.tooth_region,
            tooth_bounds: t.tooth_bounds || null,
          })),
        );
        if (pendingError) {
          logger.error('Error saving pending teeth:', pendingError);
        }
      }

      const treatmentMessages = Object.entries(treatmentCounts)
        .map(
          ([type, count]) => `${count} ${TREATMENT_LABELS[type as TreatmentType] || type}`,
        )
        .join(', ');
      clearDraft();
      // Dismiss pending toasts before navigating to avoid DOM race condition
      // (toast animations conflict with route unmount, causing insertBefore errors)
      toast.dismiss();
      navigate(`/evaluation/${sessionId}`);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      logger.error('Error creating case:', error);

      let errorMessage = 'Erro ao criar caso';
      let shouldGoBack = true;

      if (err.code === '23505') {
        errorMessage = 'Paciente já cadastrado com este nome. Selecione o paciente existente.';
      } else if (err.code === '23503') {
        errorMessage = 'Erro de referência no banco de dados. Verifique os dados do paciente.';
      } else if (err.message?.includes('recommend-resin')) {
        errorMessage =
          'Erro ao gerar protocolo de resina. Verifique a cor VITA e tente novamente.';
      } else if (err.message?.includes('recommend-cementation')) {
        errorMessage = 'Erro ao gerar protocolo de cimentação. Tente novamente.';
      } else if (err.message?.includes('Cor VITA') || err.message?.includes('VITA inválida')) {
        errorMessage = 'Cor VITA inválida. Selecione uma cor válida (ex: A1, A2, B1).';
      } else if (
        err.message?.includes('network') ||
        err.message?.includes('fetch') ||
        err.message?.includes('Failed to fetch')
      ) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = 'Muitas requisições. Aguarde alguns minutos.';
        shouldGoBack = false;
      } else if (err.message && err.message.length < 100) {
        errorMessage = `Erro: ${err.message}`;
      }

      toast.error(errorMessage, { duration: 5000 });
      if (shouldGoBack) setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    validateForm,
    selectedTeeth,
    formData,
    selectedPatientId,
    patientBirthDate,
    originalPatientBirthDate,
    uploadedPhotoPath,
    analysisResult,
    dsdResult,
    patientPreferences,
    getToothData,
    getToothTreatment,
    clearDraft,
    navigate,
  ]);

  // -------------------------------------------------------------------------
  // Navigation Actions
  // -------------------------------------------------------------------------

  const goToPreferences = useCallback(() => {
    setStep(2);
  }, []);

  const handlePreferencesContinue = useCallback(() => {
    analyzePhoto();
  }, [analyzePhoto]);

  const handleBack = useCallback(() => {
    if (step === 1) {
      navigate('/dashboard');
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
      setAnalysisError(null);
      setIsAnalyzing(false);
    } else if (step === 4) {
      setStep(2);
    } else if (step === 5) {
      setStep(4);
    }
  }, [step, navigate]);

  const handleRetryAnalysis = useCallback(() => {
    setAnalysisError(null);
    analyzePhoto();
  }, [analyzePhoto]);

  const handleSkipToReview = useCallback(() => {
    setAnalysisError(null);
    setIsAnalyzing(false);
    setStep(5);
    toast.info('Prosseguindo com entrada manual.');
  }, []);

  // -------------------------------------------------------------------------
  // DSD Actions
  // -------------------------------------------------------------------------

  const handleDSDComplete = useCallback(
    (result: DSDResult | null) => {
      setDsdResult(result);

      if (result?.analysis?.suggestions?.length && analysisResult) {
        const clinicalTeeth = analysisResult.detected_teeth || [];
        const existingNumbers = new Set(clinicalTeeth.map((t) => String(t.tooth)));

        const dsdAdditions: DetectedTooth[] = [];
        for (const s of result.analysis.suggestions) {
          const toothId = String(s.tooth);
          if (!existingNumbers.has(toothId)) {
            const toothNum = parseInt(toothId);
            const isUpper = toothNum >= 10 && toothNum <= 28;
            const isAnteriorTooth = ANTERIOR_TEETH.includes(toothId);

            dsdAdditions.push({
              tooth: toothId,
              tooth_region: isAnteriorTooth
                ? isUpper
                  ? 'anterior-superior'
                  : 'anterior-inferior'
                : isUpper
                  ? 'posterior-superior'
                  : 'posterior-inferior',
              cavity_class: null,
              restoration_size: null,
              substrate: null,
              substrate_condition: null,
              enamel_condition: null,
              depth: null,
              priority: 'média',
              notes: `DSD: ${s.current_issue} → ${s.proposed_change}`,
              treatment_indication: s.treatment_indication || 'resina',
              indication_reason: s.proposed_change,
            });
            existingNumbers.add(toothId);
          }
        }

        if (dsdAdditions.length > 0) {
          const unified = [...clinicalTeeth, ...dsdAdditions].sort(
            (a, b) => (parseInt(a.tooth) || 0) - (parseInt(b.tooth) || 0),
          );
          setAnalysisResult((prev) => (prev ? { ...prev, detected_teeth: unified } : null));
        }

        setToothTreatments((prev) => {
          const updated = { ...prev };
          for (const s of result.analysis.suggestions) {
            if (s.treatment_indication && s.treatment_indication !== 'resina') {
              if (!prev[s.tooth] || prev[s.tooth] === 'resina') {
                updated[s.tooth] = s.treatment_indication as TreatmentType;
              }
            }
          }
          return updated;
        });
      }

      setStep(5);
    },
    [analysisResult],
  );

  const handleDSDSkip = useCallback(() => {
    setDsdResult(null);
    setStep(5);
  }, []);

  // Update dsdResult in parent state as the DSD analysis progresses (for draft auto-save)
  const handleDSDResultChange = useCallback((result: DSDResult | null) => {
    setDsdResult(result);
  }, []);

  // -------------------------------------------------------------------------
  // Review Actions
  // -------------------------------------------------------------------------

  const updateFormData = useCallback((updates: Partial<ReviewFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleToothTreatmentChange = useCallback((tooth: string, treatment: TreatmentType) => {
    setToothTreatments((prev) => ({ ...prev, [tooth]: treatment }));
  }, []);

  const handleRestoreAiSuggestion = useCallback(
    (tooth: string) => {
      const original = originalToothTreatments[tooth];
      if (original) {
        setToothTreatments((prev) => ({ ...prev, [tooth]: original }));
      }
    },
    [originalToothTreatments],
  );

  const handlePatientSelect = useCallback(
    (_name: string, patientId: string | null, birthDate: string | null) => {
      setSelectedPatientId(patientId || null);
      setPatientBirthDate(birthDate || null);
      setOriginalPatientBirthDate(birthDate || null);
      if (birthDate) setDobValidationError(false);

      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        setFormData((prev) => ({ ...prev, patientAge: String(age) }));
      } else {
        setFormData((prev) => ({ ...prev, patientAge: '' }));
      }
    },
    [],
  );

  const handlePatientBirthDateChange = useCallback((date: string | null) => {
    setPatientBirthDate(date);
    if (date) setDobValidationError(false);
  }, []);

  // -------------------------------------------------------------------------
  // Draft Actions
  // -------------------------------------------------------------------------

  const handleRestoreDraft = useCallback(async () => {
    if (!pendingDraft) return;

    setStep(pendingDraft.step);
    setFormData(pendingDraft.formData);
    setSelectedTeeth(pendingDraft.selectedTeeth);
    setToothTreatments(pendingDraft.toothTreatments);
    setAnalysisResult(pendingDraft.analysisResult);
    setDsdResult(pendingDraft.dsdResult);
    setUploadedPhotoPath(pendingDraft.uploadedPhotoPath);
    setAdditionalPhotos(pendingDraft.additionalPhotos || { smile45: null, face: null });
    setPatientPreferences(pendingDraft.patientPreferences || { whiteningLevel: 'natural' });

    if (pendingDraft.uploadedPhotoPath) {
      try {
        const { data } = await supabase.storage
          .from('clinical-photos')
          .download(pendingDraft.uploadedPhotoPath);

        if (data) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageBase64(reader.result as string);
          };
          reader.readAsDataURL(data);
        }
      } catch (err) {
        logger.error('Error loading draft image:', err);
      }
    }

    setShowRestoreModal(false);
    setPendingDraft(null);
    toast.success('Rascunho restaurado com sucesso');
  }, [pendingDraft]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowRestoreModal(false);
    setPendingDraft(null);
  }, [clearDraft]);

  // -------------------------------------------------------------------------
  // Side Effects
  // -------------------------------------------------------------------------

  // Low-credit warning on mount
  useEffect(() => {
    if (hasShownCreditWarningRef.current) return;
    hasShownCreditWarningRef.current = true;

    const fullWorkflowCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
    if (creditsRemaining < fullWorkflowCost && creditsRemaining > 0) {
      toast.warning(
        `Você tem ${creditsRemaining} crédito${creditsRemaining !== 1 ? 's' : ''}. O fluxo completo (análise + DSD) requer ${fullWorkflowCost}.`,
        { duration: 6000, description: 'Você pode pular o DSD para economizar créditos.' },
      );
    } else if (creditsRemaining === 0) {
      toast.error('Sem créditos disponíveis.', {
        description: 'Faça upgrade do seu plano para criar novos casos.',
        action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
        duration: 8000,
      });
    }
  }, [creditsRemaining, getCreditCost, navigate]);

  // Check for pending draft on mount
  useEffect(() => {
    if (hasCheckedDraftRef.current) return;
    hasCheckedDraftRef.current = true;

    const checkDraft = async () => {
      const draft = await loadDraft();
      if (draft && draft.step >= 2) {
        setPendingDraft(draft);
        setShowRestoreModal(true);
      }
    };
    checkDraft();
  }, [loadDraft]);

  // Auto-save when state changes (after analysis)
  useEffect(() => {
    if (step >= 4 && user) {
      saveDraft({
        step,
        formData,
        selectedTeeth,
        toothTreatments,
        analysisResult,
        dsdResult,
        uploadedPhotoPath,
        additionalPhotos,
        patientPreferences,
      });
    }
  }, [
    step,
    formData,
    selectedTeeth,
    toothTreatments,
    analysisResult,
    dsdResult,
    uploadedPhotoPath,
    additionalPhotos,
    patientPreferences,
    saveDraft,
    user,
  ]);

  // Beforeunload warning during wizard steps 2-5
  useEffect(() => {
    if (step < 2 || step > 5) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  // Auto-select detected teeth and initialize per-tooth treatments
  useEffect(() => {
    if (analysisResult?.detected_teeth && analysisResult.detected_teeth.length > 0) {
      const allTeeth = analysisResult.detected_teeth.map((t) => t.tooth);
      setSelectedTeeth(allTeeth);

      setToothTreatments((prev) => {
        const merged: Record<string, TreatmentType> = {};
        analysisResult.detected_teeth.forEach((t) => {
          merged[t.tooth] = prev[t.tooth] || t.treatment_indication || 'resina';
        });
        return merged;
      });

      setOriginalToothTreatments((prev) => {
        if (Object.keys(prev).length === 0) {
          const original: Record<string, TreatmentType> = {};
          analysisResult.detected_teeth.forEach((t) => {
            original[t.tooth] = t.treatment_indication || 'resina';
          });
          return original;
        }
        return prev;
      });
    }

    if (analysisResult?.treatment_indication) {
      setFormData((prev) => ({
        ...prev,
        treatmentType: analysisResult.treatment_indication as TreatmentType,
      }));
    }
  }, [analysisResult]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // State
    step,
    imageBase64,
    additionalPhotos,
    patientPreferences,
    isAnalyzing,
    analysisError,
    analysisResult,
    dsdResult,
    formData,
    selectedTeeth,
    toothTreatments,
    originalToothTreatments,
    selectedPatientId,
    patientBirthDate,
    originalPatientBirthDate,
    dobValidationError,
    isReanalyzing,
    hasInventory,
    isSubmitting,
    submissionStep,
    submissionSteps,
    uploadedPhotoPath,
    showRestoreModal,
    pendingDraft,
    isSaving,
    lastSavedAt,
    creditsRemaining,
    creditsTotal,
    canGoBack,

    // Actions
    setImageBase64,
    setAdditionalPhotos,
    setPatientPreferences,
    goToPreferences,
    handlePreferencesContinue,
    handleBack,
    handleRetryAnalysis,
    handleSkipToReview,
    handleDSDComplete,
    handleDSDSkip,
    handleDSDResultChange,
    updateFormData,
    setSelectedTeeth,
    handleToothTreatmentChange,
    handleRestoreAiSuggestion,
    handleReanalyze,
    handlePatientSelect,
    handlePatientBirthDateChange,
    setDobValidationError,
    handleSubmit,
    handleRestoreDraft,
    handleDiscardDraft,
  };
}
