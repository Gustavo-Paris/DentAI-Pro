import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays } from 'date-fns';

interface Evaluation {
  id: string;
  created_at: string;
  tooth: string;
  cavity_class: string;
  patient_name: string | null;
  session_id: string | null;
  status: string | null;
}

interface Session {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
}

interface DashboardMetrics {
  pendingCases: number;
  weeklyEvaluations: number;
  completionRate: number;
  totalPatients: number;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  profile: () => [...dashboardKeys.all, 'profile'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  recentSessions: () => [...dashboardKeys.all, 'recent-sessions'] as const,
};

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.profile(),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      let avatarUrl: string | null = null;
      if (data?.avatar_url) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.avatar_url);
        avatarUrl = urlData.publicUrl;
      }

      return { profile: data as Profile | null, avatarUrl };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache profile for 5 minutes
  });
}

export function useDashboardData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: evaluationsData, error } = await supabase
        .from('evaluations')
        .select(`
          id, created_at, tooth, cavity_class, patient_name,
          session_id, status
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!evaluationsData) {
        return {
          metrics: { pendingCases: 0, weeklyEvaluations: 0, completionRate: 0, totalPatients: 0 },
          sessions: [],
        };
      }

      // Calculate metrics
      const totalCases = evaluationsData.length;
      const completedCases = evaluationsData.filter(e => e.status === 'completed').length;
      const pendingCount = totalCases - completedCases;
      const completionRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

      // Weekly evaluations
      const oneWeekAgo = subDays(new Date(), 7);
      const weeklyCount = evaluationsData.filter(e => new Date(e.created_at) > oneWeekAgo).length;

      // Unique patients
      const uniquePatients = new Set(
        evaluationsData.map(e => e.patient_name).filter(Boolean)
      ).size;

      const metrics: DashboardMetrics = {
        pendingCases: pendingCount,
        weeklyEvaluations: weeklyCount,
        completionRate,
        totalPatients: uniquePatients,
      };

      // Group by session_id
      const sessionMap = new Map<string, Evaluation[]>();

      evaluationsData.forEach(evaluation => {
        const sessionKey = evaluation.session_id || evaluation.id;
        if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, []);
        }
        sessionMap.get(sessionKey)!.push(evaluation);
      });

      // Convert to array and take first 5 sessions
      const sessions: Session[] = Array.from(sessionMap.entries())
        .slice(0, 5)
        .map(([sessionId, evals]) => ({
          session_id: sessionId,
          patient_name: evals[0].patient_name,
          created_at: evals[0].created_at,
          teeth: evals.map(e => e.tooth),
          evaluationCount: evals.length,
          completedCount: evals.filter(e => e.status === 'completed').length,
        }));

      return { metrics, sessions };
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}
