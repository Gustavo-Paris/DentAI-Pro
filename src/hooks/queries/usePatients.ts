import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  birth_date: string | null;
  created_at: string;
}

interface PatientWithStats extends Patient {
  sessionCount: number;
  caseCount: number;
  completedCount: number;
  lastVisit: string | null;
}

export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  sessions: (id: string) => [...patientKeys.detail(id), 'sessions'] as const,
};

export function usePatientsList(page: number = 0, pageSize: number = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: patientKeys.list({ page, pageSize }),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Fetch patients
      const { data: patientsData, error: patientsError, count } = await supabase
        .from('patients')
        .select('id, name, phone, email', { count: 'exact' })
        .eq('user_id', user.id)
        .order('name')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (patientsError) throw patientsError;
      if (!patientsData || patientsData.length === 0) {
        return { patients: [], totalCount: 0, hasMore: false };
      }

      // Fetch evaluation stats for the current page
      const patientIds = patientsData.map(p => p.id);
      const { data: evaluationsData, error: evalsError } = await supabase
        .from('evaluations')
        .select('patient_id, session_id, status, created_at')
        .eq('user_id', user.id)
        .in('patient_id', patientIds);

      if (evalsError) throw evalsError;

      // Calculate stats per patient
      const patientsWithStats: PatientWithStats[] = patientsData.map((patient) => {
        const patientEvals = evaluationsData?.filter((e) => e.patient_id === patient.id) || [];
        const uniqueSessions = new Set(patientEvals.map((e) => e.session_id));
        const completedCount = patientEvals.filter((e) => e.status === 'completed').length;
        const lastEval = patientEvals.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          ...patient,
          notes: null as string | null,
          birth_date: null as string | null,
          created_at: '',
          sessionCount: uniqueSessions.size,
          caseCount: patientEvals.length,
          completedCount,
          lastVisit: lastEval?.created_at || null,
        };
      });

      // Sort by last visit (most recent first), then by name
      patientsWithStats.sort((a, b) => {
        if (a.lastVisit && b.lastVisit) {
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        }
        if (a.lastVisit) return -1;
        if (b.lastVisit) return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        patients: patientsWithStats,
        totalCount: count || 0,
        hasMore: (count || 0) > (page + 1) * pageSize,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function usePatientDetail(patientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Patient | null;
    },
    enabled: !!user && !!patientId,
    staleTime: 60 * 1000,
  });
}

export function usePatientSessions(patientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: patientKeys.sessions(patientId),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('evaluations')
        .select('session_id, tooth, status, created_at')
        .eq('patient_id', patientId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by session
      const sessionMap = new Map<string, { teeth: string[]; statuses: string[]; created_at: string }>();

      (data || []).forEach((evaluation) => {
        const sessionId = evaluation.session_id || evaluation.tooth;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, { teeth: [], statuses: [], created_at: evaluation.created_at });
        }
        const session = sessionMap.get(sessionId)!;
        session.teeth.push(evaluation.tooth);
        session.statuses.push(evaluation.status || 'draft');
      });

      return Array.from(sessionMap.entries()).map(([sessionId, sessionData]) => ({
        session_id: sessionId,
        teeth: sessionData.teeth,
        evaluationCount: sessionData.teeth.length,
        completedCount: sessionData.statuses.filter((s) => s === 'completed').length,
        created_at: sessionData.created_at,
      }));
    },
    enabled: !!user && !!patientId,
    staleTime: 30 * 1000,
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Patient>) => {
      const { error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}
