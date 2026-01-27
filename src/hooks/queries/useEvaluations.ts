import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Evaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  status: string | null;
  session_id: string | null;
}

interface SessionGroup {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
}

export const evaluationKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...evaluationKeys.lists(), filters] as const,
  details: () => [...evaluationKeys.all, 'detail'] as const,
  detail: (id: string) => [...evaluationKeys.details(), id] as const,
  sessions: () => [...evaluationKeys.all, 'sessions'] as const,
  session: (id: string) => [...evaluationKeys.sessions(), id] as const,
};

function groupBySession(data: Evaluation[]): SessionGroup[] {
  const sessionMap = new Map<string, Evaluation[]>();
  
  data.forEach(evaluation => {
    const sessionKey = evaluation.session_id || evaluation.id;
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, []);
    }
    sessionMap.get(sessionKey)!.push(evaluation);
  });

  return Array.from(sessionMap.entries())
    .map(([sessionId, evals]) => ({
      session_id: sessionId,
      patient_name: evals[0].patient_name,
      created_at: evals[0].created_at,
      teeth: evals.map(e => e.tooth),
      evaluationCount: evals.length,
      completedCount: evals.filter(e => e.status === 'completed').length,
    }));
}

export function useEvaluationsList(page: number = 0, pageSize: number = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: evaluationKeys.list({ page, pageSize }),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error, count } = await supabase
        .from('evaluations')
        .select('id, created_at, patient_name, tooth, cavity_class, status, session_id', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      return {
        sessions: groupBySession(data || []),
        totalCount: count || 0,
        hasMore: (count || 0) > (page + 1) * pageSize,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

export function useEvaluationDetail(evaluationId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: evaluationKeys.detail(evaluationId),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          resins:resins!recommended_resin_id(*),
          ideal_resin:resins!ideal_resin_id(*)
        `)
        .eq('id', evaluationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!evaluationId,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  });
}

export function useSessionEvaluations(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: evaluationKeys.session(sessionId),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          id, tooth, cavity_class, status, treatment_type, 
          ai_treatment_indication, ai_indication_reason, restoration_size,
          patient_name, patient_id, photo_frontal, dsd_simulation_url,
          created_at, checklist_progress
        `)
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('tooth', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!sessionId,
    staleTime: 30 * 1000,
  });
}

export function useUpdateEvaluationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('evaluations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
    },
  });
}
