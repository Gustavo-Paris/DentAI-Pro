import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { patients } from '@/data';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientWithStats {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  sessionCount: number;
  caseCount: number;
  completedCount: number;
  lastVisit: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePatientList() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['patients', 'all-with-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Load first page of patients with stats
      const { rows: patientsData, count } = await patients.list({
        userId: user.id,
        page: 0,
        pageSize: 100,
      });

      if (!patientsData || patientsData.length === 0) {
        return { patients: [] as PatientWithStats[], total: 0 };
      }

      // Fetch evaluation stats for all patients
      const patientIds = patientsData.map((p) => p.id);
      const evaluationsData = await patients.getEvaluationStats(user.id, patientIds);

      // Calculate stats per patient
      const patientsWithStats: PatientWithStats[] = patientsData.map((patient) => {
        const patientEvals =
          evaluationsData?.filter((e) => e.patient_id === patient.id) || [];
        const uniqueSessions = new Set(patientEvals.map((e) => e.session_id));
        const completedCount = patientEvals.filter(
          (e) => e.status === EVALUATION_STATUS.COMPLETED,
        ).length;
        const lastEval = patientEvals.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];

        return {
          id: patient.id,
          name: patient.name,
          phone: patient.phone ?? null,
          email: patient.email ?? null,
          sessionCount: uniqueSessions.size,
          caseCount: patientEvals.length,
          completedCount,
          lastVisit: lastEval?.created_at || null,
        };
      });

      return { patients: patientsWithStats, total: count };
    },
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.SHORT,
  });

  return {
    patients: query.data?.patients ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
