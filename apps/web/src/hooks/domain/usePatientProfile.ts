import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { patients } from '@/data';
import type { PatientRow } from '@/data/patients';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/date-utils';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  sessions: (id: string, page?: number) => [...patientKeys.detail(id), 'sessions', page] as const,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientSession {
  session_id: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  created_at: string;
}

interface SessionsResult {
  sessions: PatientSession[];
  totalCount: number;
  hasMore: boolean;
}

export interface EditForm {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface PatientMetrics {
  totalSessions: number;
  totalCases: number;
  completedCases: number;
  firstVisit: string | null;
  firstVisitFormatted: string;
}

export interface PatientProfileState {
  patientId: string;
  patient: PatientRow | null | undefined;
  sessions: SessionsResult | undefined;
  isLoading: boolean;
  isFetchingSessions: boolean;
  editDialogOpen: boolean;
  editForm: EditForm;
  isSaving: boolean;
  metrics: PatientMetrics;
}

export interface PatientProfileActions {
  openEditDialog: () => void;
  closeEditDialog: () => void;
  setEditDialogOpen: (open: boolean) => void;
  updateEditField: <K extends keyof EditForm>(field: K, value: EditForm[K]) => void;
  handleSave: () => Promise<void>;
  loadMoreSessions: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePatientProfile(): PatientProfileState & PatientProfileActions {
  const { patientId: rawPatientId } = useParams<{ patientId: string }>();
  const patientId = rawPatientId || '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // ---- Pagination ----
  const [sessionsPage, setSessionsPage] = useState(0);

  // ---- Queries (inline — replaces @/hooks/queries/usePatients) ----
  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return patients.getById(patientId, user.id);
    },
    enabled: !!user && !!patientId,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });

  const {
    data: sessionsData,
    isLoading: loadingSessions,
    isFetching: fetchingSessions,
  } = useQuery({
    queryKey: patientKeys.sessions(patientId, sessionsPage),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { rows: data, count } = await patients.listSessions(patientId, user.id, sessionsPage);

      // Group by session
      const sessionMap = new Map<string, { teeth: string[]; statuses: string[]; created_at: string }>();
      (data || []).forEach((evaluation) => {
        const sessionId = evaluation.session_id || `legacy-${evaluation.id}`;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, { teeth: [], statuses: [], created_at: evaluation.created_at });
        }
        const session = sessionMap.get(sessionId)!;
        session.teeth.push(evaluation.tooth);
        session.statuses.push(evaluation.status || EVALUATION_STATUS.DRAFT);
      });

      const sessions: PatientSession[] = Array.from(sessionMap.entries()).map(([sessionId, sessionData]) => ({
        session_id: sessionId,
        teeth: sessionData.teeth,
        evaluationCount: sessionData.teeth.length,
        completedCount: sessionData.statuses.filter((s) => s === EVALUATION_STATUS.COMPLETED).length,
        created_at: sessionData.created_at,
      }));

      return { sessions, totalCount: count, hasMore: count > (sessionsPage + 1) * 20 };
    },
    enabled: !!user && !!patientId,
    staleTime: QUERY_STALE_TIMES.SHORT,
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PatientRow>) => {
      await patients.update(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });

  const sessions = sessionsData?.sessions || [];
  const hasMoreSessions = sessionsData?.hasMore || false;

  // ---- Edit form state ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // ---- Computed metrics ----
  const totalSessions = sessions.length;
  const totalCases = sessions.reduce((sum, s) => sum + s.evaluationCount, 0);
  const completedCases = sessions.reduce((sum, s) => sum + s.completedCount, 0);
  const firstVisit = sessions.length > 0 ? sessions[sessions.length - 1].created_at : null;
  const firstVisitFormatted = firstVisit
    ? format(new Date(firstVisit), 'd/MMM', { locale: getDateLocale() })
    : '-';

  // ---- Loading ----
  const isLoading = (loadingPatient || loadingSessions) && sessionsPage === 0;

  // ---- Redirect if patient not found (after loading) ----
  useEffect(() => {
    if (!isLoading && !loadingPatient && !patient) {
      navigate('/patients');
    }
  }, [isLoading, loadingPatient, patient, navigate]);

  // ---- Actions ----
  const initializeForm = useCallback(() => {
    if (patient) {
      setEditForm({
        name: patient.name,
        phone: patient.phone || '',
        email: patient.email || '',
        notes: patient.notes || '',
      });
    }
  }, [patient]);

  const openEditDialog = useCallback(() => {
    initializeForm();
    setEditDialogOpen(true);
  }, [initializeForm]);

  const closeEditDialog = useCallback(() => {
    setEditDialogOpen(false);
  }, []);

  const handleSetEditDialogOpen = useCallback(
    (open: boolean) => {
      if (open) initializeForm();
      setEditDialogOpen(open);
    },
    [initializeForm],
  );

  const updateEditField = useCallback(<K extends keyof EditForm>(field: K, value: EditForm[K]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!patient || !patientId) return;

    try {
      await updatePatientMutation.mutateAsync({
        id: patientId,
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null,
        notes: editForm.notes.trim() || null,
      });

      toast.success(t('toasts.patient.updated'));
      setEditDialogOpen(false);
    } catch (error) {
      logger.error('Failed to update patient profile:', error);
      toast.error(t('toasts.patient.saveError'));
    }
  }, [patient, patientId, editForm, updatePatientMutation]);

  const loadMoreSessions = useCallback(() => {
    setSessionsPage((prev) => prev + 1);
  }, []);

  return {
    // State
    patientId,
    patient,
    sessions: sessionsData
      ? { sessions, hasMore: hasMoreSessions, totalCount: sessionsData.totalCount }
      : undefined,
    isLoading,
    isFetchingSessions: fetchingSessions,
    editDialogOpen,
    editForm,
    isSaving: updatePatientMutation.isPending,
    metrics: {
      totalSessions,
      totalCases,
      completedCases,
      firstVisit,
      firstVisitFormatted,
    },

    // Actions
    openEditDialog,
    closeEditDialog,
    setEditDialogOpen: handleSetEditDialogOpen,
    updateEditField,
    handleSave,
    loadMoreSessions,
  };
}
